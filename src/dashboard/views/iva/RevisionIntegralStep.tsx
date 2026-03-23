
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    SearchIcon, 
    ChevronDownIcon, 
    ArrowRightIcon, 
    BoltIcon,
    TableCellsIcon,
    ChartPieIcon
} from '@/dashboard/components/Icons';
import type { AuxiliarData, DianData } from '@/dashboard/types';

// --- UTILS ---

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');
};

const getNormalizedId = (doc: string | null | undefined): string => {
    if (!doc) return 'SIN-ID';
    let clean = doc.trim().toUpperCase().replace(/^(FV|FE|FC|SETT|NCC|NCE|DMC|NC|ND|DS)\s*/i, '');
    const matches = clean.match(/\d+/g);
    if (!matches) return clean.replace(/[^A-Z0-9]/g, ''); 
    return parseInt(matches.join(''), 10).toString();
};

const areDatesClose = (dateStr1: string, dateStr2: string, toleranceDays: number = 5): boolean => {
    const parseDate = (str: string) => {
        if (!str) return null;
        const parts = str.split('/'); 
        if (parts.length !== 3) return null;
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    };
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);
    if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= toleranceDays;
};

// --- TIPOS DEL MOTOR FORENSE ---

interface CrossCheckFinding {
    id: string;
    docNum: string;
    fecha: string;
    nit: string;
    tercero: string;
    valorContable: number;
    valorDian: number;
    diferencia: number;
    estado: 'OK' | 'DIFERENCIA_VALOR' | 'OMITIDO_CONTABILIDAD' | 'NO_EN_DIAN';
}

interface HygieneFinding {
    id: string;
    cuenta: string;
    docNum: string;
    tercero: string;
    tipo: 'SALDO_CONTRARIO' | 'TARIFA_IMPLICITA';
    valor: number;
    detalle: string;
}

// --- KPI CARD COMPONENT ---
const KpiCard = ({ title, value, subtext, color }: { title: string, value: string, subtext: string, color: 'emerald' | 'rose' | 'amber' | 'slate' }) => {
    const colors = {
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        rose: 'bg-rose-50 border-rose-200 text-rose-800',
        amber: 'bg-amber-50 border-amber-200 text-amber-800',
        slate: 'bg-slate-50 border-slate-200 text-slate-800',
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[color]} shadow-sm flex flex-col justify-between h-full`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</p>
            <div className="text-2xl font-mono font-bold leading-tight">{value}</div>
            <p className="text-[10px] mt-2 font-medium opacity-80">{subtext}</p>
        </div>
    );
};

// --- MAIN COMPONENT ---

const RevisionIntegralStep: React.FC = () => {
    const context = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<'cruce' | 'higiene'>('cruce');
    const [filter, setFilter] = useState<'todos' | 'diferencias' | 'faltantes'>('todos');

    if (!context) return <div>Cargando...</div>;
    const { appState } = context;
    const { files, incomeAccountVatClassification } = appState;

    // --- MOTOR DE ANÁLISIS FORENSE (USE MEMO) ---
    const analysis = useMemo(() => {
        if (!files.iva_auxiliar || !files.iva_dian) return null;

        const crossCheck: CrossCheckFinding[] = [];
        const hygiene: HygieneFinding[] = [];
        
        // --- 1. INDEXACIÓN ---
        
        // Mapa DIAN (Normalizado)
        const dianMap = new Map<string, DianData>();
        files.iva_dian.forEach(d => {
            const normId = getNormalizedId(d.DocumentoDIAN);
            // Solo facturas de venta y notas crédito/débito propias
            if(normalizeText(d.Grupo).includes('emitido')) {
                dianMap.set(normId, d);
            }
        });

        // Mapa Auxiliar (Agrupado por Doc)
        const auxGroups = new Map<string, AuxiliarData[]>();
        files.iva_auxiliar.forEach(mov => {
            const normId = getNormalizedId(mov.DocNum);
            if (!auxGroups.has(normId)) auxGroups.set(normId, []);
            auxGroups.get(normId)!.push(mov);
        });

        // --- 2. ANÁLISIS DE CRUCE (MATCHING) ---
        
        // A. Recorrer Contabilidad para buscar en DIAN
        auxGroups.forEach((movimientos, docKey) => {
            // Filtrar solo docs relevantes (Ingresos/IVA)
            const hasIncomeOrIva = movimientos.some(m => m.Cuenta.startsWith('4') || m.Cuenta.startsWith('2408'));
            if (!hasIncomeOrIva) return;

            const first = movimientos[0];
            const dianMatch = dianMap.get(docKey);

            // Calcular valor neto contable (Ingreso Base + IVA Generado)
            // Asumimos naturaleza Crédito para Ingreso e IVA Gen
            let totalContable = 0;
            let ingresoBase = 0;
            let ivaGenerado = 0;

            movimientos.forEach(m => {
                const net = m.Creditos - m.Debitos;
                if (m.Cuenta.startsWith('4') || m.Cuenta.startsWith('2408')) {
                    totalContable += net;
                }
                if (m.Cuenta.startsWith('4')) ingresoBase += net;
                if (m.Cuenta.startsWith('2408')) ivaGenerado += net;
            });

            // Analisis de Higiene: Tarifa Implícita
            if (ingresoBase > 0 && ivaGenerado > 0) {
                const tarifa = (ivaGenerado / ingresoBase) * 100;
                // Tolerancia amplia para errores de redondeo (18-20% para general, 4-6% para reducida)
                const esGeneral = Math.abs(tarifa - 19) < 1.5;
                const esReducida = Math.abs(tarifa - 5) < 0.8;
                
                if (!esGeneral && !esReducida) {
                    hygiene.push({
                        id: `imp-${docKey}`,
                        cuenta: 'VAR',
                        docNum: first.DocNum,
                        tercero: first.Tercero,
                        tipo: 'TARIFA_IMPLICITA',
                        valor: ivaGenerado,
                        detalle: `Tarifa calculada del ${tarifa.toFixed(1)}% (Base: ${formatCurrency(ingresoBase)}, IVA: ${formatCurrency(ivaGenerado)})`
                    });
                }
            }

            // Analisis de Higiene: Saldos Contrarios
            movimientos.forEach(m => {
                const code = m.Cuenta.split(' ')[0];
                const desc = normalizeText(m.Nota);
                // Ignorar anulaciones/cierres
                if(desc.includes('cierre') || desc.includes('anulacion')) return;

                if (code.startsWith('4') && !code.startsWith('4175') && m.Debitos > 0) {
                    hygiene.push({
                        id: `hyg-deb-${m.id}`,
                        cuenta: m.Cuenta,
                        docNum: first.DocNum,
                        tercero: m.Tercero,
                        tipo: 'SALDO_CONTRARIO',
                        valor: m.Debitos,
                        detalle: 'Débito en cuenta de Ingreso (Naturaleza Crédito)'
                    });
                }
            });


            if (dianMatch) {
                // Match Encontrado - Verificar Valor
                // DIAN Total es Base + IVA (aprox)
                // Usamos Total de DIAN directamente
                const totalDian = dianMatch.Total; // Nota: Total en DIAN puede incluir otros impuestos.
                const diff = Math.abs(totalContable - totalDian);

                if (diff > 1000) { // Tolerancia $1.000
                    crossCheck.push({
                        id: docKey,
                        docNum: first.DocNum,
                        fecha: first.Fecha,
                        nit: first.NIT,
                        tercero: first.Tercero,
                        valorContable: totalContable,
                        valorDian: totalDian,
                        diferencia: totalContable - totalDian,
                        estado: 'DIFERENCIA_VALOR'
                    });
                } else {
                     crossCheck.push({
                        id: docKey,
                        docNum: first.DocNum,
                        fecha: first.Fecha,
                        nit: first.NIT,
                        tercero: first.Tercero,
                        valorContable: totalContable,
                        valorDian: totalDian,
                        diferencia: 0,
                        estado: 'OK'
                    });
                }
                // Remover del mapa para identificar faltantes luego
                dianMap.delete(docKey);

            } else {
                // No en DIAN (Solo si parece factura electrónica por el número)
                if (/^(FE|FV|SETT)/i.test(first.DocNum)) {
                     crossCheck.push({
                        id: docKey,
                        docNum: first.DocNum,
                        fecha: first.Fecha,
                        nit: first.NIT,
                        tercero: first.Tercero,
                        valorContable: totalContable,
                        valorDian: 0,
                        diferencia: totalContable,
                        estado: 'NO_EN_DIAN'
                    });
                }
            }
        });

        // B. Recorrer remanentes de DIAN (Omitidos en Contabilidad)
        dianMap.forEach((dianData, docKey) => {
             crossCheck.push({
                id: docKey,
                docNum: dianData.DocumentoDIAN,
                fecha: dianData.Fecha,
                nit: dianData.NITReceptor, // En ventas es el cliente
                tercero: dianData.NombreReceptor,
                valorContable: 0,
                valorDian: dianData.Total,
                diferencia: -dianData.Total,
                estado: 'OMITIDO_CONTABILIDAD'
            });
        });

        // --- 3. KPIs ---
        const totalDocs = crossCheck.length;
        const perfectMatch = crossCheck.filter(c => c.estado === 'OK').length;
        const integrityScore = totalDocs > 0 ? (perfectMatch / totalDocs) * 100 : 0;
        
        const riskFiscal = crossCheck
            .filter(c => c.estado === 'OMITIDO_CONTABILIDAD')
            .reduce((s, c) => s + c.valorDian, 0);
            
        const riskSupport = crossCheck
            .filter(c => c.estado === 'NO_EN_DIAN')
            .reduce((s, c) => s + c.valorContable, 0);

        return {
            crossCheck,
            hygiene,
            kpis: {
                integrityScore,
                riskFiscal,
                riskSupport,
                hygieneCount: hygiene.length
            }
        };

    }, [files]);

    // --- RENDER ---

    if (!analysis) {
        return (
            <div className="bg-white p-12 rounded-xl shadow-md text-center border-2 border-dashed border-slate-300 m-6">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <SearchIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Esperando Información</h3>
                <p className="text-slate-500 mt-2">Cargue los archivos 'Auxiliar' y 'DIAN' en la pestaña de Control para iniciar la auditoría forense.</p>
            </div>
        );
    }

    const filteredCrossCheck = analysis.crossCheck.filter(row => {
        if (filter === 'todos') return true;
        if (filter === 'diferencias') return row.estado === 'DIFERENCIA_VALOR';
        if (filter === 'faltantes') return row.estado === 'OMITIDO_CONTABILIDAD' || row.estado === 'NO_EN_DIAN';
        return true;
    }).sort((a,b) => {
        // Sort Priority: Errors -> Value Desc
        if (a.estado === 'OK' && b.estado !== 'OK') return 1;
        if (a.estado !== 'OK' && b.estado === 'OK') return -1;
        return Math.abs(b.diferencia) - Math.abs(a.diferencia);
    });

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            
            {/* SECCIÓN 1: KPIs (RESUMEN EJECUTIVO) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiCard 
                    title="Integridad de Datos" 
                    value={`${analysis.kpis.integrityScore.toFixed(1)}%`} 
                    subtext="Cruce Perfecto (DIAN = Contab)"
                    color={analysis.kpis.integrityScore > 95 ? 'emerald' : 'amber'}
                />
                <KpiCard 
                    title="Riesgo Fiscal (Omitidos)" 
                    value={formatCurrency(analysis.kpis.riskFiscal)} 
                    subtext="Ingresos en DIAN no hallados en Libros"
                    color={analysis.kpis.riskFiscal > 0 ? 'rose' : 'slate'}
                />
                <KpiCard 
                    title="Riesgo de Soporte" 
                    value={formatCurrency(analysis.kpis.riskSupport)} 
                    subtext="Ventas en Libros sin soporte DIAN"
                    color={analysis.kpis.riskSupport > 0 ? 'amber' : 'slate'}
                />
                <KpiCard 
                    title="Calidad Contable" 
                    value={`${analysis.kpis.hygieneCount}`} 
                    subtext="Errores de naturaleza o tarifa"
                    color={analysis.kpis.hygieneCount > 0 ? 'rose' : 'emerald'}
                />
            </div>

            {/* SECCIÓN 2: PANEL DE DETALLE */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                
                {/* TABS HEADER */}
                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('cruce')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'cruce' ? 'bg-slate-50 text-slate-800 border-b-2 border-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <TableCellsIcon className="w-5 h-5" />
                        Cruce DIAN vs Contabilidad
                    </button>
                    <button 
                        onClick={() => setActiveTab('higiene')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'higiene' ? 'bg-slate-50 text-slate-800 border-b-2 border-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <BoltIcon className="w-5 h-5" />
                        Higiene y Coherencia ({analysis.hygiene.length})
                    </button>
                </div>

                {/* TAB CONTENT: CRUCE */}
                {activeTab === 'cruce' && (
                    <div className="flex-1 flex flex-col">
                        {/* Filters */}
                        <div className="p-4 border-b border-slate-100 flex gap-2">
                            <button onClick={() => setFilter('todos')} className={`px-3 py-1.5 rounded-full text-xs font-bold ${filter === 'todos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
                            <button onClick={() => setFilter('diferencias')} className={`px-3 py-1.5 rounded-full text-xs font-bold ${filter === 'diferencias' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>Con Diferencias</button>
                            <button onClick={() => setFilter('faltantes')} className={`px-3 py-1.5 rounded-full text-xs font-bold ${filter === 'faltantes' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>Faltantes / Omitidos</button>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 w-10"></th>
                                        <th className="p-3 w-24">Fecha</th>
                                        <th className="p-3 w-32">Documento</th>
                                        <th className="p-3">Tercero</th>
                                        <th className="p-3 text-right w-32">Contabilidad</th>
                                        <th className="p-3 text-right w-32">DIAN</th>
                                        <th className="p-3 text-right w-32">Diferencia</th>
                                        <th className="p-3 text-center w-24">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCrossCheck.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-3 text-center">
                                                {row.estado === 'OK' ? 
                                                    <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : 
                                                    <ExclamationCircleIcon className="w-4 h-4 text-rose-500" />
                                                }
                                            </td>
                                            <td className="p-3 text-slate-600">{row.fecha}</td>
                                            <td className="p-3 font-mono font-bold text-slate-700">{row.docNum}</td>
                                            <td className="p-3 text-slate-600 truncate max-w-[200px]" title={row.tercero}>
                                                {row.tercero || '---'}
                                                <div className="text-[9px] text-slate-400">{row.nit}</div>
                                            </td>
                                            <td className="p-3 text-right font-mono text-slate-700">{formatCurrency(row.valorContable)}</td>
                                            <td className="p-3 text-right font-mono text-slate-700">{formatCurrency(row.valorDian)}</td>
                                            <td className={`p-3 text-right font-mono font-bold ${row.diferencia !== 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                                                {formatCurrency(row.diferencia)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                                                    row.estado === 'OK' ? 'bg-emerald-100 text-emerald-800' :
                                                    row.estado === 'DIFERENCIA_VALOR' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {row.estado.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: HIGIENE */}
                {activeTab === 'higiene' && (
                    <div className="flex-1 overflow-auto p-4">
                        {analysis.hygiene.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <CheckCircleIcon className="w-12 h-12 mb-2 text-emerald-200" />
                                <p>Excelente. No se encontraron errores de higiene contable.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {analysis.hygiene.map(issue => (
                                    <div key={issue.id} className="border border-rose-100 bg-rose-50/50 p-4 rounded-lg flex items-start gap-4 hover:bg-rose-50 transition-colors">
                                        <div className="p-2 bg-white rounded-full text-rose-500 shadow-sm mt-1">
                                            <BoltIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-rose-800 text-sm uppercase">{issue.tipo.replace('_', ' ')}</h4>
                                                <span className="font-mono font-bold text-rose-700">{formatCurrency(issue.valor)}</span>
                                            </div>
                                            <p className="text-sm text-rose-900 mt-1">{issue.detalle}</p>
                                            <div className="mt-2 flex gap-4 text-xs text-rose-600 font-mono">
                                                <span>DOC: {issue.docNum}</span>
                                                <span>CUENTA: {issue.cuenta}</span>
                                                <span className="truncate max-w-[200px]">TERCERO: {issue.tercero}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default RevisionIntegralStep;
