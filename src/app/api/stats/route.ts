import { query } from '@/lib/db';
import { getCached, setCache } from '@/lib/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function normalizeStage(stage: string | null | undefined): string {
  const raw = (stage || '').trim();
  if (!raw) return 'Unknown';

  const s = raw.toLowerCase().replace(/[_\s]+/g, ' ').trim();

  if (['n/a', 'na', 'n.a.', 'unknown', 'unknown stage', '-', '—', ''].includes(s)) return 'Unknown';
  if (['acquired', 'acquisition'].includes(s)) return 'Acquired';
  if (['public', 'ipo', 'listed'].includes(s)) return 'Public';
  if (['growth', 'growth stage', 'series c', 'series d', 'series d+', 'c', 'd', 'd+'].includes(s)) return 'Late Stage';
  if (['seed', 'seed stage', 'pre-seed', 'pre seed', 'preseed', 'seed/pre-seed', 'pre-seed/seed', 'pre seed/seed'].includes(s)) return 'Seed';

  const seriesMatch = s.match(/^series\s*([a-d])(\+)?$/i) || s.match(/^([a-d])(\+)?$/i);
  if (seriesMatch) {
    const letter = seriesMatch[1].toUpperCase();
    if (letter === 'A' || letter === 'B') return `Series ${letter}`;
    return 'Late Stage';
  }

  return 'Unknown';
}

function normalizeVertical(vertical: string | null | undefined): string {
  const raw = (vertical || '').trim();
  if (!raw) return 'Other';

  const s = raw.toLowerCase().replace(/[_\s]+/g, ' ').trim();

  if (['llm-infra', 'llm infra', 'foundation model infra', 'model infra'].includes(s)) return 'LLM Infrastructure';
  if (['ai infrastructure', 'infrastructure ai', 'infra', 'ai infra'].includes(s)) return 'AI Infrastructure';
  if (['agents', 'agent', 'agentic ai', 'agentic'].includes(s)) return 'Agents';
  if (['ai/ml', 'ml', 'machine learning', 'artificial intelligence'].includes(s)) return 'AI/ML';
  if (['enterprise ai', 'enterprise automation ai', 'enterprise agent'].includes(s)) return 'Enterprise AI';
  if (['ai application - horizontal', 'horizontal ai', 'ai apps', 'application ai'].includes(s)) return 'AI Applications';
  if (['dev-tools', 'developer tools', 'ai developer tools', 'coding'].includes(s)) return 'Developer Tools';
  if (['data-platform', 'data platform', 'rag', 'retrieval', 'search'].includes(s)) return 'Data Platforms';
  if (['cv', 'computer vision', 'vision', 'video ai'].includes(s)) return 'Computer Vision';
  if (['nlp', 'language', 'text ai'].includes(s)) return 'NLP';

  // industry labels should not dominate product taxonomy, fold them into applications
  if (['fintech', 'healthcare', 'edtech', 'legaltech', 'ecommerce', 'retail', 'sales', 'marketing'].includes(s)) return 'AI Applications';

  if (['other', 'misc', 'general'].includes(s)) return 'Other';

  return raw
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export async function GET(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get('refresh') === 'true';
    const cacheKey = 'stats';

    if (!refresh) {
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json(cached);
    }

    const baseWhere = "WHERE COALESCE(outreach_status, 'new') != 'noise'";

    const [total] = await query<{ count: number }>(`SELECT COUNT(*) as count FROM ai_startups ${baseWhere}`);
    const regions = await query<{ region: string; count: number }>(
      `SELECT region, COUNT(*) as count FROM ai_startups ${baseWhere} GROUP BY region ORDER BY count DESC`
    );
    const [avg] = await query<{ avg: number }>(`SELECT AVG(relevance_score) as avg FROM ai_startups ${baseWhere}`);
    const rawVerticals = await query<{ vertical: string; count: number }>(
      `SELECT vertical, COUNT(*) as count FROM ai_startups ${baseWhere} AND vertical IS NOT NULL GROUP BY vertical ORDER BY count DESC`
    );
    const verticalMap = new Map<string, number>();
    for (const row of rawVerticals) {
      const normalized = normalizeVertical(row.vertical);
      verticalMap.set(normalized, (verticalMap.get(normalized) || 0) + Number(row.count || 0));
    }
    const verticalOrder = ['AI Applications', 'Agents', 'LLM Infrastructure', 'AI Infrastructure', 'Enterprise AI', 'AI/ML', 'Data Platforms', 'Developer Tools', 'Computer Vision', 'NLP', 'Other'];
    const verticals = Array.from(verticalMap.entries())
      .map(([vertical, count]) => ({ vertical, count }))
      .sort((a, b) => {
        const ai = verticalOrder.indexOf(a.vertical);
        const bi = verticalOrder.indexOf(b.vertical);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return b.count - a.count;
      });
    const rawStages = await query<{ stage: string; count: number }>(
      `SELECT stage, COUNT(*) as count FROM ai_startups ${baseWhere} AND stage IS NOT NULL GROUP BY stage ORDER BY count DESC`
    );
    const stageMap = new Map<string, number>();
    for (const row of rawStages) {
      const normalized = normalizeStage(row.stage);
      stageMap.set(normalized, (stageMap.get(normalized) || 0) + Number(row.count || 0));
    }
    const stageOrder = ['Seed', 'Series A', 'Series B', 'Late Stage', 'Public', 'Acquired', 'Unknown'];
    const stages = Array.from(stageMap.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => {
        const ai = stageOrder.indexOf(a.stage);
        const bi = stageOrder.indexOf(b.stage);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return b.count - a.count;
      });
    const [needsDbCount] = await query<{ count: number }>(`SELECT COUNT(*) as count FROM ai_startups ${baseWhere} AND needs_database = 1`);
    const [totalPersons] = await query<{ count: number }>('SELECT COUNT(*) as count FROM key_persons');
    const [totalNews] = await query<{ count: number }>('SELECT COUNT(*) as count FROM company_content');
    const topFunded = await query(
      `SELECT id, name, country, vertical, funding_amount, stage FROM ai_startups 
       WHERE COALESCE(outreach_status, 'new') != 'noise'
         AND funding_amount IS NOT NULL AND funding_amount != '' AND funding_amount != 'N/A'
       ORDER BY CAST(REGEXP_REPLACE(REPLACE(REPLACE(REPLACE(funding_amount, '$', ''), '+', ''), ',', ''), '[^0-9.]', '') AS DECIMAL(20,2)) DESC
       LIMIT 10`
    );
    const investorRows = await query<{ investors: string }>(
      "SELECT investors FROM ai_startups WHERE COALESCE(outreach_status, 'new') != 'noise' AND investors IS NOT NULL AND investors != ''"
    );
    const vcSet = new Set<string>();
    for (const row of investorRows) {
      row.investors.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).forEach(v => vcSet.add(v));
    }

    const result = {
      totalStartups: total.count,
      regions,
      avgRelevance: Math.round((avg.avg || 0) * 10) / 10,
      verticals,
      stages,
      needsDatabase: needsDbCount.count,
      totalPersons: totalPersons.count,
      totalNews: totalNews.count,
      topFunded,
      totalVCs: vcSet.size,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
