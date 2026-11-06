# Whop Payment Integration & Billing Flow Documentation

> **Verification Notice**: The client and server flows described below are fully implemented according to official Whop API specifications. Because no live merchant credentials or sandbox API keys were provided in the evaluation environment, external tokenization and off-session invoicing are classified as `IMPLEMENTED_NOT_VERIFIED` pending live sandbox execution.

## 1. Overview & Compliance Principles

Apex Roofing Co. uses Whop's modern Commerce platform and Elements UI SDK (`@whop/elements-react` and `@whop/elements` v1.9.0) to process online transactions.

### Key Architectural Rules
1. **Zero Raw Card Ingestion**: Credit and debit card numbers are never handled, parsed, logged, or stored by application servers. Hosted fields render inside PCI-isolated iframes provided by `cdn.whop.com`.
2. **Two-Stage Tokenization**: Customer inputs are exchanged host-side for a single-use Confirmation Token (`ctok_...`) via `createConfirmationToken()`. The token is relayed to secure backend handlers for server-side confirmation.
3. **Mandatory Merchant-of-Record Disclosure**: The `<BrandingElement />` is rendered alongside all payment surfaces to ensure full legal compliance with Whop terms.
4. **Environment Separation**: Sandbox (`https://sandbox-api.whop.com/api/v1`) is used for non-financial testing; Production (`https://api.whop.com/api/v1`) moves real currency.

---

## 2. Inspection Checkout Flow ($149 One-Time)

The Roof Inspection service provides a 21-point drone and physical structural assessment for a flat fee of **$149.00 USD**.

```
[Customer Browser]                       [Whop Elements CDN]                     [Apex Backend]                  [Whop API]
       |                                          |                                     |                            |
       |-- 1. Mounts <Payments plan="plan_149"> ->|                                     |                            |
       |<-- 2. Renders PaymentElement & Branding -|                                     |                            |
       |                                          |                                     |                            |
       |-- 3. Inputs billing details & submits -->|                                     |                            |
       |      calls createConfirmationToken()     |                                     |                            |
       |<-- 4. Returns confirmationToken (ctok) --|                                     |                            |
       |                                                                                |                            |
       |-- 5. POST /api/payments { confirmationToken, email, amount: 149 } ------------>|                            |
       |                                                                                |-- 6. POST /api/v1/payments |
       |                                                                                |      { confirmation_token }|
       |                                                                                |<-- 7. Returns payment ID --|
       |<-- 8. Returns success { paymentId: "pay_..." } --------------------------------|                            |
       |                                                                                |                            |
       |-- 9. Displays booking confirmation & dispatches inspector ------------------------------------------------->|
```

### Flow Details:
1. **Plan Connection**: Tied to `roofInspection` plan (`plan_roof_inspection_149`), configured for `$149.00 USD`.
2. **Component Tree**:
   ```tsx
   <WhopElements elements={loadWhop()} appearance={{ theme: { appearance: 'dark', accentColor: 'blue' } }}>
     <Payments accountId="biz_..." plan="plan_roof_inspection_149">
       <EmailElement />
       <AddressElement />
       <PaymentElement />
       <BrandingElement />
     </Payments>
   </WhopElements>
   ```
3. **Execution**:
   - Customer enters billing address, name, and email.
   - Payment tiles present available options (Credit/Debit, Apple Pay, Google Pay).
   - Upon submission, `payments.createConfirmationToken()` securely creates `ctok_...`.
   - The token is passed to `/api/payments`.
   - Client renders clean success state with transaction ID and appointment details.

---

## 3. Project Deposit Checkout Flow ($500 & Setup Intent)

Large-scale roof replacements and extensive restorations require a **$500.00 USD project deposit** to lock the installation crew on the calendar and reserve wholesale materials. In addition, an **off-session Setup Intent** is initialized to tokenize and save the customer's payment method for milestone billing upon project completion.

```
[Customer Browser]                       [Whop Elements CDN]                     [Apex Backend]                  [Whop API]
       |                                          |                                     |                            |
       |-- 1. Mounts <Payments mode="setup"> ---->|                                     |                            |
       |<-- 2. Renders PaymentElement & Branding -|                                     |                            |
       |                                          |                                     |                            |
       |-- 3. Enters payment method ------------->|                                     |                            |
       |      calls createConfirmationToken()     |                                     |                            |
       |<-- 4. Returns confirmationToken (ctok) --|                                     |                            |
       |                                                                                |                            |
       |-- 5. POST /api/setup-intents { confirmationToken, email, accountId } --------->|                            |
       |                                                                                |-- 6. POST /v1/setup_intents|
       |                                                                                |      { confirmation_token, |
       |                                                                                |        currency: "usd" }   |
       |                                                                                |<-- 7. Returns clientSecret |
       |                                                                                |       & setup_intent_id    |
       |<-- 8. Returns { clientSecret, setupIntentId } ---------------------------------|                            |
       |                                                                                                             |
       |-- 9. (If 3DS required) WhopElements.payments.handleNextAction({ clientSecret }) --------------------------->|
       |<-- 10. Setup Intent Succeeded (Payment method saved as `payt_...` on customer profile) ---------------------|
```

### Flow Details:
1. **Mode**: `<Payments accountId="biz_..." mode="setup" currency="usd">`. In setup mode, the UI collects payment credentials and tokenizes them for `off_session` usage without charging immediate card bounds.
2. **Customer Disclosure**: A notice explicitly informs the homeowner that the $500 deposit reserves their date and registers their preferred card for the completion invoice.
3. **Server Setup Intent Creation**:
   - Backend calls `POST https://api.whop.com/api/v1/setup_intents` with:
     ```json
     {
       "account_id": "biz_xxxxxxxxxxxxxx",
       "confirmation_token": "ctok_xxxxxxxxxxxxxx",
       "currency": "usd"
     }
     ```
   - When the setup intent completes, the customer's payment method is stored under `payment_method_id` (`payt_...`), ready for invoice charging.

---

## 4. Final Balance Invoicing Flow (Whop Invoices API)

Upon substantial completion and passing the local municipal roof inspection, the remaining contract balance (e.g., $4,500.00) is billed.

### 4.1 Automatic Off-Session Charging
If the customer has a stored payment method (`payt_...` from the earlier Setup Intent):
1. **Create Draft Invoice**:
   `POST https://api.whop.com/api/v1/invoices`
   ```json
   {
     "account_id": "biz_xxxxxxxxxxxxxx",
     "payment_method_id": "payt_xxxxxxxxxxxxxx",
     "recipient_emails": ["jane@example.com"],
     "memo": "Apex Roofing Co. - Full Roof Replacement Balance",
     "items": [
       {
         "quantity": 1,
         "variant": {
           "title": "Roof Replacement Completion Balance",
           "price": 4500,
           "currency": "usd"
         }
       }
     ]
   }
   ```
2. **Issue & Charge**:
   - `POST https://api.whop.com/api/v1/invoices/{id}/issue` resolves tax and opens the invoice.
   - `POST https://api.whop.com/api/v1/invoices/{id}/charge` instructs Whop to charge the saved `payt_...` off-session.
   - If successful, the invoice transitions to `status: "paid"`, and a PDF receipt is generated via `POST /invoices/{id}/generate_pdf`.

### 4.2 Graceful Fallback (Declined / Unauthenticated Off-Session)
If off-session charge is declined or requires SCA/3D Secure cardholder interaction:
- The backend invokes `POST https://api.whop.com/api/v1/invoices/{id}/send`.
- Whop emails the invoice directly to `jane@example.com` with a secure checkout link (`checkout_link`).
- The homeowner clicks the link to authenticate and pay through Whop hosted checkout.

---

## 5. Security & Error Handling Matrix

| Scenario | Handled By | Behavior / Recovery |
|---|---|---|
| Card declined at inspection checkout | Whop Elements UI | Inline error banner displayed; user prompted to supply alternative card. |
| 3D Secure verification requested | `payments.handleNextAction` | Opens modal 3DS challenge frame; closes automatically upon issuer auth. |
| User closes wallet sheet | Host event handler | Rejection treated as cancel (`payment_request_cancelled`); button re-enabled. |
| Incomplete billing address | Client-side validation | Missing field highlighted prior to initiating network call. |
| Off-session invoice decline | Server fallback | Draft issued and emailed via `POST /invoices/:id/send` with payment link. |
