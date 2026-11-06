import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  ShieldAlert,
  Home,
  Search,
  Sparkles,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { roofingCompanyConfig, RoofingService } from '../config/roofingCompany';
import { trackServiceViewed } from '../lib/tracking';

interface ServicesSectionProps {
  onSelectService: (service: RoofingService) => void;
  onOpenDepositCheckout: () => void;
  onOpenInspectionCheckout: () => void;
  onOpenEstimate: (serviceTitle?: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenDepositCheckout,
  onOpenInspectionCheckout,
  onOpenEstimate,
}) => {
  const { services } = roofingCompanyConfig;
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

  const getServiceIcon = (slug: string) => {
    switch (slug) {
      case 'roof-inspection':
        return <Search className="size-6 text-brand-400" />;
      case 'roof-repair':
        return <ShieldAlert className="size-6 text-amber-400" />;
      case 'roof-replacement':
        return <Home className="size-6 text-emerald-400" />;
      default:
        return <Layers className="size-6 text-brand-400" />;
    }
  };

  const handleToggleExpand = (service: RoofingService) => {
    const isExpanding = expandedServiceId !== service.id;
    setExpandedServiceId(isExpanding ? service.id : null);

    if (isExpanding) {
      trackServiceViewed({
        serviceId: service.id,
        serviceTitle: service.title,
        price: service.estimatedStartingPrice,
      });
    }
  };

  const handleServiceCTA = (service: RoofingService) => {
    trackServiceViewed({
      serviceId: service.id,
      serviceTitle: service.title,
      price: service.estimatedStartingPrice,
    });

    if (service.checkoutType === 'inspection') {
      onOpenInspectionCheckout();
    } else if (service.checkoutType === 'deposit') {
      onOpenDepositCheckout();
    } else {
      onOpenEstimate(service.title);
    }
  };

  return (
    <section id="services" className="relative bg-slate-900 py-16 lg:py-24 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
            <Sparkles className="size-3.5" />
            <span>Commercial & Residential Specialties</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Engineered Roofing Services Guaranteed to Last
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Every project begins with transparent diagnostic assessments and upfront written proposals. No hidden fees or surprise change orders.
          </p>
        </div>

        {/* Services Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const isExpanded = expandedServiceId === service.id;

            return (
              <div
                key={service.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-slate-950 transition-all duration-300 hover:shadow-2xl hover:border-brand-500/50 ${
                  service.popular
                    ? 'border-brand-500/60 shadow-lg shadow-brand-500/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Popular Pill */}
                {service.popular && (
                  <div className="absolute top-4 right-4 z-10 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                    Most Requested
                  </div>
                )}

                {/* Service Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  
                  {/* Floating Icon */}
                  <div className="absolute bottom-3 left-4 flex size-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 shadow-md backdrop-blur-md">
                    {getServiceIcon(service.slug)}
                  </div>
                </div>

                {/* Service Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                        {service.turnaroundTime} Turnaround
                      </span>
                      <span className="text-sm font-bold text-white">
                        {service.estimatedStartingPrice}
                      </span>
                    </div>

                    <h3 className="mt-2 text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                      {service.title}
                    </h3>
                    
                    <p className="mt-1 text-xs text-brand-200/80 font-medium italic">
                      {service.tagline}
                    </p>

                    <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Key Benefits */}
                    <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Key Advantages:
                      </span>
                      {service.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Expandable Detailed Scope */}
                    {isExpanded && (
                      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300 space-y-2 animate-fadeIn">
                        <span className="font-semibold text-slate-200">Full Scope of Work:</span>
                        <ul className="space-y-1.5 list-disc pl-4 text-slate-400">
                          {service.detailedScope.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Service Footer & Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2.5">
                    <button
                      onClick={() => handleToggleExpand(service)}
                      className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Specifications' : 'View Scope Details'}</span>
                      {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>

                    <button
                      onClick={() => handleServiceCTA(service)}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all ${
                        service.checkoutType === 'inspection'
                          ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-600/20'
                          : service.checkoutType === 'deposit'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20'
                          : 'border border-slate-700 bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {service.checkoutType === 'inspection' && (
                        <>
                          <span>Book $149 Inspection</span>
                          <ArrowRight className="size-4" />
                        </>
                      )}
                      {service.checkoutType === 'deposit' && (
                        <>
                          <span>Reserve Date ($500 Deposit)</span>
                          <ArrowRight className="size-4" />
                        </>
                      )}
                      {service.checkoutType === 'custom' && (
                        <>
                          <span>Request Repair Estimate</span>
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>

                    {service.checkoutUrl && (
                      <a
                        href={service.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors py-1 hover:underline"
                      >
                        <span>Or pay directly on Whop Hosted Checkout</span>
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Banner with Emergency Dispatch */}
        <div className="mt-14 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="size-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Active Storm Damage or Sudden Attic Water Leak?
              </h4>
              <p className="text-xs sm:text-sm text-slate-400">
                Our emergency tarping and leak stabilization crew dispatches immediately to protect interior furnishings.
              </p>
            </div>
          </div>

          <a
            href={`tel:${roofingCompanyConfig.contact.emergencyPhone}`}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <span>Emergency Dispatch: {roofingCompanyConfig.contact.displayPhone}</span>
          </a>
        </div>

      </div>
    </section>
  );
};
