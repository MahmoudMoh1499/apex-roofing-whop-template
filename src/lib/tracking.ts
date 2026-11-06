/**
 * Whop Tracking Utility
 * Official wrapper around window.whop.track with deduplication and metadata sanitation
 */

declare global {
  interface Window {
    whop?: {
      track: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

// Track fired event IDs to prevent duplicate firings within the same session
const firedEventIds = new Set<string>();

/**
 * Fires an event to Whop Pixel if available.
 * Safely strips sensitive fields like credit card or raw secrets.
 */
export function trackWhopEvent(
  eventName: string,
  payload: Record<string, unknown> = {},
  dedupeKey?: string
): void {
  try {
    if (dedupeKey) {
      if (firedEventIds.has(dedupeKey)) {
        return;
      }
      firedEventIds.add(dedupeKey);
    }

    // Sanitize payload: avoid sensitive PII or payment details
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('card') ||
        lower.includes('secret') ||
        lower.includes('password') ||
        lower.includes('cvv') ||
        lower.includes('token')
      ) {
        continue;
      }
      sanitized[key] = value;
    }

    if (typeof window !== 'undefined' && window.whop && typeof window.whop.track === 'function') {
      window.whop.track(eventName, sanitized);
    } else {
      console.debug(`[Whop Track Preview] ${eventName}:`, sanitized);
    }
  } catch (err) {
    console.warn('[Whop Tracking Warning] Failed to dispatch event:', err);
  }
}

/**
 * Specifically tracked custom event: estimate_requested
 */
export function trackEstimateRequested(data: {
  serviceType: string;
  preferredContact: string;
  postalCode?: string;
  estimatedBudget?: string;
}): void {
  const eventId = `estimate_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  trackWhopEvent('estimate_requested', {
    event_id: eventId,
    service_type: data.serviceType,
    preferred_contact: data.preferredContact,
    postal_code: data.postalCode || 'N/A',
    timestamp: new Date().toISOString(),
  }, eventId);

  // Also fire standard lead event
  trackWhopEvent('lead', {
    event_id: `lead_${eventId}`,
    service: data.serviceType,
  });
}

/**
 * Specifically tracked custom event: service_viewed
 */
export function trackServiceViewed(data: {
  serviceId: string;
  serviceTitle: string;
  price?: string;
}): void {
  const dedupeKey = `view_service_${data.serviceId}`;
  trackWhopEvent('service_viewed', {
    service_id: data.serviceId,
    service_title: data.serviceTitle,
    starting_price: data.price,
  }, dedupeKey);
}

/**
 * Specifically tracked custom event: deposit_started
 */
export function trackDepositStarted(data: {
  planId: string;
  amount: number;
  currency: string;
  serviceName: string;
}): void {
  const eventId = `deposit_${data.planId}_${Date.now()}`;
  trackWhopEvent('deposit_started', {
    event_id: eventId,
    plan_id: data.planId,
    value: data.amount,
    currency: data.currency,
    service_name: data.serviceName,
  });

  // Standard checkout initiation event
  trackWhopEvent('initiate_checkout', {
    variant_id: data.planId,
    value: data.amount,
    currency: data.currency,
  });
}
