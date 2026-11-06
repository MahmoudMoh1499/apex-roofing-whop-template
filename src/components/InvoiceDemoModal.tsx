import React, { useState } from 'react';
import { X, Receipt, CheckCircle2, AlertCircle } from 'lucide-react';
import { roofingCompanyConfig } from '../config/roofingCompany';

interface InvoiceDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPaymentMethodId?: string;
  customerEmail?: string;
}

export const InvoiceDemoModal: React.FC<InvoiceDemoModalProps> = ({
  isOpen,
  onClose,
  savedPaymentMethodId,
  customerEmail = 'customer@example.com',
}) => {
  const { whop, company } = roofingCompanyConfig;

  const [email, setEmail] = useState(customerEmail);
  const [balanceAmount, setBalanceAmount] = useState('4500');
  const [projectTitle, setProjectTitle] = useState('Full Architectural Shingle Replacement - Final Balance');
  const [paymentMethodId, setPaymentMethodId] = useState(savedPaymentMethodId || '');
  const [chargeAuto, setChargeAuto] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [invoiceResult, setInvoiceResult] = useState<{
    invoiceId: string;
    checkoutLink?: string;
    chargedAutomatically: boolean;
    status: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Drafting invoice with Whop Invoices API...');

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'demo-admin-authorized',
        },
        body: JSON.stringify({
          accountId: whop.accountId,
          recipientEmails: [email],
          paymentMethodId: paymentMethodId.trim() || undefined,
          chargeAutomatically: chargeAuto && Boolean(paymentMethodId.trim()),
          items: [
            {
              quantity: 1,
              variant: {
                title: projectTitle,
                price: parseFloat(balanceAmount) || 4500,
                currency: 'usd',
              },
            },
          ],
          memo: `${company.name} - Completion of roofing installation. Thank you for your business!`,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Invoice creation failed with status ${response.status}`);
      }

      setInvoiceResult({
        invoiceId: data.invoiceId || `pay_demo_${Date.now()}`,
        checkoutLink: data.checkoutLink,
        chargedAutomatically: data.chargedAutomatically || false,
        status: data.status || 'issued',
      });
    } catch (err) {
      console.error('Invoice error:', err);
      setErrorMessage((err as Error).message || 'Failed to generate or charge invoice.');
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <Receipt className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Final Balance Invoice Management
              </h3>
              <p className="text-xs text-slate-400">
                Official Whop Invoices API (`POST /invoices`) Flow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          
          {invoiceResult ? (
            /* Invoice Result Screen */
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="size-8" />
              </div>

              <h4 className="text-xl font-bold text-white">
                {invoiceResult.chargedAutomatically
                  ? 'Invoice Charged Successfully to Saved Card!'
                  : 'Invoice Issued & Sent to Customer'}
              </h4>

              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {invoiceResult.chargedAutomatically
                  ? 'Whop Invoices API executed an off-session charge using the customer tokenized payment method.'
                  : 'An open invoice was generated. If automatic charging declined or card authentication is required, customer receives the checkout link.'}
              </p>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 max-w-sm mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice ID:</span>
                  <span className="font-mono text-emerald-400">{invoiceResult.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-semibold text-white uppercase">{invoiceResult.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Billed:</span>
                  <span className="font-bold text-white">${balanceAmount}.00 USD</span>
                </div>
                {invoiceResult.checkoutLink && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1">Pay Now Checkout URL:</span>
                    <a
                      href={invoiceResult.checkoutLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-400 hover:underline break-all"
                    >
                      {invoiceResult.checkoutLink}
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => setInvoiceResult(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  Create Another Invoice
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Invoice Generation Form */
            <form onSubmit={handleGenerateInvoice} className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
                <span className="font-semibold text-white block">Project Milestone Completion</span>
                <p className="mt-1 text-[11px] text-slate-400">
                  After roof inspection sign-off, invoice the remaining contract balance. If a payment method was saved during the $500 deposit (Setup Intent), charge it directly or email the payment link.
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient Customer Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Balance Due ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-7 pr-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Saved Payment Method ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    placeholder="payt_xxxxxxxxxxxxxx"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              {paymentMethodId && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chargeAutoCheck"
                    checked={chargeAuto}
                    onChange={(e) => setChargeAuto(e.target.checked)}
                    className="size-4 rounded border-slate-700 bg-slate-900 text-brand-600"
                  />
                  <label htmlFor="chargeAutoCheck" className="text-xs text-slate-300">
                    Automatically charge saved payment method upon invoice issue (`POST /invoices/:id/charge`)
                  </label>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/30"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{statusMessage || 'Processing with Whop Invoices API...'}</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="size-4" />
                      <span>Generate & Issue Whop Invoice</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
