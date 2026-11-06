import React from 'react';
import { MapPin, Navigation, Clock, CheckCircle } from 'lucide-react';
import { roofingCompanyConfig } from '../config/roofingCompany';

interface ServiceAreasSectionProps {
  onOpenEstimate: () => void;
}

export const ServiceAreasSection: React.FC<ServiceAreasSectionProps> = ({ onOpenEstimate }) => {
  const { serviceAreas } = roofingCompanyConfig;

  return (
    <section id="areas" className="relative bg-slate-950 py-16 lg:py-24 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
            <MapPin className="size-3.5 text-brand-400" />
            <span>Fast Local Dispatch</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Service Areas Across the Greater Metropolitan Region
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Our licensed mobile estimator units and roofing crews are strategically deployed for prompt on-site assessments and guaranteed emergency arrivals.
          </p>
        </div>

        {/* Coverage Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {serviceAreas.map((area, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between hover:border-slate-700 hover:bg-slate-900 transition-all shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-brand-300">
                    <Navigation className="size-3" />
                    <span>{area.state} Zone</span>
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="size-3 text-emerald-400" />
                    <span>{area.responseTime}</span>
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-white">
                  {area.name}
                </h3>
                
                <p className="mt-1 text-xs text-slate-400">
                  Radius: {area.coverageRadius} from hub
                </p>

                {/* Cities Pill List */}
                <div className="mt-4 space-y-1.5 border-t border-slate-800 pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Key Communities Served:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {area.cities.map((city, cIdx) => (
                      <span
                        key={cIdx}
                        className="rounded-md border border-slate-700/60 bg-slate-800/80 px-2 py-0.5 text-xs text-slate-200"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/80">
                <button
                  onClick={onOpenEstimate}
                  className="w-full text-center text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center justify-center gap-1"
                >
                  <span>Request Crew in {area.name}</span>
                  <CheckCircle className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coverage Guarantee Box */}
        <div className="mt-10 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-center text-xs text-slate-400">
          <span>
            Don't see your specific municipality? We frequently service adjacent counties for complete replacements. Contact our dispatch desk at <strong className="text-slate-200">{roofingCompanyConfig.contact.displayPhone}</strong> to verify same-week availability.
          </span>
        </div>

      </div>
    </section>
  );
};
