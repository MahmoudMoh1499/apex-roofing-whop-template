/**
 * Server-Side Whop Events API Test Suite
 * 
 * Tests WhopEventsService and api.ts server-side event dispatching.
 * ALL network calls are strictly mocked with zero real Whop API calls.
 */

import test from 'node:test';
import assert from 'node:assert';
import { WhopEventsService } from '../src/server/services/WhopEventsService.ts';
import { handleApiRoute } from '../src/server/api.ts';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.WHOP_SERVER_EVENTS_ENABLED;
  delete process.env.WHOP_COMPANY_API_KEY;
  delete process.env.WHOP_API_KEY;
  delete process.env.WHOP_ACCOUNT_ID;
});

// 1. Feature flag disabled
test('1. Feature flag disabled: skips network request and returns skipped status', async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response(JSON.stringify({ id: 'evt_123' }), { status: 201 });
  };

  const service = new WhopEventsService({ enabled: false, apiKey: 'apik_mock_test' });
  const result = await service.trackEstimateRequested({
    serviceType: 'Full Roof Replacement',
    email: 'test@example.com',
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.skipped, true);
  assert.match(result.reason, /FEATURE_DISABLED/);
  assert.strictEqual(fetchCalled, false, 'Fetch must never be called when feature flag is disabled');
});

// 2. Missing API key
test('2. Missing API key: fails closed safely with 503 error', async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response('{}', { status: 200 });
  };

  const service = new WhopEventsService({ enabled: true, apiKey: undefined });
  const result = await service.trackServiceViewed({
    serviceId: 'roof-repair',
    serviceTitle: 'Emergency Leak Repair',
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 503);
  assert.match(result.error, /GATEWAY_UNCONFIGURED/);
  assert.strictEqual(fetchCalled, false);
});

// 3. Missing account ID
test('3. Missing account ID: rejects with 400 validation error', async () => {
  const service = new WhopEventsService({ enabled: true, apiKey: 'apik_mock', accountId: '' });
  const result = await service.sendEvent({
    account_id: '',
    event_name: 'custom',
    custom_name: 'estimate_requested',
    action_source: 'website',
    event_id: 'evt_test_missing_acc',
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 400);
  assert.match(result.error, /Missing mandatory account_id/);
});

// 4. Custom event: estimate_requested
test('4. Custom event estimate_requested: formats correct endpoint and request payload', async () => {
  let capturedUrl = '';
  let capturedBody = null;
  let capturedHeaders = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url.toString();
    capturedBody = JSON.parse(options.body);
    capturedHeaders = options.headers;
    return new Response(JSON.stringify({ id: 'evt_est_mock_999' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const service = new WhopEventsService({
    enabled: true,
    apiKey: 'apik_mock_test_key_123',
    accountId: 'biz_test_apex_roof',
  });

  const result = await service.trackEstimateRequested({
    leadId: 'lead_test_123',
    serviceType: 'Comprehensive Roof Inspection',
    preferredContact: 'email',
    postalCode: '78701',
    estimatedBudget: '$5,000',
    email: 'sarah.jenkins@example.com',
    fullName: 'Sarah Jenkins',
    phone: '(512) 555-8921',
    city: 'Austin',
    state: 'TX',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, 201);
  assert.strictEqual(capturedUrl, 'https://api.whop.com/api/v1/events');
  assert.strictEqual(capturedHeaders['Authorization'], 'Bearer apik_mock_test_key_123');
  assert.strictEqual(capturedHeaders['Api-Version-Date'], '2026-11-03-1');
  assert.strictEqual(capturedBody.account_id, 'biz_test_apex_roof');
  assert.strictEqual(capturedBody.event_name, 'custom');
  assert.strictEqual(capturedBody.custom_name, 'estimate_requested');
  assert.strictEqual(capturedBody.action_source, 'website');
  assert.strictEqual(capturedBody.user.email, 'sarah.jenkins@example.com');
  assert.strictEqual(capturedBody.user.name, 'Sarah Jenkins');
  assert.strictEqual(capturedBody.value, 5000);
});

// 5. Custom event: service_viewed
test('5. Custom event service_viewed: formats correct endpoint and request payload', async () => {
  let capturedBody = null;

  globalThis.fetch = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'evt_sv_mock_111' }), { status: 201 });
  };

  const service = new WhopEventsService({
    enabled: true,
    apiKey: 'apik_mock_key',
    accountId: 'biz_test_roof',
  });

  const result = await service.trackServiceViewed({
    serviceId: 'commercial-tpo',
    serviceTitle: 'Commercial TPO Flat Roofing',
    price: '$899',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(capturedBody.event_name, 'custom');
  assert.strictEqual(capturedBody.custom_name, 'service_viewed');
  assert.strictEqual(capturedBody.product_id, 'prod_r8sfpPYp7nzxz');
  assert.strictEqual(capturedBody.value, 899);
});

// 6. Custom event: deposit_started
test('6. Custom event deposit_started: formats correct endpoint and request payload', async () => {
  let capturedBody = null;

  globalThis.fetch = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'evt_dep_mock_222' }), { status: 201 });
  };

  const service = new WhopEventsService({
    enabled: true,
    apiKey: 'apik_mock_key',
    accountId: 'biz_test_roof',
  });

  const result = await service.trackDepositStarted({
    planId: 'plan_8Z1S3Yw1WjX4a',
    amount: 500,
    currency: 'USD',
    serviceName: 'Full Roof Replacement',
    email: 'sarah.jenkins@example.com',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(capturedBody.event_name, 'custom');
  assert.strictEqual(capturedBody.custom_name, 'deposit_started');
  assert.strictEqual(capturedBody.variant_id, 'plan_8Z1S3Yw1WjX4a');
  assert.strictEqual(capturedBody.value, 500);
  assert.strictEqual(capturedBody.currency, 'usd');
});

// 7. Custom name 35-character limit validation
test('7. Custom name length check: rejects names > 35 characters', async () => {
  const service = new WhopEventsService({ enabled: true, apiKey: 'apik_mock', accountId: 'biz_test' });
  const result = await service.sendEvent({
    account_id: 'biz_test',
    event_name: 'custom',
    custom_name: 'this_is_an_extremely_long_custom_event_name_exceeding_35_chars',
    action_source: 'website',
    event_id: 'evt_overflow',
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 400);
  assert.match(result.error, /35 character limit/);
});

// 8. HTTP error response
test('8. HTTP error response: handles 400/401/500 without throwing', async () => {
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({ error: { message: 'Invalid custom payload schema' } }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const service = new WhopEventsService({ enabled: true, apiKey: 'apik_mock', accountId: 'biz_test' });
  const result = await service.trackServiceViewed({
    serviceId: 'roof-inspection',
    serviceTitle: 'Drone Roof Inspection',
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 422);
  assert.strictEqual(result.error, 'Invalid custom payload schema');
});

// 9. Network timeout
test('9. Network timeout: handles abort signal and returns 504 status', async () => {
  globalThis.fetch = async (url, options) => {
    return new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => {
        const abortErr = new Error('The operation was aborted');
        abortErr.name = 'AbortError';
        reject(abortErr);
      });
    });
  };

  const service = new WhopEventsService({
    enabled: true,
    apiKey: 'apik_mock',
    accountId: 'biz_test',
    timeoutMs: 50, // Short timeout for test
  });

  const result = await service.trackEstimateRequested({
    serviceType: 'Drone Inspection',
    email: 'fast@example.com',
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 504);
  assert.match(result.error, /TIMEOUT/);
});

// 10. Malformed response
test('10. Malformed response: handles non-JSON responses gracefully', async () => {
  globalThis.fetch = async () => {
    return new Response('<html>Gateway Error 502</html>', {
      status: 502,
      headers: { 'Content-Type': 'text/html' },
    });
  };

  const service = new WhopEventsService({ enabled: true, apiKey: 'apik_mock', accountId: 'biz_test' });
  const result = await service.trackDepositStarted({
    planId: 'plan_123',
    amount: 500,
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 502);
});

// 11. Duplicate event prevention
test('11. Duplicate event prevention: in-memory deduplication skips duplicate event IDs', async () => {
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount++;
    return new Response(JSON.stringify({ id: 'evt_dedupe_ok' }), { status: 201 });
  };

  const service = new WhopEventsService({ enabled: true, apiKey: 'apik_mock', accountId: 'biz_test' });

  // First call
  const res1 = await service.trackServiceViewed({
    serviceId: 'static-service-id',
    serviceTitle: 'Service Title',
    idempotencyKey: 'evt_static_fixed_id',
  });

  // Second call with identical idempotencyKey
  const res2 = await service.trackServiceViewed({
    serviceId: 'static-service-id',
    serviceTitle: 'Service Title',
    idempotencyKey: 'evt_static_fixed_id',
  });

  assert.strictEqual(res1.success, true);
  assert.strictEqual(res2.success, false);
  assert.strictEqual(res2.skipped, true);
  assert.match(res2.reason, /DEDUPLICATED/);
  assert.strictEqual(callCount, 1, 'HTTP fetch should only be invoked once for duplicate event ID');
});

// 12. Estimate Lead failure does not emit an event
test('12. Estimate Lead failure does not emit estimate_requested event', async () => {
  let eventDispatched = false;

  globalThis.fetch = async (url) => {
    const urlStr = url.toString();
    if (urlStr.includes('/leads')) {
      // Simulate failure on Whop Leads API
      return new Response(JSON.stringify({ error: { message: 'Failed to create lead' } }), {
        status: 400,
      });
    }
    if (urlStr.includes('/events')) {
      eventDispatched = true;
      return new Response(JSON.stringify({ id: 'evt_should_not_happen' }), { status: 201 });
    }
    return new Response('{}', { status: 200 });
  };

  process.env.WHOP_SERVER_EVENTS_ENABLED = 'true';
  process.env.WHOP_COMPANY_API_KEY = 'apik_mock_for_leads_test';

  const res = await handleApiRoute({
    method: 'POST',
    url: 'https://apexroof-template.whop.app/api/leads',
    body: {
      fullName: 'Robert Frost',
      email: 'robert@frost.example',
      phone: '(512) 555-0199',
      address: '100 Woods Lane, Austin, TX 78701',
      serviceType: 'Drone Inspection',
      description: 'Check roof slope after hail storm',
    },
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(eventDispatched, false, 'No event should be dispatched if Lead creation fails');
});

// 13. Repeated service renders do not emit duplicate events
test('13. Repeated service views with same daily window generate deterministic stable event ID', () => {
  const service = new WhopEventsService({ enabled: false });
  // Generate deterministic ID check
  const id1 = service['generateEventId']('sv', 'service_1_2026-11-06T19');
  const id2 = service['generateEventId']('sv', 'service_1_2026-11-06T19');
  const id3 = service['generateEventId']('sv', 'service_2_2026-11-06T19');

  assert.strictEqual(id1, id2, 'Identical service view inputs must generate the exact same event ID');
  assert.notStrictEqual(id1, id3, 'Different service views must produce distinct event IDs');
});

// 14. Deposit modal opening alone does not emit an event
test('14. Deposit modal opening alone does not trigger server-side deposit_started', async () => {
  let eventDispatched = false;

  globalThis.fetch = async (url) => {
    if (url.toString().includes('/events')) {
      eventDispatched = true;
    }
    return new Response('{}', { status: 200 });
  };

  process.env.WHOP_SERVER_EVENTS_ENABLED = 'true';

  // Client requests standard GET or unrelated route
  const res = await handleApiRoute({
    method: 'GET',
    url: 'https://apexroof-template.whop.app/api/non-existent-modal-route',
    body: {},
  });

  assert.strictEqual(res.status, 404);
  assert.strictEqual(eventDispatched, false, 'Modal rendering or route polling must never trigger deposit_started');
});

// 15. Server-side /api/events endpoint handles service_viewed and deposit_started
test('15. /api/events endpoint accepts valid service_viewed and deposit_started events', async () => {
  let dispatchedEvents = [];

  globalThis.fetch = async (url, options) => {
    if (url.toString().includes('/events')) {
      const parsed = JSON.parse(options.body);
      dispatchedEvents.push(parsed.custom_name);
      return new Response(JSON.stringify({ id: `evt_${parsed.custom_name}_ok` }), { status: 201 });
    }
    return new Response('{}', { status: 200 });
  };

  process.env.WHOP_SERVER_EVENTS_ENABLED = 'true';
  process.env.WHOP_COMPANY_API_KEY = 'apik_mock_events_api';

  // 1. service_viewed
  const svRes = await handleApiRoute({
    method: 'POST',
    url: 'https://apexroof-template.whop.app/api/events',
    body: {
      eventName: 'service_viewed',
      payload: {
        serviceId: 'roof-replacement',
        serviceTitle: 'Full Roof Replacement',
        price: 500,
      },
    },
  });

  assert.strictEqual(svRes.status, 201);
  assert.strictEqual(dispatchedEvents.includes('service_viewed'), true);

  // 2. deposit_started
  const depRes = await handleApiRoute({
    method: 'POST',
    url: 'https://apexroof-template.whop.app/api/events',
    body: {
      eventName: 'deposit_started',
      payload: {
        planId: 'plan_8Z1S3Yw1WjX4a',
        amount: 500,
        serviceName: 'Full Roof Replacement',
      },
    },
  });

  assert.strictEqual(depRes.status, 201);
  assert.strictEqual(dispatchedEvents.includes('deposit_started'), true);

  // 3. invalid event name rejected
  const invRes = await handleApiRoute({
    method: 'POST',
    url: 'https://apexroof-template.whop.app/api/events',
    body: {
      eventName: 'unsupported_random_event',
      payload: {},
    },
  });

  assert.strictEqual(invRes.status, 400);
});
