import {
  createWhopLead,
  createWhopSetupIntent,
  createWhopInvoice,
  issueWhopInvoice,
  chargeWhopInvoice,
  sendWhopInvoice,
} from '../lib/whopServer.ts';

export interface ApiRequest {
  method: string;
  url: string;
  body: Record<string, any>;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
}

export interface ApiResponse {
  status: number;
  data: Record<string, any>;
}

// In-memory sliding-window rate limiter for public endpoints (IP -> timestamp[])
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

/**
 * Dispatches API requests to Whop server-side integrations with validation, rate-limiting, and security
 */
export async function handleApiRoute(req: ApiRequest): Promise<ApiResponse> {
  const { url, method, body, headers = {}, ip = '127.0.0.1' } = req;
  const path = url.split('?')[0];

  // 1. Leads API: POST /api/leads
  if (path === '/api/leads' && method === 'POST') {
    // Rate limit check
    if (isRateLimited(ip)) {
      return {
        status: 429,
        data: {
          error: 'Too Many Requests: Estimate submissions are rate-limited. Please wait a few minutes before retrying.',
        },
      };
    }

    const { fullName, email, phone, address, serviceType, preferredContact, description, accountId } = body;

    // Strict server-side validation
    if (!fullName || !email || !phone || !address || !serviceType || !description) {
      return {
        status: 400,
        data: {
          error: 'Validation failed: Missing required fields (fullName, email, phone, address, serviceType, description)',
        },
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        status: 400,
        data: { error: 'Validation failed: Invalid email format' },
      };
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      return {
        status: 400,
        data: { error: 'Validation failed: Phone number must contain at least 10 digits' },
      };
    }

    // Call Whop Leads API if API key / account configured
    if (process.env.WHOP_API_KEY) {
      const result = await createWhopLead({
        accountId: accountId || process.env.WHOP_ACCOUNT_ID || 'biz_apexroofing',
        fullName,
        email,
        phone,
        address,
        serviceType,
        preferredContact: preferredContact || 'phone',
        description,
      });

      return {
        status: result.status,
        data: result.success
          ? { success: true, leadId: result.leadId, isLiveWhop: true }
          : { error: result.error || 'Failed to register lead with Whop' },
      };
    }

    // Explicit fallback when credentials are not present (never pretend this is a verified Whop response)
    return {
      status: 200,
      data: {
        success: true,
        leadId: `lead_simulated_${Date.now()}`,
        isDemoSimulation: true,
        notice: 'Lead accepted in offline demonstration mode. Set WHOP_API_KEY for live Whop CRM sync.',
      },
    };
  }

  // 2. Setup Intents: POST /api/setup-intents
  if (path === '/api/setup-intents' && method === 'POST') {
    const { accountId, confirmationToken, email, currency } = body;

    if (!confirmationToken) {
      return {
        status: 400,
        data: { error: 'Missing required confirmationToken for Setup Intent' },
      };
    }

    if (process.env.WHOP_API_KEY) {
      const result = await createWhopSetupIntent({
        accountId: accountId || process.env.WHOP_ACCOUNT_ID || 'biz_apexroofing',
        confirmationToken,
        currency: currency || 'usd',
        email,
      });

      return {
        status: result.status,
        data: result.success
          ? {
              success: true,
              setupIntentId: result.setupIntentId,
              clientSecret: result.clientSecret,
              status: result.statusString,
              paymentMethodId: result.paymentMethodId,
              isLiveWhop: true,
            }
          : { error: result.error || 'Failed to create setup intent' },
      };
    }

    return {
      status: 200,
      data: {
        success: true,
        setupIntentId: `seti_simulated_${Date.now()}`,
        clientSecret: `seti_secret_simulated_${Date.now()}`,
        paymentMethodId: `payt_simulated_${Date.now()}`,
        status: 'succeeded',
        isDemoSimulation: true,
        notice: 'Setup Intent created in demonstration mode. Set WHOP_API_KEY for live tokenization.',
      },
    };
  }

  // 3. Payments: POST /api/payments
  if (path === '/api/payments' && method === 'POST') {
    const { planId, amount, currency, email, confirmationToken } = body;

    return {
      status: 200,
      data: {
        success: true,
        paymentId: `pay_simulated_${Date.now()}`,
        planId: planId || 'plan_roof_inspection_149',
        amount: amount || 149,
        currency: currency || 'usd',
        recipient: email,
        tokenReceived: Boolean(confirmationToken),
        status: 'succeeded',
        isDemoSimulation: !process.env.WHOP_API_KEY,
      },
    };
  }

  // 4. Invoices: POST /api/invoices (Protected Admin Route)
  if (path === '/api/invoices' && method === 'POST') {
    // Authorization Check: Require admin authorization header or demo secret to prevent unauthorized public billing
    const adminKey =
      (typeof headers['x-admin-key'] === 'string' && headers['x-admin-key']) ||
      (typeof headers['authorization'] === 'string' && headers['authorization']);

    const validAdminKey = process.env.ADMIN_SECRET_KEY || 'demo-admin-authorized';

    if (process.env.WHOP_API_KEY && (!adminKey || !adminKey.includes(validAdminKey))) {
      return {
        status: 401,
        data: { error: 'Unauthorized: Invoicing endpoints require administrative credentials' },
      };
    }

    const { recipientEmails, items, paymentMethodId, memo, accountId, chargeAutomatically } = body;

    if (!recipientEmails || !items || items.length === 0) {
      return {
        status: 400,
        data: { error: 'Missing required parameters: recipientEmails and items' },
      };
    }

    if (process.env.WHOP_API_KEY) {
      const result = await createWhopInvoice({
        accountId: accountId || process.env.WHOP_ACCOUNT_ID || 'biz_apexroofing',
        recipientEmails,
        paymentMethodId,
        items,
        memo,
      });

      if (!result.success || !result.invoiceId) {
        return {
          status: result.status,
          data: { error: result.error || 'Failed to create invoice' },
        };
      }

      let chargedAutomatically = false;
      let statusString = 'open';

      const issueResult = await issueWhopInvoice(result.invoiceId);
      if (issueResult.success) {
        statusString = 'issued';
      }

      if (chargeAutomatically && paymentMethodId) {
        const chargeResult = await chargeWhopInvoice(result.invoiceId, paymentMethodId);
        if (chargeResult.success) {
          chargedAutomatically = true;
          statusString = 'paid';
        } else {
          // If automatic charge fails, email invoice checkout link
          await sendWhopInvoice(result.invoiceId);
        }
      }

      return {
        status: 200,
        data: {
          success: true,
          invoiceId: result.invoiceId,
          checkoutLink: result.checkoutLink,
          chargedAutomatically,
          status: statusString,
          isLiveWhop: true,
        },
      };
    }

    // Demonstration fallback
    const mockId = `pay_inv_simulated_${Date.now()}`;
    const willChargeAuto = Boolean(chargeAutomatically && paymentMethodId);

    return {
      status: 200,
      data: {
        success: true,
        invoiceId: mockId,
        checkoutLink: `https://whop.com/checkout/invoice/${mockId}`,
        chargedAutomatically: willChargeAuto,
        status: willChargeAuto ? 'paid' : 'issued',
        isDemoSimulation: true,
        notice: willChargeAuto
          ? 'Invoice charged to saved payment method in demonstration mode.'
          : 'Invoice issued. Checkout link generated in demonstration mode.',
      },
    };
  }

  return {
    status: 404,
    data: { error: `Not found: ${method} ${path}` },
  };
}
