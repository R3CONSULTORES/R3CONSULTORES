export interface CiiuActivity {
  id: string;
  code: string;
  description: string;
  rate: number;
  isMain: boolean;
  taxableBase?: number;
}

export interface DepurationData {
  grossIncome: number;
  returns: number;
  exports: number;
  assetSales: number;
  excludedActivities: number;
  exemptActivities: number;
  otherDeductions: number;
}

export interface LiquidationConfig {
  municipalityId: string;
  municipality: string;
  year: number;
  filingDate: string;
}

export interface TaxResults {
  avisosTablerosCheck: boolean;
  bomberilRate: number;
  retentions: number;
  selfRetentions: number;
  advances: number;
  sanctions: number;
  interest: number;
  balanceFavor?: number;
}

export interface IcaAnualState {
  step: number;
  company: any | null;
  config: LiquidationConfig;
  activities: CiiuActivity[];
  depuration: DepurationData;
  results: TaxResults;
}

export type IcaAnualAction =
  | { type: 'SET_COMPANY'; payload: any }
  | { type: 'SET_CONFIG'; payload: Partial<LiquidationConfig> }
  | { type: 'SET_ACTIVITIES'; payload: CiiuActivity[] }
  | { type: 'UPDATE_DEPURATION'; payload: Partial<DepurationData> }
  | { type: 'UPDATE_RESULTS'; payload: Partial<TaxResults> }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };
