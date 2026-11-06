import { handleApiRoute, ApiRequest } from './api.ts';

export interface Env {
  WHOP_API_KEY?: string;
  ADMIN_SECRET_KEY?: string;
  WHOP_ACCOUNT_ID?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Populate process.env simulation from worker environment bindings
    if (typeof process === 'undefined') {
      (globalThis as any).process = { env: {} };
    }
    if (env.WHOP_API_KEY) process.env.WHOP_API_KEY = env.WHOP_API_KEY;
    if (env.ADMIN_SECRET_KEY) process.env.ADMIN_SECRET_KEY = env.ADMIN_SECRET_KEY;
    if (env.WHOP_ACCOUNT_ID) process.env.WHOP_ACCOUNT_ID = env.WHOP_ACCOUNT_ID;
    if (env.UPSTASH_REDIS_REST_URL) process.env.UPSTASH_REDIS_REST_URL = env.UPSTASH_REDIS_REST_URL;
    if (env.UPSTASH_REDIS_REST_TOKEN) process.env.UPSTASH_REDIS_REST_TOKEN = env.UPSTASH_REDIS_REST_TOKEN;

    // 1. API Route Handling: /api/*
    if (url.pathname.startsWith('/api/')) {
      let body: Record<string, any> = {};
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          body = await request.json();
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
        headers,
        ip,
      };

      const result = await handleApiRoute(apiReq);

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
