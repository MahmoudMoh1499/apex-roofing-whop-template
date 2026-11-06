# Whop Pixel Tracking & Analytics Documentation

## 1. Overview & Automatic Pixel Integration

Sites hosted on Whop Websites (`whop.site` / `whop.app`) automatically include the official **Whop Pixel** without requiring manual script snippets or company ID configuration.

Whop injects the tracking pixel into every HTML document served, bound to the app's business, which automatically tracks:
- **Page Views**: Logged on every initial page load and route navigation.
- **Checkout Views & Conversions**: Automatically attributed whenever a customer completes a payment on Whop payment surfaces.

---

## 2. Custom Events Specification

The application implements three explicit custom events via the global `window.whop.track` API, encapsulated in `src/lib/tracking.ts`.

### 2.1 `estimate_requested`
- **Trigger Location**: `src/components/EstimateFormSection.tsx` inside `handleSubmit` after successful server validation and acceptance.
- **Purpose**: Signals a high-intent conversion lead.
- **Payload Schema**:
  ```javascript
  whop.track("estimate_requested", {
    event_id: "estimate_1730900000_abcde", // Unique deduplication ID
    service_type: "Comprehensive Roof Inspection",
    preferred_contact: "phone",
    postal_code: "75201",
    timestamp: "2026-11-06T14:30:00.000Z"
  });

  // Also fires standard lead event:
  whop.track("lead", {
    event_id: "lead_estimate_1730900000_abcde",
    service: "Comprehensive Roof Inspection"
  });
  ```
- **Privacy Safeguard**: Customer names, direct email addresses, and street addresses are omitted from the pixel event payload to protect PII; complete contact details are submitted strictly over server-to-server TLS to `POST /api/leads`.

### 2.2 `service_viewed`
- **Trigger Location**: `src/components/ServicesSection.tsx` inside `handleToggleExpand` when a visitor expands service specifications, or inside `handleServiceCTA` when initiating an action on a specific service card.
- **Purpose**: Tracks catalog engagement and service popularity.
- **Payload Schema**:
  ```javascript
  whop.track("service_viewed", {
    service_id: "roof-inspection",
    service_title: "Comprehensive Roof Inspection",
    starting_price: "$149 Flat Rate"
  });
  ```
- **Deduplication**: Session-level memoization prevents duplicate firings if the visitor toggles the same service card multiple times.

### 2.3 `deposit_started`
- **Trigger Location**: `src/components/WhopCheckoutModal.tsx` upon opening the modal in `mode === 'deposit'`.
- **Purpose**: Tracks high-value project commitment funnel entry.
- **Payload Schema**:
  ```javascript
  whop.track("deposit_started", {
    event_id: "deposit_plan_project_deposit_500_1730900000",
    plan_id: "plan_project_deposit_500",
    value: 500,
    currency: "USD",
    service_name: "Roofing Project Deposit & Crew Reservation"
  });

  // Also fires standard ecommerce checkout initiation:
  whop.track("initiate_checkout", {
    variant_id: "plan_project_deposit_500",
    value: 500,
    currency: "USD"
  });
  ```

---

## 3. Deduplication Strategy

To prevent skewing attribution data during page refreshes, retries, or multiple clicks:
1. **Dynamic `event_id`**: High-value events (`estimate_requested` and `deposit_started`) generate a unique timestamped hash (`event_id`). Whop deduplicates multiple events bearing identical event IDs.
2. **In-Memory Cache**: `firedEventIds` set in `src/lib/tracking.ts` suppresses redundant dispatches for the duration of the page session.

---

## 4. Verification Guide

### 4.1 In Production / Staging on `whop.site`:
1. Open the website on your `whop.site` address.
2. Open the Browser Developer Tools (**F12**) -> **Network** tab.
3. Filter requests by `events` or `pulse`.
4. Submit an estimate: verify a network POST payload is dispatched containing `estimate_requested`.
5. Click **"Reserve Date ($500 Deposit)"**: verify a POST payload containing `deposit_started` is dispatched.
6. Open your Whop Dashboard -> **Websites** / **Analytics** to view live visitor counts, conversions, and attribution graphs.

### 4.2 In Local Development:
When running on `localhost:3000`, the application provides a resilient mock pixel logger in `index.html`:
```javascript
window.whop = {
  track: function(eventName, data) {
    console.log('[Whop Pixel Event]', eventName, data);
  }
};
```
Open the Browser Console (**Ctrl+Shift+J** or **Cmd+Option+J**) to inspect formatted `[Whop Pixel Event]` outputs for every trigger in real time.
