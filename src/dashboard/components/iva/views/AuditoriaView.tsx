
import React, { useMemo, useState, useContext } from 'react';
import { AppContext } from '../../../contexts/AppContext';
import type { AuxiliarData, DianData, AppState } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { normalizeTextForSearch } from '../../../views/iva/ivaUtils';

// --- ICONS (Native SVG) ---
const ClipboardDocumentCheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
);

const ExclamationCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const BanknotesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
);

const ArrowsRightLeftIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
);

// --- UTILS ---

const getNormalizedId = (doc: string | null | undefined): string => {
    if (!doc) return 'SIN-ID';
    // 1. Convertir a mayúsculas y quitar espacios
    let clean = doc.toString().toUpperCase().replace(/\s+/g, '');
    // 2. Eliminar prefijos comunes de software contable
    //    Elimina FV, FE, FAC, NC, ND, SETT, DMC al inicio
    clean = clean.replace(/^(FV|FE|FAC|NC|ND|SETT|DMC)+/g, '');
    // 3. Eliminar caracteres no alfanuméricos restantes
    return clean.replace(/[^A-Z0-9]/g, '');
};

interface AuditoriaViewProps {
    files: AppState['files'];
}

// --- INTERFACES ---

interface NatureIssue {
    id: string;
    cuenta: string;
    tercero: string;
    docNum: string;
    tipo: 'DEBITO_INGRESO' | 'CREDITO_GASTO' | 'IVA_NATURALEZA';
    valor: number;
    descripcion: string;
}

interface DocumentFinding {
    docNum: string;
    ingreso: number;
    ivaGenerado: number;
    tasaImplicita: number;
    diagnostico: string;
    tipo: 'ERROR' | 'WARNING';
}

interface CrossCheckFinding {
    id: string;
    docNum: string;
    docOriginal: string;
    
    // Contabilidad (Aggregated)
    accTaxed: number;
    accNonTaxed: number;
    accTotal: number;
    
    // DIAN (Aggregated)
    dianTaxed: number;
    dianNonTaxed: number;
    dianTotal: number;
    
    // Diagnosis
    diffTotal: number;
    diffTaxed: number;
    diagnosis: string;
    severity: 'critical' | 'warning' | 'info';
}

const AccordionCard: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    count: number; 
    children: React.ReactNode;
    defaultOpen?: boolean;
    colorClass?: 'red' | 'amber' | 'blue' | 'purple';
}> = ({ title, icon, count, children, defaultOpen = false, colorClass = 'blue' }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const colors = {
        red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-800' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800' },
        blue: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', badge: 'bg-slate-200 text-slate-800' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-800' },
    };
    const c = colors[colorClass];

    return (
        <div className={`border rounded-xl overflow-hidden mb-4 shadow-sm ${c.border}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 ${c.bg} transition-colors hover:opacity-90`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white shadow-sm ${c.text}`}>
                        {icon}
                    </div>
                    <div className="text-left">
                        <h4 className={`font-bold text-sm ${c.text}`}>{title}</h4>
                        {count > 0 && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                                {count} Hallazgos
                            </span>
                        )}
                    </div>
                </div>
                <ChevronDownIcon className={`w-5 h-5 ${c.text} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="bg-white border-t border-slate-100 p-0">
                    {count > 0 ? children : <div className="p-6 text-center text-slate-400 italic text-sm">No se encontraron inconsistencias en esta sección.</div>}
                </div>
            )}
        </div>
    );
};

export const AuditoriaView: React.FC<AuditoriaViewProps> = ({ files }) => {
    const { iva_auxiliar, iva_dian, iva_ventas } = files;
    const context = useContext(AppContext);
    const incomeClassifications = context?.appState.incomeAccountVatClassification;

    // --- 1. AUDITORÍA DE HIGIENE FISCAL ---
    const hygieneIssues = useMemo(() => {
        if (!iva_auxiliar) return [];
        const issues: NatureIssue[] = [];

        iva_auxiliar.forEach((mov, idx) => {
            const code = mov.Cuenta.split(' ')[0];
            const normalizedDesc = normalizeTextForSearch(mov.Nota + mov.Cuenta);
            
            if (code.startsWith('4') && !code.startsWith('4175') && mov.Debitos > 0) {
                if (!normalizedDesc.includes('cierre') && !normalizedDesc.includes('anulacion') && !normalizedDesc.includes('correccion')) {
                    issues.push({
                        id: `nature-${idx}`,
                        cuenta: mov.Cuenta,
                        tercero: mov.Tercero,
                        docNum: mov.DocNum,
                        tipo: 'DEBITO_INGRESO',
                        valor: mov.Debitos,
                        descripcion: 'Débito en cuenta de Ingreso (Posible menor valor injustificado)'
                    });
                }
            }

            if (code.startsWith('240801') && mov.Debitos > 0) {
                 if (!normalizedDesc.includes('devolucion') && !normalizedDesc.includes('anulacion') && !normalizedDesc.includes('nc')) {
                     issues.push({
                        id: `nature-${idx}`,
                        cuenta: mov.Cuenta,
                        tercero: mov.Tercero,
                        docNum: mov.DocNum,
                        tipo: 'IVA_NATURALEZA',
                        valor: mov.Debitos,
                        descripcion: 'Débito en IVA Generado sin evidencia de devolución en ventas.'
                    });
                 }
            }
        });
        return issues;
    }, [iva_auxiliar]);

    // --- 2. CRUCE DIMENSIONAL (CONTABILIDAD vs DIAN) ---
    const crossCheckFindings = useMemo(() => {
        if (!iva_auxiliar || !iva_dian) return [];
        const findings: CrossCheckFinding[] = [];
        const TOLERANCE = 100;

        // 0. Pre-compute Valid Sales Documents (Whitelist)
        // Esto evita falsos positivos con Recibos de Caja (RC), Comprobantes (CC), etc.
        const validSalesDocs = new Set<string>();
        if (iva_ventas) {
            iva_ventas.forEach(v => validSalesDocs.add(getNormalizedId(v.Documento)));
        }

        // A. Build DIAN Map (Normalized ID -> Values)
        const dianMap = new Map<string, { taxed: number, nonTaxed: number, total: number, originalId: string }>();
        iva_dian.forEach(row => {
            const type = normalizeTextForSearch(row.TipoDeDocumento);
            const group = normalizeTextForSearch(row.Grupo);
            
            if (group.includes('emitido') && (type.includes('factura') || type.includes('nota'))) {
                const normId = getNormalizedId(row.DocumentoDIAN);
                
                let taxed = 0;
                let nonTaxed = 0;
                
                if (Math.abs(row.IVA) > 0) {
                    taxed = row.Base;
                } else {
                    nonTaxed = row.Base;
                }

                if (!dianMap.has(normId)) dianMap.set(normId, { taxed: 0, nonTaxed: 0, total: 0, originalId: row.DocumentoDIAN });
                const entry = dianMap.get(normId)!;
                entry.taxed += taxed;
                entry.nonTaxed += nonTaxed;
                entry.total += row.Total;
            }
        });

        // B. Build Accounting Map (Normalized ID -> Values)
        const accMap = new Map<string, { taxed: number, nonTaxed: number, total: number, originalDoc: string }>();
        iva_auxiliar.forEach(mov => {
            const code = mov.Cuenta.split(' ')[0];
            if (code.startsWith('4')) {
                const normId = getNormalizedId(mov.DocNum);
                if (normId === 'SIN-ID') return;

                // --- LOGIC FIX: FILTER INTERNAL DOCUMENTS ---
                // Solo auditamos si está en el reporte de ventas oficial o parece un documento electrónico.
                const isElectronicDoc = /^(FE|NC|ND|FV|FAC|SETT)/i.test(mov.DocNum); 
                const isInSalesReport = validSalesDocs.has(normId);

                // Si es un documento interno (RC, CC, etc.) y no está en ventas, lo saltamos.
                if (!isInSalesReport && !isElectronicDoc) {
                    return; 
                }
                // ---------------------------------------------

                const category = incomeClassifications?.get(code) || 'no_clasificado';
                const val = mov.Creditos - mov.Debitos;

                if (!accMap.has(normId)) accMap.set(normId, { taxed: 0, nonTaxed: 0, total: 0, originalDoc: mov.DocNum });
                const entry = accMap.get(normId)!;

                entry.total += val;
                
                if (category === 'gravado') {
                    entry.taxed += val;
                } else {
                    entry.nonTaxed += val;
                }
            }
        });

        // C. Matching Process with Fuzzy Fallback
        accMap.forEach((accData, accKey) => {
            let dianData = dianMap.get(accKey);
            let matchKey = accKey;

            // Fuzzy Match Fallback if strict match fails
            if (!dianData) {
                // Iterar keys para buscar contenido parcial
                // Restricción: Claves de más de 3 caracteres para evitar falsos positivos con '1', '10', etc.
                for (const [dKey, dVal] of dianMap.entries()) {
                     if (accKey.length > 3 && dKey.length > 3) {
                        if (accKey.includes(dKey) || dKey.includes(accKey)) {
                            dianData = dVal;
                            matchKey = dKey;
                            break;
                        }
                     }
                }
            }

            if (dianData) {
                dianMap.delete(matchKey); // Mark as matched
            } else {
                dianData = { taxed: 0, nonTaxed: 0, total: 0, originalId: '---' };
            }

            const diffTotal = accData.total - (dianData.taxed + dianData.nonTaxed);
            const diffTaxed = accData.taxed - dianData.taxed;
            const diffNonTaxed = accData.nonTaxed - dianData.nonTaxed;

            const isTotalOff = Math.abs(diffTotal) > TOLERANCE;
            const isDistributionOff = Math.abs(diffTaxed) > TOLERANCE || Math.abs(diffNonTaxed) > TOLERANCE;

            if (isTotalOff || isDistributionOff) {
                let diagnosis = "";
                let severity: CrossCheckFinding['severity'] = 'warning';

                if (isTotalOff) {
                    diagnosis = `Diferencia de Valor. Contabilidad: ${formatCurrency(accData.total)} vs DIAN: ${formatCurrency(dianData.taxed + dianData.nonTaxed)}.`;
                    severity = 'critical';
                } else if (isDistributionOff) {
                    diagnosis = `Error de Clasificación. El total cuadra, pero la distribución (Gravado vs No Gravado) difiere.`;
                    severity = 'warning';
                }

                if (dianData.total === 0 && accData.total > 0) {
                    diagnosis = "Documento no encontrado en reporte DIAN (Posible error de fecha o no enviado).";
                    severity = 'critical';
                }

                findings.push({
                    id: accKey,
                    docNum: accKey,
                    docOriginal: accData.originalDoc,
                    accTaxed: accData.taxed,
                    accNonTaxed: accData.nonTaxed,
                    accTotal: accData.total,
                    dianTaxed: dianData.taxed,
                    dianNonTaxed: dianData.nonTaxed,
                    dianTotal: dianData.taxed + dianData.nonTaxed,
                    diffTotal,
                    diffTaxed,
                    diagnosis,
                    severity
                });
            }
        });

        // Remaining DIAN Docs (Missing in Accounting)
        dianMap.forEach((dianData, dianKey) => {
            const accData = { taxed: 0, nonTaxed: 0, total: 0 };
            const diffTotal = 0 - dianData.total;
            
            if (Math.abs(diffTotal) > TOLERANCE) {
                 findings.push({
                    id: dianKey,
                    docNum: dianKey,
                    docOriginal: '---', // Not in WO
                    accTaxed: 0,
                    accNonTaxed: 0,
                    accTotal: 0,
                    dianTaxed: dianData.taxed,
                    dianNonTaxed: dianData.nonTaxed,
                    dianTotal: dianData.total,
                    diffTotal,
                    diffTaxed: 0 - dianData.taxed,
                    diagnosis: "Documento en DIAN no hallado en Contabilidad (Posible omisión de ingreso).",
                    severity: 'critical'
                });
            }
        });

        return findings.sort((a, b) => Math.abs(b.diffTotal) - Math.abs(a.diffTotal));

    }, [iva_auxiliar, iva_dian, iva_ventas, incomeClassifications]);


    // --- 3. AUDITORÍA DE TASAS IMPLÍCITAS ---
    const coherenceFindings = useMemo(() => {
        if (!iva_auxiliar) return [];
        const findings: DocumentFinding[] = [];
        const docMap = new Map<string, { 
            ingresoGravado: number;
            ingresoNoGravado: number;
            ingresoTotal: number;
            iva: number; 
        }>();
        
        iva_auxiliar.forEach(mov => {
            const docNum = mov.DocNum.trim();
            if (!docNum || docNum === 'SIN NÚMERO' || docNum === '0') return;
            
            if (!docMap.has(docNum)) {
                docMap.set(docNum, { ingresoGravado: 0, ingresoNoGravado: 0, ingresoTotal: 0, iva: 0 });
            }
            const current = docMap.get(docNum)!;
            const code = mov.Cuenta.split(' ')[0];
            const netValue = mov.Creditos - mov.Debitos; // Ingresos son Créditos habitualmente

            if (code.startsWith('4')) {
                current.ingresoTotal += netValue;
                const classification = incomeClassifications?.get(code) || 'no_clasificado';
                
                // Segregación estricta para el cálculo de tasa
                if (classification === 'gravado') {
                    current.ingresoGravado += netValue;
                } else {
                    // Exento, excluido, no_gravado, o no_clasificado (asumimos no gravado para no ensuciar la base)
                    current.ingresoNoGravado += netValue;
                }
            }
            
            const normalizedDesc = normalizeTextForSearch(mov.Nota);
            if (code.startsWith('240801') || (code.startsWith('2408') && normalizedDesc.includes('generado'))) {
                current.iva += netValue;
            }
        });

        docMap.forEach((data, docNum) => {
            // Ignorar movimientos muy pequeños o ajustes menores
            if (data.ingresoTotal < 1000 && data.iva < 100) return;

            const { ingresoGravado, ingresoTotal, iva } = data;
            
            let tasaCalculada = 0;
            let baseCalculo = 0;
            let diagnostico = "";
            let tipo: 'ERROR' | 'WARNING' | null = null;

            // --- Lógica Corregida de Cálculo de Tasa ---
            if (ingresoGravado > 0) {
                // Escenario Ideal: Hay base gravada explícita. Usamos esta para dividir.
                baseCalculo = ingresoGravado;
                tasaCalculada = iva / ingresoGravado;
            } else if (iva > 0) {
                // Escenario de Error Potencial: Hay IVA pero no hay cuentas marcadas como gravadas.
                // Usamos el total para intentar adivinar o marcar el error.
                baseCalculo = ingresoTotal;
                tasaCalculada = (ingresoTotal !== 0) ? (iva / ingresoTotal) : 0;
            } else {
                // Sin IVA y sin base gravada identificada -> Asumimos OK (Exento/Excluido)
                // O sin ingresos significativos.
                return; 
            }

            const tasaPct = tasaCalculada * 100;
            
            // Umbrales de Tolerancia
            const is19 = Math.abs(tasaPct - 19) < 1.5; // 17.5% - 20.5% (Margen amplio por decimales)
            const is5 = Math.abs(tasaPct - 5) < 0.8;   // 4.2% - 5.8%
            const isZero = Math.abs(tasaPct) < 0.5;

            // --- Generación de Diagnósticos ---
            if (iva > 0 && ingresoGravado === 0 && ingresoTotal > 0) {
                // Caso: Hay IVA pero cuentas no están marcadas como gravadas.
                tipo = 'ERROR';
                diagnostico = `Error Crítico: Factura tiene IVA (${formatCurrency(iva)}) pero sus cuentas de ingreso (${formatCurrency(ingresoTotal)}) están clasificadas como NO GRAVADAS o NO CLASIFICADAS. Revise Configuración.`;
            } else if (!is19 && !is5 && !isZero) {
                // Caso: Tasa irregular sobre la base identificada
                tipo = 'WARNING';
                const baseLabel = ingresoGravado > 0 ? "la base gravada" : "el ingreso total";
                diagnostico = `Inconsistencia Real: El IVA no corresponde al 19% ni 5% de ${baseLabel} (${formatCurrency(baseCalculo)}). Tasa calc: ${tasaPct.toFixed(1)}%.`;
            }

            if (tipo) {
                findings.push({
                    docNum,
                    ingreso: baseCalculo,
                    ivaGenerado: iva,
                    tasaImplicita: tasaPct,
                    diagnostico,
                    tipo
                });
            }
        });
        return findings;
    }, [iva_auxiliar, incomeClassifications]);

    // --- RENDER ---

    if (!iva_auxiliar) {
        return (
            <div className="bg-white p-12 rounded-xl shadow-md text-center border-2 border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">Cargue el archivo 'Auxiliar General' para iniciar la auditoría forense.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-enter">
            {/* ENCABEZADO */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#1e293b] rounded-xl text-[#f6b034] shadow-lg">
                        <ClipboardDocumentCheckIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Auditoría Fiscal de IVA</h2>
                        <p className="text-slate-500 text-sm">Revisión de consistencia tributaria, cruces con DIAN y tarifas.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-red-50 rounded-lg border border-red-100 flex flex-col items-center">
                        <span className="text-2xl font-bold text-red-600 leading-none">{crossCheckFindings.filter(f => f.severity === 'critical').length}</span>
                        <span className="text-[10px] font-bold text-red-400 uppercase">Dif. Críticas</span>
                    </div>
                    <div className="px-4 py-2 bg-purple-50 rounded-lg border border-purple-100 flex flex-col items-center">
                        <span className="text-2xl font-bold text-purple-600 leading-none">{crossCheckFindings.filter(f => f.severity === 'warning').length}</span>
                        <span className="text-[10px] font-bold text-purple-400 uppercase">Err. Clasif.</span>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 1: CRUCE DIMENSIONAL (LO NUEVO) */}
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    1. Cruce Dimensional (Contabilidad vs DIAN)
                    <span className="text-xs font-normal text-white bg-slate-800 px-2 py-0.5 rounded-full">Prioridad Alta</span>
                </h3>
                
                <AccordionCard 
                    title="Discrepancias en Ingresos (Gravado vs No Gravado)" 
                    icon={<ArrowsRightLeftIcon className="w-5 h-5" />}
                    count={crossCheckFindings.length}
                    defaultOpen={crossCheckFindings.length > 0}
                    colorClass="purple"
                >
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="min-w-full text-xs text-left">
                            <thead className="bg-purple-50 text-purple-900 sticky top-0 z-10 font-bold shadow-sm">
                                <tr>
                                    <th className="p-3 border-b border-purple-200">Documento</th>
                                    <th className="p-3 text-right border-b border-purple-200 text-slate-600">Total WO</th>
                                    <th className="p-3 text-right border-b border-purple-200 text-slate-600 border-r border-purple-200">Total DIAN</th>
                                    
                                    <th className="p-3 text-right border-b border-purple-200 text-blue-700 bg-blue-50">Gravado WO</th>
                                    <th className="p-3 text-right border-b border-purple-200 text-blue-700 bg-blue-50 border-r border-blue-100">Gravado DIAN</th>
                                    
                                    <th className="p-3 text-right border-b border-purple-200 text-green-700 bg-green-50">No Grav WO</th>
                                    <th className="p-3 text-right border-b border-purple-200 text-green-700 bg-green-50">No Grav DIAN</th>
                                    
                                    <th className="p-3 border-b border-purple-200 w-1/4">Diagnóstico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100">
                                {crossCheckFindings.map((row) => (
                                    <tr key={row.id} className="hover:bg-purple-50/50 transition-colors">
                                        <td className="p-3 font-mono font-bold text-slate-700">
                                            {row.docOriginal}
                                            {row.docNum !== row.docOriginal && <div className="text-[9px] text-gray-400">ID: {row.docNum}</div>}
                                        </td>
                                        
                                        <td className="p-3 text-right font-mono text-slate-700">{formatCurrency(row.accTotal)}</td>
                                        <td className="p-3 text-right font-mono border-r border-slate-100 text-slate-700">{formatCurrency(row.dianTotal)}</td>
                                        
                                        <td className={`p-3 text-right font-mono bg-blue-50/30 ${Math.abs(row.accTaxed - row.dianTaxed) > 100 ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{formatCurrency(row.accTaxed)}</td>
                                        <td className="p-3 text-right font-mono bg-blue-50/30 border-r border-slate-100 text-slate-700">{formatCurrency(row.dianTaxed)}</td>
                                        
                                        <td className={`p-3 text-right font-mono bg-green-50/30 ${Math.abs(row.accNonTaxed - row.dianNonTaxed) > 100 ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{formatCurrency(row.accNonTaxed)}</td>
                                        <td className="p-3 text-right font-mono bg-green-50/30 text-slate-700">{formatCurrency(row.dianNonTaxed)}</td>
                                        
                                        <td className="p-3">
                                            <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${row.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {row.diagnosis}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AccordionCard>
            </div>

            {/* SECCIÓN 3: HIGIENE CONTABLE */}
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    2. Higiene de Cuentas Fiscales
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Calidad del Dato</span>
                </h3>
                
                <AccordionCard 
                    title="Naturaleza Incorrecta (Ingresos, IVA)" 
                    icon={<ExclamationCircleIcon className="w-5 h-5" />}
                    count={hygieneIssues.length}
                    defaultOpen={false}
                    colorClass="red"
                >
                    <div className="overflow-x-auto max-h-60">
                        <table className="min-w-full text-xs text-left">
                            <thead className="bg-red-50 text-red-900 sticky top-0 z-10 font-bold">
                                <tr>
                                    <th className="p-3">Cuenta</th>
                                    <th className="p-3">Documento</th>
                                    <th className="p-3 text-right">Valor</th>
                                    <th className="p-3">Problema</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-100">
                                {hygieneIssues.map(issue => (
                                    <tr key={issue.id} className="hover:bg-red-50/50 transition-colors">
                                        <td className="p-3 font-mono font-medium text-slate-700">{issue.cuenta}</td>
                                        <td className="p-3 text-slate-800 font-bold">{issue.docNum}</td>
                                        <td className="p-3 text-right font-mono text-red-600 font-bold">{formatCurrency(issue.valor)}</td>
                                        <td className="p-3 text-red-700 italic">{issue.descripcion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AccordionCard>
            </div>

            {/* SECCIÓN 4: COHERENCIA TARIFA */}
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    3. Coherencia de Tarifas
                </h3>
                <AccordionCard 
                    title="Tarifas Implícitas Irregulares" 
                    icon={<MagnifyingGlassIcon className="w-5 h-5" />}
                    count={coherenceFindings.length}
                    defaultOpen={false}
                    colorClass="amber"
                >
                    <div className="overflow-x-auto max-h-60">
                        <table className="min-w-full text-xs text-left">
                            <thead className="bg-amber-50 text-amber-900 sticky top-0 z-10 font-bold">
                                <tr>
                                    <th className="p-3">Documento</th>
                                    <th className="p-3 text-right">Base Calc.</th>
                                    <th className="p-3 text-right">IVA</th>
                                    <th className="p-3 text-center">Tarifa Calc.</th>
                                    <th className="p-3">Diagnóstico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100">
                                {coherenceFindings.map((doc, idx) => (
                                    <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                                        <td className="p-3 font-mono font-bold text-slate-800">{doc.docNum}</td>
                                        <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(doc.ingreso)}</td>
                                        <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(doc.ivaGenerado)}</td>
                                        <td className="p-3 text-center font-bold text-amber-700">{doc.tasaImplicita.toFixed(1)}%</td>
                                        <td className="p-3 text-amber-700 text-xs">{doc.diagnostico}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AccordionCard>
            </div>
        </div>
    );
};
