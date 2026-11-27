export type PricingMode = 'quote' | 'ready';
export type SupportedCurrency = 'INR' | 'USD';
export type BillingInterval = 'monthly' | 'yearly';

export interface PlanPriceEntry {
  currency: SupportedCurrency;
  symbol: string;
  monthlyMinor: number;
  annualMinor: number;
  monthlyFormatted: string;
  annualTotalFormatted: string;
  annualMonthlyEquivalent: string;
}

export interface PlanDefinition {
  id: 'starter' | 'growth' | 'agency';
  name: string;
  badge: string | null;
  highlighted: boolean;
  description: string;
  accounts: number;
  users: number;
  deliveriesPerMonth: number;
  prices: Record<SupportedCurrency, PlanPriceEntry>;
  features: string[];
  ctaQuote: string;
  ctaReady: string;
}

export const BRAND_CONFIG = {
  name: 'DAOZ360',
  tagline: 'Plan. Publish. Grow.',
  domain: 'https://daoz360.ai/',
  contactEmail: 'mail@daoz360.ai',
  loginUrl: '/login',
  registerUrl: '/register',
  legacyLoginUrl: 'https://daoz360.ai/social/login',
  legacyRegisterUrl: 'https://daoz360.ai/social/register',
  primaryCta: 'Talk to Us',
  address: '60 Paya Lebar Road, #04-23, Paya Lebar Square, Singapore 409051',
  entity: 'Digital PRIZM PTE LTD / DAOZ360',
  features: {
    media_library: true,
    content_previews: true,
    ai_writing_assistance: false,
    templates_and_hashtags: false,
    brand_workspaces: false,
    bulk_recurring_scheduling: false,
    agency_audience_card: false,
    integrations_section: false,
    trial_strip: false,
    cancellation_faq: false,
  },
};

export const PRICE_BOOK: {
  mode: PricingMode;
  researchDate: string;
  approvedVersion: string | null;
  effectiveDate: string | null;
  defaultBilling: BillingInterval;
  defaultCurrency: SupportedCurrency;
  supportedCurrencies: SupportedCurrency[];
  plans: Record<'starter' | 'growth' | 'agency', PlanDefinition>;
} = {
  mode: (process.env.DAOZ360_PRICING_MODE as PricingMode) || 'quote',
  researchDate: '2026-11-17',
  approvedVersion: null,
  effectiveDate: null,
  defaultBilling: 'monthly',
  defaultCurrency: 'INR',
  supportedCurrencies: ['INR', 'USD'],
  plans: {
    starter: {
      id: 'starter',
      name: 'Starter',
      badge: null,
      highlighted: false,
      description: 'For creators and independent professionals.',
      accounts: 5,
      users: 1,
      deliveriesPerMonth: 300,
      prices: {
        INR: {
          currency: 'INR',
          symbol: '₹',
          monthlyMinor: 99900,
          annualMinor: 999000,
          monthlyFormatted: '₹999',
          annualTotalFormatted: '₹9,990',
          annualMonthlyEquivalent: '₹832.50',
        },
        USD: {
          currency: 'USD',
          symbol: '$',
          monthlyMinor: 1900,
          annualMinor: 19000,
          monthlyFormatted: '$19',
          annualTotalFormatted: '$190',
          annualMonthlyEquivalent: '$15.83',
        },
      },
      features: [
        '5 connected social accounts.',
        '1 user.',
        '300 successful platform deliveries per month.',
        'Post scheduling and publishing.',
        'Supported-network analytics.',
        'Email support.',
      ],
      ctaQuote: 'Enquire About Starter',
      ctaReady: 'Choose Starter',
    },
    growth: {
      id: 'growth',
      name: 'Growth',
      badge: 'Recommended for Teams',
      highlighted: true,
      description: 'For growing businesses and small marketing teams.',
      accounts: 15,
      users: 3,
      deliveriesPerMonth: 1500,
      prices: {
        INR: {
          currency: 'INR',
          symbol: '₹',
          monthlyMinor: 249900,
          annualMinor: 2499000,
          monthlyFormatted: '₹2,499',
          annualTotalFormatted: '₹24,990',
          annualMonthlyEquivalent: '₹2,082.50',
        },
        USD: {
          currency: 'USD',
          symbol: '$',
          monthlyMinor: 4900,
          annualMinor: 49000,
          monthlyFormatted: '$49',
          annualTotalFormatted: '$490',
          annualMonthlyEquivalent: '$40.83',
        },
      },
      features: [
        '15 connected social accounts.',
        '3 users.',
        '1,500 successful platform deliveries per month.',
        'Post scheduling and publishing.',
        'Supported-network analytics.',
        'Team collaboration and content approvals.',
        'Email support.',
      ],
      ctaQuote: 'Enquire About Growth',
      ctaReady: 'Choose Growth',
    },
    agency: {
      id: 'agency',
      name: 'Agency',
      badge: null,
      highlighted: false,
      description: 'For teams managing a larger portfolio of social accounts.',
      accounts: 40,
      users: 10,
      deliveriesPerMonth: 5000,
      prices: {
        INR: {
          currency: 'INR',
          symbol: '₹',
          monthlyMinor: 599900,
          annualMinor: 5999000,
          monthlyFormatted: '₹5,999',
          annualTotalFormatted: '₹59,990',
          annualMonthlyEquivalent: '₹4,999.17',
        },
        USD: {
          currency: 'USD',
          symbol: '$',
          monthlyMinor: 9900,
          annualMinor: 99000,
          monthlyFormatted: '$99',
          annualTotalFormatted: '$990',
          annualMonthlyEquivalent: '$82.50',
        },
      },
      features: [
        '40 connected social accounts.',
        '10 users.',
        '5,000 successful platform deliveries per month.',
        'Post scheduling and publishing.',
        'Supported-network analytics.',
        'Team collaboration and content approvals.',
        'Email support.',
      ],
      ctaQuote: 'Enquire About Agency',
      ctaReady: 'Choose Agency',
    },
  },
};

export function getPricingChatReply(currency: SupportedCurrency = 'INR', mode: PricingMode = PRICE_BOOK.mode): string {
  const cur: SupportedCurrency = PRICE_BOOK.supportedCurrencies.includes(currency) ? currency : 'INR';
  const starterPrice = PRICE_BOOK.plans.starter.prices[cur].monthlyFormatted;
  const growthPrice = PRICE_BOOK.plans.growth.prices[cur].monthlyFormatted;
  const agencyPrice = PRICE_BOOK.plans.agency.prices[cur].monthlyFormatted;

  if (mode === 'ready') {
    return `Starter is ${starterPrice}/month, Growth is ${growthPrice}/month, and Agency is ${agencyPrice}/month before applicable taxes. Yearly options are available. How many social accounts and people do you need?`;
  }
  return `Our proposed packages start at ${starterPrice}/month. Starter includes five accounts and one user; Growth supports small teams, and Agency supports larger account portfolios. Would you like help choosing a package?`;
}
