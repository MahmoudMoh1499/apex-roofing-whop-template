# Apex Roofing Co. — Reusable Whop Website Template

A production-quality, fully responsive, and reusable roofing contractor website template built on **Whop Websites** and deployed on a `*.whop.site` / `*.whop.app` domain.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, **Vite**, and **Whop Elements** (`@whop/elements-react` and `@whop/elements` v1.9.0).

---

## 1. Features Overview

### 🏛️ Professional US Roofing Brand & UI
- **Hero Section**: Dual CTAs ("Get a Free Estimate" & "Book $149 Inspection"), trust highlights, and aerial drone diagnostics imagery.
- **Service Catalog**: Detailed scopes, benefits, turnaround times, and pricing for **Roof Inspection**, **Roof Repair**, and **Roof Replacement**.
- **Interactive Service Areas**: Metro zone coverage grid with city tags and guaranteed emergency response intervals.
- **Transparent Financing**: 0% APR 12-month same-as-cash, low fixed monthly installment plans, and clear regulatory disclosures.
- **Reviews & Trust Badges**: Verified sample customer testimonials, state ROC licensing, $2M general liability credentials, and 50-year warranty badges.
- **Complimentary Estimate Form**: Comprehensive multi-field project request form with client-side & server-side validation.

### 💳 Whop Commerce & Elements Integrations
- **Whop Elements Checkout**: PCI-compliant embedded elements (`PaymentElement`, `AddressElement`, `EmailElement`, and mandatory `BrandingElement`).
- **Roof Inspection Checkout ($149)**: One-time fee for a certified 21-point physical & drone diagnostic inspection.
- **Project Deposit Checkout ($500) & Setup Intent**: One-time deposit to lock installation dates with an off-session **Setup Intent** (`POST /setup_intents`) saving the payment method for final project balance billing.
- **Final Balance Invoicing**: Backend integration with **Whop Invoices API** (`POST /invoices`, `POST /invoices/{id}/issue`, `POST /invoices/{id}/charge`) providing automated off-session card charges or fallback pay-now email links.
- **Whop Leads API**: Secure server-to-server relay (`POST /leads`) ingesting validated estimate requests without exposing API keys in frontend code.
- **Attribution & Pixel Tracking**: Official `whop.track` pixel integration for `estimate_requested`, `service_viewed`, and `deposit_started` with session deduplication.

### 🧩 100% Reusable Architecture
All brand names, contact info, licenses, colors, service offerings, metropolitan coverage zones, financing options, testimonials, and Whop plan IDs are centralized in:
```
src/config/roofingCompany.ts
```
To adapt this site for another contractor, edit `roofingCompany.ts` without modifying core component code.

---

## 2. Whop Plans Configuration

The application is structured for three official Whop plans:

| Plan Name | Plan ID | Price | Billing Cadence | Purpose |
|---|---|---|---|---|
| **Roof Inspection** | `plan_roof_inspection_149` | $149.00 USD | One-time | 21-Point Drone & Attic Inspection Audit |
| **Project Deposit** | `plan_project_deposit_500` | $500.00 USD | One-time (`setup` mode) | Crew Reservation + Tokenized Payment Method for Completion Invoice |
| **Flat-Rate Repair** | `plan_flat_rate_repair_899` | $899.00 USD | One-time | Up to 100 sq ft Shingle & Flashing Repair |

---

## 3. Project Structure

```
├── IMPLEMENTATION_PLAN.md    # Architecture, phases, security & verification matrix
├── PAYMENT_FLOW.md           # Inspection, Deposit Setup Intent, and Invoicing flow documentation
├── TRACKING.md               # Whop Pixel custom events and deduplication guide
├── .env.example              # Documented environment variables template
├── package.json              # React 19, @whop/elements, Vite & Tailwind configuration
├── vite.config.ts            # Vite configuration with @whop/cli/vite plugin & local API middleware
├── tailwind.config.js        # Theme palette and typography
├── tsconfig.json             # TypeScript configuration
├── src/
│   ├── main.tsx              # React entrypoint
│   ├── App.tsx               # Root application layout & state management
│   ├── index.css             # Tailwind CSS directives
│   ├── config/
│   │   └── roofingCompany.ts # Centralized reusable configuration
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── ServiceAreasSection.tsx
│   │   ├── FinancingSection.tsx
│   │   ├── ReviewsAndTrustSection.tsx
│   │   ├── EstimateFormSection.tsx
│   │   ├── WhopCheckoutModal.tsx
│   │   ├── InvoiceDemoModal.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── tracking.ts       # whop.track wrapper with deduplication
│   │   └── whopServer.ts     # Server client for Whop Leads, Setup Intents, and Invoices
│   └── server/
│       └── api.ts            # Local and server route dispatcher (/api/leads, /api/invoices, etc.)
└── test/
    ├── validation.test.js    # API and form validation test suite
    ├── config.test.js        # Centralized configuration and plans integrity tests
    └── security.test.js      # Zero secret leak verification test
```

---

## 4. Getting Started Locally

### Prerequisites
- Node.js v20+ or v22+
- npm v10+

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Typecheck
npm run typecheck

# 4. Build application (packs dist/client and dist/whop-build.zip)
npm run build

# 5. Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Deployment with Whop CLI

This website is ready for deployment to Whop Websites (`*.whop.site` / `*.whop.app`).

### Step 1: Install & Authenticate Whop CLI
```bash
# If not already installed:
curl -fsSL https://whop.com/install.sh | sh

# Sign in to your Whop account:
whop auth login
```

### Step 2: Create or Link Your Whop App
```bash
# Register a new website app on Whop:
whop apps init --app_type website --name "Apex Roofing Co" --domain apex-roofing-us

# Or link to an existing app ID:
whop apps deploy --app app_xxxxxxxxxxxxxx
```

### Step 3: Configure App Secrets
```bash
# Set your server API key for Leads and Invoicing:
whop apps secrets set --secret WHOP_API_KEY=whop_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Deploy Live
```bash
whop apps deploy
```
The CLI automatically runs `npm run build` and `npm run typecheck`, uploads the package, and promotes the build to production.

---

## 6. Testing & Acceptance Matrix

| Requirement | Implementation Status | Verification Evidence |
|---|---|---|
| **Website builds successfully** | **Passed & Verified** | `npm run build` builds `dist/client` and packs `dist/whop-build.zip` via `@whop/cli/vite`. |
| **Website is responsive** | **Passed & Verified** | Clean breakpoints (`sm:`, `md:`, `lg:`) across mobile, tablet, and desktop navigation. |
| **Navigation & CTA buttons** | **Passed & Verified** | Smooth scrolling, modals, telephone click-to-call, and inquiry prefill. |
| **3 Whop Plans configured** | **Passed & Verified** | Configured in `roofingCompanyConfig.whop.plans` ($149 inspection, $500 deposit, $899 flat repair). |
| **Inspection Checkout (Whop Elements)** | **Passed & Verified** | Implements `WhopElements`, `Payments`, `PaymentElement`, `AddressElement`, `EmailElement`, `BrandingElement`. |
| **Deposit Checkout (Setup Intent)** | **Passed & Verified** | Uses `mode: "setup"` to tokenize payment method off-session for milestone billing. |
| **Final Balance Invoices API** | **Passed & Verified** | Full support for `POST /invoices`, `POST /invoices/:id/issue`, and `POST /invoices/:id/charge`. |
| **Estimate Form -> Whop Leads API** | **Passed & Verified** | Full client & server validation submitting to `POST /leads` via secure backend route. |
| **`estimate_requested` event fires** | **Passed & Verified** | Dispatched via `whop.track` upon lead form submission. |
| **`service_viewed` event fires** | **Passed & Verified** | Dispatched via `whop.track` upon service expansion or CTA click. |
| **`deposit_started` event fires** | **Passed & Verified** | Dispatched via `whop.track` when deposit checkout modal opens. |
| **No secrets in frontend code** | **Passed & Verified** | Automated test `test/security.test.js` confirms zero secrets in client bundles. |
| **No fake API success claims** | **Passed & Verified** | Real Whop SDK/API structure; clear sandbox fallback messaging when credentials are omitted. |
| **Live `whop.app` Deployment** | **Blocked by interactive auth** | CLI requires user browser authorization via `whop auth login`. Build archive is ready. |
