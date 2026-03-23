
export interface RetentionRule {
    id: string;
    concept: string;
    base: number;
    rate: number;
    isDeclarante: boolean | null; // null means it applies to both
    personType: 'pj' | 'pn' | null; // null means it applies to both
    accountPrefixes: string[];
}

// Based on the provided images and standard Colombian PUC
// Note: accountPrefixes are educated guesses for common accounts.
export const RETENTION_RULES: RetentionRule[] = [
    // Compras
    { id: 'compras-generales-decl', concept: 'Compras generales (declarantes)', base: 498000, rate: 0.025, isDeclarante: true, personType: null, accountPrefixes: ['14', '62'] },
    { id: 'compras-generales-no-decl', concept: 'Compras generales (no declarantes)', base: 498000, rate: 0.035, isDeclarante: false, personType: null, accountPrefixes: ['14', '62'] },
    { id: 'compras-tdc', concept: 'Compras con tarjeta débito o crédito', base: 0, rate: 0.015, isDeclarante: null, personType: null, accountPrefixes: ['531510'] }, // Assume specific expense account
    { id: 'compras-agro-sin-proc', concept: 'Compras de bienes o productos agrícolas o pecuarios sin procesamiento industrial', base: 3486000, rate: 0.015, isDeclarante: null, personType: null, accountPrefixes: ['620505'] },
    { id: 'compras-agro-con-proc-decl', concept: 'Compras de bienes o productos agrícolas o pecuarios con procesamiento industrial (declarantes)', base: 498000, rate: 0.025, isDeclarante: true, personType: null, accountPrefixes: ['620505'] },
    { id: 'compras-agro-con-proc-no-decl', concept: 'Compras de bienes o productos agrícolas o pecuarios con procesamiento industrial (no declarantes)', base: 498000, rate: 0.035, isDeclarante: false, personType: null, accountPrefixes: ['620505'] },
    { id: 'compras-cafe', concept: 'Compras de café pergamino o cereza', base: 3486000, rate: 0.005, isDeclarante: null, personType: null, accountPrefixes: ['620510'] },
    { id: 'compras-combustibles', concept: 'Compras de combustibles derivados del petróleo', base: 0, rate: 0.001, isDeclarante: null, personType: null, accountPrefixes: ['515515', '525515'] },
    { id: 'compras-vehiculos', concept: 'Compras de vehículos', base: 0, rate: 0.01, isDeclarante: null, personType: null, accountPrefixes: ['1540'] },
    { id: 'compras-oro-ci', concept: 'Compra de oro por las sociedades de comercialización internacional', base: 0, rate: 0.025, isDeclarante: null, personType: null, accountPrefixes: ['620590'] },
    { id: 'compras-bienes-raices-vivienda-1', concept: 'Compras de bienes raíces (vivienda) (primeras 10.000 UVT)', base: 0, rate: 0.01, isDeclarante: null, personType: null, accountPrefixes: ['151610'] },
    { id: 'compras-bienes-raices-vivienda-2', concept: 'Compras de bienes raíces (vivienda) (exceso 10.000 UVT)', base: 497990000, rate: 0.025, isDeclarante: null, personType: null, accountPrefixes: ['151610'] },
    { id: 'compras-bienes-raices-otros', concept: 'Compras de bienes raíces (distinto a vivienda)', base: 0, rate: 0.025, isDeclarante: null, personType: null, accountPrefixes: ['151605'] },
    
    // Servicios
    { id: 'servicios-generales-decl', concept: 'Servicios generales (declarantes)', base: 100000, rate: 0.04, isDeclarante: true, personType: null, accountPrefixes: ['5135', '5235'] },
    { id: 'servicios-generales-no-decl', concept: 'Servicios generales (no declarantes)', base: 100000, rate: 0.06, isDeclarante: false, personType: null, accountPrefixes: ['5135', '5235'] },
    { id: 'servicios-emolumentos-decl', concept: 'Por emolumentos eclesiásticos (declarantes)', base: 498000, rate: 0.04, isDeclarante: true, personType: null, accountPrefixes: ['519540'] },
    { id: 'servicios-emolumentos-no-decl', concept: 'Por emolumentos eclesiásticos (no declarantes)', base: 498000, rate: 0.035, isDeclarante: false, personType: null, accountPrefixes: ['519540'] },
    { id: 'servicios-transporte-carga', concept: 'Servicios de transporte de carga', base: 100000, rate: 0.01, isDeclarante: null, personType: null, accountPrefixes: ['513550', '523550'] },
    { id: 'servicios-transporte-pasajeros-terr', concept: 'Servicios de transporte nacional de pasajeros por vía terrestre', base: 498000, rate: 0.035, isDeclarante: null, personType: null, accountPrefixes: ['513555', '523555'] },
    { id: 'servicios-transporte-pasajeros-aereo', concept: 'Servicios de transporte nacional de pasajeros por vía aérea o marítima', base: 100000, rate: 0.01, isDeclarante: null, personType: null, accountPrefixes: ['513555', '523555'] },
    { id: 'servicios-temporales-aiu', concept: 'Servicios prestados por empresas de servicios temporales (sobre AIU)', base: 100000, rate: 0.01, isDeclarante: null, personType: null, accountPrefixes: ['5130', '5230'] },
    { id: 'servicios-vigilancia-aiu', concept: 'Servicios prestados por empresas de vigilancia y aseo (sobre AIU)', base: 100000, rate: 0.02, isDeclarante: null, personType: null, accountPrefixes: ['513540', '523540'] },
    { id: 'servicios-salud-ips', concept: 'Servicios integrales de salud prestados por IPS', base: 100000, rate: 0.02, isDeclarante: null, personType: null, accountPrefixes: ['513595', '523595'] },
    { id: 'servicios-hoteles-restaurantes', concept: 'Servicios de hoteles y restaurantes', base: 100000, rate: 0.035, isDeclarante: null, personType: null, accountPrefixes: ['5155', '5255'] },
    
    // Arrendamientos
    { id: 'arrendamiento-muebles', concept: 'Arrendamiento de bienes muebles', base: 0, rate: 0.04, isDeclarante: null, personType: null, accountPrefixes: ['5120', '5220'] }, // Excludes 512010
    { id: 'arrendamiento-inmuebles-decl', concept: 'Arrendamiento de bienes inmuebles (declarantes)', base: 498000, rate: 0.035, isDeclarante: true, personType: null, accountPrefixes: ['512010', '522010'] },
    { id: 'arrendamiento-inmuebles-no-decl', concept: 'Arrendamiento de bienes inmuebles (no declarantes)', base: 498000, rate: 0.035, isDeclarante: false, personType: null, accountPrefixes: ['512010', '522010'] },
    
    // Otros Ingresos Tributarios (Honorarios, Comisiones, etc.)
    { id: 'honorarios-comisiones-pj', concept: 'Honorarios y comisiones (personas jurídicas)', base: 0, rate: 0.11, isDeclarante: null, personType: 'pj', accountPrefixes: ['5110', '5210'] },
    { id: 'honorarios-comisiones-pn-decl', concept: 'Honorarios y comisiones (personas naturales declarantes)', base: 0, rate: 0.10, isDeclarante: true, personType: 'pn', accountPrefixes: ['5110', '5210'] },
    { id: 'honorarios-comisiones-pn-no-decl', concept: 'Honorarios y comisiones (personas naturales no declarantes)', base: 0, rate: 0.10, isDeclarante: false, personType: 'pn', accountPrefixes: ['5110', '5210'] },
    { id: 'servicios-licenciamiento', concept: 'Servicios de licenciamiento o derecho de uso de software', base: 0, rate: 0.035, isDeclarante: null, personType: null, accountPrefixes: ['511520'] },
    { id: 'rendimientos-financieros', concept: 'Intereses o rendimientos financieros', base: 0, rate: 0.07, isDeclarante: null, personType: null, accountPrefixes: ['5305'] },
    { id: 'contratos-construccion', concept: 'Contratos de construcción y urbanización', base: 498000, rate: 0.02, isDeclarante: null, personType: null, accountPrefixes: ['6135'] },
    
    // Generics (catch-alls if more specific not found)
    { id: 'otros-ingresos-decl', concept: 'Otros ingresos tributarios (declarantes)', base: 498000, rate: 0.025, isDeclarante: true, personType: null, accountPrefixes: ['5'] },
    { id: 'otros-ingresos-no-decl', concept: 'Otros ingresos tributarios (no declarantes)', base: 498000, rate: 0.035, isDeclarante: false, personType: null, accountPrefixes: ['5'] },
];

export const RETENTION_ACCOUNT_CONCEPTS: Record<string, string> = {
    '236505': 'Compras', 
    '236510': 'Arrendamientos', 
    '236515': 'Honorarios', 
    '236520': 'Comisiones', 
    '236525': 'Servicios', 
    '236530': 'Rendimientos Financieros',
    '236535': 'Contratos de construcción',
    '236540': 'Compras', // General purchases
    '236545': 'Transporte',
    '236550': 'Servicios temporales',
    '236555': 'Servicios de vigilancia y aseo',
    '236560': 'Servicios de hoteles y restaurantes',
    '236565': 'Compras de bienes raíces',
    '236570': 'Compras de vehículos',
    '236575': 'Otros ingresos tributarios',
};

/**
 * Finds the most specific retention rule for a given account code.
 * It prioritizes longer, more specific prefixes over shorter, more generic ones.
 * @param costAccount - The account code for the cost or expense.
 * @param isDeclarante - The assumed status of the provider.
 * @param personType - The type of person (juridica 'pj' or natural 'pn').
 * @returns The best matching RetentionRule or undefined.
 */
export function findRuleForTransaction(
    costAccount: string,
    isDeclarante: boolean,
    personType: 'pj' | 'pn'
): RetentionRule | undefined {
    let bestMatch: RetentionRule | undefined = undefined;

    for (const rule of RETENTION_RULES) {
        // Filter by declarante status
        if (rule.isDeclarante !== null && rule.isDeclarante !== isDeclarante) {
            continue;
        }

        // Filter by person type
        if (rule.personType !== null && rule.personType !== personType) {
            continue;
        }

        for (const prefix of rule.accountPrefixes) {
            if (costAccount.startsWith(prefix)) {
                // If we found a match, check if it's more specific than the previous best match
                if (!bestMatch || prefix.length > bestMatch.accountPrefixes.find(p => costAccount.startsWith(p))!.length) {
                    bestMatch = rule;
                }
            }
        }
    }

    return bestMatch;
}