import test from 'node:test';
import assert from 'node:assert/strict';

// Import our server API handler (using dynamic import or built module)
import { handleApiRoute } from '../src/server/api.ts';

test('Lead API validation rejects missing required fields', async () => {
  const req = {
    method: 'POST',
    url: '/api/leads',
    body: {
      fullName: 'John Doe',
      // missing email, phone, etc.
    },
  };

  const res = await handleApiRoute(req);
  assert.equal(res.status, 400);
  assert.ok(res.data.error.includes('Missing required fields'));
});

test('Lead API validation rejects invalid email format', async () => {
  const req = {
    method: 'POST',
    url: '/api/leads',
    body: {
      fullName: 'John Doe',
      email: 'not-an-email',
      phone: '5551234567',
      address: '123 Main St, Austin, TX',
      serviceType: 'Roof Repair',
      description: 'Severe leak in master bedroom ceiling',
    },
  };

  const res = await handleApiRoute(req);
  assert.equal(res.status, 400);
  assert.ok(res.data.error.includes('Invalid email format'));
});

test('Lead API accepts well-formed estimate request', async () => {
  const req = {
    method: 'POST',
    url: '/api/leads',
    body: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Austin, TX 78701',
      serviceType: 'Roof Replacement',
      preferredContact: 'phone',
      description: 'Need full asphalt shingle replacement after recent storm',
    },
  };

  const res = await handleApiRoute(req);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.leadId);
});

test('Setup Intent API returns valid setup structure with client secret', async () => {
  const req = {
    method: 'POST',
    url: '/api/setup-intents',
    body: {
      accountId: 'biz_apexroofing',
      confirmationToken: 'ctok_test_12345678',
      email: 'customer@example.com',
      currency: 'usd',
    },
  };

  const res = await handleApiRoute(req);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.setupIntentId);
  assert.ok(res.data.clientSecret);
});

test('Invoice API rejects requests with missing items', async () => {
  const req = {
    method: 'POST',
    url: '/api/invoices',
    body: {
      recipientEmails: ['customer@example.com'],
      items: [],
    },
  };

  const res = await handleApiRoute(req);
  assert.equal(res.status, 400);
});

test('Invoice API creates draft and simulates charge on saved payment method', async () => {
  const req = {
    method: 'POST',
    url: '/api/invoices',
    body: {
      recipientEmails: ['customer@example.com'],
      paymentMethodId: 'payt_test_saved_card_99',
      chargeAutomatically: true,
      items: [
        {
          quantity: 1,
          variant: {
            title: 'Roof Replacement Final Balance',
            price: 4500,
            currency: 'usd',
          },
        },
      ],
    },
  };

  const res = await handleApiRoute(req);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.invoiceId);
  assert.equal(res.data.chargedAutomatically, true);
});
