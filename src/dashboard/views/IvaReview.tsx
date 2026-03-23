
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { useIvaLiquidation } from '@/dashboard/hooks/useIvaLiquidation';
import { AppContext } from '@/dashboard/contexts/AppContext';
import { TabNavigation } from '@/dashboard/components/common/TabNavigation';
import { IvaStickyToolbar } from '@/dashboard/components/iva/components/IvaStickyToolbar';
import { FileManagerModal } from '@/dashboard/components/iva/components/FileManagerModal';
import { ControlView } from '@/dashboard/components/iva/views/ControlView';
import { ClasificacionUnificadaView } from '@/dashboard/components/iva/views/ClasificacionUnificadaView';
import { ProrrateoView } from '@/dashboard/components/iva/views/ProrrateoView';
import { LiquidacionFinalView } from '@/dashboard/components/iva/views/LiquidacionFinalView';
import { ReporteView } from '@/dashboard/components/iva/views/ReporteView';
import ProyeccionesIvaStep from './iva/ProyeccionesIvaStep';
import RevisionIvaStep from './iva/RevisionIvaStep';
import CoherenciaContable from './iva/CoherenciaContable';
import ExploradorDoc from './iva/ExploradorDoc';
import Formulario300 from './iva/Formulario300';
import { XMarkIcon, BoltIcon } from '@/dashboard/components/Icons';
import { formatCurrency } from '@/dashboard/utils/formatters';
import { useExcelExport } from '@/dashboard/hooks/useExcelExport';
import { normalizeTextForSearch } from './iva/ivaUtils';
import type { DianData, DocumentoDiscrepancia, DocumentoDiscrepanciaClasificacion, AuxiliarData, CoherenciaFinding } from '@/dashboard/types';

interface IvaReviewProps {
    embedded?: boolean;
    defaultClientName?: string;
    initialTab?: string;
}

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, ' ');
};

const IvaReview: React.FC<IvaReviewProps> = ({ embedded, initialTab }) => {
    const context = React.useContext(AppContext);
    if (!context) return null;
    const { appState, updateAppState, showLoading, hideLoading, showError } = context;

    // Use custom hook for logic
    const logic = useIvaLiquidation();
    
    // UI State
    const [activeTab, setActiveTab] = useState(initialTab || 'control');
    const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Excel Export
    const { generateExcel } = useExcelExport();

    const handleExportExcel = () => {
        if (!logic.liquidationCalculations || !logic.formulario300Data || !appState.ivaLiquidationResult) return;
        generateExcel({
            fileName: `Liquidacion_IVA_${appState.razonSocial}_${appState.periodo}`,
            razonSocial: appState.razonSocial,
            nit: logic.formulario300Data.header.nit,
            periodo: appState.periodo,
            liquidationCalculations: logic.liquidationCalculations,
            prorrateoPercentages: logic.prorrateoPercentages,
            ingresosData: appState.ivaLiquidationResult.ingresos,
            files: appState.files,
            ivaDescontableClassification: appState.ivaDescontableClassification,
            selectedIvaAccounts: logic.selectedIvaAccounts,
            formulario300Data: logic.formulario300Data,
            incomeAccountVatClassification: appState.incomeAccountVatClassification,
            comprasAccountVatClassification: appState.comprasAccountVatClassification
        });
    };

    // --- LÓGICA DE AUDITORÍA GLOBAL (Master Handler) ---
    
    const handleGlobalAudit = () => {
        const { files: { iva_auxiliar, iva_dian } } = appState;
        
        if (!iva_auxiliar) {
            showError("Falta el archivo 'Auxiliar General (IVA)'.");
            return;
        }
        if (!iva_dian) {
            showError("Falta el archivo para el cruce DIAN (Reporte DIAN).");
            return;
        }

        setIsProcessing(true);
        showLoading("Ejecutando Auditoría Integral (Coherencia + Cruces DIAN)...");

        setTimeout(() => {
            try {
                // --- 1. COHERENCIA CONTABLE ---
                const groupedByDoc = new Map<string, AuxiliarData[]>();
                iva_auxiliar.forEach(mov => {
                    const docNum = mov.DocNum.trim();
                    if (!docNum) return;
                    if (!groupedByDoc.has(docNum)) groupedByDoc.set(docNum, []);
                    groupedByDoc.get(docNum)!.push(mov);
                });

                const newCoherenceFindings: CoherenciaFinding[] = [];

                groupedByDoc.forEach((movimientos, docNum) => {
                    if (movimientos.length === 0) return;
                    const firstMov = movimientos[0];
                    const docIdBase = `${docNum}-${firstMov.Fecha}`;

                    movimientos.forEach((mov, index) => {
                        // Débito en Ingreso
                        if (mov.Cuenta.startsWith('4') && !mov.Cuenta.startsWith('4175') && mov.Debitos > 0) {
                            newCoherenceFindings.push({
                                id: `${docIdBase}-DEBITO_INGRESO-${index}`, docNum, fecha: firstMov.Fecha, tercero: firstMov.Tercero,
                                inconsistencia: `Débito en cuenta de Ingreso (${mov.Cuenta}).`,
                                accionSugerida: "Las cuentas de ingreso no deben debitarse. Si es una devolución, usar cuenta 4175.",
                                movimientos, lineasInconsistentes: [index]
                            });
                        }
                        // Crédito en Gasto
                        if (['5', '6', '7'].some(p => mov.Cuenta.startsWith(p)) && mov.Creditos > 0) {
                            const isPurchaseReturn = movimientos.some(m => (m.Cuenta.startsWith('22') || m.Cuenta.startsWith('11') || m.Cuenta.startsWith('240802')) && (m.Debitos > 0 || m.Creditos > 0));
                            if (!isPurchaseReturn && !normalizeText(firstMov.Nota).includes('devolucion') && !normalizeText(docNum).includes('nc')) {
                                newCoherenceFindings.push({
                                    id: `${docIdBase}-CREDITO_GASTO-${index}`, docNum, fecha: firstMov.Fecha, tercero: firstMov.Tercero,
                                    inconsistencia: `Crédito en cuenta de Gasto/Costo (${mov.Cuenta}) sin contexto de devolución.`,
                                    accionSugerida: "Verifique si es un ingreso mal clasificado o una anulación.",
                                    movimientos, lineasInconsistentes: [index]
                                });
                            }
                        }
                    });
                });

                // --- 2. REVISIÓN CRUCES DIAN ---
                 const getDocKey = (doc: string | null | undefined) => doc ? doc.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
                 const TOLERANCE = 5;

                 const compareDocuments = (
                    woData: any[],
                    dianData: DianData[],
                    woValueKey: string,
                    dianValueKey: keyof DianData,
                    dianNitResolver: (d: DianData) => string
                ) => {
                    // (Simplified logic for brevity - assume matching logic similar to previous steps)
                    const faltantesEnDian: DocumentoDiscrepancia[] = [];
                    const faltantesEnWo: DocumentoDiscrepancia[] = [];
                    const conDiferenciaValor: DocumentoDiscrepancia[] = [];
                    
                    // Basic exact match implementation for the global handler
                    const woMap = new Map();
                    woData.forEach(w => woMap.set(getDocKey(w.Documento || w.docNum), w));
                    
                    dianData.forEach(d => {
                        const key = getDocKey(d.DocumentoDIAN);
                        if(woMap.has(key)) {
                            const w = woMap.get(key);
                            const valW = w[woValueKey] || 0;
                            const valD = d[dianValueKey] as number || 0;
                            if(Math.abs(valW - valD) > TOLERANCE) {
                                conDiferenciaValor.push({
                                    docNum: d.DocumentoDIAN, nit: dianNitResolver(d), nombre: '', fecha: d.Fecha,
                                    valorWo: valW, valorDian: valD, diferencia: valW - valD, observacion: 'Diferencia Valor'
                                });
                            }
                            woMap.delete(key);
                        } else {
                            if(Math.abs(d[dianValueKey] as number) > TOLERANCE) {
                                faltantesEnWo.push({
                                    docNum: d.DocumentoDIAN, nit: dianNitResolver(d), nombre: '', fecha: d.Fecha,
                                    valorWo: 0, valorDian: d[dianValueKey] as number, diferencia: -(d[dianValueKey] as number), observacion: 'Faltante en WO'
                                });
                            }
                        }
                    });
                    
                    woMap.forEach((w) => {
                        const valW = w[woValueKey] || 0;
                        if(Math.abs(valW) > TOLERANCE) {
                            faltantesEnDian.push({
                                docNum: w.Documento || w.docNum, nit: w.NIT, nombre: w.Cliente || w.nombre, fecha: w.Fecha || w.fecha,
                                valorWo: valW, valorDian: 0, diferencia: valW, observacion: 'Faltante en DIAN'
                            });
                        }
                    });

                    return { faltantesEnDian, faltantesEnWo, conDiferenciaValor };
                 };

                 // Synth Ventas and Compras from Auxiliar for DIAN Audit
                 const iva_ventas_sintetico: any[] = [];
                 const iva_compras_sintetico: any[] = [];
                 
                 groupedByDoc.forEach((movimientos, docNum) => {
                     let baseIngreso = 0, ivaIngreso = 0;
                     let baseCompra = 0, ivaCompra = 0;
                     let thirdPartyNit = movimientos[0]?.NIT || '';
                     let thirdPartyName = movimientos[0]?.Tercero || '';
                     let fecha = movimientos[0]?.Fecha;
 
                     movimientos.forEach(mov => {
                         const code = mov.Cuenta.split(' ')[0];
                         if (code.startsWith('4')) {
                             baseIngreso += (mov.Creditos - mov.Debitos);
                         } else if (['14', '5', '6', '7'].some(p => code.startsWith(p))) {
                             baseCompra += (mov.Debitos - mov.Creditos);
                         } else if (code.startsWith('240802')) {
                             ivaCompra += (mov.Debitos - mov.Creditos);
                         } else if (code.startsWith('2408')) {
                             ivaIngreso += (mov.Creditos - mov.Debitos);
                         }
                     });
 
                     if (baseIngreso !== 0) {
                         iva_ventas_sintetico.push({
                             Documento: docNum,
                             Fecha: fecha,
                             Cliente: thirdPartyName,
                             NIT: thirdPartyNit,
                             VentaNeta: baseIngreso,
                             IVA: ivaIngreso
                         });
                     }
 
                     if (baseCompra !== 0) {
                         iva_compras_sintetico.push({
                             Documento: docNum,
                             Fecha: fecha,
                             Cliente: thirdPartyName,
                             NIT: thirdPartyNit,
                             VentaNeta: baseCompra,
                             IVA: ivaCompra
                         });
                     }
                 });

                 const isIngreso = (d: DianData) => {
                    const grupo = normalizeText(d.Grupo);
                    const tipoDoc = normalizeText(d.TipoDeDocumento);
                    return grupo.includes('emitido') && !tipoDoc.includes('documento soporte');
                };
                const dianIngresos = iva_dian.filter(isIngreso);
                const dianCompras = iva_dian.filter(d => !isIngreso(d));
                const getDianCompraNit = (row: DianData) => normalizeText(row.TipoDeDocumento).includes('documento soporte') ? String(row.NITReceptor).trim() : String(row.NITEMISOR).trim();

                const resultadoIngresos = compareDocuments(iva_ventas_sintetico, dianIngresos, 'VentaNeta', 'Base', d => String(d.NITReceptor).trim());
                const resultadoIvaGenerado = compareDocuments(iva_ventas_sintetico, dianIngresos, 'IVA', 'IVA', d => String(d.NITReceptor).trim());
                const resultadoCompras = compareDocuments(iva_compras_sintetico, dianCompras, 'VentaNeta', 'Base', getDianCompraNit);
                const resultadoIvaDescontable = compareDocuments(iva_compras_sintetico, dianCompras, 'IVA', 'IVA', getDianCompraNit);


                // --- ACTUALIZACIÓN DE ESTADO ---
                updateAppState({ 
                    coherenciaContableResult: newCoherenceFindings,
                    ivaRevisionResult: {
                        ingresos: resultadoIngresos,
                        ingresosClasificacion: [], // Simplified for global button
                        ivaGenerado: resultadoIvaGenerado,
                        compras: resultadoCompras,
                        ivaDescontable: resultadoIvaDescontable,
                    },
                    ivaNeedsRecalculation: false
                });

            } catch (error) {
                console.error(error);
                showError("Error durante la auditoría global.");
            } finally {
                setIsProcessing(false);
                hideLoading();
            }
        }, 1000);
    };

    // Tabs definition
    const tabs = [
        { id: 'control', label: 'Control & Ingresos' },
        { id: 'clasificacion', label: 'Clasificación' },
        { id: 'prorrateo', label: 'Prorrateo' },
        { id: 'liquidacion', label: 'Liquidación Final' },
        { id: 'reporte', label: 'Reporte Auditoría' },
        { id: 'formulario', label: 'Formulario 300' },
        { id: 'proyecciones', label: 'Proyecciones' },
        { id: 'auditoria_integral', label: 'Auditoría Integral' },
        { id: 'explorador', label: 'Explorador' },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                <div className="h-16 flex items-center">
                    <IvaStickyToolbar 
                        clientName={appState.razonSocial}
                        onOpenFiles={() => setIsFileManagerOpen(true)}
                        onExportExcel={handleExportExcel}
                        isReadyToExport={!!appState.ivaLiquidationResult}
                    />
                </div>
                <div className="px-6 pb-0">
                    <TabNavigation 
                        tabs={tabs} 
                        activeTab={activeTab} 
                        onTabChange={setActiveTab} 
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-grow overflow-auto">
                {activeTab === 'control' && (
                    <ControlView 
                        files={appState.files}
                        fileUploadStatus={appState.fileUploadStatus}
                        handleFileChange={logic.handleFileChange}
                        isPanelExpanded={logic.isPanelExpanded}
                        setIsPanelExpanded={logic.setIsPanelExpanded}
                        allBaseFilesLoaded={logic.allBaseFilesLoaded}
                        handleGenerate={logic.handleGenerate}
                        ivaNeedsRecalculation={appState.ivaNeedsRecalculation}
                        onOpenClasificacionModal={() => logic.setModal('ingresos')}
                        ivaLiquidationResult={appState.ivaLiquidationResult}
                        ivaIncomeComments={appState.ivaIncomeComments}
                        handleCommentChange={logic.handleCommentChange}
                        handleShowDianDetails={(title, docs) => logic.setDianDetailModal({title, documents: docs})}
                        ivaTransactionVatOverrides={appState.ivaTransactionVatOverrides}
                        handleTransactionOverride={logic.handleTransactionOverride}
                        ventaActivosFijos={logic.ventaActivosFijos}
                        setVentaActivosFijos={logic.setVentaActivosFijos}
                        prorrateoPercentages={logic.prorrateoPercentages}
                        onExportExcel={handleExportExcel}
                        onOpenFiles={() => setIsFileManagerOpen(true)}
                    />
                )}

                {activeTab === 'clasificacion' && (
                    <ClasificacionUnificadaView 
                        files={appState.files}
                        comprasAccountVatClassification={appState.comprasAccountVatClassification}
                        onComprasClassificationChange={(c, v) => updateAppState({ comprasAccountVatClassification: new Map(appState.comprasAccountVatClassification).set(c, v) })}
                        ivaDescontableClassification={appState.ivaDescontableClassification}
                        onIvaClassificationChange={(c, v) => updateAppState({ ivaDescontableClassification: new Map(appState.ivaDescontableClassification).set(c, v) })}
                    />
                )}

                {activeTab === 'prorrateo' && (
                    <ProrrateoView 
                        files={appState.files}
                        liquidationCalculations={logic.liquidationCalculations}
                        selectedIvaAccounts={logic.selectedIvaAccounts}
                        handleAccountSelectionChange={logic.handleAccountSelectionChange}
                        prorrateoPercentages={logic.prorrateoPercentages}
                        ivaTypeFilter={logic.ivaTypeFilter}
                        setIvaTypeFilter={logic.setIvaTypeFilter}
                        ivaDescontableClassification={appState.ivaDescontableClassification}
                    />
                )}

                {activeTab === 'liquidacion' && (
                    <LiquidacionFinalView 
                        files={appState.files}
                        liquidationCalculations={logic.liquidationCalculations}
                        projectionCalculations={logic.projectionCalculations}
                        incomeStatementCalculations={logic.incomeStatementCalculations}
                        sobrantes={logic.sobrantes}
                        onSobrantesChange={logic.setSobrantes}
                        ivaDeseado={logic.ivaDeseado}
                        onIvaDeseadoChange={(e) => logic.setIvaDeseado(Number(e.target.value.replace(/\D/g, '')) || 0)}
                        facturaIvaRate={logic.facturaIvaRate}
                        onFacturaIvaRateChange={(e) => logic.setFacturaIvaRate(Number(e.target.value) || 0)}
                        selectedIvaAccounts={logic.selectedIvaAccounts}
                        prorrateoPercentages={logic.prorrateoPercentages}
                        ivaDescontableClassification={appState.ivaDescontableClassification}
                    />
                )}

                {activeTab === 'reporte' && (
                    <ReporteView 
                        formulario300Data={logic.formulario300Data}
                        liquidationCalculations={logic.liquidationCalculations}
                        prorrateoPercentages={logic.prorrateoPercentages}
                        auxiliarData={appState.files.iva_auxiliar || []}
                        incomeClassifications={appState.incomeAccountVatClassification}
                        ivaDescontableClassification={appState.ivaDescontableClassification}
                        selectedIvaAccounts={logic.selectedIvaAccounts}
                    />
                )}

                {activeTab === 'formulario' && logic.formulario300Data && (
                    <Formulario300 
                        data={logic.formulario300Data} 
                        dataSource={logic.formDataSource}
                        onDataSourceChange={logic.setFormDataSource}
                    />
                )}

                {activeTab === 'proyecciones' && <ProyeccionesIvaStep />}
                
                {/* VISTA UNIFICADA: AUDITORÍA INTEGRAL */}
                {activeTab === 'auditoria_integral' && (
                    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
                        
                        {/* BOTÓN MAESTRO DE AUDITORÍA */}
                        <div className="mb-6 flex justify-end">
                            <button
                                onClick={handleGlobalAudit}
                                disabled={isProcessing}
                                className="flex items-center gap-3 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all transform hover:scale-105 disabled:bg-slate-400 disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                ) : (
                                    <BoltIcon className="w-5 h-5 text-white" />
                                )}
                                {isProcessing ? 'Procesando...' : 'Ejecutar Auditoría Global'}
                            </button>
                        </div>

                        {/* SECCIÓN 1: CRUCES DIAN */}
                        <section id="cruces-dian" className="scroll-mt-6">
                            <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">1. Cruce de Información (DIAN vs Contabilidad)</h2>
                                    <p className="text-sm text-slate-500">Comparativa detallada de ingresos y compras reportadas electrónicamente.</p>
                                </div>
                            </div>
                            {/* Pasamos prop para ocultar botones internos */}
                            <RevisionIvaStep hideControls={true} />
                        </section>

                        <div className="border-t-4 border-slate-100 rounded-full" /> 

                        {/* SECCIÓN 2: COHERENCIA */}
                        <section id="coherencia" className="scroll-mt-6">
                            <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-4">
                                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">2. Análisis de Coherencia Contable</h2>
                                    <p className="text-sm text-slate-500">Detección de anomalías en la naturaleza de cuentas (Débitos/Créditos) y partidas dobles.</p>
                                </div>
                            </div>
                            {/* Pasamos prop para ocultar botones internos */}
                            <CoherenciaContable hideControls={true} />
                        </section>
                    </div>
                )}

                {activeTab === 'explorador' && <ExploradorDoc />}
            </div>

            {/* Modals */}
            <FileManagerModal 
                isOpen={isFileManagerOpen}
                onClose={() => setIsFileManagerOpen(false)}
                fileUploadStatus={appState.fileUploadStatus}
                handleFileChange={logic.handleFileChange}
                handleGenerate={logic.handleGenerate}
                allBaseFilesLoaded={logic.allBaseFilesLoaded}
                ivaNeedsRecalculation={appState.ivaNeedsRecalculation}
            />

            {/* Logic for DIAN Detail Modal */}
            {logic.dianDetailModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[9999] p-4" onClick={() => logic.setDianDetailModal(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">{logic.dianDetailModal.title}</h3>
                            <button onClick={() => logic.setDianDetailModal(null)} className="text-gray-500 hover:text-gray-800">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <table className="min-w-full text-sm border">
                                <thead className="bg-gray-100 sticky top-0 text-slate-700">
                                    <tr>
                                        <th className="p-2 text-left font-semibold">Documento</th>
                                        <th className="p-2 text-left font-semibold">Fecha</th>
                                        <th className="p-2 text-right font-semibold">Base Gravada</th>
                                        <th className="p-2 text-right font-semibold">Base Otros</th>
                                        <th className="p-2 text-right font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700">
                                    {logic.dianDetailModal.documents.map((doc, idx) => (
                                        <tr key={idx} className="border-t hover:bg-slate-50 transition-colors">
                                            <td className="p-2 font-mono text-slate-900">{doc.docNum}</td>
                                            <td className="p-2 text-slate-600">{doc.fecha}</td>
                                            <td className="p-2 text-right font-mono text-slate-800">{formatCurrency(doc.baseGravada)}</td>
                                            <td className="p-2 text-right font-mono text-slate-800">{formatCurrency(doc.baseOtros)}</td>
                                            <td className="p-2 text-right font-mono font-bold text-slate-900">{formatCurrency(doc.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t bg-gray-50 text-right">
                            <button onClick={() => logic.setDianDetailModal(null)} className="bg-slate-900 text-white py-2 px-4 rounded hover:bg-slate-700">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Logic for Income Classification Modal */}
            {logic.modal === 'ingresos' && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-40 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">Clasificar Cuentas de Ingresos</h3>
                            <button onClick={() => logic.setModal('none')} className="text-gray-500 hover:text-gray-800">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <p className="text-sm text-gray-600 mb-4">Asigne una categoría de IVA a cada cuenta de ingresos (código '4') y devoluciones (código '4175').</p>
                            <div className="border rounded-lg shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/4">Cuenta</th>
                                            <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/2">Nombre</th>
                                            <th className="py-2 px-3 text-left font-medium text-gray-600 w-1/4">Categoría IVA</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {logic.incomeAccounts.map(({ cuenta, nombre }) => (
                                            <tr key={cuenta}>
                                                <td className="p-2 px-3 text-gray-800 font-mono">{cuenta}</td>
                                                <td className="p-2 px-3 text-gray-700">{nombre}</td>
                                                <td className="p-2 px-3">
                                                    <select
                                                        value={appState.incomeAccountVatClassification.get(cuenta) || 'no_clasificado'}
                                                        onChange={(e) => {
                                                            const val = e.target.value as any;
                                                            const newMap = new Map(appState.incomeAccountVatClassification);
                                                            if(val === 'no_clasificado') newMap.delete(cuenta);
                                                            else newMap.set(cuenta, val);
                                                            updateAppState({ incomeAccountVatClassification: newMap, ivaNeedsRecalculation: true });
                                                        }}
                                                        className="w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 text-sm bg-white text-slate-900"
                                                    >
                                                        <option value="no_clasificado">No Clasificado</option>
                                                        <option value="gravado">Gravado</option>
                                                        <option value="exento">Exento</option>
                                                        <option value="excluido">Excluido</option>
                                                        <option value="no_gravado">No Gravado</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 text-right">
                            <button onClick={() => logic.setModal('none')} className="bg-slate-900 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-slate-700">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default IvaReview;
