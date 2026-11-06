import { handleApiRoute, ApiRequest } from './api.ts';

export interface Env {
  WHOP_COMPANY_API_KEY?: string;
  WHOP_API_KEY?: string;
  ADMIN_SECRET_KEY?: string;
  WHOP_ACCOUNT_ID?: string;
  WHOP_WEBHOOK_SECRET?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  DB?: any;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Populate process.env simulation from worker environment bindings
    if (typeof process === 'undefined') {
      (globalThis as any).process = { env: {} };
    }
    if (env.WHOP_COMPANY_API_KEY) process.env.WHOP_COMPANY_API_KEY = env.WHOP_COMPANY_API_KEY;
    if (env.WHOP_API_KEY) process.env.WHOP_API_KEY = env.WHOP_API_KEY;
    if (env.ADMIN_SECRET_KEY) process.env.ADMIN_SECRET_KEY = env.ADMIN_SECRET_KEY;
    if (env.WHOP_ACCOUNT_ID) process.env.WHOP_ACCOUNT_ID = env.WHOP_ACCOUNT_ID;
    if (env.WHOP_WEBHOOK_SECRET) process.env.WHOP_WEBHOOK_SECRET = env.WHOP_WEBHOOK_SECRET;
    if (env.UPSTASH_REDIS_REST_URL) process.env.UPSTASH_REDIS_REST_URL = env.UPSTASH_REDIS_REST_URL;
    if (env.UPSTASH_REDIS_REST_TOKEN) process.env.UPSTASH_REDIS_REST_TOKEN = env.UPSTASH_REDIS_REST_TOKEN;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key, webhook-id, webhook-timestamp, webhook-signature',
        },
      });
    }

    // 1. API Route Handling: /api/*
    if (url.pathname.startsWith('/api/')) {
      let body: Record<string, any> = {};
      let rawBody = '';

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          rawBody = await request.text();
          body = JSON.parse(rawBody);
        } catch {
          body = {};
        }
      }

      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';

      const apiReq: ApiRequest = {
        method: request.method,
        url: request.url,
        body,
        rawBody,
        headers,
        ip,
      };

      const result = await handleApiRoute(apiReq, env);

      return new Response(JSON.stringify(result.data), {
        status: result.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 2. Static Asset Delivery (via Cloudflare Workers ASSETS binding)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Apex Roofing Co — Whop Website Online', { status: 200 });
  },
};
