import React from 'react';
import { CreditCard, AlertCircle, ArrowRight } from 'lucide-react';
import { roofingCompanyConfig } from '../config/roofingCompany';

interface FinancingSectionProps {
  onOpenEstimate: () => void;
}

export const FinancingSection: React.FC<FinancingSectionProps> = ({ onOpenEstimate }) => {
  const { financing } = roofingCompanyConfig;

  return (
    <section id="financing" className="relative bg-slate-900 py-16 lg:py-24 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
            <CreditCard className="size-3.5" />
            <span>Budget-Friendly Project Solutions</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Flexible Roofing Financing Options
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            A damaged roof cannot wait for payday. We offer accessible installment plans designed to protect your home now without straining household liquidity.
          </p>
        </div>

        {/* Financing Plans Cards */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {financing.options.map((option, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-8 transition-all ${
                option.recommended
                  ? 'border-brand-500 bg-slate-950 shadow-xl shadow-brand-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              {option.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                  {option.term}
                </span>

                <h3 className="mt-2 text-2xl font-bold text-white">
                  {option.title}
                </h3>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {option.rate}
                  </span>
                  <span className="text-xs text-slate-400">
                    Subject to eligibility
                  </span>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  {option.monthlyEstimate}
                </p>

                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  {option.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={onOpenEstimate}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-semibold transition-all ${
                    option.recommended
                      ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-600/30'
                      : 'border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>Inquire with Estimate</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory Transparency Notice */}
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 flex items-start gap-3.5 text-xs text-slate-400">
          <AlertCircle className="size-5 text-brand-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-300 block">
              Financing Transparency & Disclosure Notice:
            </span>
            <p className="leading-relaxed">
              {financing.disclaimer} Payment methods, installment terms, and promotional financing availability are configured through the merchant's verified Whop and credit processing gateway. No claim of guaranteed loan approval is made. Final interest rates and down payment requirements depend on applicant credit review and applicable state regulations.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
