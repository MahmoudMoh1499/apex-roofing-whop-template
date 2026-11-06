# Apex Roofing Co. — Compliance Gap Audit & Verification Matrix

**Project**: Apex Roofing Co. Production Whop Website Template  
**Canonical Whop URL**: [https://apexroof-template.whop.app](https://apexroof-template.whop.app)  
**Edge Origin URL**: [https://apexroof-template.whop.site](https://apexroof-template.whop.site)  
**Whop Account ID**: `biz_yxb2Bl22qgep3g` ("Apex Roofing Co")  
**Whop Product ID**: `prod_r8sfpPYp7nzxz` ("Apex Roofing Services")  
**Active Edge Build ID**: `apbu_XWXCltynjMSKW`  
**Whop Production Domain ID**: `dom_F7KQMpiQdkByDn`  
**Audit Timestamp**: 2026-11-06T19:05:00Z  
**Submission Readiness**: **NOT READY / PENDING MERCHANT ACTION** (Awaiting real settlement / sandbox card confirmation and owner KYC verification)

---

## 1. Executive Summary & Verification Policy

This audit strictly enforces the zero-simulation policy. Every requirement is assessed against live Whop cloud infrastructure (`https://api.whop.com/api/v1`), the official Whop CLI (`whop@0.34.1`, API version `2026-11-03-1`), and runtime observations.

Each requirement is assigned one of three mutually exclusive compliance statuses:
- **`VERIFIED`**: Validated against genuine, reproducible Whop platform responses or verified local code contracts.
- **`OUTSTANDING`**: An essential requirement where live settlement or backend data does not currently exist.
- **`BLOCKED BY WHOP`**: An action prevented by platform-level prerequisites (such as merchant identity verification).

---

## 2. Requirement-by-Requirement Compliance Matrix

| Requirement | Implementation / Resource | Evidence & Current Behavior | Compliance Status |
|---|---|---|---|
| **Whop Website Deployment** | `app_YSTzxphBLHp5Z6` / Build `apbu_XWXCltynjMSKW` | Canonical `https://apexroof-template.whop.app` returns 307 redirect to `https://apexroof-template.whop.site/`. Returns HTTP 200 with full site DOM. | **`VERIFIED`** |
| **Site Sections & Responsive Layout** | Services, Areas, Financing, Reviews, Contact | 5 core roofing services, Austin/Dallas metro service areas, 0% APR financing callout, Owens Corning trust badges, 390px mobile viewport reflow verified. | **`VERIFIED`** |
| **Plan 1: Roof Inspection ($149)** | Variant `plan_2KwvDItyoRemP` | `GET /api/v1/plans?account_id=biz_yxb2Bl22qgep3g` returns $149.00 USD, `one_time`, visible, `buy_now`. Checkout: `https://whop.com/checkout/plan_2KwvDItyoRemP`. | **`VERIFIED`** |
| **Plan 2: Project Deposit ($500)** | Variant `plan_8Z1S3Yw1WjX4a` | `GET /api/v1/plans?account_id=biz_yxb2Bl22qgep3g` returns $500.00 USD, `one_time`, visible, `buy_now`. Checkout: `https://whop.com/checkout/plan_8Z1S3Yw1WjX4a`. | **`VERIFIED`** |
| **Plan 3: Flat-Rate Repair ($899)** | Variant `plan_i2sQTyDeCoYq3` | `GET /api/v1/plans?account_id=biz_yxb2Bl22qgep3g` returns $899.00 USD, `one_time`, visible, `buy_now`. Checkout: `https://whop.com/checkout/plan_i2sQTyDeCoYq3`. | **`VERIFIED`** |
| **Plan 4: Replacement Balance ($2,500)** | Variant `plan_0CImbqaHxL27Q` | `GET /api/v1/plans?account_id=biz_yxb2Bl22qgep3g` returns $2,500.00 USD, `one_time`, visible, `buy_now`. Line item 1 for final balance invoice. | **`VERIFIED`** |
| **Plan 5: Replacement Final ($2,000)** | Variant `plan_zfQonb2jocdhm` | `GET /api/v1/plans?account_id=biz_yxb2Bl22qgep3g` returns $2,000.00 USD, `one_time`, visible, `buy_now`. Line item 2 for final balance invoice ($4,500 total). | **`VERIFIED`** |
| **Payment Elements Mount** | `@whop/elements-react` | `<WhopElements>`, `<PaymentElement>`, `<BrandingElement>`, `<ExpressCheckoutElement>` cleanly mount with `setupFutureUsage="off_session"`. | **`VERIFIED`** |
| **$500 Deposit Completed Checkout** | `POST /api/v1/payments` | `GET /api/v1/payments?account_id=biz_yxb2Bl22qgep3g` returns `{"data": []}`. No completed $500 charge exists on the merchant account. | **`OUTSTANDING`** |
| **Estimate Form CRM Ingestion** | `lead_69xncLH4vvPse` | `GET /api/v1/leads/lead_69xncLH4vvPse` confirms real lead under `biz_yxb2Bl22qgep3g` / `prod_r8sfpPYp7nzxz` with Sarah Jenkins' contact & metadata. | **`VERIFIED`** |
| **$4,500 Draft Invoice Creation** | `pay_TABe0XRc3EsrPb` | `GET /api/v1/invoices/pay_TABe0XRc3EsrPb` confirms real draft invoice with subtotal $4,500.00 USD, recipient `sarah.jenkins@gmail.com`, 2 line items. | **`VERIFIED`** |
| **Invoice Issuance & Auto-Charging** | `POST /api/v1/invoices/:id/issue` | Calling issue endpoint fails with `invoice_account_verification_required`. Whop platform enforces business KYC verification before issuing. | **`BLOCKED BY WHOP`** |
| **Platform Pixel Installation** | `<script data-whop-pixel="platform">` | `whop events validate_pixel --account_id biz_yxb2Bl22qgep3g --url https://apexroof-template.whop.app` returns `installed: true, reachable: true, firing_data_ok: true`. | **`VERIFIED`** |
| **Individual Custom Event Ingestion** | `pixel.custom:<name>` | Events `estimate_requested`, `service_viewed`, `deposit_started` are dispatched client-side, but `whop events list` returns 0 custom event records (`native_tracking: false`). | **`OUTSTANDING`** |
| **Demo Video Alignment** | `submission/demo-video.mp4` | 03:08.86 duration, 1080p Full HD (1920x1080). Accurately depicts elements inspection and draft invoice without claiming completed settlement. | **`VERIFIED`** |
| **Security & Edge Architecture** | `src/server/api.ts`, `src/lib/webhookVerification.ts` | Timing-safe matching, fail-closed handling, standard webhooks verification (`whsec_...`/`ws_...`), D1 lease deduplication, 29/29 passing tests. | **`VERIFIED`** |

---

## 3. Deep-Dive Gap Investigation

### 3.1 Whop Sandbox & Test Payment Options (Gap 1)
- **Investigation**:
  - We audited the official Whop Developer Documentation (`docs.whop.com`) and CLI for sandbox/testing capabilities.
  - Whop provides an isolated sandbox environment located at `https://sandbox-api.whop.com/api/v1`.
  - In the sandbox environment, test card `4242 4242 4242 4242` can be used to simulate successful payments without transferring real money.
- **Finding for Account `biz_yxb2Bl22qgep3g`**:
  - The business account `biz_yxb2Bl22qgep3g`, app `app_YSTzxphBLHp5Z6`, product `prod_r8sfpPYp7nzxz`, and plans are hosted on **live production** (`https://api.whop.com/api/v1`).
  - Whop's production checkout enforces real card processing. Entering test card `4242 4242 4242 4242` on live Whop Payment Elements results in a card decline (`card_declined` / `testmode_charges_only`).
  - Therefore, a genuine completed $500 Payment Elements checkout cannot be settled on the live account without charging a real customer credit card.
- **Recommended Action**:
  - To achieve genuine supporting evidence for completed checkout without real financial expenditure:
    1. Provision a dedicated Whop Sandbox Company via the Developer Dashboard or CLI (`export WHOP_API_BASE_URL=https://sandbox-api.whop.com/api/v1`).
    2. Deploy a staging build configured with sandbox credentials, or execute a minimal real $1.00 test transaction on production if authorized by the business owner.

---

### 3.2 KYC Restriction on Invoice Issuance (Gap 2)
- **Investigation**:
  - When issuing (`POST /api/v1/invoices/:id/issue`) or charging (`POST /api/v1/invoices/:id/charge`) draft invoice `pay_TABe0XRc3EsrPb`, Whop returns:
    ```json
    {
      "error": {
        "type": "bad_request",
        "message": "invoice_account_verification_required"
      }
    }
    ```
  - We queried `whop verifications list --account_id biz_yxb2Bl22qgep3g --format json`. Result: `{"data": []}`.
  - Whop operates as a licensed Merchant of Record and financial institution intermediary. Platform policy strictly prohibits outbound invoice delivery or off-session charging until legal business entity verification (KYB) is approved.
- **Account Owner Action Needed**:
  - The account owner of `biz_yxb2Bl22qgep3g` (`user_B3eADGFKRWB1S`) must complete verification in the Whop Seller Dashboard:
    1. Navigate to: `https://whop.com/dashboard/biz_yxb2Bl22qgep3g/settings/` (Verification & Payouts tab).
    2. Submit legal identity documentation:
       - **Representative Identity**: Legal full name, date of birth, SSN / national ID, residential address, government photo ID (passport / driver's license), and live selfie.
       - **Entity Details**: Legal business name, business structure (e.g. LLC / Corporation), EIN / Tax ID number, registration state, and formation documentation.
    3. Once the verification status transitions to `approved`, invoice issuance and automated charging endpoints will unlock immediately.

---

### 3.3 Individual Custom Tracking Events Verification (Gap 3)
- **Investigation**:
  - The website fires three custom tracking events via `window.whop.track`: `estimate_requested`, `service_viewed`, and `deposit_started`.
  - Running official pixel verification (`whop events validate_pixel --account_id biz_yxb2Bl22qgep3g --url https://apexroof-template.whop.app`) returned:
    ```yaml
    installed: true
    url: https://apexroof-template.whop.app
    reachable: true
    native_tracking: false
    firing_data_ok: true
    affiliate_tracking_detected: false
    ```
  - However, querying `whop events list --account_id biz_yxb2Bl22qgep3g --event "pixel.custom:estimate_requested,..."` returned `{"data": []}`.
- **Finding & Technical Limitation**:
  - While `firing_data_ok: true` confirms the client-side pixel hooks and event schemas conform to Whop's platform specification, `native_tracking: false` indicates that ingestion into the seller's analytics data lake requires a linked Whop Ad Pixel ID or platform pixel activation on the custom domain.
  - Without an active Ad Pixel binding (`whop ad-pixels create`), custom frontend events are logged to the client console and evaluated by the validator, but are not persisted as individual event rows in `whop events list`.
- **Recommended Action**:
  - Register an official Whop Ad Pixel via `whop ad-pixels create --account_id biz_yxb2Bl22qgep3g --name "Apex Roofing Pixel"` and bind the pixel ID in `whop.app.json` or dashboard domain settings to enable server-side persistence of custom conversion events.

---

### 3.4 Demo Video Alignment Audit (Area 4)
- **Review of Recorded Walkthrough (`submission/demo-video.mp4`)**:
  - **Start URL**: Begins cleanly at canonical URL `https://apexroof-template.whop.app`, demonstrating the 307 redirect to edge infrastructure.
  - **Payment Elements Flow**: Demonstrates the crew reservation modal, verifies that `<PaymentElement>`, `<BrandingElement>`, and `<ExpressCheckoutElement>` are mounted, enters billing address details, and articulates the `setupFutureUsage="off_session"` card-on-file architecture. The video closes the modal without displaying a fabricated "Payment Succeeded" alert.
  - **Estimate Form**: Fills in real customer inquiry details and successfully receives live confirmation `lead_69xncLH4vvPse` from `POST /api/leads`.
  - **Invoicing Portal**: Composes the $4,500 balance using real variants `plan_0CImbqaHxL27Q` and `plan_zfQonb2jocdhm`, triggers `POST /api/invoices`, displays the genuine draft invoice `pay_TABe0XRc3EsrPb`, and highlights the explicit platform KYC verification notice.
  - **Compliance Verdict**: The video adheres 100% to actual application behavior. No simulated responses or mock transactions are presented as completed payments.

---

## 4. Summary of Blockers and Action Items

| Blocker / Gap | Root Cause | Recommended Next Action | Owner |
|---|---|---|---|
| **$500 Completed Checkout** | Account is in live production mode; test card `4242...` is declined on live gateway. | Deploy to a dedicated Whop Sandbox environment or authorize a minimal real test charge. | Template Maintainer / Whop Reviewer |
| **Invoice Issuance (KYC)** | Platform requires KYB identity verification before outbound invoices can be issued. | Account owner must complete KYC onboarding at `whop.com/dashboard/biz_yxb2Bl22qgep3g/settings/`. | Account Owner (`user_B3eADGFKRWB1S`) |
| **Custom Event Persistence** | Pixel validator reports `native_tracking: false` without an active Ad Pixel binding. | Create and bind an Ad Pixel ID (`whop ad-pixels create`) to enable database ingestion. | Developer / Account Owner |

**Conclusion**: The technical implementation, edge deployment, security posture, and API contracts are fully established and verified. Per instructions, the submission is formally designated **`PENDING MERCHANT SETTLEMENT & KYC ACTION`** until the account owner completes verification and real/sandbox checkout settlement evidence is generated.
