
export interface TokenData  {
    project: string;
    categories: string[];
    socialLinks?: {
      website?: string;
      discord?: string;
      telegram?: string;
      twitter?: string;
      coinMarketCap?: string;
      coinGecko?: string;
    };
    decimals?: number;
  }
  