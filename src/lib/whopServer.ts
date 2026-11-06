/**
 * Server-side Whop API Client
 * Interacts with Whop REST API using official dated versioning
 * Safe for server environments only; never bundled into client
 */

export interface WhopLeadInput {
  accountId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  preferredContact: string;
  description: string;
  referrer?: string;
}

export interface WhopSetupIntentInput {
  accountId: string;
  confirmationToken: string;
  currency?: string;
  email?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
}

export interface WhopInvoiceInput {
  accountId: string;
  recipientEmails: string[];
  memo?: string;
  paymentMethodId?: string;
  items: Array<{
    quantity: number;
    variantId?: string;
    variant?: {
      title: string;
      price: number;
      currency: string;
    };
  }>;
}

const API_VERSION = '2026-11-03-1';

function getApiBaseUrl(): string {
  const isSandbox = process.env.WHOP_ENVIRONMENT === 'sandbox';
  return (
    process.env.WHOP_API_ORIGIN ||
    (isSandbox ? 'https://sandbox-api.whop.com/api/v1' : 'https://api.whop.com/api/v1')
  );
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Api-Version-Date': API_VERSION,
  };

  const apiKey = process.env.WHOP_API_KEY;
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

/**
 * Submit an estimate lead to Whop Leads API
 */
export async function createWhopLead(input: WhopLeadInput): Promise<{
  success: boolean;
  leadId?: string;
  error?: string;
  status: number;
}> {
  const url = `${getApiBaseUrl()}/leads`;

  const payload = {
    account_id: input.accountId,
    metadata: {
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      property_address: input.address,
      service_type: input.serviceType,
      preferred_contact: input.preferredContact,
      project_description: input.description,
      source: 'Apex Roofing Website Estimate Form',
    },
    referrer: input.referrer || 'https://apex-roofing.whop.site',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = (data && data.error && data.error.message) || res.statusText || 'Failed to submit lead';
      return { success: false, error: errMsg, status: res.status };
    }

    return {
      success: true,
      leadId: data.id,
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      status: 500,
    };
  }
}

/**
 * Create a Setup Intent from a Confirmation Token to save payment method off-session
 */
export async function createWhopSetupIntent(input: WhopSetupIntentInput): Promise<{
  success: boolean;
  setupIntentId?: string;
  clientSecret?: string;
  statusString?: string;
  paymentMethodId?: string;
  error?: string;
  status: number;
}> {
  const url = `${getApiBaseUrl()}/setup_intents`;

  const payload = {
    account_id: input.accountId,
    confirmation_token: input.confirmationToken,
    currency: (input.currency || 'usd').toLowerCase(),
    email: input.email,
    metadata: input.metadata || {},
    return_url: input.returnUrl,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = (data && data.error && data.error.message) || res.statusText || 'Failed to create setup intent';
      return { success: false, error: errMsg, status: res.status };
    }

    return {
      success: true,
      setupIntentId: data.id,
      clientSecret: data.client_secret,
      statusString: data.status,
      paymentMethodId: data.payment_method_id,
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      status: 500,
    };
  }
}

/**
 * Create a draft invoice for final project balance
 */
export async function createWhopInvoice(input: WhopInvoiceInput): Promise<{
  success: boolean;
  invoiceId?: string;
  checkoutLink?: string;
  error?: string;
  status: number;
}> {
  const url = `${getApiBaseUrl()}/invoices`;

  const items = input.items.map((item) => {
    if (item.variantId) {
      return {
        quantity: item.quantity,
        variant_id: item.variantId,
      };
    }
    return {
      quantity: item.quantity,
      variant: item.variant,
    };
  });

  const payload: Record<string, unknown> = {
    account_id: input.accountId,
    recipient_emails: input.recipientEmails,
    items,
  };

  if (input.memo) {
    payload.memo = input.memo;
  }
  if (input.paymentMethodId) {
    payload.payment_method_id = input.paymentMethodId;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = (data && data.error && data.error.message) || res.statusText || 'Failed to create invoice';
      return { success: false, error: errMsg, status: res.status };
    }

    return {
      success: true,
      invoiceId: data.id,
      checkoutLink: data.checkout_link,
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      status: 500,
    };
  }
}

/**
 * Issue and attempt off-session charge on a draft invoice
 */
export async function issueWhopInvoice(invoiceId: string): Promise<{
  success: boolean;
  invoice?: Record<string, unknown>;
  error?: string;
  status: number;
}> {
  const url = `${getApiBaseUrl()}/invoices/${invoiceId}/issue`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = (data && data.error && data.error.message) || res.statusText || 'Failed to issue invoice';
      return { success: false, error: errMsg, status: res.status };
    }

    return {
      success: true,
      invoice: data,
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      status: 500,
    };
  }
}

/**
 * Charge an open invoice directly to a customer saved payment method
 */
export async function chargeWhopInvoice(
  invoiceId: string,
  paymentMethodId?: string
): Promise<{
  success: boolean;
  invoice?: Record<string, unknown>;
  error?: string;
  status: number;
}> {
  const url = `${getApiBaseUrl()}/invoices/${invoiceId}/charge`;
  const body = paymentMethodId ? JSON.stringify({ payment_method_id: paymentMethodId }) : undefined;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = (data && data.error && data.error.message) || res.statusText || 'Failed to charge invoice';
      return { success: false, error: errMsg, status: res.status };
    }

    return {
      success: true,
      invoice: data,
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      status: 500,
    };
  }
}

/**
 * Send invoice with checkout link via email
 */
export async function sendWhopInvoice(invoiceId: string): Promise<{
  success: boolean;
  invoice?: Record<string, unknown>;
  error?: string;
  status: number;
}> {
  const url = `${getApiBaseUrl()}/invoices/${invoiceId}/send`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = (data && data.error && data.error.message) || res.statusText || 'Failed to send invoice';
      return { success: false, error: errMsg, status: res.status };
    }

    return {
      success: true,
      invoice: data,
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      status: 500,
    };
  }
}
