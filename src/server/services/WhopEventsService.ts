/**
 * Whop Server-Side Events Service
 * 
 * Interacts with the official Whop Events API:
 *   - Create: POST https://api.whop.com/api/v1/events
 *   - List:   GET  https://api.whop.com/api/v1/events
 * 
 * Documentation:
 *   - https://docs.whop.com/api-reference/events/create-event
 *   - https://docs.whop.com/api-reference/events/list-events
 *   - https://docs.whop.com/developer/ads/events-api
 * 
 * Server-only service: Never exposes API keys or secrets to client browser bundles.
 */

export interface WhopEventsConfig {
  apiKey?: string;
  accountId?: string;
  enabled?: boolean;
  apiOrigin?: string;
  timeoutMs?: number;
}

export type SupportedCustomEventName =
  | 'estimate_requested'
  | 'service_viewed'
  | 'deposit_started';

export interface EstimateRequestedEventInput {
  leadId?: string;
  serviceType: string;
  preferredContact?: string;
  postalCode?: string;
  estimatedBudget?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  url?: string;
  referrerUrl?: string;
  idempotencyKey?: string;
}

export interface ServiceViewedEventInput {
  serviceId: string;
  serviceTitle: string;
  price?: string | number;
  url?: string;
  referrerUrl?: string;
  idempotencyKey?: string;
}

export interface DepositStartedEventInput {
  planId: string;
  amount: number;
  currency?: string;
  serviceName?: string;
  email?: string;
  url?: string;
  idempotencyKey?: string;
}

export interface WhopEventPayload {
  account_id: string;
  event_name: 'custom';
  custom_name: SupportedCustomEventName;
  action_source: 'website' | 'system' | 'email';
  event_id: string;
  event_time?: string;
  url?: string;
  referrer_url?: string;
  product_id?: string;
  variant_id?: string;
  value?: number;
  currency?: string;
  user?: {
    email?: string;
    name?: string;
    phone?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  context?: {
    action_source?: string;
    utm_source?: string;
  };
  'idempotency-key'?: string;
}

export interface WhopEventResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  eventId?: string;
  status: number;
  error?: string;
  data?: any;
}

export interface WhopListEventsQuery {
  accountId: string;
  from?: string;
  to?: string;
  first?: number;
  after?: string;
  before?: string;
  direction?: 'asc' | 'desc';
  event?: string;
  identifier?: string;
}

export interface WhopListEventsResult {
  success: boolean;
  status: number;
  data?: any[];
  pageInfo?: {
    startCursor?: string | null;
    endCursor?: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  error?: string;
}

export class WhopEventsService {
  private config: WhopEventsConfig;
  private inMemoryDispatchedEventIds = new Set<string>();

  constructor(config?: WhopEventsConfig) {
    this.config = config || {};
  }

  private isEnabled(): boolean {
    if (typeof this.config.enabled === 'boolean') {
      return this.config.enabled;
    }
    if (typeof process !== 'undefined' && process.env.WHOP_SERVER_EVENTS_ENABLED) {
      return process.env.WHOP_SERVER_EVENTS_ENABLED === 'true';
    }
    return false;
  }

  private getApiOrigin(): string {
    const origin =
      this.config.apiOrigin ||
      (typeof process !== 'undefined' && process.env.WHOP_API_ORIGIN) ||
      'https://api.whop.com';
    const clean = origin.replace(/\/+$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }

  private getApiKey(override?: string): string | undefined {
    return (
      override ||
      this.config.apiKey ||
      (typeof process !== 'undefined'
        ? process.env.WHOP_COMPANY_API_KEY || process.env.WHOP_API_KEY
        : undefined)
    );
  }

  private getAccountId(override?: string): string {
    return (
      override ||
      this.config.accountId ||
      (typeof process !== 'undefined' ? process.env.WHOP_ACCOUNT_ID : undefined) ||
      'biz_yxb2Bl22qgep3g'
    );
  }

  /**
   * Generates a stable unique event ID for deduplication
   */
  private generateEventId(prefix: string, seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash).toString(36);
    return `evt_${prefix}_${absHash}`;
  }

  /**
   * Dispatches a raw event to POST /api/v1/events
   */
  public async sendEvent(
    payload: WhopEventPayload,
    apiKeyOverride?: string
  ): Promise<WhopEventResult> {
    // 1. Feature Flag Guard
    if (!this.isEnabled()) {
      return {
        success: false,
        skipped: true,
        reason: 'FEATURE_DISABLED: WHOP_SERVER_EVENTS_ENABLED is false or unset.',
        status: 200,
      };
    }

    // 2. Validation of mandatory parameters
    if (!payload.account_id) {
      return {
        success: false,
        error: 'VALIDATION_ERROR: Missing mandatory account_id.',
        status: 400,
      };
    }

    if (!payload.custom_name) {
      return {
        success: false,
        error: 'VALIDATION_ERROR: Missing custom_name.',
        status: 400,
      };
    }

    // Custom name length check (Whop platform limit: max 35 characters)
    if (payload.custom_name.length > 35) {
      return {
        success: false,
        error: `VALIDATION_ERROR: custom_name exceeds 35 character limit (${payload.custom_name.length} chars).`,
        status: 400,
      };
    }

    // 3. Deduplication check in memory (avoids rapid duplicates within process)
    if (this.inMemoryDispatchedEventIds.has(payload.event_id)) {
      return {
        success: false,
        skipped: true,
        reason: `DEDUPLICATED: Event ID ${payload.event_id} was already dispatched.`,
        eventId: payload.event_id,
        status: 200,
      };
    }

    // 4. API Key Resolution
    const apiKey = this.getApiKey(apiKeyOverride);
    if (!apiKey) {
      return {
        success: false,
        error: 'GATEWAY_UNCONFIGURED: Missing Whop API credentials (WHOP_COMPANY_API_KEY).',
        status: 503,
      };
    }

    const url = `${this.getApiOrigin()}/events`;
    const timeoutMs = this.config.timeoutMs || 5000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Api-Version-Date': '2026-11-03-1',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { rawText: 'Non-JSON response' };
      }

      if (!response.ok) {
        const errorMsg =
          (data && (data.error?.message || data.message)) ||
          response.statusText ||
          `Events API responded with HTTP ${response.status}`;

        return {
          success: false,
          status: response.status,
          error: errorMsg,
          data,
        };
      }

      // Record successful dispatch to deduplication cache
      this.inMemoryDispatchedEventIds.add(payload.event_id);

      return {
        success: true,
        status: response.status,
        eventId: data.id || payload.event_id,
        data,
      };
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err.name === 'AbortError';
      return {
        success: false,
        status: isAbort ? 504 : 500,
        error: isAbort
          ? `TIMEOUT: Events API request timed out after ${timeoutMs}ms.`
          : (err as Error).message || 'Network error executing Events API request',
      };
    }
  }

  /**
   * Event 1: estimate_requested
   * Triggered strictly after successful validation and confirmed Whop Lead creation.
   */
  public async trackEstimateRequested(
    input: EstimateRequestedEventInput,
    apiKeyOverride?: string
  ): Promise<WhopEventResult> {
    const accountId = this.getAccountId();
    const eventTime = new Date().toISOString();
    const seed = input.leadId || `${input.email || 'guest'}_${input.serviceType}_${eventTime.slice(0, 10)}`;
    const eventId = input.idempotencyKey || this.generateEventId('est', seed);

    const payload: WhopEventPayload = {
      account_id: accountId,
      event_name: 'custom',
      custom_name: 'estimate_requested',
      action_source: 'website',
      event_id: eventId,
      event_time: eventTime,
      url: input.url || 'https://apexroof-template.whop.app/#contact',
      referrer_url: input.referrerUrl,
      product_id: 'prod_r8sfpPYp7nzxz',
      value: input.estimatedBudget ? parseFloat(input.estimatedBudget.replace(/[^0-9.]/g, '')) : undefined,
      currency: 'usd',
      user: {
        email: input.email,
        name: input.fullName,
        phone: input.phone,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        country: input.country || 'US',
      },
      context: {
        action_source: 'website',
        utm_source: 'direct',
      },
      'idempotency-key': eventId,
    };

    return this.sendEvent(payload, apiKeyOverride);
  }

  /**
   * Event 2: service_viewed
   * Triggered on meaningful service view interactions.
   */
  public async trackServiceViewed(
    input: ServiceViewedEventInput,
    apiKeyOverride?: string
  ): Promise<WhopEventResult> {
    const accountId = this.getAccountId();
    const eventTime = new Date().toISOString();
    // Daily/session window seed for deduplication to prevent repeated renders
    const dayWindow = eventTime.slice(0, 13); // Hourly resolution
    const eventId = input.idempotencyKey || this.generateEventId('sv', `${input.serviceId}_${dayWindow}`);

    const numericPrice = typeof input.price === 'number'
      ? input.price
      : input.price ? parseFloat(input.price.replace(/[^0-9.]/g, '')) : undefined;

    const payload: WhopEventPayload = {
      account_id: accountId,
      event_name: 'custom',
      custom_name: 'service_viewed',
      action_source: 'website',
      event_id: eventId,
      event_time: eventTime,
      url: input.url || `https://apexroof-template.whop.app/#services?service=${encodeURIComponent(input.serviceId)}`,
      referrer_url: input.referrerUrl,
      product_id: 'prod_r8sfpPYp7nzxz',
      value: numericPrice,
      currency: 'usd',
      context: {
        action_source: 'website',
      },
      'idempotency-key': eventId,
    };

    return this.sendEvent(payload, apiKeyOverride);
  }

  /**
   * Event 3: deposit_started
   * Triggered when customer actively starts the deposit checkout.
   */
  public async trackDepositStarted(
    input: DepositStartedEventInput,
    apiKeyOverride?: string
  ): Promise<WhopEventResult> {
    const accountId = this.getAccountId();
    const eventTime = new Date().toISOString();
    const minuteWindow = eventTime.slice(0, 16); // 1-minute window
    const eventId = input.idempotencyKey || this.generateEventId('dep', `${input.planId}_${input.email || 'guest'}_${minuteWindow}`);

    const payload: WhopEventPayload = {
      account_id: accountId,
      event_name: 'custom',
      custom_name: 'deposit_started',
      action_source: 'website',
      event_id: eventId,
      event_time: eventTime,
      url: input.url || 'https://apexroof-template.whop.app/#services',
      product_id: 'prod_r8sfpPYp7nzxz',
      variant_id: input.planId,
      value: input.amount,
      currency: input.currency ? input.currency.toLowerCase() : 'usd',
      user: {
        email: input.email,
      },
      context: {
        action_source: 'website',
      },
      'idempotency-key': eventId,
    };

    return this.sendEvent(payload, apiKeyOverride);
  }

  /**
   * List Events for verification (GET /api/v1/events)
   */
  public async listEvents(
    query: WhopListEventsQuery,
    apiKeyOverride?: string
  ): Promise<WhopListEventsResult> {
    const apiKey = this.getApiKey(apiKeyOverride);
    if (!apiKey) {
      return {
        success: false,
        status: 503,
        error: 'GATEWAY_UNCONFIGURED: Missing Whop API credentials.',
      };
    }

    const params = new URLSearchParams();
    params.set('account_id', query.accountId);
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);
    if (query.first) params.set('first', query.first.toString());
    if (query.after) params.set('after', query.after);
    if (query.before) params.set('before', query.before);
    if (query.direction) params.set('direction', query.direction);
    if (query.event) params.set('event', query.event);
    if (query.identifier) params.set('identifier', query.identifier);

    const url = `${this.getApiOrigin()}/events?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Api-Version-Date': '2026-11-03-1',
        },
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: json.error?.message || response.statusText,
        };
      }

      return {
        success: true,
        status: response.status,
        data: json.data || [],
        pageInfo: json.page_info ? {
          startCursor: json.page_info.start_cursor,
          endCursor: json.page_info.end_cursor,
          hasNextPage: !!json.page_info.has_next_page,
          hasPreviousPage: !!json.page_info.has_previous_page,
        } : undefined,
      };
    } catch (err) {
      return {
        success: false,
        status: 500,
        error: (err as Error).message,
      };
    }
  }
}
