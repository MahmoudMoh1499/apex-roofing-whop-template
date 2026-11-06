import React, { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, Phone, Mail, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { roofingCompanyConfig } from '../config/roofingCompany';
import { trackEstimateRequested } from '../lib/tracking';

interface EstimateFormSectionProps {
  initialService?: string;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  preferredContact: 'phone' | 'email' | 'text';
  description: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  serviceType?: string;
  description?: string;
}

export const EstimateFormSection: React.FC<EstimateFormSectionProps> = ({ initialService }) => {
  const { services, contact } = roofingCompanyConfig;

  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    serviceType: initialService || services[0]?.title || 'Comprehensive Roof Inspection',
    preferredContact: 'phone',
    description: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);

  // Client-side validation function
  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Please enter your first and last name';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (digitsOnly.length < 10) {
      errs.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      errs.address = 'Property address is required';
    } else if (formData.address.trim().length < 5) {
      errs.address = 'Please provide street address, city, and zip';
    }

    if (!formData.serviceType) {
      errs.serviceType = 'Please select a service type';
    }

    if (!formData.description.trim()) {
      errs.description = 'Please provide a brief description of your project';
    } else if (formData.description.trim().length < 10) {
      errs.description = 'Please describe the issue or project in at least 10 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to our secure server API endpoint
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: roofingCompanyConfig.whop.accountId,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          serviceType: formData.serviceType,
          preferredContact: formData.preferredContact,
          description: formData.description,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || `Submission failed with status ${response.status}`);
      }

      // Track the conversion event in Whop Pixel
      trackEstimateRequested({
        serviceType: formData.serviceType,
        preferredContact: formData.preferredContact,
        postalCode: formData.address.match(/\b\d{5}\b/)?.[0] || 'N/A',
      });

      setSubmittedLeadId(result.leadId || `lead_demo_${Date.now()}`);
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Lead submission error:', err);
      setSubmitError(
        (err as Error).message ||
          'Failed to submit estimate request. Please try again or call our dispatch desk.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative bg-slate-900 py-16 lg:py-24 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Contact info & value guarantees */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
              <ShieldCheck className="size-3.5" />
              <span>Fast 24-Hour Response Guaranteed</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Request Your Detailed Roofing Estimate
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Complete the form below to receive a zero-pressure written proposal. For urgent leak mitigation, contact our 24/7 dispatcher directly.
            </p>

            {/* Direct Contact Cards */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-brand-600/20 text-brand-400">
                  <Phone className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Direct Telephone</span>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-base font-bold text-white hover:text-brand-300 transition-colors"
                  >
                    {contact.displayPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-brand-600/20 text-brand-400">
                  <Mail className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Email Inquiries</span>
                  <span className="text-sm font-semibold text-white">{contact.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-brand-600/20 text-brand-400">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Headquarters</span>
                  <span className="text-xs text-slate-300 block">
                    {contact.address.street}, {contact.address.city}, {contact.address.state} {contact.address.zip}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-brand-600/20 text-brand-400">
                  <Clock className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Operating Hours</span>
                  <span className="text-xs text-slate-300 block">{contact.hours.weekday}</span>
                  <span className="text-xs text-slate-400 block">{contact.hours.saturday}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Lead Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl relative">
              
              {submitSuccess ? (
                /* Success State Screen */
                <div className="py-10 text-center space-y-4 animate-fadeIn">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="size-10" />
                  </div>

                  <h3 className="text-2xl font-bold text-white">
                    Estimate Request Successfully Received!
                  </h3>

                  <p className="max-w-md mx-auto text-sm text-slate-300 leading-relaxed">
                    Thank you, <strong className="text-white">{formData.fullName}</strong>. Your project inquiry has been registered in our system and synced to the Whop Leads engine.
                  </p>

                  {submittedLeadId && (
                    <div className="inline-block rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-mono text-slate-400">
                      Whop Lead Confirmation: <span className="text-emerald-400">{submittedLeadId}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-400">
                    Our lead estimator will review your aerial property imagery and contact you via {formData.preferredContact} within 24 business hours.
                  </p>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setSubmitSuccess(false);
                        setFormData({
                          fullName: '',
                          email: '',
                          phone: '',
                          address: '',
                          serviceType: services[0]?.title || '',
                          preferredContact: 'phone',
                          description: '',
                        });
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                /* Estimate Form Fields */
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-xl font-bold text-white">
                      Complimentary Project Quote
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      All fields are securely transmitted to our licensed estimating department.
                    </p>
                  </div>

                  {submitError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 flex items-start gap-3 text-xs text-red-300">
                      <AlertTriangle className="size-5 shrink-0 text-red-400 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Submission Error</span>
                        <p>{submitError}</p>
                      </div>
                    </div>
                  )}

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Robert Smith"
                        className={`w-full rounded-lg border bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                          errors.fullName ? 'border-red-500' : 'border-slate-700'
                        }`}
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. robert@example.com"
                        className={`w-full rounded-lg border bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                          errors.email ? 'border-red-500' : 'border-slate-700'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone and Property Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. (555) 234-5678"
                        className={`w-full rounded-lg border bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                          errors.phone ? 'border-red-500' : 'border-slate-700'
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Property Address *
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street, City, State, Zip"
                        className={`w-full rounded-lg border bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                          errors.address ? 'border-red-500' : 'border-slate-700'
                        }`}
                      />
                      {errors.address && (
                        <p className="mt-1 text-xs text-red-400">{errors.address}</p>
                      )}
                    </div>
                  </div>

                  {/* Service Type and Preferred Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Service Required *
                      </label>
                      <select
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {services.map((svc) => (
                          <option key={svc.id} value={svc.title}>
                            {svc.title}
                          </option>
                        ))}
                        <option value="Commercial Roofing">Commercial Roofing Consultation</option>
                        <option value="Insurance Claim Assistance">Storm Insurance Claim Assessment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Preferred Contact Method
                      </label>
                      <div className="grid grid-cols-3 gap-2 pt-0.5">
                        {(['phone', 'email', 'text'] as const).map((method) => (
                          <button
                            type="button"
                            key={method}
                            onClick={() => setFormData({ ...formData, preferredContact: method })}
                            className={`rounded-lg py-2 text-xs font-medium capitalize border transition-all ${
                              formData.preferredContact === method
                                ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Project Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Project Description & Damage Details *
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Please mention approximate roof age, signs of active leakage, hail or wind storm date, or shingle material preferences..."
                      className={`w-full rounded-lg border bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        errors.description ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs text-red-400">{errors.description}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Submitting to Whop Leads Engine...</span>
                        </>
                      ) : (
                        <>
                          <Send className="size-4" />
                          <span>Submit Estimate Request</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center">
                    Privacy Protection: Your contact information is used strictly to provide estimate scheduling and is never sold to third-party telemarketers.
                  </p>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
