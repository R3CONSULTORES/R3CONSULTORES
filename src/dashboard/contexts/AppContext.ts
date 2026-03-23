

import { createContext } from 'react';
import type { AppContextType } from '@/dashboard/types';

export const AppContext = createContext<AppContextType | null>(null);