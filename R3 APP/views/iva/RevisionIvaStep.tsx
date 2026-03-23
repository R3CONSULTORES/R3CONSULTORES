
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { IvaRevisionResult, DocumentoDiscrepancia, AuxiliarData, DianData, VentasComprasData, DocumentoDiscrepanciaClasificacion } from '../../types';
import { CheckCircleIcon, ChevronDownIcon } from '../../components/Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
}).format(value);

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');
};

type GroupedDiscrepancy = {
    nit: string;
    nombre: string;
    totalValorWo: number;
    totalValorDian: number;
    totalDiferencia: number;
    detalles: DocumentoDiscrepancia[];
};

const groupDiscrepancies = (discrepancies: DocumentoDiscrepancia[]): GroupedDiscrepancy[] => {
    const grouped = new Map<string, GroupedDiscrepancy>();

    discrepancies.forEach(doc => {
        if (!grouped.has(doc.nit)) {
            grouped.set(doc.nit, {
                nit: doc.nit,
                nombre: doc.nombre,
                totalValorWo: 0,
                totalValorDian: 0,
                totalDiferencia: 0,
                detalles: [],
            });
        }
        const entry = grouped.get(doc.nit)!;
        entry.totalValorWo += doc.valorWo;
        entry.totalValorDian += doc.valorDian;
        entry.totalDiferencia += doc.diferencia;
        entry.detalles.push(doc);
    });

    return Array.from(grouped.values()).sort((a, b) => Math.abs(b.totalDiferencia) - Math.abs(a.totalDiferencia));
};

const TablaAgrupadaDiscrepancias: React.FC<{ title: string, data: GroupedDiscrepancy[] }> = ({ title, data }) => {
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

    if (!data || data.length === 0) {
        return (
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
                <div className="text-slate-500 text-center italic p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span>No se encontraron discrepancias.</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">{title} ({data.length})</h3>
            <div className="max-h-[60vh] overflow-auto border rounded-lg shadow-sm bg-white">
                <table className="min-w-full text-sm divide-y divide-slate-200">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr>
                            <th className="py-2 px-3 w-12"></th>
                            <th className="py-2 px-3 text-left font-semibold text-slate-600">NIT</th>
                            <th className="py-2 px-3 text-left font-semibold text-slate-600">Nombre</th>
                            <th className="py-2 px-3 text-right font-semibold text-slate-600">Total Valor (WO)</th>
                            <th className="py-2 px-3 text-right font-semibold text-slate-600">Total Valor (DIAN)</th>
                            <th className="py-2 px-3 text-right font-semibold text-slate-600">Total Diferencia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {data.map((item, index) => {
                            const isExpanded = expandedNits.has(item.nit);
                            return (
                                <React.Fragment key={item.nit}>
                                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                        <td className="py-1 px-3 text-center">
                                            <button onClick={() => toggleExpand(item.nit)} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
                                                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        </td>
                                        <td className="py-1 px-3 font-mono text-slate-800">{item.nit}</td>
                                        <td className="py-1 px-3 truncate text-slate-800" title={item.nombre}>{item.nombre}</td>
                                        <td className="py-1 px-3 text-right font-mono text-slate-800">{formatCurrency(item.totalValorWo)}</td>
                                        <td className="py-1 px-3 text-right font-mono text-slate-800">{formatCurrency(item.totalValorDian)}</td>
                                        <td className="py-1 px-3 text-right font-bold text-slate-800 font-mono">{formatCurrency(item.totalDiferencia)}</td>
                                    </tr>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={6} className="p-0 bg-slate-100">
                                                <div className="p-3">
                                                    <table className="min-w-full text-xs bg-white rounded shadow-inner">
                                                        <thead className="bg-slate-200 text-slate-800">
                                                            <tr>
                                                                <th className="p-2 text-left font-semibold">Documento</th>
                                                                <th className="p-2 text-left font-semibold">Fecha</th>
                                                                <th className="p-2 text-right font-semibold">Valor (WO)</th>
                                                                <th className="p-2 text-right font-semibold">Valor (DIAN)</th>
                                                                <th className="p-2 text-right font-semibold">Diferencia</th>
                                                                <th className="p-2 text-left font-semibold">Observación</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {item.detalles.map((doc, i) => (
                                                                <tr key={i} className="border-t border-slate-200">
                                                                    <td className="p-2 font-mono text-slate-800">{doc.docNum}</td>
                                                                    <td className="p-2 font-mono text-slate-800">{doc.fecha}</td>
                                                                    <td className="p-2 text-right font-mono text-slate-800">{formatCurrency(doc.valorWo)}</td>
                                                                    <td className="p-2 text-right font-mono text-slate-800">{formatCurrency(doc.valorDian)}</td>
                                                                    <td className="p-2 text-right font-mono font-bold text-slate-800">{formatCurrency(doc.diferencia)}</td>
                                                                    <td className="p-2 text-xs text-slate-800">{doc.observacion}</td>
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
        </div>
    );
};


const RevisionTableClasificacion: React.FC<{ title: string, data: DocumentoDiscrepanciaClasificacion[] }> = ({ title, data }) => {
    if (!data || data.length === 0) {
        return (
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
                <div className="text-slate-500 text-center italic p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span>No se encontraron discrepancias de clasificación.</span>
                </div>
            </div>
        );
    }

    const sortedData = [...data].sort((a, b) => Math.abs(b.diferenciaTotal) - Math.abs(a.diferenciaTotal));

    const getObservacionClass = (obs: DocumentoDiscrepanciaClasificacion['observacion']) => {
        switch (obs) {
            case 'Reclasificado': return 'text-blue-700 bg-blue-100';
            case 'Diferencia Valor': return 'text-orange-700 bg-orange-100';
            case 'Faltante en DIAN': return 'text-red-700 bg-red-100';
            case 'Faltante en WO': return 'text-purple-700 bg-purple-100';
            default: return 'text-slate-700 bg-slate-100';
        }
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">{title} ({data.length})</h3>
            <div className="max-h-[60vh] overflow-auto border rounded-lg shadow-sm bg-white">
                <table className="min-w-full text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr>
                            <th rowSpan={2} className="py-2 px-2 text-left font-semibold text-slate-600 align-bottom">Documento</th>
                            <th rowSpan={2} className="py-2 px-2 text-left font-semibold text-slate-600 align-bottom">Nombre</th>
                            <th colSpan={2} className="py-2 px-2 text-center font-semibold text-slate-600 border-b border-l">Contabilidad (WO)</th>
                            <th colSpan={2} className="py-2 px-2 text-center font-semibold text-slate-600 border-b border-l">DIAN</th>
                            <th colSpan={2} className="py-2 px-2 text-center font-semibold text-slate-600 border-b border-l">Diferencias</th>
                            <th rowSpan={2} className="py-2 px-2 text-left font-semibold text-slate-600 align-bottom">Observación</th>
                        </tr>
                        <tr>
                            <th className="py-1 px-2 text-right font-semibold text-slate-500 border-l">Base Gravada</th>
                            <th className="py-1 px-2 text-right font-semibold text-slate-500">Base No Gravada</th>
                            <th className="py-1 px-2 text-right font-semibold text-slate-500 border-l">Base Gravada</th>
                            <th className="py-1 px-2 text-right font-semibold text-slate-500">Base No Gravada</th>
                            <th className="py-1 px-2 text-right font-semibold text-slate-500 border-l">Dif. Gravada</th>
                            <th className="py-1 px-2 text-right font-semibold text-slate-500">Dif. No Gravada</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {sortedData.map((item, index) => (
                            <tr key={`${item.docNum}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                <td className="py-1 px-2 font-mono text-slate-800">{item.docNum}</td>
                                <td className="py-1 px-2 truncate text-slate-800" title={item.nombre}>{item.nombre.substring(0, 30)}</td>
                                <td className="py-1 px-2 text-right font-mono border-l text-slate-800">{formatCurrency(item.baseGravadaWo)}</td>
                                <td className="py-1 px-2 text-right font-mono text-slate-800">{formatCurrency(item.baseNoGravadaWo)}</td>
                                <td className="py-1 px-2 text-right font-mono border-l text-slate-800">{formatCurrency(item.baseGravadaDian)}</td>
                                <td className="py-1 px-2 text-right font-mono text-slate-800">{formatCurrency(item.baseNoGravadaDian)}</td>
                                <td className="py-1 px-2 text-right font-mono border-l font-bold text-slate-800">{formatCurrency(item.diferenciaGravado)}</td>
                                <td className="py-1 px-2 text-right font-mono font-bold text-slate-800">{formatCurrency(item.diferenciaNoGravado)}</td>
                                <td className="py-1 px-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getObservacionClass(item.observacion)}`}>{item.observacion}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface RevisionIvaStepProps {
    hideControls?: boolean;
}

const RevisionIvaStep: React.FC<RevisionIvaStepProps> = ({ hideControls = false }) => {
    const context = useContext(AppContext);

    if (!context) return <div>Cargando...</div>;

    const { appState, showLoading, hideLoading, showError, updateAppState } = context;
    const { ivaRevisionResult: reviewResult } = appState;

    const groupedData = useMemo(() => {
        if (!reviewResult) return null;
        return {
            ingresos: groupDiscrepancies([...reviewResult.ingresos.faltantesEnDian, ...reviewResult.ingresos.faltantesEnWo, ...reviewResult.ingresos.conDiferenciaValor]),
            ivaGenerado: groupDiscrepancies([...reviewResult.ivaGenerado.faltantesEnDian, ...reviewResult.ivaGenerado.faltantesEnWo, ...reviewResult.ivaGenerado.conDiferenciaValor]),
            compras: groupDiscrepancies([...reviewResult.compras.faltantesEnDian, ...reviewResult.compras.faltantesEnWo, ...reviewResult.compras.conDiferenciaValor]),
            ivaDescontable: groupDiscrepancies([...reviewResult.ivaDescontable.faltantesEnDian, ...reviewResult.ivaDescontable.faltantesEnWo, ...reviewResult.ivaDescontable.conDiferenciaValor]),
        };
    }, [reviewResult]);

    // Note: Logic has been moved to handleGlobalAudit in parent or duplicated for safety here.
    // For local "Generate" button support when NOT hiding controls, we keep this handler.
    const compareDocuments = (
        woData: any[],
        dianData: DianData[],
        woValueKey: string,
        dianValueKey: keyof DianData,
        dianNitResolver: (d: DianData) => string
    ): { faltantesEnDian: DocumentoDiscrepancia[], faltantesEnWo: DocumentoDiscrepancia[], conDiferenciaValor: DocumentoDiscrepancia[] } => {
        
        const getDocKey = (doc: string | null | undefined): string => {
            if (!doc) return '';
            let s = doc.toString().toLowerCase().trim();
            const parts = s.split(/\s+/);
            if (parts.length > 1 && /^[a-z]+$/.test(parts[0]) && /^[a-z]/.test(parts[1])) {
                s = parts.slice(1).join(' ');
            }
            return s.replace(/[^a-z0-9]/g, '');
        };
        const TOLERANCE = 5;
    
        // 1. Group data by NIT
        const woByNit = new Map<string, any[]>();
        woData.forEach(row => {
            const nit = String(row.NIT || row.nit).trim();
            if (!nit) return;
            if (!woByNit.has(nit)) woByNit.set(nit, []);
            woByNit.get(nit)!.push(row);
        });
    
        const dianByNit = new Map<string, DianData[]>();
        dianData.forEach(row => {
            const nit = dianNitResolver(row);
            if (!nit) return;
            if (!dianByNit.has(nit)) dianByNit.set(nit, []);
            dianByNit.get(nit)!.push(row);
        });
    
        const faltantesEnDian: DocumentoDiscrepancia[] = [];
        const faltantesEnWo: DocumentoDiscrepancia[] = [];
        const conDiferenciaValor: DocumentoDiscrepancia[] = [];
    
        const allNits = new Set([...woByNit.keys(), ...dianByNit.keys()]);
    
        const isIngresoRow = (d: DianData) => {
            const grupo = normalizeText(d.Grupo);
            const tipoDoc = normalizeText(d.TipoDeDocumento);
            return grupo.includes('emitido') && !tipoDoc.includes('documento soporte');
        };
    
        // 2. Iterate through each NIT
        allNits.forEach(nit => {
            const woPool = [...(woByNit.get(nit) || [])];
            const dianPool = [...(dianByNit.get(nit) || [])];
            
            const woMatched = new Array(woPool.length).fill(false);
            const dianMatched = new Array(dianPool.length).fill(false);
    
            // Pass 1: Match by exact document number
            woPool.forEach((woDoc, i) => {
                const woKey = getDocKey(woDoc.Documento || woDoc.docNum);
                if (!woKey) return;
    
                const dianIndex = dianPool.findIndex((dianDoc, j) => !dianMatched[j] && getDocKey(dianDoc.DocumentoDIAN) === woKey);
    
                if (dianIndex !== -1) {
                    const dianDoc = dianPool[dianIndex];
                    const valorWo = woDoc[woValueKey] || 0;
                    const valorDian = dianDoc[dianValueKey] as number || 0;
                    const diferencia = valorWo - valorDian;
    
                    if (Math.abs(diferencia) > TOLERANCE) {
                        conDiferenciaValor.push({
                            docNum: woDoc.Documento || woDoc.docNum,
                            nit: nit,
                            nombre: woDoc.Cliente || woDoc.nombre,
                            fecha: woDoc.Fecha || woDoc.fecha,
                            valorWo,
                            valorDian,
                            diferencia,
                            observacion: 'Diferencia de valor'
                        });
                    }
                    woMatched[i] = true;
                    dianMatched[dianIndex] = true;
                }
            });
    
            // Pass 2: Match by value (for unmatched documents)
            woPool.forEach((woDoc, i) => {
                if (woMatched[i]) return;
                const valorWo = woDoc[woValueKey] || 0;
                if (Math.abs(valorWo) < TOLERANCE) return;
    
                const dianIndex = dianPool.findIndex((dianDoc, j) => !dianMatched[j] && Math.abs(valorWo - (dianDoc[dianValueKey] as number || 0)) <= TOLERANCE);
                
                if (dianIndex !== -1) {
                    woMatched[i] = true;
                    dianMatched[dianIndex] = true;
                }
            });
    
            // Pass 3: Match by opposite value (for credit notes)
            woPool.forEach((woDoc, i) => {
                if (woMatched[i]) return;
                const valorWo = woDoc[woValueKey] || 0;
                if (Math.abs(valorWo) < TOLERANCE) return;
    
                const dianIndex = dianPool.findIndex((dianDoc, j) => !dianMatched[j] && Math.abs(valorWo + (dianDoc[dianValueKey] as number || 0)) <= TOLERANCE);
    
                if (dianIndex !== -1) {
                    woMatched[i] = true;
                    dianMatched[dianIndex] = true;
                }
            });
    
            // 3. Report unmatched documents
            woPool.forEach((woDoc, i) => {
                if (!woMatched[i]) {
                    const valorWo = woDoc[woValueKey] || 0;
                    if (Math.abs(valorWo) > TOLERANCE) {
                        faltantesEnDian.push({
                            docNum: woDoc.Documento || woDoc.docNum,
                            nit: nit,
                            nombre: woDoc.Cliente || woDoc.nombre,
                            fecha: woDoc.Fecha || woDoc.fecha,
                            valorWo,
                            valorDian: 0,
                            diferencia: valorWo,
                            observacion: 'Faltante en DIAN'
                        });
                    }
                }
            });
            dianPool.forEach((dianDoc, j) => {
                if (!dianMatched[j]) {
                    const valorDian = dianDoc[dianValueKey] as number || 0;
                    if (Math.abs(valorDian) > TOLERANCE) {
                        faltantesEnWo.push({
                            docNum: dianDoc.DocumentoDIAN,
                            nit: nit,
                            nombre: isIngresoRow(dianDoc) ? dianDoc.NombreReceptor : dianDoc.NombreEmisor,
                            fecha: dianDoc.Fecha,
                            valorWo: 0,
                            valorDian,
                            diferencia: -valorDian,
                            observacion: 'Faltante en WO'
                        });
                    }
                }
            });
        });
    
        return { faltantesEnDian, faltantesEnWo, conDiferenciaValor };
    };

    const handleGenerateReview = () => {
        const { files: { iva_auxiliar: auxiliar, iva_dian: dian, iva_ventas: ventas, iva_compras }, incomeAccountVatClassification } = appState;
        if (!auxiliar || !dian || !ventas || !iva_compras) {
            showError("Asegúrese de que los archivos 'Auxiliar', 'Ventas', 'Compras' y 'DIAN' para IVA estén cargados.");
            return;
        }
        showLoading("Generando revisión de IVA...");

        setTimeout(() => {
            try {
                const getDocKey = (doc: string | null | undefined): string => {
                    if (!doc) return '';
                    let s = doc.toString().toLowerCase().trim();
                    const parts = s.split(/\s+/);
                    if (parts.length > 1 && /^[a-z]+$/.test(parts[0]) && /^[a-z]/.test(parts[1])) {
                        s = parts.slice(1).join(' ');
                    }
                    return s.replace(/[^a-z0-9]/g, '');
                };
                const TOLERANCE = 5;

                // --- 1. CLASIFICACIÓN DE INGRESOS ---
                const woDocsMap = new Map<string, { baseGravada: number; baseNoGravada: number; total: number; originalDoc: VentasComprasData }>();
                const auxiliarMapByDoc = new Map<string, AuxiliarData[]>();
                auxiliar.forEach(row => {
                    const docKey = getDocKey(row.DocNum);
                    if (docKey) {
                        const movs = auxiliarMapByDoc.get(docKey) || [];
                        movs.push(row);
                        auxiliarMapByDoc.set(docKey, movs);
                    }
                });

                ventas.forEach(venta => {
                    const docKey = getDocKey(venta.Documento);
                    if (!docKey) return;
                    const movimientos = auxiliarMapByDoc.get(docKey) || [];
                    const incomeMov = movimientos.find(m => m.Cuenta.startsWith('4'));
                    const cuentaCode = incomeMov ? incomeMov.Cuenta.split(' ')[0] : '4_NO_ASIGNADA';
                    const classification = incomeAccountVatClassification.get(cuentaCode) || 'no_clasificado';
                    let baseGravada = 0;
                    let baseNoGravada = 0;
                    
                    if (classification === 'gravado') {
                        baseGravada = venta.VentaNeta;
                    } else {
                        baseNoGravada = venta.VentaNeta;
                    }
                    woDocsMap.set(docKey, { baseGravada, baseNoGravada, total: venta.VentaNeta, originalDoc: venta });
                });

                const dianDocsMap = new Map<string, { baseGravada: number; baseNoGravada: number; total: number; originalDoc: DianData }>();
                dian.forEach(row => {
                    const normalizedGrupo = normalizeText(row.Grupo);
                    const normalizedTipoDoc = normalizeText(row.TipoDeDocumento);
                    const isIngresoDian = normalizedGrupo.includes('emitido') && (
                        normalizedTipoDoc === 'factura electronica' || 
                        normalizedTipoDoc === 'nota de credito electronica' ||
                        normalizedTipoDoc === 'nota debito electronica'
                    );
                    if (!isIngresoDian) return;
                    const docKey = getDocKey(row.DocumentoDIAN);
                    if (!docKey) return;
                    
                    const iva = row.IVA;
                    const total = row.Total;
                    const baseGravada = (iva !== 0) ? (iva / 0.19) : 0;
                    const baseNoGravada = total - iva - baseGravada;
                    dianDocsMap.set(docKey, { baseGravada, baseNoGravada, total, originalDoc: row });
                });

                const hallazgosClasificacion: DocumentoDiscrepanciaClasificacion[] = [];
                const allDocKeys = new Set([...woDocsMap.keys(), ...dianDocsMap.keys()]);
                
                allDocKeys.forEach(key => {
                    const woDoc = woDocsMap.get(key);
                    const dianDoc = dianDocsMap.get(key);
                    
                    if (woDoc && dianDoc) {
                        const difGravada = woDoc.baseGravada - dianDoc.baseGravada;
                        const difNoGravada = woDoc.baseNoGravada - dianDoc.baseNoGravada;
                        if (Math.abs(difGravada) > TOLERANCE || Math.abs(difNoGravada) > TOLERANCE) {
                             hallazgosClasificacion.push({
                                docNum: woDoc.originalDoc.Documento,
                                nit: woDoc.originalDoc.NIT,
                                nombre: woDoc.originalDoc.Cliente,
                                fecha: woDoc.originalDoc.Fecha,
                                baseGravadaWo: woDoc.baseGravada,
                                baseNoGravadaWo: woDoc.baseNoGravada,
                                baseGravadaDian: dianDoc.baseGravada,
                                baseNoGravadaDian: dianDoc.baseNoGravada,
                                diferenciaGravado: difGravada,
                                diferenciaNoGravado: difNoGravada,
                                diferenciaTotal: difGravada + difNoGravada,
                                observacion: Math.abs(woDoc.total - dianDoc.total) < TOLERANCE ? 'Reclasificado' : 'Diferencia Valor'
                            });
                        }
                    } else if (woDoc && !dianDoc) {
                         hallazgosClasificacion.push({
                            docNum: woDoc.originalDoc.Documento, nit: woDoc.originalDoc.NIT, nombre: woDoc.originalDoc.Cliente, fecha: woDoc.originalDoc.Fecha,
                            baseGravadaWo: woDoc.baseGravada, baseNoGravadaWo: woDoc.baseNoGravada, baseGravadaDian: 0, baseNoGravadaDian: 0,
                            diferenciaGravado: woDoc.baseGravada, diferenciaNoGravado: woDoc.baseNoGravada, diferenciaTotal: woDoc.total, observacion: 'Faltante en DIAN'
                        });
                    } else if (!woDoc && dianDoc) {
                        hallazgosClasificacion.push({
                            docNum: dianDoc.originalDoc.DocumentoDIAN, nit: dianDoc.originalDoc.NITReceptor, nombre: dianDoc.originalDoc.NombreReceptor, fecha: dianDoc.originalDoc.Fecha,
                            baseGravadaWo: 0, baseNoGravadaWo: 0, baseGravadaDian: dianDoc.baseGravada, baseNoGravadaDian: dianDoc.baseNoGravada,
                            diferenciaGravado: -dianDoc.baseGravada, diferenciaNoGravado: -dianDoc.baseNoGravada, diferenciaTotal: -dianDoc.total, observacion: 'Faltante en WO'
                        });
                    }
                });

                // --- 2. CONCILIACIÓN DE VALORES ---
                const isIngreso = (d: DianData) => {
                    const grupo = normalizeText(d.Grupo);
                    const tipoDoc = normalizeText(d.TipoDeDocumento);
                    return grupo.includes('emitido') && !tipoDoc.includes('documento soporte');
                };
                const dianIngresos = dian!.filter(isIngreso);
                const dianCompras = dian!.filter(d => !isIngreso(d));

                const getDianCompraNit = (row: DianData) => normalizeText(row.TipoDeDocumento).includes('documento soporte') ? String(row.NITReceptor).trim() : String(row.NITEMISOR).trim();

                const compras = iva_compras;

                const resultadoIngresos = compareDocuments(ventas!, dianIngresos, 'VentaNeta', 'Base', d => String(d.NITReceptor).trim());
                const resultadoIvaGenerado = compareDocuments(ventas!, dianIngresos, 'IVA', 'IVA', d => String(d.NITReceptor).trim());
                const resultadoCompras = compareDocuments(compras, dianCompras, 'VentaNeta', 'Base', getDianCompraNit);
                const resultadoIvaDescontable = compareDocuments(compras, dianCompras, 'IVA', 'IVA', getDianCompraNit);

                updateAppState({ 
                    ivaRevisionResult: {
                        ingresos: resultadoIngresos,
                        ingresosClasificacion: hallazgosClasificacion,
                        ivaGenerado: resultadoIvaGenerado,
                        compras: resultadoCompras,
                        ivaDescontable: resultadoIvaDescontable,
                    }
                });

            } catch (error) {
                showError(error instanceof Error ? error.message : "Error al generar la revisión.");
            } finally {
                hideLoading();
            }
        }, 50);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            {!hideControls && (
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-slate-700">Revisión de Cruces (Contabilidad vs DIAN)</h2>
                    <button
                        onClick={handleGenerateReview}
                        disabled={!appState.ivaLiquidationResult}
                        className="bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-slate-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Generar Revisión
                    </button>
                </div>
            )}
            
            {!reviewResult || !groupedData ? (
                <div className="text-center py-10 text-slate-500">
                    <p>Presione "Ejecutar Auditoría" para cruzar los datos y encontrar discrepancias.</p>
                    {!appState.ivaLiquidationResult && <p className="text-sm text-red-500 mt-2">Requiere haber generado la Base de Datos en la pestaña 'Control' primero.</p>}
                </div>
            ) : (
                <div className="space-y-8">
                     <RevisionTableClasificacion title="Hallazgos en Clasificación de Ingresos (Base)" data={reviewResult.ingresosClasificacion} />
                     <TablaAgrupadaDiscrepancias title="Hallazgos en Ingresos (Base)" data={groupedData.ingresos} />
                     <TablaAgrupadaDiscrepancias title="Hallazgos en IVA Generado" data={groupedData.ivaGenerado} />
                     <TablaAgrupadaDiscrepancias title="Hallazgos en Compras (Base)" data={groupedData.compras} />
                     <TablaAgrupadaDiscrepancias title="Hallazgos en IVA Descontable" data={groupedData.ivaDescontable} />
                </div>
            )}
        </div>
    );
};

export default RevisionIvaStep;
