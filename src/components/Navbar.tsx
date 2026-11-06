import React, { useState } from 'react';
import { Shield, Phone, Menu, X, ArrowRight, FileCheck } from 'lucide-react';
import { roofingCompanyConfig } from '../config/roofingCompany';

interface NavbarProps {
  onOpenEstimate: () => void;
  onOpenInspectionCheckout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenEstimate,
  onOpenInspectionCheckout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { company, contact } = roofingCompanyConfig;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* Top Notification / Emergency Bar */}
      <div className="bg-gradient-to-r from-brand-900 via-slate-900 to-brand-950 px-4 py-1.5 text-xs text-slate-300 border-b border-slate-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded bg-brand-500/20 px-2 py-0.5 font-semibold text-brand-300">
              <span className="size-1.5 rounded-full bg-brand-400 animate-pulse"></span>
              Demonstration Template
            </span>
            <span className="hidden sm:inline text-slate-400">
              Customizable Roofing Contractor Template for Whop Websites
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-slate-400 text-[11px]">
              {company.licenseNumber}
            </span>
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex items-center gap-1.5 font-medium text-brand-300 hover:text-brand-200 transition-colors"
            >
              <Phone className="size-3.5" />
              <span>{contact.displayPhone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Shield className="size-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-brand-300 transition-colors">
              {company.name}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Whop Websites Template
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#services" className="hover:text-white transition-colors">
            Services
          </a>
          <a href="#areas" className="hover:text-white transition-colors">
            Service Areas
          </a>
          <a href="#financing" className="hover:text-white transition-colors">
            Financing
          </a>
          <a href="#reviews" className="hover:text-white transition-colors">
            Reviews & Trust
          </a>
          <a href="#contact" className="hover:text-white transition-colors">
            Contact
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onOpenInspectionCheckout}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3.5 py-2 text-xs font-semibold text-brand-300 hover:bg-brand-500/20 hover:border-brand-500/60 transition-all"
          >
            <FileCheck className="size-4" />
            <span>$149 Inspection</span>
          </button>

          <button
            onClick={onOpenEstimate}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-brand-600/30 hover:bg-brand-500 hover:shadow-brand-500/40 active:scale-95 transition-all"
          >
            <span>Get Free Estimate</span>
            <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-900/95 px-4 pt-3 pb-6 space-y-4">
          <div className="flex flex-col space-y-3 text-sm font-medium text-slate-200">
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-brand-400"
            >
              Services
            </a>
            <a
              href="#areas"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-brand-400"
            >
              Service Areas
            </a>
            <a
              href="#financing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-brand-400"
            >
              Financing
            </a>
            <a
              href="#reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-brand-400"
            >
              Reviews & Trust
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-brand-400"
            >
              Contact
            </a>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenInspectionCheckout();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-brand-500/40 bg-brand-500/10 py-2.5 text-sm font-semibold text-brand-300"
            >
              <FileCheck className="size-4" />
              <span>Book $149 Inspection</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenEstimate();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30"
            >
              <span>Get Free Estimate</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
