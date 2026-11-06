import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Award, Star, Calendar } from 'lucide-react';
import { roofingCompanyConfig } from '../config/roofingCompany';

interface HeroSectionProps {
  onOpenEstimate: () => void;
  onOpenInspectionCheckout: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenEstimate,
  onOpenInspectionCheckout,
}) => {
  const { company } = roofingCompanyConfig;

  return (
    <section className="relative overflow-hidden bg-slate-950 pt-10 pb-16 lg:pt-16 lg:pb-24">
      {/* Background visual accents */}
      <div className="absolute top-0 right-1/4 -z-10 size-96 rounded-full bg-brand-600/10 blur-3xl" />
      <div className="absolute bottom-10 left-10 -z-10 size-80 rounded-full bg-blue-900/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          
          {/* Left Column: Headline, Value Props, CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 shadow-inner">
              <span className="flex size-2 rounded-full bg-emerald-400" />
              <span>Ranked #1 Certified Roofing Contractor in Metro Service Zone</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.12]">
              Precision Roofing Built for <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-sky-200 bg-clip-text text-transparent">Generations of Protection.</span>
            </h1>

            {/* Subheading */}
            <p className="max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed">
              From high-resolution drone inspections to complete storm damage replacements, {company.name} delivers licensed, bonded, and insured craftsmanship backed by 50-year manufacturer material warranties.
            </p>

            {/* Key Value Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>Zero-Pressure Written Quotes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>$2,000,000 Property Liability Insured</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>0% APR 12-Month Financing Available</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>Secure $500 Deposit via Whop Payments</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={onOpenEstimate}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-brand-600 px-6 py-4 text-base font-semibold text-white shadow-xl shadow-brand-600/30 hover:bg-brand-500 hover:shadow-brand-500/40 active:scale-[0.98] transition-all"
              >
                <span>Get a Free Estimate</span>
                <ArrowRight className="size-5" />
              </button>

              <button
                onClick={onOpenInspectionCheckout}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-4 text-base font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 active:scale-[0.98] transition-all"
              >
                <Calendar className="size-5 text-brand-400" />
                <span>Book $149 Inspection</span>
              </button>
            </div>

            {/* Quick Proof Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  4.9/5 Rating (Demo Reviews)
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="size-4 text-brand-400" />
                <span>GAF Master-Class Certified</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Award className="size-4 text-brand-400" />
                <span>13+ Years In Business</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Card with Trust Overlays */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Decorative Gradient Frame */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-brand-600 via-sky-500 to-indigo-600 opacity-30 blur-lg" />
              
              <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=1000&q=80"
                  alt="Professional roofing installation with premium shingles"
                  className="h-80 w-full object-cover sm:h-96"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Floating Inspection Offer Card */}
                <div className="absolute bottom-4 inset-x-4 rounded-xl border border-slate-700/80 bg-slate-900/90 p-4 backdrop-blur-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded bg-brand-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-300">
                        Popular Choice
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-white">
                        Comprehensive 21-Point Inspection
                      </h4>
                      <p className="text-xs text-slate-400">
                        Full drone photo report + attic audit within 24 hours.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-white">$149</span>
                      <span className="block text-[10px] text-slate-400">Credited to repairs</span>
                    </div>
                  </div>

                  <button
                    onClick={onOpenInspectionCheckout}
                    className="mt-3 w-full rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-colors"
                  >
                    Checkout with Whop Elements
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
