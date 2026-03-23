import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { ChevronDownIcon } from '../../components/Icons';
import type { AuxiliarData, VentasComprasData, DianData } from '../../types';

// Grouped data structures for Auxiliar tab
interface TerceroData {
    nit: string;
    nombre: string;
    totalDebitos: number;
    totalCreditos: number;
    movimientos: AuxiliarData[];
}
interface AccountData {
    totalDebitos: number;
    totalCreditos: number;
    movimientosCount: number;
    terceros: Map<string, TerceroData>;
}

// Data structure for Compras/Ventas vs Auxiliar tab
interface DocumentoConAuxiliar {
    documento: string;
    fecha: string;
    cliente: string;
    valorPrincipal: number;
    movimientosAux: AuxiliarData[];
}


const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return '$ 0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(value);
};

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u00c0-\u00df]/g, "").trim().replace(/\s+/g, ' ');
};


const RevisionStep: React.FC = () => {
    const context = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('auxiliar');
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    if (!context) {
        return <div>Loading...</div>
    }

    const { appState } = context;

    const normalizeDocKey = (key: string | null | undefined): string => {
        if (!key) return '';
        let s = key.toString().toLowerCase().trim();
        
        // Heuristic to remove common, unofficial prefixes (e.g., "FV FE 256", "DMC NCC17").
        // This assumes the first word is a removable prefix if the second word also starts with letters.
        const parts = s.split(/\s+/);
        if (parts.length > 1 && /^[a-z]+$/.test(parts[0]) && /^[a-z]/.test(parts[1])) {
            s = parts.slice(1).join(' ');
        }
        
        // Remove all non-alphanumeric characters for a final, clean key.
        return s.replace(/[^a-z0-9]/g, '');
    };

    const auxiliarData = useMemo(() => {
        const auxiliar = appState.files.auxiliar;
        if (!auxiliar) return null;

        const totalDebitos = auxiliar.reduce((sum, row) => sum + (row.Debitos || 0), 0);
        const totalCreditos = auxiliar.reduce((sum, row) => sum + (row.Creditos || 0), 0);

        const grouped = new Map<string, AccountData>();

        auxiliar.forEach(mov => {
            if (!grouped.has(mov.Cuenta)) {
                grouped.set(mov.Cuenta, {
                    totalDebitos: 0,
                    totalCreditos: 0,
                    movimientosCount: 0,
                    terceros: new Map<string, TerceroData>()
                });
            }
            const cuentaGroup = grouped.get(mov.Cuenta)!;
            cuentaGroup.totalDebitos += mov.Debitos;
            cuentaGroup.totalCreditos += mov.Creditos;
            cuentaGroup.movimientosCount += 1;
            
            const terceroKey = `${mov.Tercero.trim()} (NIT: ${mov.NIT})`;

            if (!cuentaGroup.terceros.has(terceroKey)) {
                cuentaGroup.terceros.set(terceroKey, {
                    nit: mov.NIT,
                    nombre: mov.Tercero,
                    totalDebitos: 0,
                    totalCreditos: 0,
                    movimientos: [],
                });
            }
            const terceroGroup = cuentaGroup.terceros.get(terceroKey)!;
            terceroGroup.totalDebitos += mov.Debitos;
            terceroGroup.totalCreditos += mov.Creditos;
            terceroGroup.movimientos.push(mov);
        });

        return {
            totalRows: auxiliar.length,
            totalDebitos,
            totalCreditos,
            diferencia: totalDebitos - totalCreditos,
            groupedData: grouped,
        };

    }, [appState.files.auxiliar]);

    const comprasVsAuxiliarData = useMemo(() => {
        const { compras, auxiliar } = appState.files;
        if (!compras || !auxiliar) return null;

        const auxiliarMap = new Map<string, AuxiliarData[]>();
        auxiliar.forEach(mov => {
            const key = normalizeDocKey(mov.DocNum);
            if (!key) return;
            if (!auxiliarMap.has(key)) {
                auxiliarMap.set(key, []);
            }
            auxiliarMap.get(key)!.push(mov);
        });

        const result: DocumentoConAuxiliar[] = compras.map(compra => {
            const key = normalizeDocKey(compra.Documento);
            const movimientosAux = auxiliarMap.get(key) || [];
            
            const isDevolucion = normalizeDocKey(compra.Documento).includes('dvc') || movimientosAux.some(m => normalizeText(m.Nota).includes('devolucion'));
            
            const valorPrincipal = isDevolucion ? -compra.VentaNeta : compra.VentaNeta;

            return {
                documento: compra.Documento,
                fecha: compra.Fecha,
                cliente: compra.Cliente,
                valorPrincipal,
                movimientosAux,
            };
        });

        return result;

    }, [appState.files.compras, appState.files.auxiliar]);

    const ventasVsAuxiliarData = useMemo(() => {
        const { ventas, auxiliar } = appState.files;
        if (!ventas || !auxiliar) return null;

        const auxiliarMap = new Map<string, AuxiliarData[]>();
        auxiliar.forEach(mov => {
            const key = normalizeDocKey(mov.DocNum);
            if (!key) return;
            if (!auxiliarMap.has(key)) {
                auxiliarMap.set(key, []);
            }
            auxiliarMap.get(key)!.push(mov);
        });

        const result: DocumentoConAuxiliar[] = ventas.map(venta => {
            const key = normalizeDocKey(venta.Documento);
            const movimientosAux = auxiliarMap.get(key) || [];
            
            const isDevolucion = normalizeDocKey(venta.Documento).toLowerCase().includes('nc') || movimientosAux.some(m => normalizeText(m.Nota).includes('devolucion'));
            
            const valorPrincipal = isDevolucion ? -venta.VentaNeta : venta.VentaNeta;

            return {
                documento: venta.Documento,
                fecha: venta.Fecha,
                cliente: venta.Cliente,
                valorPrincipal,
                movimientosAux,
            };
        });

        return result;

    }, [appState.files.ventas, appState.files.auxiliar]);
    
    const dianSummaryData = useMemo(() => {
        const dian = appState.files.dian;
        if (!dian) return null;

        let totalIngresosBase = 0;
        let totalEgresosBase = 0;
        let totalIva = 0;

        dian.forEach(row => {
            const tipoDoc = normalizeText(row.TipoDeDocumento);
            const grupo = normalizeText(row.Grupo);
    
            // An 'Ingreso' is an issued document that is NOT a support document.
            const isIngreso = grupo.includes('emitido') && !tipoDoc.includes('documento soporte');
            
            totalIva += row.IVA;

            if (isIngreso) {
                totalIngresosBase += row.Base;
            } else {
                // Everything else (received docs, or issued support docs) is an 'Egreso'.
                totalEgresosBase += row.Base;
            }
        });

        return {
            totalDocumentos: dian.length,
            totalIngresosBase,
            totalEgresosBase,
            totalIva,
            data: dian,
        };
    }, [appState.files.dian]);
    
    const toggleExpand = (key: string) => {
        setExpandedKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const tabs = [
        { id: 'auxiliar', label: 'Auxiliar General' },
        { id: 'compras', label: 'Compras (vs Auxiliar)' },
        { id: 'ventas', label: 'Ventas (vs Auxiliar)' },
        { id: 'dian', label: 'DIAN' },
    ];

    const renderAuxiliarTab = () => {
        if (!auxiliarData) {
            return <p className="text-center text-gray-500 italic mt-6">Datos del Auxiliar General no cargados.</p>;
        }
        
        const sortedAccounts = Array.from(auxiliarData.groupedData.entries()).sort(([a], [b]) => a.localeCompare(b));

        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Resumen: Auxiliar General</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Summary Cards */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">Filas Procesadas</p>
                        <p className="text-2xl font-bold text-blue-900">{auxiliarData.totalRows.toLocaleString('es-CO')}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <p className="text-sm text-green-800">Total Débitos</p>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(auxiliarData.totalDebitos)}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <p className="text-sm text-red-800">Total Créditos</p>
                        <p className="text-2xl font-bold text-red-900">{formatCurrency(auxiliarData.totalCreditos)}</p>
                    </div>
                    <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-800">Diferencia</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(auxiliarData.diferencia)}</p>
                    </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">Resumen por Cuenta, Tercero y Movimiento</h3>
                <div className="space-y-2">
                    {sortedAccounts.map(([cuenta, cuentaData]) => {
                        const cuentaKey = `cuenta-${cuenta}`;
                        const isCuentaExpanded = expandedKeys.has(cuentaKey);
                        const sortedTerceros = Array.from(cuentaData.terceros.entries()).sort(([a], [b]) => a.localeCompare(b));

                        return (
                            <div key={cuentaKey} className="bg-white border border-gray-200 rounded-md">
                                {/* Account Header */}
                                <button onClick={() => toggleExpand(cuentaKey)} className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50">
                                    <div className="flex-1">
                                        <span className="font-semibold text-blue-600">{cuenta}</span>
                                        <span className="text-sm text-gray-500 ml-2">({cuentaData.movimientosCount} mov.)</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm font-mono text-green-600">D: {formatCurrency(cuentaData.totalDebitos)}</span>
                                        <span className="text-sm font-mono text-red-600">C: {formatCurrency(cuentaData.totalCreditos)}</span>
                                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isCuentaExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {/* Terceros List */}
                                {isCuentaExpanded && (
                                    <div className="px-4 pb-2 space-y-1">
                                        {sortedTerceros.map(([terceroKeyStr, terceroData]) => {
                                            const fullTerceroKey = `tercero-${cuenta}-${terceroKeyStr}`;
                                            const isTerceroExpanded = expandedKeys.has(fullTerceroKey);

                                            return (
                                                <div key={fullTerceroKey} className="border-t">
                                                    {/* Tercero Header */}
                                                    <button onClick={() => toggleExpand(fullTerceroKey)} className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50">
                                                        <div className="flex-1">
                                                            <span className="font-medium text-gray-800 text-sm">{terceroData.nombre}</span>
                                                            <span className="text-xs text-gray-500 ml-2">(NIT: {terceroData.nit}) ({terceroData.movimientos.length} mov.)</span>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className="text-sm font-mono text-green-600">{formatCurrency(terceroData.totalDebitos)}</span>
                                                            <span className="text-sm font-mono text-red-600">{formatCurrency(terceroData.totalCreditos)}</span>
                                                            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isTerceroExpanded ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>
                                                    {/* Movements Table */}
                                                    {isTerceroExpanded && (
                                                        <div className="pl-8 pr-4 pb-3">
                                                            <table className="min-w-full text-xs bg-gray-50">
                                                                <thead className="font-medium text-gray-500">
                                                                    <tr>
                                                                        <th className="p-2 text-left">Fecha</th>
                                                                        <th className="p-2 text-left">Doc Num</th>
                                                                        <th className="p-2 text-left">Nota</th>
                                                                        <th className="p-2 text-right">Débito</th>
                                                                        <th className="p-2 text-right">Crédito</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="text-gray-700">
                                                                    {terceroData.movimientos.map((mov, index) => (
                                                                        <tr key={index} className="border-t border-gray-200">
                                                                            <td className="p-2">{mov.Fecha}</td>
                                                                            <td className="p-2">{mov.DocNum}</td>
                                                                            <td className="p-2">{mov.Nota}</td>
                                                                            <td className="p-2 text-right font-mono">{mov.Debitos > 0 ? formatCurrency(mov.Debitos) : '$ 0'}</td>
                                                                            <td className="p-2 text-right font-mono">{mov.Creditos > 0 ? formatCurrency(mov.Creditos) : '$ 0'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const renderComprasTab = () => {
        if (!comprasVsAuxiliarData) {
            return <p className="text-center text-gray-500 italic mt-6">Datos de Compras o Auxiliar no cargados.</p>;
        }

        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Resumen: Informe de Compras (Cruzado con Auxiliar)</h3>
                <div className="space-y-2">
                    {comprasVsAuxiliarData.map((item, index) => {
                        const itemKey = `compra-${index}-${item.documento}`;
                        const isExpanded = expandedKeys.has(itemKey);

                        return (
                            <div key={itemKey} className="bg-white border border-gray-200 rounded-md">
                                <button onClick={() => toggleExpand(itemKey)} className="w-full flex items-center p-3 text-left hover:bg-gray-50">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{item.documento}</p>
                                        <p className="text-sm text-gray-600">{item.cliente}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500">{item.fecha}</span>
                                        <span className="text-base font-semibold text-blue-600 w-32 text-right">{formatCurrency(item.valorPrincipal)}</span>
                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                                            ({item.movimientosAux.length} Aux)
                                        </span>
                                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="px-4 pb-3">
                                        <div className="border-t pt-2">
                                            <table className="min-w-full text-sm">
                                                <thead className="font-medium text-gray-500">
                                                    <tr>
                                                        <th className="py-1 px-2 text-left w-[20%]">Cuenta</th>
                                                        <th className="py-1 px-2 text-left w-[50%]">Nota</th>
                                                        <th className="py-1 px-2 text-right">Débito</th>
                                                        <th className="py-1 px-2 text-right">Crédito</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-gray-700">
                                                    {item.movimientosAux.map((mov, movIndex) => (
                                                        <tr key={movIndex}>
                                                            <td className="py-1 px-2 align-top">{mov.Cuenta}</td>
                                                            <td className="py-1 px-2 align-top">{mov.Nota}</td>
                                                            <td className="py-1 px-2 text-right font-mono text-green-700 align-top">{formatCurrency(mov.Debitos)}</td>
                                                            <td className="py-1 px-2 text-right font-mono text-red-700 align-top">{formatCurrency(mov.Creditos)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    const renderVentasTab = () => {
        if (!ventasVsAuxiliarData) {
            return <p className="text-center text-gray-500 italic mt-6">Datos de Ventas o Auxiliar no cargados.</p>;
        }

        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Resumen: Informe de Ventas (Cruzado con Auxiliar)</h3>
                <div className="space-y-2">
                    {ventasVsAuxiliarData.map((item, index) => {
                        const itemKey = `venta-${index}-${item.documento}`;
                        const isExpanded = expandedKeys.has(itemKey);

                        return (
                            <div key={itemKey} className="bg-white border border-gray-200 rounded-md">
                                <button onClick={() => toggleExpand(itemKey)} className="w-full flex items-center p-3 text-left hover:bg-gray-50">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{item.documento}</p>
                                        <p className="text-sm text-gray-600">{item.cliente}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500">{item.fecha}</span>
                                        <span className="text-base font-semibold text-blue-600 w-32 text-right">{formatCurrency(item.valorPrincipal)}</span>
                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                                            ({item.movimientosAux.length} Aux)
                                        </span>
                                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="px-4 pb-3">
                                        <div className="border-t pt-2">
                                            <table className="min-w-full text-sm">
                                                <thead className="font-medium text-gray-500">
                                                    <tr>
                                                        <th className="py-1 px-2 text-left w-[20%]">Cuenta</th>
                                                        <th className="py-1 px-2 text-left w-[50%]">Nota</th>
                                                        <th className="py-1 px-2 text-right">Débito</th>
                                                        <th className="py-1 px-2 text-right">Crédito</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-gray-700">
                                                    {item.movimientosAux.map((mov, movIndex) => (
                                                        <tr key={movIndex}>
                                                            <td className="py-1 px-2 align-top">{mov.Cuenta}</td>
                                                            <td className="py-1 px-2 align-top">{mov.Nota}</td>
                                                            <td className="py-1 px-2 text-right font-mono text-green-700 align-top">{formatCurrency(mov.Debitos)}</td>
                                                            <td className="py-1 px-2 text-right font-mono text-red-700 align-top">{formatCurrency(mov.Creditos)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    const renderDianTab = () => {
        if (!dianSummaryData) {
            return <p className="text-center text-gray-500 italic mt-6">Datos del informe DIAN no cargados.</p>;
        }

        return (
            <div>
                 <h3 className="text-xl font-semibold text-gray-800 mb-4">Resumen: Informe DIAN</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">Total Ingresos (Base)</p>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(dianSummaryData.totalIngresosBase)}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                        <p className="text-sm text-orange-800">Total Egresos (Base)</p>
                        <p className="text-2xl font-bold text-orange-900">{formatCurrency(dianSummaryData.totalEgresosBase)}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                        <p className="text-sm text-purple-800">Total IVA Reportado</p>
                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(dianSummaryData.totalIva)}</p>
                    </div>
                     <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-800">Total Documentos</p>
                        <p className="text-2xl font-bold text-gray-900">{dianSummaryData.totalDocumentos.toLocaleString('es-CO')}</p>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-auto border rounded-lg shadow-sm">
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left font-medium text-gray-600">Tipo Doc.</th>
                                <th className="py-2 px-3 text-left font-medium text-gray-600">Documento</th>
                                <th className="py-2 px-3 text-left font-medium text-gray-600">Fecha</th>
                                <th className="py-2 px-3 text-left font-medium text-gray-600">Emisor</th>
                                <th className="py-2 px-3 text-left font-medium text-gray-600">Receptor</th>
                                <th className="py-2 px-3 text-right font-medium text-gray-600">Base</th>
                                <th className="py-2 px-3 text-right font-medium text-gray-600">IVA</th>
                                <th className="py-2 px-3 text-right font-medium text-gray-600">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {dianSummaryData.data.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-700 truncate" title={item.TipoDeDocumento}>{item.TipoDeDocumento.substring(0, 20)}</td>
                                    <td className="py-2 px-3 text-gray-700">{item.DocumentoDIAN}</td>
                                    <td className="py-2 px-3 text-gray-700">{item.Fecha}</td>
                                    <td className="py-2 px-3 text-gray-700 truncate" title={item.NombreEmisor}>{item.NombreEmisor.substring(0, 30)}</td>
                                    <td className="py-2 px-3 text-gray-700 truncate" title={item.NombreReceptor}>{item.NombreReceptor.substring(0, 30)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-gray-800">{formatCurrency(item.Base)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-gray-800">{formatCurrency(item.IVA)}</td>
                                    <td className="py-2 px-3 text-right font-mono font-semibold text-gray-800">{formatCurrency(item.Total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group inline-flex items-center py-2 px-2 border-b-2 font-medium text-sm
                                    ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            
            <div key={activeTab} style={{ animation: 'fadeIn 0.4s ease-out' }}>
                {activeTab === 'auxiliar' && renderAuxiliarTab()}
                {activeTab === 'compras' && renderComprasTab()}
                {activeTab === 'ventas' && renderVentasTab()}
                {activeTab === 'dian' && renderDianTab()}
            </div>
             <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default RevisionStep;