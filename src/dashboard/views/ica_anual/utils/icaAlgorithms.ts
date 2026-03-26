import { CiiuActivity, DepurationData, TaxResults } from '../types';

/**
 * Redondeo Municipal Estricto.
 * Redondea al múltiplo de 1000 más cercano.
 * Ej: 125.400 -> 125.000 | 125.600 -> 126.000 | 125.500 -> 126.000
 */
export const roundToNearestThousand = (val: number): number => {
  return Math.round(val / 1000) * 1000;
};

/**
 * Calcula los renglones oficiales del ICA basado en la depuración.
 */
export interface IcaFormulario {
  renglon8_totalBruto: number;
  renglon9_fueraMunicipio: number;
  renglon10_ingresosLocales: number;
  renglon11_devoluciones: number;
  renglon12_exportaciones: number;
  renglon13_activosFijos: number;
  renglon14_excluidos: number;
  renglon15_exentos: number;
  renglon16_baseGravable: number;
  renglon20_impuestoIca: number;
  renglon25_avisosTableros: number;
  renglon26_sobretasaBomberil: number;
  renglon33_totalImpuesto: number;
  renglon34_retenciones: number;
  renglon35_autoretenciones: number;
  renglon36_anticipoAnterior: number;
  renglon37_sanciones: number;
  renglon38_interesesMora: number;
  renglon39_totalPagar: number;
  seccionC: SeccionCRow[];
}

export interface SeccionCRow {
  ciiuCode: string;
  description: string;
  ingresosGravados: number;
  tarifa: number;
  impuesto: number;
}

export const calculateIcaFormulario = (
  activities: CiiuActivity[],
  depuration: DepurationData,
  results: TaxResults,
  avisosTablerosRate: number,
  bomberilRate: number
): IcaFormulario => {

  // --- RENGLONES DE DEPURACIÓN ---
  const r8 = depuration.grossIncome;
  const r9 = depuration.otherDeductions; // Foreign income stored here
  const r10 = r8 - r9;
  const r11 = depuration.returns;
  const r12 = depuration.exports;
  const r13 = depuration.assetSales;
  const r14 = depuration.excludedActivities;
  const r15 = depuration.exemptActivities;
  
  // Renglón 16: Base Gravable = Ingresos Locales - Devoluciones - Exportaciones - Activos - Excluidos - Exentos
  const r16 = Math.max(0, r10 - r11 - r12 - r13 - r14 - r15);

  // --- SECCIÓN C: DISCRIMINACIÓN POR ACTIVIDADES ---
  const seccionC: SeccionCRow[] = activities.map(act => {
    const base = Math.max(0, act.taxableBase || 0);
    const impuesto = base * (act.rate / 1000);
    return {
      ciiuCode: act.code,
      description: act.description,
      ingresosGravados: base,
      tarifa: act.rate,
      impuesto: roundToNearestThousand(impuesto)
    };
  });

  // --- RENGLÓN 20: IMPUESTO ICA TOTAL ---
  const r20 = roundToNearestThousand(seccionC.reduce((sum, r) => sum + r.impuesto, 0));

  // --- COMPLEMENTARIOS ---
  const r25 = results.avisosTablerosCheck
    ? roundToNearestThousand(r20 * (avisosTablerosRate / 100))
    : 0;

  const r26 = roundToNearestThousand(r20 * (bomberilRate / 100));
  
  const r33 = roundToNearestThousand(r20 + r25 + r26);

  // --- DESCUENTOS Y SALDO ---
  const r34 = results.retentions;
  const r35 = results.selfRetentions;
  const r36 = results.advances;
  const r37 = results.sanctions;
  const r38 = results.interest;

  const r39 = roundToNearestThousand(r33 - r34 - r35 - r36 + r37 + r38);

  return {
    renglon8_totalBruto: r8,
    renglon9_fueraMunicipio: r9,
    renglon10_ingresosLocales: r10,
    renglon11_devoluciones: r11,
    renglon12_exportaciones: r12,
    renglon13_activosFijos: r13,
    renglon14_excluidos: r14,
    renglon15_exentos: r15,
    renglon16_baseGravable: r16,
    renglon20_impuestoIca: r20,
    renglon25_avisosTableros: r25,
    renglon26_sobretasaBomberil: r26,
    renglon33_totalImpuesto: r33,
    renglon34_retenciones: r34,
    renglon35_autoretenciones: r35,
    renglon36_anticipoAnterior: r36,
    renglon37_sanciones: r37,
    renglon38_interesesMora: r38,
    renglon39_totalPagar: r39,
    seccionC,
  };
};
