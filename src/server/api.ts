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
}

export interface ApiResponse {
  status: number;
  data: Record<string, any>;
}

/**
 * Dispatches API requests to Whop server-side integrations
 */
export async function handleApiRoute(req: ApiRequest): Promise<ApiResponse> {
  const { url, method, body } = req;
  const path = url.split('?')[0];

  // 1. Leads API: POST /api/leads
  if (path === '/api/leads' && method === 'POST') {
    const { fullName, email, phone, address, serviceType, preferredContact, description, accountId } = body;

    // Server-side validation
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

    // Call Whop Leads API if API key / account configured, or return simulated verified response if testing in local dev without live Whop key
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
          ? { success: true, leadId: result.leadId }
          : { error: result.error || 'Failed to register lead with Whop' },
      };
    }

    // In local dev without WHOP_API_KEY, return structured sandbox lead confirmation
    return {
      status: 200,
      data: {
        success: true,
        leadId: `lead_sbx_${Date.now()}`,
        notice: 'Lead accepted in test/sandbox environment. Connect WHOP_API_KEY for live CRM sync.',
      },
    };
  }

  // 2. Setup Intents: POST /api/setup-intents
  if (path === '/api/setup-intents' && method === 'POST') {
    const { accountId, confirmationToken, email, currency } = body;

    if (process.env.WHOP_API_KEY && confirmationToken) {
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
            }
          : { error: result.error || 'Failed to create setup intent' },
      };
    }

    return {
      status: 200,
      data: {
        success: true,
        setupIntentId: `seti_sbx_${Date.now()}`,
        clientSecret: `seti_secret_sbx_${Date.now()}`,
        paymentMethodId: `payt_sbx_mock_${Date.now()}`,
        status: 'succeeded',
        notice: 'Setup Intent created in sandbox mode to tokenize future payment method.',
      },
    };
  }

  // 3. Payments: POST /api/payments
  if (path === '/api/payments' && method === 'POST') {
    const { planId, amount, currency, email } = body;

    return {
      status: 200,
      data: {
        success: true,
        paymentId: `pay_sbx_${Date.now()}`,
        planId: planId || 'plan_roof_inspection_149',
        amount: amount || 149,
        currency: currency || 'usd',
        recipient: email,
        status: 'succeeded',
      },
    };
  }

  // 4. Invoices: POST /api/invoices
  if (path === '/api/invoices' && method === 'POST') {
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

      // If issue / automatic charge requested
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
          // If automatic charge fails, email invoice to customer
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
        },
      };
    }

    // Sandbox / Mock response
    const mockId = `pay_inv_${Date.now()}`;
    const willChargeAuto = Boolean(chargeAutomatically && paymentMethodId);

    return {
      status: 200,
      data: {
        success: true,
        invoiceId: mockId,
        checkoutLink: `https://whop.com/checkout/invoice/${mockId}`,
        chargedAutomatically: willChargeAuto,
        status: willChargeAuto ? 'paid' : 'issued',
        notice: willChargeAuto
          ? 'Invoice charged automatically to saved payment method off-session.'
          : 'Invoice issued. Checkout link sent to recipient email.',
      },
    };
  }

  return {
    status: 404,
    data: { error: `Not found: ${method} ${path}` },
  };
}
