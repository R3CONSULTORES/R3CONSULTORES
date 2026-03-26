import { IcaAnualState, IcaAnualAction } from './types';

export const initialState: IcaAnualState = {
  step: 0,
  company: null,
  config: {
    municipalityId: '',
    municipality: '',
    year: new Date().getFullYear() - 1,
    filingDate: new Date().toISOString().split('T')[0],
  },
  activities: [],
  depuration: {
    grossIncome: 0,
    returns: 0,
    exports: 0,
    assetSales: 0,
    excludedActivities: 0,
    exemptActivities: 0,
    otherDeductions: 0,
  },
  results: {
    avisosTablerosCheck: true,
    bomberilRate: 0,
    retentions: 0,
    selfRetentions: 0,
    advances: 0,
    sanctions: 0,
    interest: 0,
  },
};

export const icaAnualReducer = (state: IcaAnualState, action: IcaAnualAction): IcaAnualState => {
  switch (action.type) {
    case 'SET_COMPANY':
      return { 
        ...state, 
        company: action.payload, 
        step: 1,
        config: { ...state.config, municipality: action.payload.municipio }
      };
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'SET_ACTIVITIES':
      return { ...state, activities: action.payload };
    case 'UPDATE_DEPURATION':
      return { ...state, depuration: { ...state.depuration, ...action.payload } };
    case 'UPDATE_RESULTS':
      return { ...state, results: { ...state.results, ...action.payload } };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: Math.max(0, state.step - 1) };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};
