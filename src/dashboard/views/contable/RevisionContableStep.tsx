
import React, { useState, useContext } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import type { ConciliacionResultados, DianData, Diferencia, VentasComprasData, DocumentoDetalle, AuxiliarData, CoherenciaFinding } from '@/dashboard/types';
import { ChevronDownIcon, BoltIcon, CheckCircleIcon } from '@/dashboard/components/Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u00c0-\u00df]/g, "").trim().replace(/\s+/g, ' ');
};

// --- Helper Components ---

const Accordion: React.FC<{ title: string; count: number; children: React.ReactNode; color?: 'red' | 'blue' }> = ({ title, count, children, color = 'blue' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasData = count > 0;
    const headerBg = color === 'red' ? 'bg-red-50 hover:bg-red-100' : 'bg-slate-50 hover:bg-slate-100';
    
    return (
        <div className="border border-slate-300 rounded-lg mb-3 bg-white shadow-sm overflow-hidden">
            <button
                className={`w-full flex justify-between items-center p-4 ${headerBg} focus:outline-none transition-colors`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center text-left gap-3">
                    <span className={`font-bold text-base ${color === 'red' ? 'text-red-800' : 'text-slate-800'}`}>{title}</span>
                    {hasData && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${color === 'red' ? 'bg-red-200 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {count} Hallazgos
                        </span>
                    )}
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 border-t border-slate-200">{children}</div>}
        </div>
    );
};

const ResultadosTable: React.FC<{ data: Diferencia[] }> = ({ data }) => {
    const [expandedNits, setExpandedNits] = useState(new Set<string>());

    const toggleExpand = (nit: string) => {
        setExpandedNits(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nit)) newSet.delete(nit);
            else newSet.add(nit);
            return newSet;
        });
    };

    if (data.length === 0) {
        return <div className="p-4 text-center text-green-600 flex items-center justify-center gap-2"><CheckCircleIcon className="w-5 h-5"/><span>Sin diferencias.</span></div>;
    }

    return (
        <div className="max-h-[50vh] overflow-auto border border-slate-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-slate-800 sticky top-0 z-10 text-white">
                    <tr>
                        <th className="px-4 py-2 w-8"></th>
                        <th className="px-4 py-2 text-left font-bold">NIT</th>
                        <th className="px-4 py-2 text-left font-bold hidden sm:table-cell">Nombre</th>
                        <th className="px-4 py-2 text-right font-bold">Valor WO</th>
                        <th className="px-4 py-2 text-right font-bold">Valor DIAN</th>
                        <th className="px-4 py-2 text-right font-bold">Diferencia</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map(item => {
                        const isExpanded = expandedNits.has(item.nit);
                        return (
                            <React.Fragment key={item.nit}>
                                <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpand(item.nit)}>
                                    <td className="px-4 py-2 text-center"><ChevronDownIcon className={`w-4 h-4 text-slate-500 ${isExpanded ? 'rotate-180' : ''}`} /></td>
                                    <td className="px-4 py-2 font-mono text-gray-800">{item.nit}</td>
                                    <td className="px-4 py-2 text-gray-600 truncate max-w-[150px] hidden sm:table-cell" title={item.nombre}>{item.nombre}</td>
                                    <td className="px-4 py-2 text-right font-mono text-gray-800">{formatCurrency(item.valorWO)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-gray-800">{formatCurrency(item.valorDIAN)}</td>
                                    <td className={`px-4 py-2 text-right font-mono font-bold ${Math.abs(item.diferencia) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(item.diferencia)}</td>
                                </tr>
                                {isExpanded && item.detalles && (
                                    <tr>
                                        <td colSpan={6} className="p-3 bg-slate-50">
                                            <div className="bg-white border border-slate-300 rounded p-2 overflow-x-auto shadow-inner">
                                                <table className="min-w-full text-xs">
                                                    <thead className="bg-slate-100 text-gray-700">
                                                        <tr>
                                                            <th className="p-2 text-left font-semibold">Doc (WO)</th>
                                                            <th className="p-2 text-left font-semibold">Doc (DIAN)</th>
                                                            <th className="p-2 text-left font-semibold">Fecha</th>
                                                            <th className="p-2 text-right font-semibold">Valor WO</th>
                                                            <th className="p-2 text-right font-semibold">Valor DIAN</th>
                                                            <th className="p-2 text-right font-semibold">Dif</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {item.detalles.map((d, i) => (
                                                            <tr key={i} className={`border-t border-gray-200 ${d.tipo === 'coincide' ? 'bg-green-50/50' : (Math.abs(d.diferencia) > 0 ? 'bg-red-50/30' : '')}`}>
                                                                <td className="p-2 font-mono text-gray-800">{d.docNumWO}</td>
                                                                <td className="p-2 font-mono text-gray-800">{d.docNumDIAN}</td>
                                                                <td className="p-2 font-mono text-gray-800">{d.fecha}</td>
                                                                <td className="p-2 text-right font-mono text-gray-800">{formatCurrency(d.valorWO)}</td>
                                                                <td className="p-2 text-right font-mono text-gray-800">{formatCurrency(d.valorDIAN)}</td>
                                                                <td className={`p-2 text-right font-mono font-bold ${Math.abs(d.diferencia) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(d.diferencia)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const RevisionContableStep: React.FC = () => {
    const context = useContext(AppContext);
    const [isRunning, setIsRunning] = useState(false);

    if (!context) return <div>Loading...</div>;
    const { appState, updateAppState, showLoading, hideLoading, showError } = context;
    const { conciliacionResultados: resultados, files } = appState;

    const canRun = !!(files.ventas && files.compras && files.dian);

    const handleRunAnalysis = () => {
         if (!canRun) {
            showError("Faltan archivos (Ventas, Compras, DIAN) en la pestaña 'Carga'.");
            return;
        }
        setIsRunning(true);
        showLoading("Ejecutando revisión integral contable...");

        setTimeout(() => {
            try {
                const ventasData = files.ventas as VentasComprasData[];
                const comprasData = files.compras as VentasComprasData[];
                const dianData = files.dian as DianData[];

                // Logic Setup
                const isIngreso = (d: DianData) => {
                    const grupo = normalizeText(d.Grupo);
                    const tipoDoc = normalizeText(d.TipoDeDocumento);
                    return grupo.includes('emitido') && !tipoDoc.includes('documento soporte');
                };

                const dianIngresos = dianData.filter(isIngreso);
                const dianCompras = dianData.filter(d => !isIngreso(d));

                 const groupData = (data: any[], nitKey: string | ((row: any) => string), valueKey: string) => {
                    return data.reduce((acc, row) => {
                        const nit = typeof nitKey === 'function' ? nitKey(row) : String(row[nitKey]).trim();
                        if (nit) {
                            acc[nit] = (acc[nit] || 0) + (row[valueKey] || 0);
                        }
                        return acc;
                    }, {} as Record<string, number>);
                };

                const findName = (nit: string) => {
                    const venta = ventasData.find(v => String(v.NIT).trim() === nit);
                    if (venta) return venta.Cliente;
                    const compra = comprasData.find(c => String(c.NIT).trim() === nit);
                    if (compra) return compra.Cliente;
                    const dianEmisor = dianData.find(d => String(d.NITEMISOR).trim() === nit);
                    if (dianEmisor) return dianEmisor.NombreEmisor;
                    return 'No encontrado';
                };

                const compareGroups = (groupWO: Record<string, number>, groupDIAN: Record<string, number>) => {
                    const allNits = new Set([...Object.keys(groupWO), ...Object.keys(groupDIAN)]);
                    const differences: Diferencia[] = [];
                    allNits.forEach(nit => {
                        const valorWO = groupWO[nit] || 0;
                        const valorDIAN = groupDIAN[nit] || 0;
                        const diferencia = valorWO - valorDIAN;
                        if (Math.abs(diferencia) > 1000) {
                            differences.push({
                                nit,
                                nombre: findName(nit),
                                valorWO,
                                valorDIAN,
                                diferencia,
                                observaciones: ''
                            });
                        }
                    });
                    return differences.sort((a,b) => Math.abs(b.diferencia) - Math.abs(a.diferencia));
                };

                // *** CORE MATCHING ALGORITHM WITH NORMALIZATION ***
                const findDetailedDifferences = (
                    diferenciasBase: Diferencia[],
                    woData: VentasComprasData[],
                    dianRelevantData: DianData[],
                    dianNitResolver: (d: DianData) => string,
                    woValueKey: keyof VentasComprasData,
                    dianValueKey: keyof DianData
                ): Diferencia[] => {
                    const finalDiferencias: Diferencia[] = [];
                    
                    const woDataByNit = woData.reduce((acc, row) => {
                        const nit = String(row.NIT).trim();
                        if (!acc[nit]) acc[nit] = [];
                        acc[nit].push(row);
                        return acc;
                    }, {} as Record<string, VentasComprasData[]>);
                    
                    const dianDataByNit = dianRelevantData.reduce((acc, row) => {
                        const nit = dianNitResolver(row);
                        if (!acc[nit]) acc[nit] = [];
                        acc[nit].push(row);
                        return acc;
                    }, {} as Record<string, DianData[]>);
                    
                    // Normalization Helper
                    const getNormalizedId = (doc: string | null | undefined): string => {
                        if (!doc) return 'SIN-ID';
                        const matches = doc.match(/\d+/g);
                        if (!matches) return doc.trim();
                        return parseInt(matches.join(''), 10).toString();
                    };

                    // Fuzzy Date Helper (+/- 5 days)
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
        
                    for (const dif of diferenciasBase) {
                        const nit = dif.nit;
                        const woPool = [...(woDataByNit[nit] || [])]; 
                        const dianPool = [...(dianDataByNit[nit] || [])];
                        
                        const detalles: DocumentoDetalle[] = [];
                        const woMatchedIndices = new Set<number>(); 
                        const dianMatchedIndices = new Set<number>();
                        
                        woPool.forEach((woDoc, woIndex) => {
                            const woId = getNormalizedId(woDoc.Documento);
                            const woVal = (woDoc[woValueKey] as number || 0);
                            
                            let bestMatchIndex = -1;
                            let minValDiff = Infinity;

                            dianPool.forEach((dianDoc, dIndex) => {
                                if (dianMatchedIndices.has(dIndex)) return;
                                
                                const dianId = getNormalizedId(dianDoc.DocumentoDIAN);
                                
                                if (woId === dianId) {
                                    if (areDatesClose(woDoc.Fecha, dianDoc.Fecha)) {
                                        const dianVal = (dianDoc[dianValueKey] as number || 0);
                                        const valDiff = Math.abs(woVal - dianVal);
                                        
                                        if (valDiff < minValDiff) {
                                            minValDiff = valDiff;
                                            bestMatchIndex = dIndex;
                                        }
                                    }
                                }
                            });

                            if (bestMatchIndex !== -1) {
                                const match = dianPool[bestMatchIndex];
                                const dianVal = (match[dianValueKey] as number || 0);
                                detalles.push({
                                    docNum: `${woDoc.Documento} / ${match.DocumentoDIAN}`,
                                    docNumWO: woDoc.Documento,
                                    docNumDIAN: match.DocumentoDIAN,
                                    fecha: woDoc.Fecha,
                                    valorWO: woVal,
                                    valorDIAN: dianVal,
                                    diferencia: woVal - dianVal,
                                    tipo: Math.abs(woVal - dianVal) > 1 ? 'diferenciaValor' : 'coincide'
                                });
                                woMatchedIndices.add(woIndex);
                                dianMatchedIndices.add(bestMatchIndex);
                            }
                        });

                        // Pass 2: Fallback Match by EXACT Value + Fuzzy Date
                        woPool.forEach((woDoc, woIndex) => {
                            if (woMatchedIndices.has(woIndex)) return;
                            const woVal = (woDoc[woValueKey] as number || 0);
                            if (Math.abs(woVal) < 100) return; 

                            let bestMatchIndex = -1;
                            dianPool.forEach((dianDoc, dIndex) => {
                                if (dianMatchedIndices.has(dIndex)) return;
                                const dianVal = (dianDoc[dianValueKey] as number || 0);
                                
                                if (Math.abs(woVal - dianVal) <= 1) {
                                    if (areDatesClose(woDoc.Fecha, dianDoc.Fecha)) {
                                        bestMatchIndex = dIndex;
                                    }
                                }
                            });

                            if (bestMatchIndex !== -1) {
                                const match = dianPool[bestMatchIndex];
                                const dianVal = (match[dianValueKey] as number || 0);
                                detalles.push({
                                    docNum: `${woDoc.Documento} (Coincidencia Valor)`,
                                    docNumWO: woDoc.Documento,
                                    docNumDIAN: match.DocumentoDIAN,
                                    fecha: woDoc.Fecha,
                                    valorWO: woVal,
                                    valorDIAN: dianVal,
                                    diferencia: woVal - dianVal,
                                    tipo: 'coincide'
                                });
                                woMatchedIndices.add(woIndex);
                                dianMatchedIndices.add(bestMatchIndex);
                            }
                        });
                        
                        woPool.forEach((woDoc, index) => { 
                            if (!woMatchedIndices.has(index)) { 
                                const vWO = woDoc[woValueKey] as number || 0; 
                                detalles.push({docNum:woDoc.Documento,docNumWO:woDoc.Documento,docNumDIAN:'---',fecha:woDoc.Fecha,valorWO:vWO,valorDIAN:0,diferencia:vWO,tipo:'faltaDIAN'});
                            }
                        });
                        dianPool.forEach((dianDoc, index) => { 
                            if (!dianMatchedIndices.has(index)) { 
                                const vDIAN = dianDoc[dianValueKey] as number || 0; 
                                detalles.push({docNum:dianDoc.DocumentoDIAN,docNumWO:'---',docNumDIAN:dianDoc.DocumentoDIAN,fecha:dianDoc.Fecha,valorWO:0,valorDIAN:vDIAN,diferencia:-vDIAN,tipo:'faltaWO'});
                            }
                        });
                        
                        detalles.sort((a,b) => {
                             if (a.tipo === 'coincide' && b.tipo !== 'coincide') return -1;
                             if (a.tipo !== 'coincide' && b.tipo === 'coincide') return 1;
                             return 0;
                        });

                        finalDiferencias.push({ ...dif, detalles });
                    }
                    return finalDiferencias;
                };

                const ingresosBase = compareGroups(groupData(ventasData, 'NIT', 'VentaNeta'), groupData(dianIngresos, 'NITReceptor', 'Base'));
                const ingresos = findDetailedDifferences(ingresosBase, ventasData, dianIngresos, d => String(d.NITReceptor).trim(), 'VentaNeta', 'Base');

                const ivaGenBase = compareGroups(groupData(ventasData, 'NIT', 'IVA'), groupData(dianIngresos, 'NITReceptor', 'IVA'));
                const ivaGen = findDetailedDifferences(ivaGenBase, ventasData, dianIngresos, d => String(d.NITReceptor).trim(), 'IVA', 'IVA');

                const getDianCompraNit = (row: DianData) => normalizeText(row.TipoDeDocumento).includes('documento soporte') ? String(row.NITReceptor).trim() : String(row.NITEMISOR).trim();

                const comprasBase = compareGroups(groupData(comprasData, 'NIT', 'VentaNeta'), groupData(dianCompras, getDianCompraNit, 'Base'));
                const compras = findDetailedDifferences(comprasBase, comprasData, dianCompras, getDianCompraNit, 'VentaNeta', 'Base');

                const ivaDescBase = compareGroups(groupData(comprasData, 'NIT', 'IVA'), groupData(dianCompras, getDianCompraNit, 'IVA'));
                const ivaDesc = findDetailedDifferences(ivaDescBase, comprasData, dianCompras, getDianCompraNit, 'IVA', 'IVA');

                const finalResults: ConciliacionResultados = { ingresos, ivaGen, compras, ivaDesc };
                
                updateAppState({ conciliacionResultados: finalResults });

            } catch (error) {
                console.error(error);
                showError("Ocurrió un error durante la conciliación.");
            } finally {
                setIsRunning(false);
                hideLoading();
            }
        }, 200);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Revisión Integral Contable</h2>
                    <p className="text-slate-500 mt-1">Cruces fiscales inteligentes (WO vs DIAN) con normalización automática.</p>
                </div>
                 <button
                    onClick={handleRunAnalysis}
                    disabled={!canRun || isRunning}
                    className="bg-slate-900 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isRunning ? <div className="animate-spin w-5 h-5 rounded-full border-2 border-white border-t-transparent"></div> : <BoltIcon className="w-5 h-5 text-amber-400" />}
                    {isRunning ? 'Analizando...' : 'Ejecutar Análisis'}
                </button>
            </div>

             {!canRun && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                    <p className="font-bold">Archivos Requeridos</p>
                    <p className="text-sm">Cargue los archivos de Ventas, Compras y DIAN en la pestaña 'Carga' para iniciar.</p>
                </div>
            )}

            {resultados && (
                <div className="space-y-6">
                     <Accordion title="1. Ingresos (Base)" count={resultados.ingresos.length}>
                       <ResultadosTable data={resultados.ingresos} />
                    </Accordion>
                    <Accordion title="2. IVA Generado" count={resultados.ivaGen.length}>
                       <ResultadosTable data={resultados.ivaGen} />
                    </Accordion>
                     <Accordion title="3. Compras y Gastos (Base)" count={resultados.compras.length}>
                       <ResultadosTable data={resultados.compras} />
                    </Accordion>
                     <Accordion title="4. IVA Descontable" count={resultados.ivaDesc.length}>
                       <ResultadosTable data={resultados.ivaDesc} />
                    </Accordion>
                </div>
            )}
        </div>
    );
};

export default RevisionContableStep;
