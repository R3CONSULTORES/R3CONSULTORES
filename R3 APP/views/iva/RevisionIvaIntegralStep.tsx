
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { AuxiliarData, DianData } from '../../types';
import { CheckCircleIcon, BoltIcon, ExclamationCircleIcon, SearchIcon } from '../../components/Icons';
import { GoogleGenAI } from "@google/genai";

// --- UTILS & FORMATTERS ---

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');
};

/**
 * REGLA A: Normalización de Identificadores (Sanitización)
 * Elimina prefijos de texto comunes y ceros a la izquierda para asegurar el match.
 */
const getNormalizedId = (doc: string | null | undefined): string => {
    if (!doc) return 'SIN-ID';
    // Eliminar prefijos de texto comunes + espacios
    let clean = doc.trim().replace(/^(fv|fe|fc|sett|ncc|nce|dmc|nc|nd|ds)\s*/i, '');
    // Extraer solo números
    const matches = clean.match(/\d+/g);
    if (!matches) return clean; // Fallback si no hay números
    // Unir números y parsear para quitar ceros a la izquierda (ej: 00123 -> 123)
    return parseInt(matches.join(''), 10).toString();
};

/**
 * REGLA B: Tolerancia Temporal (Fuzzy Date)
 * Margen de error de +/- 5 días.
 */
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= toleranceDays;
};

type DocType = 'FV' | 'FC' | 'NC_CLIENTE' | 'NC_PROVEEDOR' | 'OTRO';

/**
 * REGLA C: Clasificación Contextual (Prevención de Colisiones)
 * Determina si es Venta o Compra basado en las cuentas afectadas, no solo en el número.
 */
const detectDocType = (docNum: string, context: AuxiliarData[]): DocType => {
    const normalized = normalizeText(docNum);
    const accounts = context.map(m => m.Cuenta);

    // Detectar intención por cuentas
    const hasIngreso = accounts.some(acc => acc.startsWith('4') && !acc.startsWith('4175'));
    const hasDevVenta = accounts.some(acc => acc.startsWith('4175'));
    const hasGastoCosto = accounts.some(acc => ['5', '6', '7'].some(p => acc.startsWith(p)));
    const hasProveedor = accounts.some(acc => acc.startsWith('22') || acc.startsWith('23'));
    const hasCliente = accounts.some(acc => acc.startsWith('13'));

    // Heurísticas para Notas Crédito (Prefijos explícitos o cuenta 4175)
    const isNC = /^(nc|nce|ncr)/.test(normalized) || normalized.includes('nota credito');

    if (isNC || hasDevVenta) {
        // Si afecta clientes o ingresos/devoluciones -> NC Cliente
        if (hasDevVenta || hasCliente || hasIngreso) return 'NC_CLIENTE';
        // Si afecta proveedores o gastos -> NC Proveedor
        return 'NC_PROVEEDOR';
    }

    if (hasIngreso) return 'FV'; // Factura Venta
    if (hasGastoCosto || hasProveedor) return 'FC'; // Factura Compra

    // Fallback: Dirección del IVA (Crédito suele ser Venta, Débito suele ser Compra)
    const ivaCredits = context.filter(m => m.Cuenta.startsWith('2408')).reduce((s, m) => s + m.Creditos, 0);
    const ivaDebits = context.filter(m => m.Cuenta.startsWith('2408')).reduce((s, m) => s + m.Debitos, 0);
    
    if (ivaCredits > ivaDebits) return 'FV';
    if (ivaDebits > ivaCredits) return 'FC';

    return 'OTRO';
};

interface AuditRow {
    id: string; // Unique key for React
    docOriginal: string; // For display (WO)
    docType: DocType;
    normId: string;
    
    // Matching Data
    nit: string;
    tercero: string;
    fechaDisplay: string;
    
    // Values
    ivaWO: number;
    ivaDIAN: number;
    diferencia: number;
    
    // Audit
    auditStatus: 'OK' | 'ERROR';
    auditMessage?: string;
    
    // Context
    movimientos: AuxiliarData[];
    aiAnalysis?: string;
}

const RevisionIntegralStep: React.FC = () => {
    const context = useContext(AppContext);
    const [isRunning, setIsRunning] = useState(false);
    const [rows, setRows] = useState<AuditRow[]>([]);
    const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState('');

    if (!context) return <div>Cargando...</div>;
    const { appState, showLoading, hideLoading, showError } = context;
    const { files } = appState;

    const canRun = !!(files.iva_auxiliar && files.iva_dian);

    const handleRunAnalysis = () => {
        if (!canRun) return;
        setIsRunning(true);
        showLoading("Ejecutando Motor de Revisión Integral...");

        setTimeout(() => {
            try {
                const processedRows: AuditRow[] = [];
                
                // 1. Index DIAN Data
                const dianMap = new Map<string, DianData[]>();
                
                files.iva_dian!.forEach(d => {
                    const normId = getNormalizedId(d.DocumentoDIAN);
                    const nitEmisor = getNormalizedId(d.NITEMISOR);
                    const nitReceptor = getNormalizedId(d.NITReceptor);
                    
                    // Index by Emisor (Matches our Purchases where Provider is Emisor)
                    const keyEmisor = `${nitEmisor}_${normId}`;
                    if (!dianMap.has(keyEmisor)) dianMap.set(keyEmisor, []);
                    dianMap.get(keyEmisor)!.push(d);
                    
                    // Index by Receptor (Matches our Sales where Client is Receptor)
                    const keyReceptor = `${nitReceptor}_${normId}`;
                    if (!dianMap.has(keyReceptor)) dianMap.set(keyReceptor, []);
                    dianMap.get(keyReceptor)!.push(d);
                });

                // 2. Group WO Data by Original Document ID (Strict Grouping)
                const woGroups = new Map<string, AuxiliarData[]>();
                files.iva_auxiliar!.forEach(row => {
                    const docNum = row.DocNum.trim();
                    if (!docNum) return;
                    if (!woGroups.has(docNum)) woGroups.set(docNum, []);
                    woGroups.get(docNum)!.push(row);
                });

                // 3. Process Each WO Group
                woGroups.forEach((movimientos, docOriginal) => {
                    // Filter: Only interested in documents moving IVA (2408)
                    const ivaMovs = movimientos.filter(m => m.Cuenta.startsWith('2408'));
                    if (ivaMovs.length === 0) return; 

                    const first = movimientos[0];
                    const nitWO = getNormalizedId(first.NIT); 
                    const normId = getNormalizedId(docOriginal);
                    const docType = detectDocType(docOriginal, movimientos);

                    // Calculate Net IVA in WO
                    const debitos = ivaMovs.reduce((s, m) => s + m.Debitos, 0);
                    const creditos = ivaMovs.reduce((s, m) => s + m.Creditos, 0);
                    // Net Impact absolute value
                    const ivaWOVal = Math.abs(creditos - debitos);

                    // 4. Match against DIAN
                    const matchKey = `${nitWO}_${normId}`;
                    const candidates = dianMap.get(matchKey);
                    
                    let match: DianData | null = null;
                    if (candidates) {
                        // REGLA B: Fuzzy Date
                        match = candidates.find(c => areDatesClose(first.Fecha, c.Fecha)) || null;
                    }

                    let ivaDIANVal = 0;
                    let fechaDisplay = first.Fecha;

                    if (match) {
                        ivaDIANVal = Math.abs(match.IVA); 
                        if (match.Fecha !== first.Fecha) {
                            fechaDisplay = `${first.Fecha} (WO) / ${match.Fecha} (DIAN)`;
                        }
                    }

                    const diferencia = ivaWOVal - ivaDIANVal;

                    // 5. REGLA D: Auditoría Lógica (Validación de Naturaleza)
                    let auditStatus: 'OK' | 'ERROR' = 'OK';
                    let auditMessage = 'Naturaleza Correcta';

                    if (docType === 'FV') {
                        // Venta -> IVA Crédito
                        if (debitos > 0 && creditos === 0) {
                            auditStatus = 'ERROR';
                            auditMessage = 'NATURALEZA: IVA en Venta está al Débito (Debe ser Crédito)';
                        }
                    } else if (docType === 'FC') {
                        // Compra -> IVA Débito
                        if (creditos > 0 && debitos === 0) {
                            auditStatus = 'ERROR';
                            auditMessage = 'NATURALEZA: IVA en Compra está al Crédito (Debe ser Débito)';
                        }
                    } else if (docType === 'NC_CLIENTE') {
                        // Dev Venta -> IVA Débito
                        if (creditos > 0 && debitos === 0) {
                            auditStatus = 'ERROR';
                            auditMessage = 'NATURALEZA: Nota Crédito Cliente requiere IVA al Débito';
                        }
                    } else if (docType === 'NC_PROVEEDOR') {
                        // Dev Compra -> IVA Crédito
                        if (debitos > 0 && creditos === 0) {
                            auditStatus = 'ERROR';
                            auditMessage = 'NATURALEZA: Nota Crédito Proveedor requiere IVA al Crédito';
                        }
                    }

                    // Append difference warning if significant
                    if (match && Math.abs(diferencia) > 1000) {
                       const msg = `Diferencia de valor: ${formatCurrency(diferencia)}`;
                       auditMessage = auditStatus === 'ERROR' ? `${auditMessage}. ${msg}` : msg;
                       if (auditStatus === 'OK') auditStatus = 'ERROR'; // Treat significant diff as error for visibility
                    } else if (!match) {
                       // Optional: Flag missing in DIAN
                       // auditMessage += " (No encontrado en DIAN)";
                    }

                    processedRows.push({
                        id: `${docOriginal}-${nitWO}`,
                        docOriginal,
                        docType,
                        normId,
                        nit: first.NIT,
                        tercero: first.Tercero,
                        fechaDisplay,
                        ivaWO: ivaWOVal,
                        ivaDIAN: ivaDIANVal,
                        diferencia,
                        auditStatus,
                        auditMessage,
                        movimientos
                    });
                });

                // Sort: Errors first, then by Difference magnitude
                processedRows.sort((a, b) => {
                    if (a.auditStatus === 'ERROR' && b.auditStatus === 'OK') return -1;
                    if (a.auditStatus === 'OK' && b.auditStatus === 'ERROR') return 1;
                    return Math.abs(b.diferencia) - Math.abs(a.diferencia);
                });

                setRows(processedRows);
                
            } catch (error) {
                console.error(error);
                showError("Error crítico en el motor de revisión.");
            } finally {
                setIsRunning(false);
                hideLoading();
            }
        }, 100);
    };

    const handleAnalyzeRow = async (row: AuditRow) => {
        const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
        if (!apiKey) {
            showError("API Key no configurada.");
            return;
        }

        setAnalyzingIds(prev => new Set(prev).add(row.id));

        try {
            const ai = new GoogleGenAI({ apiKey });
            
            const contextData = row.movimientos.map(m => `- Cuenta: ${m.Cuenta}, Nota: ${m.Nota}, Valor: ${formatCurrency(m.Debitos + m.Creditos)}`).join('\n');
            
            const prompt = `
            Actúa como Auditor Tributario Experto en Colombia.
            Analiza la siguiente transacción contable para detectar "Gasto no deducible" o "IVA descontable improcedente".
            
            Tercero: ${row.tercero} (NIT: ${row.nit})
            Tipo Documento: ${row.docType}
            Movimientos Contables:
            ${contextData}
            
            Reglas:
            1. Si el gasto parece personal (mercado, ropa, cine, entretenimiento, lujos) -> ALERTA DE RECHAZO.
            2. Si el tercero no tiene relación de causalidad evidente con un negocio típico -> ALERTA.
            3. Si parece legítimo -> OK.
            
            Responde muy brevemente (máximo 20 palabras).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setRows(prev => prev.map(r => r.id === row.id ? { ...r, aiAnalysis: response.text } : r));

        } catch (error) {
            showError("Error al consultar IA.");
        } finally {
            setAnalyzingIds(prev => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
            });
        }
    };

    const filteredRows = useMemo(() => {
        if (!filter) return rows;
        const lower = filter.toLowerCase();
        return rows.filter(r => 
            r.docOriginal.toLowerCase().includes(lower) ||
            r.tercero.toLowerCase().includes(lower) ||
            r.nit.includes(lower)
        );
    }, [rows, filter]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Revisión Integral de IVA</h2>
                    <p className="text-slate-500 text-sm mt-1">Módulo Unificado: Conciliación DIAN + Auditoría de Naturaleza + IA</p>
                </div>
                <div className="flex gap-3">
                    {!isRunning && rows.length > 0 && (
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Buscar documento..." 
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                    )}
                    <button
                        onClick={handleRunAnalysis}
                        disabled={!canRun || isRunning}
                        className="bg-slate-900 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-slate-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isRunning ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            <BoltIcon className="w-5 h-5 text-amber-400" />
                        )}
                        {rows.length > 0 ? 'Actualizar Análisis' : 'Ejecutar Revisión Integral'}
                    </button>
                </div>
            </div>

            {/* WARNING IF FILES MISSING */}
            {!canRun && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-r-lg flex items-center gap-3">
                    <ExclamationCircleIcon className="w-6 h-6" />
                    <div>
                        <p className="font-bold">Faltan Archivos Críticos</p>
                        <p className="text-sm">Para iniciar, cargue 'Auxiliar General (IVA)' y 'Informe DIAN (IVA)' en la pestaña de Control.</p>
                    </div>
                </div>
            )}

            {/* RESULTS TABLE */}
            {rows.length > 0 && (
                <div className="overflow-x-auto border rounded-lg shadow-sm max-h-[70vh]">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-slate-800 text-white sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold w-32">Documento</th>
                                <th className="px-4 py-3 text-left font-semibold">Tercero</th>
                                <th className="px-4 py-3 text-left font-semibold w-40">Fechas</th>
                                <th className="px-4 py-3 text-right font-semibold w-24">IVA WO</th>
                                <th className="px-4 py-3 text-right font-semibold w-24">IVA DIAN</th>
                                <th className="px-4 py-3 text-right font-semibold w-24">Diferencia</th>
                                <th className="px-4 py-3 text-center font-semibold w-32">Estado</th>
                                <th className="px-4 py-3 text-left font-semibold min-w-[200px]">IA</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRows.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    {/* Document ID & Type */}
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-bold text-slate-800">{row.docOriginal}</div>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${row.docType.startsWith('NC') ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {row.docType}
                                        </span>
                                    </td>
                                    
                                    {/* Third Party */}
                                    <td className="px-4 py-3 align-top">
                                        <div className="text-slate-700 font-medium truncate max-w-[180px]" title={row.tercero}>{row.tercero}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{row.nit}</div>
                                    </td>

                                    {/* Dates */}
                                    <td className="px-4 py-3 align-top text-slate-600">{row.fechaDisplay}</td>

                                    {/* Values */}
                                    <td className="px-4 py-3 align-top text-right font-mono text-slate-700">{formatCurrency(row.ivaWO)}</td>
                                    <td className="px-4 py-3 align-top text-right font-mono text-slate-700">{formatCurrency(row.ivaDIAN)}</td>
                                    <td className={`px-4 py-3 align-top text-right font-mono font-bold ${Math.abs(row.diferencia) > 1000 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(row.diferencia)}
                                    </td>

                                    {/* Audit Status */}
                                    <td className="px-4 py-3 align-top text-center">
                                        {row.auditStatus === 'OK' && Math.abs(row.diferencia) < 1000 ? (
                                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 w-fit mx-auto">
                                                <CheckCircleIcon className="w-3 h-3" />
                                                <span className="font-semibold">Correcto</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1 items-center">
                                                <div className="flex items-start gap-1 text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100">
                                                    <ExclamationCircleIcon className="w-3 h-3 mt-0.5 shrink-0" />
                                                    <span className="font-medium leading-tight text-left">{row.auditMessage}</span>
                                                </div>
                                            </div>
                                        )}
                                    </td>

                                    {/* AI Analysis */}
                                    <td className="px-4 py-3 align-top">
                                        {row.aiAnalysis ? (
                                            <div className="text-[10px] bg-indigo-50 border border-indigo-100 p-2 rounded text-indigo-900 leading-snug animate-fadeIn">
                                                {row.aiAnalysis}
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleAnalyzeRow(row)}
                                                disabled={analyzingIds.has(row.id)}
                                                className="w-full text-[10px] bg-white border border-slate-300 hover:bg-indigo-50 hover:text-indigo-700 text-slate-500 px-2 py-1 rounded transition-all flex items-center justify-center gap-1"
                                            >
                                                {analyzingIds.has(row.id) ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <BoltIcon className="w-3 h-3" />}
                                                Consultar IA
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RevisionIntegralStep;
