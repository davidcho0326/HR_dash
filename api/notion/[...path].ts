/**
 * Vercel Serverless Function - Notion API Proxy
 *
 * CORS 우회 및 API 키 보안을 위한 프록시 역할
 * 클라이언트에서 /api/notion/* 경로로 요청 시 Notion API로 포워딩
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2022-06-28';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // API 키 확인
  if (!NOTION_API_KEY) {
    res.status(500).json({ error: 'NOTION_API_KEY is not configured' });
    return;
  }

  try {
    // 경로 추출: /api/notion/databases/xxx/query -> databases/xxx/query
    const { path } = req.query;
    const endpoint = Array.isArray(path) ? path.join('/') : (path || '');

    if (!endpoint) {
      res.status(400).json({ error: 'API endpoint is required' });
      return;
    }

    const notionUrl = `https://api.notion.com/v1/${endpoint}`;

    console.log(`[Notion Proxy] ${req.method} ${notionUrl}`);

    // Notion API 호출
    const response = await fetch(notionUrl, {
      method: req.method || 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();

    // 에러 로깅
    if (!response.ok) {
      console.error(`[Notion Proxy Error] ${response.status}:`, data);
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Notion Proxy Error]', error);
    res.status(500).json({
      error: 'Failed to proxy request to Notion API',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
