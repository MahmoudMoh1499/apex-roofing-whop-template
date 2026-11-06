export interface RoofingService {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  detailedScope: string[];
  benefits: string[];
  estimatedStartingPrice: string;
  turnaroundTime: string;
  popular?: boolean;
  whopPlanId?: string;
  checkoutType?: 'inspection' | 'deposit' | 'custom' | 'quote';
  image: string;
}

export interface ServiceArea {
  name: string;
  state: string;
  cities: string[];
  coverageRadius: string;
  responseTime: string;
}

export interface FinancingOption {
  title: string;
  rate: string;
  term: string;
  monthlyEstimate: string;
  description: string;
  recommended?: boolean;
}

export interface Testimonial {
  id: string;
  author: string;
  location: string;
  projectType: string;
  rating: number;
  reviewDate: string;
  content: string;
  isVerifiedDemo: boolean;
}

export interface TrustBadge {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
}

export interface RoofingCompanyConfig {
  company: {
    name: string;
    legalName: string;
    tagline: string;
    shortDescription: string;
    foundedYear: number;
    licenseNumber: string;
    bondedAndInsured: boolean;
    coverageAmount: string;
  };
  contact: {
    phone: string;
    displayPhone: string;
    emergencyPhone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    hours: {
      weekday: string;
      saturday: string;
      sunday: string;
    };
  };
  whop: {
    accountId: string;
    plans: {
      roofInspection: {
        id: string;
        title: string;
        amount: number; // in USD
        currency: string;
        billingType: 'one_time';
        description: string;
      };
      projectDeposit: {
        id: string;
        title: string;
        amount: number; // in USD ($500)
        currency: string;
        billingType: 'one_time';
        mode: 'setup';
        description: string;
      };
      flatRateService: {
        id: string;
        title: string;
        amount: number; // in USD
        currency: string;
        billingType: 'one_time';
        description: string;
      };
    };
  };
  services: RoofingService[];
  serviceAreas: ServiceArea[];
  financing: {
    disclaimer: string;
    options: FinancingOption[];
  };
  testimonials: Testimonial[];
  trustBadges: TrustBadge[];
  socialLinks: {
    platform: string;
    url: string;
  }[];
}

const safeEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || process.env || {};

export const roofingCompanyConfig: RoofingCompanyConfig = {
  company: {
    name: "Apex Roofing Co.",
    legalName: "Apex Premier Roofing & Construction LLC (Fictional Demo Entity)",
    tagline: "Uncompromising Quality, Lasting Protection (Customizable Template)",
    shortDescription: "A production-grade, customizable website template for US roofing contractors built on Whop Websites, featuring Whop Elements, Setup Intents, Invoicing, and Leads integration.",
    foundedYear: 2011,
    licenseNumber: "SAMPLE-ROC-339842 (Demo Specification)",
    bondedAndInsured: true,
    coverageAmount: "Sample $2,000,000 Liability Specification",
  },
  contact: {
    phone: "+18005557663",
    displayPhone: "(800) 555-ROOF",
    emergencyPhone: "(800) 555-7664",
    email: "estimates@apexroofing-us.example",
    address: {
      street: "4820 Summit Ridge Boulevard, Suite 300",
      city: "Dallas",
      state: "TX",
      zip: "75201",
      country: "United States",
    },
    hours: {
      weekday: "Monday - Friday: 7:00 AM - 7:00 PM CST",
      saturday: "Saturday: 8:00 AM - 4:00 PM CST",
      sunday: "Sunday: 24/7 Emergency Storm Dispatch Only",
    },
  },
  whop: {
    accountId: safeEnv.VITE_WHOP_ACCOUNT_ID || "biz_yxb2Bl22qgep3g",
    plans: {
      roofInspection: {
        id: safeEnv.VITE_WHOP_INSPECTION_PLAN_ID || "plan_2KwvDItyoRemP",
        title: "Comprehensive 21-Point Roof Inspection",
        amount: 149,
        currency: "USD",
        billingType: "one_time",
        description: "Full drone & physical diagnostic inspection, attic moisture scan, photographic damage report, and itemized repair estimate.",
      },
      projectDeposit: {
        id: safeEnv.VITE_WHOP_DEPOSIT_PLAN_ID || "plan_8Z1S3Yw1WjX4a",
        title: "Roofing Project Deposit & Crew Reservation",
        amount: 500,
        currency: "USD",
        billingType: "one_time",
        mode: "setup",
        description: "Secures project scheduling, locks in wholesale material pricing, and establishes customer payment method for final project balance upon completion.",
      },
      flatRateService: {
        id: safeEnv.VITE_WHOP_SERVICE_PLAN_ID || "plan_i2sQTyDeCoYq3",
        title: "Flat-Rate Emergency Roof Repair",
        amount: 899,
        currency: "USD",
        billingType: "one_time",
        description: "Up to 100 sq ft architectural shingle repair, pipe boot replacement, leak sealing, and post-repair weatherproofing guarantee.",
      },
    },
  },
  services: [
    {
      id: "roof-inspection",
      title: "Comprehensive Roof Inspection",
      slug: "roof-inspection",
      tagline: "Prevent Costly Leaks with Certified 21-Point Diagnostics",
      description: "Our certified technicians perform thorough drone high-res imaging and hands-on structural analysis of shingles, decking, flashing, vents, gutters, and attic insulation.",
      detailedScope: [
        "High-definition aerial drone scan of hard-to-reach slopes",
        "Physical inspection of shingles, flashing, ridge caps, and pipe boots",
        "Attic moisture and thermal leak detection audit",
        "Written photographic condition report within 24 hours",
        "Insurance-ready documentation in case of storm damage"
      ],
      benefits: [
        "Uncover hidden hail & wind damage early",
        "Protect home resale value with certified inspection records",
        "Transparent $149 flat pricing credited toward any approved repair"
      ],
      estimatedStartingPrice: "$149 Flat Rate",
      turnaroundTime: "24-48 Hours",
      whopPlanId: "plan_roof_inspection_149",
      checkoutType: "inspection",
      image: "https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "roof-repair",
      title: "Precision Roof Repair",
      slug: "roof-repair",
      tagline: "Rapid-Response Leak Mitigation & Storm Damage Restoration",
      description: "From missing shingles and storm wind damage to persistent valley leaks and chimney flashing failures, we provide permanent, color-matched repairs with warranty.",
      detailedScope: [
        "Emergency tarping and immediate water mitigation",
        "Underlayment, drip edge, and flashing rebuilds",
        "Precision architectural and 3-tab shingle matching",
        "Skylight and chimney penetration resealing",
        "Fascia and soffit wood rot restoration"
      ],
      benefits: [
        "Stops water intrusion before drywall or structural framing rots",
        "Same-day dispatch for active leak emergencies",
        "2-Year Workmanship Warranty on all repair areas"
      ],
      estimatedStartingPrice: "$450 Starting",
      turnaroundTime: "Same-Day / Next-Day",
      popular: true,
      whopPlanId: "plan_flat_rate_repair_899",
      checkoutType: "custom",
      image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "roof-replacement",
      title: "Full Roof Replacement",
      slug: "roof-replacement",
      tagline: "Engineered Roofing Systems Built for Lifetime Durability",
      description: "Complete tear-off, high-performance synthetic underlayment, ice & water shield, architectural shingles or standing-seam metal, backed by transferable lifetime warranties.",
      detailedScope: [
        "Complete removal of old layers down to sound decking",
        "Plywood deck reinforcement and rotted wood replacement",
        "Class 4 impact-resistant shingles or standing-seam metal",
        "Ridge vent balanced attic ventilation installation",
        "Magnetic sweep cleanup ensuring zero nails left on property"
      ],
      benefits: [
        "Up to 25% homeowners insurance premium reduction with Class 4 shingles",
        "50-Year Non-Prorated Manufacturer Material Warranty",
        "Secure project deposit ($500) online to lock your installation date"
      ],
      estimatedStartingPrice: "$5,500 - $14,000 Avg",
      turnaroundTime: "1-2 Days On-Site",
      whopPlanId: "plan_project_deposit_500",
      checkoutType: "deposit",
      image: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80",
    },
  ],
  serviceAreas: [
    {
      name: "North Metro Area",
      state: "TX",
      cities: ["Plano", "Frisco", "McKinney", "Allen", "Prosper"],
      coverageRadius: "30 Miles",
      responseTime: "< 2 Hours Emergency",
    },
    {
      name: "Central Metro Area",
      state: "TX",
      cities: ["Dallas", "University Park", "Highland Park", "Richardson", "Garland"],
      coverageRadius: "25 Miles",
      responseTime: "< 90 Min Emergency",
    },
    {
      name: "West Metro Area",
      state: "TX",
      cities: ["Fort Worth", "Arlington", "Southlake", "Grapevine", "Keller"],
      coverageRadius: "35 Miles",
      responseTime: "< 2 Hours Emergency",
    },
    {
      name: "East & Lake Counties",
      state: "TX",
      cities: ["Rockwall", "Rowlett", "Heath", "Forney", "Sunnyvale"],
      coverageRadius: "30 Miles",
      responseTime: "< 2.5 Hours Emergency",
    },
  ],
  financing: {
    disclaimer: "Financing options are subject to merchant credit approval and processor qualification. Terms may vary based on creditworthiness and total project invoice.",
    options: [
      {
        title: "0% APR Same-As-Cash",
        rate: "0% APR",
        term: "12 Months",
        monthlyEstimate: "Spread full cost over 1 year with zero interest if paid in full.",
        description: "Ideal for homeowners awaiting storm insurance claim checks or seeking zero financing costs.",
        recommended: true,
      },
      {
        title: "Low Fixed Interest Long-Term",
        rate: "7.99% Fixed",
        term: "60 to 120 Months",
        monthlyEstimate: "Low monthly payments starting at ~$119/month on a $9,000 project.",
        description: "Affordable predictable monthly installments that keep capital intact while upgrading to premium roofing.",
      },
      {
        title: "Insurance Deductible Assistance",
        rate: "Flexible",
        term: "Milestone-Based",
        monthlyEstimate: "Pay your standard deductible via credit card or digital wallet with zero prepayment penalties.",
        description: "We work directly with all major US insurance carriers for direct supplemental billing.",
      },
    ],
  },
  testimonials: [
    {
      id: "rev-1",
      author: "David M.",
      location: "Plano, TX",
      projectType: "Full Architectural Roof Replacement",
      rating: 5,
      reviewDate: "October 2024",
      content: "Apex Roofing did an incredible job replacing our hail-damaged roof. The team arrived at 7:00 AM, protected all our landscaping with netting, finished by 4:30 PM, and left the driveway spotless. Paying the $500 deposit online made booking effortless.",
      isVerifiedDemo: true,
    },
    {
      id: "rev-2",
      author: "Sarah & Robert L.",
      location: "Frisco, TX",
      projectType: "21-Point Roof Inspection & Leak Repair",
      rating: 5,
      reviewDate: "November 2024",
      content: "Booked the $149 inspection after a severe wind storm. The drone report showed three cracked shingles around the master bedroom chimney that our insurance inspector missed. Repaired the next morning. Highly recommend!",
      isVerifiedDemo: true,
    },
    {
      id: "rev-3",
      author: "Marcus T.",
      location: "Dallas, TX",
      projectType: "Commercial Flat Roof Coating",
      rating: 5,
      reviewDate: "December 2024",
      content: "Superb communication from quote to final completion invoice. Transparent pricing, no surprise fees, and courteous crew foremen. The online payment system was seamless.",
      isVerifiedDemo: true,
    },
  ],
  trustBadges: [
    {
      id: "badge-1",
      title: "Sample License Spec",
      subtitle: "Configurable State ROC",
      iconName: "ShieldCheck",
    },
    {
      id: "badge-2",
      title: "Sample Liability Spec",
      subtitle: "$2M General Liability Policy",
      iconName: "FileCheck",
    },
    {
      id: "badge-3",
      title: "Sample Warranty Spec",
      subtitle: "50-Yr Material Warranty",
      iconName: "Award",
    },
    {
      id: "badge-4",
      title: "Emergency Fleet Spec",
      subtitle: "24/7 Dispatch Dispatch Ready",
      iconName: "Clock",
    },
  ],
  socialLinks: [
    { platform: "Facebook", url: "https://facebook.com/example-apexroofing" },
    { platform: "Instagram", url: "https://instagram.com/example-apexroofing" },
    { platform: "LinkedIn", url: "https://linkedin.com/company/example-apexroofing" },
  ],
};
