
import React, { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { ConciliacionResultados, DianData, Diferencia, VentasComprasData, DocumentoDetalle } from '../../types';
import { ChevronDownIcon } from '../../components/Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u00c0-\u00df]/g, "").trim().replace(/\s+/g, ' ');
};

const Accordion: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasData = count > 0;
    return (
        <div className="border border-gray-200 rounded-lg mb-2">
            <button
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center">
                    <span className="font-semibold text-gray-700">{title}</span>
                    <span className={`ml-3 text-sm font-mono px-2 py-0.5 rounded-full ${hasData ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {count} {count === 1 ? 'diferencia' : 'diferencias'}
                    </span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 bg-white">{children}</div>}
        </div>
    );
};

const ResultadosTable: React.FC<{ data: Diferencia[] }> = ({ data }) => {
    const [expandedNits, setExpandedNits] = useState(new Set<string>());

    const toggleExpand = (nit: string) => {
        setExpandedNits(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nit)) {
                newSet.delete(nit);
            } else {
                newSet.add(nit);
            }
            return newSet;
        });
    };

    if (data.length === 0) {
        return <p className="text-center text-gray-500 py-4">No se encontraron diferencias en esta categoría.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIT</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor WO</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor DIAN</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diferencia</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map(item => {
                        const isExpanded = expandedNits.has(item.nit);
                        const rowClass = Math.abs(item.diferencia) > 0 ? 'bg-red-50/50' : '';
                        return (
                            <React.Fragment key={item.nit}>
                                <tr className={rowClass}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                        {item.detalles && item.detalles.length > 0 && (
                                            <button onClick={() => toggleExpand(item.nit)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                                                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{item.nit}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600" title={item.nombre}>{item.nombre.substring(0, 40)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-right font-mono">{formatCurrency(item.valorWO)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-right font-mono">{formatCurrency(item.valorDIAN)}</td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-mono font-bold ${Math.abs(item.diferencia) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(item.diferencia)}</td>
                                </tr>
                                {isExpanded && item.detalles && item.detalles.length > 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-0 bg-gray-100">
                                            <div className="p-3">
                                                <table className="min-w-full text-xs bg-white rounded shadow-inner">
                                                    <thead className="bg-gray-200 text-gray-700">
                                                        <tr>
                                                            <th className="p-2 text-left font-semibold">Documento (WO)</th>
                                                            <th className="p-2 text-left font-semibold">Documento (DIAN)</th>
                                                            <th className="p-2 text-left font-semibold">Fecha</th>
                                                            <th className="p-2 text-right font-semibold">Valor WO</th>
                                                            <th className="p-2 text-right font-semibold">Valor DIAN</th>
                                                            <th className="p-2 text-right font-semibold">Diferencia</th>
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

const ConciliacionStep: React.FC = () => {
    const context = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);

    if (!context) { return <div>Loading...</div>; }
    const { appState, updateAppState, showError } = context;
    const { conciliacionResultados: resultados, files } = appState;

    const handleConciliar = () => {
        if (!files.ventas || !files.compras || !files.dian) {
            showError("Faltan archivos necesarios para la conciliación.");
            return;
        }

        setIsLoading(true);

        setTimeout(() => {
            try {
                const ventasData = files.ventas as VentasComprasData[];
                const comprasData = files.compras as VentasComprasData[];
                const dianData = files.dian as DianData[];

                // Split DIAN data based on business logic
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
                    const dianReceptor = dianData.find(d => String(d.NITReceptor).trim() === nit);
                    if (dianReceptor) return dianReceptor.NombreReceptor;
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

                const findDetailedDifferences = (
                    diferenciasBase: Diferencia[],
                    woData: VentasComprasData[],
                    dianRelevantData: DianData[],
                    dianNitResolver: (d: DianData) => string,
                    woValueKey: keyof VentasComprasData,
                    dianValueKey: keyof DianData
                ): Diferencia[] => {
                    const finalDiferencias: Diferencia[] = [];
                    
                    // Data Pools by NIT
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
                    
                    // Helper: Extract numeric ID (Normalización)
                    const getNormalizedId = (doc: string | null | undefined): string => {
                        if (!doc) return 'SIN-ID';
                        // Extract digits only
                        const matches = doc.match(/\d+/g);
                        if (!matches) return doc.trim(); // Fallback if no numbers
                        // Join and Parse Int to remove leading zeros, then back to string
                        return parseInt(matches.join(''), 10).toString();
                    };

                    // Helper: Check Date Tolerance (+/- 5 days)
                    const areDatesClose = (dateStr1: string, dateStr2: string, toleranceDays: number = 5): boolean => {
                        const parseDate = (str: string) => {
                            if (!str) return null;
                            const parts = str.split('/'); 
                            if (parts.length !== 3) return null;
                            // Assuming DD/MM/YYYY
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
                        
                        // --- MATCHING LOGIC ---
                        
                        // Pass 1: Match by Normalized ID + Fuzzy Date
                        woPool.forEach((woDoc, woIndex) => {
                            const woId = getNormalizedId(woDoc.Documento);
                            const woVal = (woDoc[woValueKey] as number || 0);
                            
                            // Find candidates in DIAN
                            let bestMatchIndex = -1;
                            let minValueDiff = Infinity;

                            dianPool.forEach((dianDoc, dIndex) => {
                                if (dianMatchedIndices.has(dIndex)) return;
                                
                                const dianId = getNormalizedId(dianDoc.DocumentoDIAN);
                                
                                // Check ID Match
                                if (woId === dianId) {
                                    // Check Date Tolerance
                                    if (areDatesClose(woDoc.Fecha, dianDoc.Fecha)) {
                                        const dianVal = (dianDoc[dianValueKey] as number || 0);
                                        const valDiff = Math.abs(woVal - dianVal);
                                        
                                        // Optimization: prefer exact value match
                                        if (valDiff < minValueDiff) {
                                            minValueDiff = valDiff;
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

                        // Pass 2: Fallback Match by EXACT Value + Fuzzy Date (when IDs are totally different)
                        woPool.forEach((woDoc, woIndex) => {
                            if (woMatchedIndices.has(woIndex)) return;
                            const woVal = (woDoc[woValueKey] as number || 0);
                            if (Math.abs(woVal) < 100) return; // Ignore small values for risk of false positives

                            let bestMatchIndex = -1;
                            dianPool.forEach((dianDoc, dIndex) => {
                                if (dianMatchedIndices.has(dIndex)) return;
                                const dianVal = (dianDoc[dianValueKey] as number || 0);
                                
                                // Exact value match (+/- 1 peso) within date range
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
                        
                        // Final Pass: Orphans
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
                        
                        // Sort details: Coincidencias first
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
                setIsLoading(false);
            }
        }, 50);
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Conciliación de Datos</h2>
            <p className="text-gray-500 mb-6 border-b pb-4">Cruza la información de tus informes de Ventas y Compras contra el informe de la DIAN para identificar discrepancias.</p>
            
            {isLoading ? (
                <div className="text-center py-10">
                    <div className="animate-spin w-8 h-8 rounded-full border-4 border-amber-200 border-t-slate-900 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Realizando conciliación inteligente (Normalización + Fuzzy Date Matching)...</p>
                </div>
            ) : !resultados ? (
                <div className="text-center py-10">
                    <button
                        onClick={handleConciliar}
                        disabled={!files.ventas || !files.compras || !files.dian}
                        className="bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Realizar Conciliación
                    </button>
                    {(!files.ventas || !files.compras || !files.dian) && (
                        <p className="text-xs text-red-500 mt-2">Cargue los archivos de Ventas, Compras y DIAN primero.</p>
                    )}
                </div>
            ) : (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Resultados de la Conciliación</h3>
                    <Accordion title="Ingresos (Base)" count={resultados.ingresos.length}>
                       <ResultadosTable data={resultados.ingresos} />
                    </Accordion>
                    <Accordion title="IVA Generado" count={resultados.ivaGen.length}>
                       <ResultadosTable data={resultados.ivaGen} />
                    </Accordion>
                     <Accordion title="Compras (Base)" count={resultados.compras.length}>
                       <ResultadosTable data={resultados.compras} />
                    </Accordion>
                     <Accordion title="IVA Descontable" count={resultados.ivaDesc.length}>
                       <ResultadosTable data={resultados.ivaDesc} />
                    </Accordion>
                </div>
            )}
        </div>
    );
};

export default ConciliacionStep;
