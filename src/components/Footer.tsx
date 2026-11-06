import React from 'react';
import { Shield, Phone, MapPin, Clock, Lock, CheckCircle2 } from 'lucide-react';
import { roofingCompanyConfig } from '../config/roofingCompany';

interface FooterProps {
  onOpenInvoiceDemo: () => void;
  onOpenEstimate: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenInvoiceDemo, onOpenEstimate }) => {
  const { company, contact, serviceAreas } = roofingCompanyConfig;

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Brand Info & Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
                <Shield className="size-5" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                {company.name}
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed text-xs">
              {company.shortDescription}
            </p>

            <div className="space-y-1 text-slate-300 font-medium pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>State License: {company.licenseNumber}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>{company.coverageAmount}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Service Coverage */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Metro Service Zones
            </h4>
            <ul className="space-y-2">
              {serviceAreas.map((area, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-300">
                  <MapPin className="size-3 text-brand-400 shrink-0" />
                  <span>{area.name} ({area.cities.slice(0, 3).join(', ')})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Hours & Emergency */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Dispatch & Hours
            </h4>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-start gap-2">
                <Clock className="size-3.5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-200 font-medium">Standard Hours:</span>
                  <span className="text-[11px] text-slate-400">{contact.hours.weekday}</span>
                  <span className="text-[11px] text-slate-400 block">{contact.hours.saturday}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <Phone className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-200 font-medium">Emergency Line:</span>
                  <a href={`tel:${contact.emergencyPhone}`} className="text-brand-300 hover:underline">
                    {contact.emergencyPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Whop Powered Payments & Invoicing */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1">
              Secure Online Payments
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Accepting Apple Pay, Google Pay, and major debit/credit cards through Whop Elements.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
                <Lock className="size-3.5 text-emerald-400" />
                <span>PCI-Compliant Whop Checkout</span>
              </div>
              <button
                onClick={onOpenInvoiceDemo}
                className="w-full text-left rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-brand-300 hover:bg-slate-700 transition-colors"
              >
                Launch Final Balance Invoice Portal &rarr;
              </button>
            </div>
          </div>

        </div>

        {/* Legal Disclaimer & Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} {company.legalName}. All rights reserved. Built with Whop Websites.
          </p>
          <div className="flex items-center gap-4">
            <a href="#services" className="hover:text-slate-300">Services</a>
            <a href="#financing" className="hover:text-slate-300">Financing</a>
            <button onClick={onOpenEstimate} className="hover:text-slate-300">Free Estimate</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
