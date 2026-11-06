import React from 'react';
import { Star, ShieldCheck, FileCheck, Award, Clock, CheckCircle2 } from 'lucide-react';
import { roofingCompanyConfig, TrustBadge } from '../config/roofingCompany';

export const ReviewsAndTrustSection: React.FC = () => {
  const { testimonials, trustBadges } = roofingCompanyConfig;

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="size-6 text-brand-400" />;
      case 'FileCheck':
        return <FileCheck className="size-6 text-emerald-400" />;
      case 'Award':
        return <Award className="size-6 text-amber-400" />;
      case 'Clock':
        return <Clock className="size-6 text-sky-400" />;
      default:
        return <CheckCircle2 className="size-6 text-brand-400" />;
    }
  };

  return (
    <section id="reviews" className="relative bg-slate-950 py-16 lg:py-24 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span>Customer Feedback & Credentials</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Reputation Built on Rigorous Standards
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            See how our certified craftsmanship and transparent Whop billing experience give homeowners peace of mind.
          </p>
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustBadges.map((badge: TrustBadge) => (
            <div
              key={badge.id}
              className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700">
                {renderBadgeIcon(badge.iconName)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{badge.title}</h4>
                <p className="text-xs text-slate-400">{badge.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((review) => (
            <div
              key={review.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 relative shadow-lg"
            >
              <div>
                {/* Rating stars & verified demo pill */}
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400" />
                    ))}
                  </div>

                  {review.isVerifiedDemo && (
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Sample Customer
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-400">
                  {review.projectType}
                </p>

                <p className="mt-3 text-sm text-slate-300 leading-relaxed italic">
                  "{review.content}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{review.author}</span>
                  <span className="text-slate-400">{review.location}</span>
                </div>
                <span className="text-slate-400">{review.reviewDate}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Testimonials Disclaimer */}
        <div className="mt-10 rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 text-center text-xs text-slate-400">
          <span>
            <strong>Transparency Notice:</strong> Testimonials on this demonstration site are structured as sample representations of typical customer experiences and project scopes to showcase template functionality without fabricating real-person endorsements.
          </span>
        </div>

      </div>
    </section>
  );
};
