/**
 * Server-side Whop API Client
 * Interacts with Whop REST API
 * Safe for server environments only; never bundled into client
 */

export interface WhopLeadInput {
  accountId: string;
  userId?: string;
  productId?: string;
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

export interface WhopPaymentInput {
  accountId: string;
  confirmationToken: string;
  variantId: string;
  email?: string;
  setupFutureUsage?: 'off_session' | null;
  returnUrl?: string;
  metadata?: Record<string, string>;
}

export interface WhopInvoiceInput {
  accountId: string;
  recipientEmails: string[];
  customerName?: string;
  memo?: string;
  paymentMethodId?: string;
  items: Array<{
    quantity: number;
    variant_id?: string;
    variantId?: string;
    variant?: any;
  }>;
}

function getApiBaseUrl(): string {
  const origin =
    (typeof process !== 'undefined' && process.env.WHOP_API_ORIGIN) ||
    'https://api.whop.com';
  const cleanOrigin = origin.replace(/\/+$/, '');
  return cleanOrigin.endsWith('/api/v1') ? cleanOrigin : `${cleanOrigin}/api/v1`;
}

function getAuthHeaders(apiKeyOverride?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Api-Version-Date': '2026-11-03-1',
  };

  const apiKey =
    apiKeyOverride ||
    (typeof process !== 'undefined'
      ? process.env.WHOP_COMPANY_API_KEY || process.env.WHOP_API_KEY
      : undefined);

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

/**
 * Submit an estimate lead to Whop Leads API
 */
export async function createWhopLead(
  input: WhopLeadInput,
  apiKeyOverride?: string
): Promise<{
  success: boolean;
  leadId?: string;
  error?: string;
  status: number;
  data?: any;
}> {
  const url = `${getApiBaseUrl()}/leads`;

  const payload = {
    company_id: input.accountId || 'biz_yxb2Bl22qgep3g',
    user_id: input.userId || 'user_B3eADGFKRWB1S',
    product_id: input.productId || 'prod_r8sfpPYp7nzxz',
    metadata: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      serviceType: input.serviceType,
      preferredContact: input.preferredContact,
      description: input.description,
      source: 'Apex Roofing Website Estimate Form',
    },
    referrer: input.referrer || 'https://apexroof-template.whop.app',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(apiKeyOverride),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (data && (data.error?.message || data.message)) ||
        res.statusText ||
        'Failed to submit lead';
      return { success: false, error: errMsg, status: res.status, data };
    }

    return {
      success: true,
      leadId: data.id,
      status: res.status,
      data,
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
 * Execute a payment with confirmation token (and setup_future_usage for off-session card saving)
 */
export async function createWhopPayment(
  input: WhopPaymentInput,
  apiKeyOverride?: string
): Promise<{
  success: boolean;
  paymentId?: string;
  paymentMethodId?: string;
  memberId?: string;
  statusString?: string;
  error?: string;
  status: number;
  data?: any;
}> {
  const url = `${getApiBaseUrl()}/payments`;

  const payload: Record<string, unknown> = {
    account_id: input.accountId || 'biz_yxb2Bl22qgep3g',
    confirmation_token: input.confirmationToken,
    variant_id: input.variantId,
    setup_future_usage: input.setupFutureUsage || 'off_session',
    return_url: input.returnUrl || 'https://apexroof-template.whop.app',
  };

  if (input.email) {
    payload.email = input.email;
  }
  if (input.metadata) {
    payload.metadata = input.metadata;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(apiKeyOverride),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (data && (data.error?.message || data.message)) ||
        res.statusText ||
        'Failed to process payment';
      return { success: false, error: errMsg, status: res.status, data };
    }

    const paymentMethodId =
      data.payment_method?.id || data.payment_method_id || data.payment_token;
    const memberId = data.member?.id || data.member_id;

    return {
      success: true,
      paymentId: data.id,
      paymentMethodId,
      memberId,
      statusString: data.status,
      status: res.status,
      data,
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
export async function createWhopSetupIntent(
  input: WhopSetupIntentInput,
  apiKeyOverride?: string
): Promise<{
  success: boolean;
  setupIntentId?: string;
  clientSecret?: string;
  statusString?: string;
  paymentMethodId?: string;
  error?: string;
  status: number;
  data?: any;
}> {
  const url = `${getApiBaseUrl()}/setup_intents`;

  const payload = {
    account_id: input.accountId || 'biz_yxb2Bl22qgep3g',
    confirmation_token: input.confirmationToken,
    currency: (input.currency || 'usd').toLowerCase(),
    email: input.email,
    metadata: input.metadata || {},
    return_url: input.returnUrl || 'https://apexroof-template.whop.app',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(apiKeyOverride),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (data && (data.error?.message || data.message)) ||
        res.statusText ||
        'Failed to create setup intent';
      return { success: false, error: errMsg, status: res.status, data };
    }

    return {
      success: true,
      setupIntentId: data.id,
      clientSecret: data.client_secret,
      statusString: data.status,
      paymentMethodId: data.payment_method_id,
      status: res.status,
      data,
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
 * Create a draft invoice for project milestones
 */
export async function createWhopInvoice(
  input: WhopInvoiceInput,
  apiKeyOverride?: string
): Promise<{
  success: boolean;
  invoiceId?: string;
  checkoutLink?: string;
  memberId?: string;
  subtotal?: any;
  error?: string;
  status: number;
  data?: any;
}> {
  const url = `${getApiBaseUrl()}/invoices`;

  const items = input.items.map((item) => {
    const variantId = item.variant_id || item.variantId;
    if (variantId) {
      return {
        quantity: item.quantity || 1,
        variant_id: variantId,
      };
    }
    return {
      quantity: item.quantity || 1,
      variant: item.variant,
    };
  });

  const payload: Record<string, unknown> = {
    account_id: input.accountId || 'biz_yxb2Bl22qgep3g',
    recipient_emails: input.recipientEmails,
    email_address: input.recipientEmails[0],
    customer_name: input.customerName || 'Apex Project Client',
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
      headers: getAuthHeaders(apiKeyOverride),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (data && (data.error?.message || data.message)) ||
        res.statusText ||
        'Failed to create invoice';
      return { success: false, error: errMsg, status: res.status, data };
    }

    return {
      success: true,
      invoiceId: data.id,
      checkoutLink: data.checkout_link,
      memberId: data.member_id,
      subtotal: data.subtotal,
      status: res.status,
      data,
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
 * Issue draft invoice (resolves tax, generates checkout link or triggers charge if payment method attached)
 */
export async function issueWhopInvoice(
  invoiceId: string,
  apiKeyOverride?: string
): Promise<{
  success: boolean;
  invoice?: Record<string, unknown>;
  error?: string;
  code?: string;
  status: number;
}> {
  const url = `${getApiBaseUrl()}/invoices/${invoiceId}/issue`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(apiKeyOverride),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (data && (data.error?.message || data.message)) ||
        res.statusText ||
        'Failed to issue invoice';
      const code = data?.error?.code;
      return { success: false, error: errMsg, code, status: res.status };
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
  paymentMethodId?: string,
  apiKeyOverride?: string
): Promise<{
  success: boolean;
  invoice?: Record<string, unknown>;
  error?: string;
  code?: string;
  status: number;
}> {
  const url = `${getApiBaseUrl()}/invoices/${invoiceId}/charge`;
  const body = paymentMethodId ? JSON.stringify({ payment_method_id: paymentMethodId }) : undefined;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(apiKeyOverride),
      body,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (data && (data.error?.message || data.message)) ||
        res.statusText ||
        'Failed to charge invoice';
      const code = data?.error?.code;
      return { success: false, error: errMsg, code, status: res.status };
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
export async function sendWhopInvoice(
  invoiceId: string,
  apiKeyOverride?: string
): Promise<{
  success: boolean;
  invoice?: Record<string, unknown>;
  error?: string;
  status: number;
}> {
  const url = `${getApiBaseUrl()}/invoices/${invoiceId}/send`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(apiKeyOverride),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (data && (data.error?.message || data.message)) ||
        res.statusText ||
        'Failed to send invoice';
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
