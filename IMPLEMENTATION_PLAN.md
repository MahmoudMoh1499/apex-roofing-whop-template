# Apex Roofing Co. — Whop Websites Implementation Plan

## 1. Executive Summary & Objective

This project implements a complete, production-quality, reusable roofing company website template built for **Apex Roofing Co.** (a fictional, premier US residential and commercial roofing contractor) deployed on Whop Websites (`whop.app` / `whop.site`).

The website provides an engaging customer-facing brand experience and integrates deeply with Whop's Commerce and Elements infrastructure:
- **Whop Elements React integration** for PCI-compliant checkout (`PaymentElement`, `AddressElement`, `EmailElement`, `BrandingElement`, and `PaymentRequest` for Express Checkout / Apple Pay & Google Pay).
- **Inspection Checkout**: One-time payment for a standard 21-point roof inspection ($149).
- **Project Deposit & Setup Intent**: One-time $500 project deposit with an off-session Setup Intent to securely tokenize and save the customer's payment method for milestone billing.
- **Final Balance Invoicing**: Backend integration with Whop Invoices API (`POST /invoices`, `POST /invoices/{id}/issue`, `POST /invoices/{id}/charge`) to bill the remaining balance against saved payment methods with automated and manual payment links.
- **Estimate Form & Whop Leads API**: Client- and server-side validated estimate request form submitting verified leads to `POST /leads` without exposing secret credentials.
- **Client Analytics & Attribution**: Official `whop.track` pixel integration for `estimate_requested`, `service_viewed`, and `deposit_started` with deduplication support.
- **Reusable Architecture**: Centralized configuration (`src/config/roofingCompany.ts`) allowing any roofing business to rebrand the entire site, services, service areas, testimonials, and Whop IDs instantly.

---

## 2. System Architecture

```
+--------------------------------------------------------------------------------------------------+
|                                    Client Layer (Browser)                                        |
|                                                                                                  |
|   +------------------------------------------------------------------------------------------+   |
|   |  Apex Roofing UI (React 19 + Tailwind CSS + Lucide Icons + Vite)                         |   |
|   |  - Responsive Hero, Services, Areas, Financing, Reviews, Trust Credentials, Estimate CTA |   |
|   |  - Centralized Config Driven (`roofingCompanyConfig`)                                    |   |
|   +------------------------------------------------------------------------------------------+   |
|           |                                       |                               |              |
|           | Estimate Form                         | Whop Elements React           | whop.track   |
|           v                                       v                               v              |
|   +-------------------+                   +-------------------+           +------------------+   |
|   | /api/leads        |                   | WhopElements      |           | Whop Pixel       |   |
|   | Client Validation |                   | - PaymentElement  |           | - page_view      |   |
|   +-------------------+                   | - AddressElement  |           | - estimate_req   |   |
|           |                               | - EmailElement    |           | - service_viewed |   |
|           |                               | - BrandingElement |           | - deposit_start  |   |
|           |                               +-------------------+           +------------------+   |
|           |                                       | (Tokens only)                                |
+-----------|---------------------------------------|----------------------------------------------+
            |                                       | confirmationToken (`ctok_...`)
            v                                       v
+--------------------------------------------------------------------------------------------------+
|                                    Server Layer (Node / SSR)                                     |
|                                                                                                  |
|   +------------------------------------+          +------------------------------------------+   |
|   | /api/leads                         |          | /api/payments / /api/setup-intents       |   |
|   | - Server validation                |          | - Server-side confirmation               |   |
|   | - Deduplication (IP / hash)        |          | - Mint setup intent / process charge     |   |
|   | - Submits to Whop Leads API        |          | - Invoices & charge saved payment method |   |
|   +------------------------------------+          +------------------------------------------+   |
|                    \                                  /                                          |
|                     v                                v                                           |
|       +-------------------------------------------------------------+                            |
|       | Server Outbound Proxy / Whop SDK / REST Client              |                            |
|       | Headers: `Authorization: Bearer <WHOP_API_KEY>`,            |                            |
|       |          `Api-Version-Date: 2026-11-03-1`                   |                            |
|       +-------------------------------------------------------------+                            |
+--------------------------------------------------------------------------------------------------+
                                             |
                                             v
+--------------------------------------------------------------------------------------------------+
|                                  Whop Platform & APIs                                            |
|                                                                                                  |
|   +-----------------------+     +-----------------------+     +-------------------------------+  |
|   | POST /leads           |     | POST /setup_intents   |     | POST /invoices                |  |
|   | - Lead CRM ingestion  |     | - Token verification  |     | - Draft creation              |  |
|   | - Lead notification   |     | - Stored payment meth |     | - Off-session charge & link   |  |
|   +-----------------------+     +-----------------------+     +-------------------------------+  |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Implementation Phases

### Phase 1: Inspect Project & Official Documentation (Complete)
- Evaluated workspace directory, tools (Node v22, npm, pnpm, yarn), Whop CLI v0.34.1.
- Researched Whop Elements (`@whop/elements-react`), tracking (`whop.track`), OpenAPI specifications for `/leads`, `/setup_intents`, `/invoices`, and `/payments`.
- Verified CLI deployment guidelines and Vite hosting plugin requirements (`@whop/cli/vite`).

### Phase 2: Architecture & Implementation Plan (Current)
- Author `IMPLEMENTATION_PLAN.md`.
- Detail architecture, API contracts, error handling, credentials, and verification matrix.

### Phase 3: Website & Reusable Components
- Scaffold Vite + React 19 + TypeScript + Tailwind CSS application configured for Whop hosting.
- Implement centralized configuration `roofingCompanyConfig` in `src/config/roofingCompany.ts`.
- Build UI sections:
  1. Navbar (Sticky with Phone, Areas, Services, Estimate CTA)
  2. Hero Section (Headline, Trust badges, dual CTA, roof imagery)
  3. Services Section (Roof Repair, Replacement, Inspection with benefits, modal, price tags)
  4. Service Areas (Interactive coverage grid for US metropolitan zones)
  5. Financing Section (Transparent options: 0% APR intro, low-interest installment terms)
  6. Reviews & Trust (Verified sample reviews, licensed/bonded credential badges)
  7. Estimate Request Form (Full name, email, phone, property address, service type, contact method, description)
  8. Footer & Business Hours.

### Phase 4: Configure Whop Plans
- Set up plans configuration for:
  1. `Roof Inspection` ($149 one-time)
  2. `Project Deposit` ($500 one-time)
  3. `Flat-Rate Roofing Service` (Configurable flat-rate pricing)
- Define fallback sandbox/configured plan IDs and document exact CLI/dashboard creation commands if account is not yet linked.

### Phase 5: Payment Integration
- Install and configure `@whop/elements-react` and `@whop/elements`.
- Implement `WhopElements` wrapper and checkout modals:
  - Inspection Checkout ($149).
  - Deposit Checkout ($500) with `mode: "setup"` Setup Intent.
  - Required `BrandingElement`, `PaymentElement`, `AddressElement`, `EmailElement`.
- Implement backend server handlers (`/api/payments/confirm`, `/api/setup-intents/create`, `/api/invoices/create-and-charge`).
- Author `PAYMENT_FLOW.md`.

### Phase 6: Leads API & Tracking Integration
- Implement `/api/leads` backend endpoint to relay validated estimate requests to Whop Leads API (`POST https://api.whop.com/api/v1/leads` or `https://sandbox-api.whop.com/api/v1/leads`).
- Implement client-side `whop.track` triggers:
  - `estimate_requested` on successful submission with project metadata.
  - `service_viewed` on service expansion/details.
  - `deposit_started` on checkout open.
- Author `TRACKING.md`.

### Phase 7: Verification & Testing
- Run automated unit and integration tests (build check, lint check, typecheck, schema validation, mock payment and lead submission tests).
- Verify responsive layout across mobile, tablet, desktop.
- Verify environment variable hygiene (no secret credentials in client bundles).

### Phase 8: Deployment & Final Submission
- Test local build with `@whop/cli/vite`.
- Present instructions for authenticating `whop auth login` and linking live domain `*.whop.site` / `*.whop.app`.
- Provide demo script, final summary, and complete documentation.

---

## 4. Required Credentials & Permissions

| Credential / Variable | Required Scope / Usage | Exposure Level | Environment |
|---|---|---|---|
| `WHOP_API_KEY` | `lead:manage`, `payment:charge`, `payment:setup_intent:read`, `invoice:create`, `invoice:update` | **Server-side only** (never committed, never sent to browser) | Production or Sandbox |
| `WHOP_ACCOUNT_ID` | Account identifier (`biz_...`) to scope leads, plans, and invoices | Server & Client (Public ID) | Both |
| `WHOP_APP_ID` | Injected automatically by Whop hosting runtime (`app_...`) | Runtime environment | Production |
| `VITE_WHOP_INSPECTION_PLAN_ID` | Plan ID for Roof Inspection ($149) | Client-side public config | Both |
| `VITE_WHOP_DEPOSIT_PLAN_ID` | Plan ID for Project Deposit ($500) | Client-side public config | Both |
| `VITE_WHOP_SERVICE_PLAN_ID` | Plan ID for Flat-Rate Roofing Service | Client-side public config | Both |
| `WHOP_API_ORIGIN` | `https://api.whop.com` or `https://sandbox-api.whop.com` | Server-side | Default injected |

---

## 5. API Integrations Specification

### 5.1 Estimate Form -> Whop Leads API
- **Endpoint**: `POST /api/leads` -> Whop `POST /api/v1/leads`
- **Headers**: `Authorization: Bearer <WHOP_API_KEY>`, `Api-Version-Date: 2026-11-03-1`, `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "account_id": "biz_xxxxxxxxxxxxxx",
    "metadata": {
      "full_name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "(555) 234-5678",
      "address": "123 Maple Street, Austin, TX 78701",
      "service_type": "Roof Replacement",
      "preferred_contact": "phone",
      "description": "Asphalt shingle replacement after hail storm"
    },
    "referrer": "https://apex-roofing.whop.site"
  }
  ```

### 5.2 Project Deposit & Setup Intent Flow
- Client renders `<Payments accountId={bizId} mode="setup" currency="usd">` with `PaymentElement`, `AddressElement`, `EmailElement`, `BrandingElement`.
- Buyer inputs billing details -> `payments.createConfirmationToken()`.
- Client posts `confirmationToken` to server `/api/setup-intents/create`.
- Server calls Whop `POST /api/v1/setup_intents`:
  ```json
  {
    "account_id": "biz_xxxxxxxxxxxxxx",
    "confirmation_token": "ctok_xxxxxxxxxxxxxx",
    "currency": "usd"
  }
  ```
- Server returns `client_secret` to client.
- Client passes `client_secret` to `WhopElements.payments.handleNextAction({ clientSecret })` for 3D Secure / authorization confirmation.

### 5.3 Final Balance Invoicing API
- Server endpoint `/api/invoices/create`:
  ```json
  {
    "account_id": "biz_xxxxxxxxxxxxxx",
    "payment_method_id": "payt_xxxxxxxxxxxxxx",
    "recipient_emails": ["jane@example.com"],
    "memo": "Apex Roofing Co. - Final Project Balance (Completion of Roof Replacement)",
    "items": [
      {
        "quantity": 1,
        "variant": {
          "currency": "usd",
          "price": 4500,
          "title": "Roof Replacement Balance - 123 Maple Street"
        }
      }
    ]
  }
  ```
- Server calls `POST /api/v1/invoices/{id}/issue` to issue invoice.
- If `payment_method_id` is attached, the Whop billing engine attempts automatic off-session charge.
- If automatic charging declines or requires customer authentication, server invokes `POST /api/v1/invoices/{id}/send` to email invoice payment link directly.

---

## 6. Testing Strategy

1. **Static Analysis & Type Safety**:
   - `npm run typecheck` (`tsc --noEmit`).
   - Linting and build verification (`vite build`).
2. **Component & Reusability Verification**:
   - Verify all configuration values propagate through `roofingCompanyConfig` (brand, phone, colors, areas, services).
3. **Form & Validation Testing**:
   - Verify client-side field validation (invalid email, short phone, blank address).
   - Verify server-side validation error responses (HTTP 400).
   - Verify duplicate submission throttle / debounce.
4. **Whop Elements Flow Testing**:
   - Mount test for `WhopElements`, `Payments`, `PaymentElement`, `AddressElement`, `EmailElement`, `BrandingElement`.
   - Verify graceful handling when running in sandbox, mock, or live credential environments.
5. **Event Tracking Verification**:
   - Verify `whop.track("estimate_requested", ...)` is called on form submission.
   - Verify `whop.track("service_viewed", ...)` is called on service selection.
   - Verify `whop.track("deposit_started", ...)` is called on checkout open.

---

## 7. Known Limitations & Fallbacks

1. **Whop CLI Live Deployment**:
   - Requires live interactive authentication (`whop auth login` or Whop API Key).
   - In environments without active terminal TTY for browser login, user can set `WHOP_API_KEY` or run `whop auth login` manually.
2. **Off-Session Auto Charge Permissions**:
   - Charging a saved payment method off-session (`POST /invoices/{id}/charge` or `POST /invoices/{id}/issue` with `payment_method_id`) requires `payment:charge` permission on the merchant account.
   - If an account lacks off-session charge privileges or if card issuer requests 3D Secure, the system gracefully falls back to sending an invoice with checkout link via `POST /invoices/{id}/send`.
