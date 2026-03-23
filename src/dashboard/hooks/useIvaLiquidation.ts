
import { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { AppContext } from '@/dashboard/contexts/AppContext';
import type { 
    FileType, 
    AppState, 
    IvaLiquidationResult, 
    VatCategory, 
    IvaSectionResult, 
    DianData, 
    AuxiliarData, 
    IvaCategoryData, 
    CompraVatCategory, 
    IvaDocumentDetail, 
    IvaDescontableCategory, 
    VentasComprasData, 
    DianDocumentDetail, 
    FileStatus 
} from '@/dashboard/types';
import { parseExcelFile, processAuxiliar, processDian, processVentas, processCompras } from '@/dashboard/utils/parsing';
import { isDevolucionesComprasAccountFuzzy, normalizeTextForSearch } from '@/dashboard/views/iva/ivaUtils';

// Helper local para normalización dentro del hook
const normalizeDocKey = (doc: string | null | undefined): string => {
    if (!doc) return '';
    let s = doc.toString().toLowerCase().trim();
    const parts = s.split(/\s+/);
    if (parts.length > 1 && /^[a-z]+$/.test(parts[0]) && /^[a-z]/.test(parts[1])) {
        s = parts.slice(1).join(' ');
    }
    return s.replace(/[^a-z0-9]/g, '');
};

const getDianPeriodCode = (periodString: string, type: 'mensual' | 'bimestral' | 'cuatrimestral'): string => {
    const lower = periodString.toLowerCase();
    
    if (type === 'bimestral') {
        if (lower.includes('enero')) return '01';
        if (lower.includes('marzo')) return '02';
        if (lower.includes('mayo')) return '03';
        if (lower.includes('julio')) return '04';
        if (lower.includes('septiembre')) return '05';
        if (lower.includes('noviembre')) return '06';
    }
    
    if (type === 'cuatrimestral') {
        if (lower.includes('1er') || lower.includes('enero')) return '01';
        if (lower.includes('2do') || lower.includes('mayo')) return '02';
        if (lower.includes('3er') || lower.includes('septiembre')) return '03';
    }

    // Default Fallback mapping for months if needed, though form 300 is usually bi/cuatri
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const idx = months.findIndex(m => lower.includes(m));
    if (idx !== -1) return String(idx + 1).padStart(2, '0');

    return '01';
};

export const useIvaLiquidation = () => {
    const context = useContext(AppContext);
    
    if (!context) {
        throw new Error("useIvaLiquidation must be used within an AppContext Provider");
    }

    const { appState, updateAppState, showLoading, hideLoading, showError, showNotification } = context;
    const { ivaLiquidationResult, files } = appState;

    // --- 0. CALCULOS PRELIMINARES ---
    // Calculamos esto al inicio para usarlo en el estado inicial del panel
    const allBaseFilesLoaded = !!(files.iva_auxiliar && files.iva_dian && files.iva_ventas && files.iva_compras);

    // --- 1. ESTADOS LOCALES DE UI Y CONFIGURACIÓN ---
    const [modal, setModal] = useState<'none' | 'ingresos'>('none');
    const [dianDetailModal, setDianDetailModal] = useState<{ title: string; documents: DianDocumentDetail[] } | null>(null);
    
    // Estado de expansión del Panel de Control
    // Inicialmente expandido si faltan archivos, colapsado si ya están cargados
    const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(!allBaseFilesLoaded);

    // Estados de Activos Fijos
    const [ventaActivosFijos, setVentaActivosFijos] = useState<number>(0);
    const [compraActivosFijos, setCompraActivosFijos] = useState<number>(0);

    // Selección de Cuentas
    const [selectedIvaAccounts, setSelectedIvaAccounts] = useState<Map<string, boolean>>(new Map());
    const [selectedReteivaAccounts, setSelectedReteivaAccounts] = useState<Map<string, boolean>>(new Map());

    // Estados de Proyección y Prorrateo
    const [ivaTypeFilter, setIvaTypeFilter] = useState<'descontable' | 'transitorio' | 'ambos'>('descontable');
    const [ivaDeseado, setIvaDeseado] = useState<number>(0);
    const [facturaIvaRate, setFacturaIvaRate] = useState<number>(19);
    const [sobrantes, setSobrantes] = useState<number>(0);
    const [formDataSource, setFormDataSource] = useState<'proyectado' | 'real'>('proyectado');

    // --- 2. EFECTOS SECUNDARIOS ---

    // Auto-colapsar el panel cuando todos los archivos estén listos
    useEffect(() => {
        if (allBaseFilesLoaded) {
            setIsPanelExpanded(false);
        }
    }, [allBaseFilesLoaded]);

    // Inicializar selección de cuentas cuando se carga el auxiliar
    useEffect(() => {
        if (files.iva_auxiliar) {
            const initialSelectionIva = new Map<string, boolean>();
            const initialSelectionRete = new Map<string, boolean>();
            
            files.iva_auxiliar.forEach(row => {
                // IVA (2408)
                if (row.Cuenta.startsWith('2408') && !initialSelectionIva.has(row.Cuenta)) {
                    initialSelectionIva.set(row.Cuenta, true);
                }
                // ReteIVA (2367 o similar, ajustado a necesidades)
                if ((row.Cuenta.startsWith('2367') || row.Cuenta.startsWith('2368')) && !initialSelectionRete.has(row.Cuenta)) {
                    initialSelectionRete.set(row.Cuenta, true);
                }
            });
            setSelectedIvaAccounts(initialSelectionIva);
            setSelectedReteivaAccounts(initialSelectionRete);
        }
    }, [files.iva_auxiliar]);

    // --- 3. LOGICA DE NEGOCIO (ACCIONES) ---

    const handleAccountSelectionChange = (cuenta: string) => {
        setSelectedIvaAccounts(prev => {
            const newMap = new Map(prev);
            newMap.set(cuenta, !newMap.get(cuenta));
            return newMap;
        });
    };

    const handleReteivaAccountSelectionChange = (cuenta: string) => {
        setSelectedReteivaAccounts(prev => {
            const newMap = new Map(prev);
            newMap.set(cuenta, !newMap.get(cuenta));
            return newMap;
        });
    };

    const handleFileChange = async (fileType: FileType, file: File) => {
        if (fileType !== 'iva_auxiliar' && fileType !== 'iva_dian' && fileType !== 'iva_ventas' && fileType !== 'iva_compras') return;

        updateAppState({
            fileUploadStatus: {
                ...appState.fileUploadStatus,
                [fileType]: { status: 'loading', name: file.name }
            }
        });
        showLoading(`Procesando ${file.name}...`);
        
        try {
            const rawData = await parseExcelFile(file);
            const updatePayload: Partial<AppState> = {};
            let processedData: any;

            if (fileType === 'iva_auxiliar') {
                const auxResult = processAuxiliar(rawData, appState.allNits);
                processedData = auxResult.data;
                updatePayload.allNits = auxResult.nits;
            } else if (fileType === 'iva_ventas') {
                 const ventasResult = processVentas(rawData, appState.allNits);
                 processedData = ventasResult.data;
                 updatePayload.allNits = ventasResult.nits;
            } else if (fileType === 'iva_compras') {
                const comprasResult = processCompras(rawData, appState.allNits);
                processedData = comprasResult.data;
                updatePayload.allNits = comprasResult.nits;
           } else { // iva_dian
                const dianResult = processDian(rawData, appState.allNits);
                processedData = dianResult.data;
                updatePayload.allNits = dianResult.nits;
            }

            updatePayload.files = {
                ...appState.files,
                [fileType]: processedData
            };
            updatePayload.fileUploadStatus = {
                ...appState.fileUploadStatus,
                [fileType]: { status: 'success', name: file.name }
            };
            // Marcar necesidad de recalculo si cambian los datos
            updatePayload.ivaNeedsRecalculation = true;
            
            updateAppState(updatePayload);

        } catch (error) {
            const errorMessage = error instanceof Error ? `Error al procesar: ${error.message}` : String(error);
            showError(`Error en ${file.name}: ${errorMessage}`);
            updateAppState({
                fileUploadStatus: {
                    ...appState.fileUploadStatus,
                    [fileType]: { status: 'error', name: file.name }
                }
            });
        } finally {
            hideLoading();
        }
    };

    const handleDeleteFile = (fileType: FileType) => {
        updateAppState({
            files: { ...appState.files, [fileType]: null },
            fileUploadStatus: {
                ...appState.fileUploadStatus,
                [fileType]: { status: 'pending', name: '' }
            },
            ivaNeedsRecalculation: true
        });
        showNotification(`Archivo ${fileType} eliminado.`);
    };

    const handleGenerate = () => {
        const { iva_auxiliar, iva_dian, iva_ventas, iva_compras } = appState.files;
        
        if (!iva_auxiliar || !iva_dian || !iva_ventas || !iva_compras) {
            showError("Asegúrese de que los archivos 'Auxiliar', 'Ventas', 'Compras' y 'DIAN' para IVA estén cargados.");
            return;
        }
        
        showLoading("Generando liquidación de IVA...");

        setTimeout(() => {
            try {
                const { incomeAccountVatClassification, purchaseAccountVatClassification, ivaTransactionVatOverrides } = appState;
                
                const blankSection = (): IvaSectionResult => ({
                    gravados: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] }, devolucionesGravadas: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] },
                    exentos: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] }, devolucionesExentas: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] },
                    excluidos: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] }, devolucionesExcluidas: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] },
                    noGravados: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] }, devolucionesNoGravadas: { accounts: [], totalAuxiliar: 0, totalDian: 0, totalDianGravado: 0, totalDianOtros: 0, dianDocuments: [] },
                });
                
                const newResult: IvaLiquidationResult = {
                    ingresos: blankSection(),
                    compras: blankSection(),
                    resumen: { ivaGenerado: 0, ivaDescontable: 0, saldoAPagar: 0 }
                };
                
                interface PopulatedDoc {
                    cuenta: string;
                    nombre: string;
                    valor: number;
                    isIncome: boolean;
                    docDetail: IvaDocumentDetail;
                }

                const auxiliarMapByDoc = new Map<string, AuxiliarData[]>();
                files.iva_auxiliar!.forEach(row => {
                    const docKey = normalizeDocKey(row.DocNum);
                    if (docKey) {
                        const existing = auxiliarMapByDoc.get(docKey);
                        if (existing) {
                            existing.push(row);
                        } else {
                            auxiliarMapByDoc.set(docKey, [row]);
                        }
                    }
                });
                
                const allDocuments: PopulatedDoc[] = [];

                // Process Ventas
                files.iva_ventas!.forEach(venta => {
                    const docKey = normalizeDocKey(venta.Documento);
                    const movimientos = auxiliarMapByDoc.get(docKey) || [];
                    const incomeMov = movimientos.find(m => m.Cuenta.startsWith('4'));
                    const cuentaCode = incomeMov ? incomeMov.Cuenta.split(' ')[0] : '4_NO_ASIGNADA';
                    const cuentaName = incomeMov ? incomeMov.Cuenta.substring(cuentaCode.length).trim() : 'Ingreso sin cuenta en Auxiliar';
                    
                    const isReturnAccount = cuentaCode.startsWith('4175');
                    const isCreditNote = normalizeTextForSearch(venta.Documento).includes('nc');
                    const absoluteVentaNeta = Math.abs(venta.VentaNeta);
                    const balance = (isReturnAccount || isCreditNote) ? -absoluteVentaNeta : absoluteVentaNeta;

                    const txKey = `${cuentaCode}-${venta.Documento}-${balance}`;

                    allDocuments.push({
                        cuenta: cuentaCode,
                        nombre: cuentaName,
                        valor: balance,
                        isIncome: true,
                        docDetail: { docNum: venta.Documento, nota: `Venta a ${venta.Cliente}`, valor: balance, key: txKey }
                    });
                });

                // Process Compras
                const saleDocKeys = new Set(files.iva_ventas!.map(v => normalizeDocKey(v.Documento)));
                const processedPurchaseDocs = new Set<string>();

                files.iva_auxiliar!.forEach(row => {
                    const docKey = normalizeDocKey(row.DocNum);
                    if (!docKey || saleDocKeys.has(docKey) || processedPurchaseDocs.has(docKey)) return;

                    const code = row.Cuenta?.split(' ')[0] || '';
                    if (['14', '5', '6', '7'].some(p => code.startsWith(p))) {
                        const movsForDoc = auxiliarMapByDoc.get(docKey) || [];
                        let baseCompra = movsForDoc.reduce((sum, mov) => {
                            if (['14', '5', '6', '7'].some(p => mov.Cuenta.startsWith(p))) {
                                return sum + mov.Debitos - mov.Creditos;
                            }
                            return sum;
                        }, 0);
                        
                        if (baseCompra !== 0) {
                            const firstMov = movsForDoc[0];
                            const purchaseAccountCode = firstMov.Cuenta.split(' ')[0];
                            const purchaseAccountName = firstMov.Cuenta.substring(purchaseAccountCode.length).trim();
                            const txKey = `${purchaseAccountCode}-${firstMov.DocNum}-${baseCompra}`;

                             allDocuments.push({
                                cuenta: purchaseAccountCode,
                                nombre: purchaseAccountName,
                                valor: baseCompra,
                                isIncome: false,
                                docDetail: { docNum: firstMov.DocNum, nota: firstMov.Nota, valor: baseCompra, key: txKey }
                            });
                        }
                        processedPurchaseDocs.add(docKey);
                    }
                });

                // Classify and aggregate all documents
                allDocuments.forEach(doc => {
                    const accountClassificationMap = doc.isIncome ? incomeAccountVatClassification : purchaseAccountVatClassification;
                    const accountCategory = accountClassificationMap.get(doc.cuenta) || 'no_clasificado';
                    const finalCategory = ivaTransactionVatOverrides.get(doc.docDetail.key) || accountCategory;
                    
                    if (finalCategory === 'no_clasificado' || doc.valor === 0) return;

                    const isReturn = doc.valor < 0;
                    const targetSection = doc.isIncome ? newResult.ingresos : newResult.compras;
                    
                    let targetCategoryKey: keyof IvaSectionResult | null = null;
                    switch(finalCategory) {
                        case 'gravado': targetCategoryKey = isReturn ? 'devolucionesGravadas' : 'gravados'; break;
                        case 'exento': targetCategoryKey = isReturn ? 'devolucionesExentas' : 'exentos'; break;
                        case 'excluido': targetCategoryKey = isReturn ? 'devolucionesExcluidas' : 'excluidos'; break;
                        case 'no_gravado': targetCategoryKey = isReturn ? 'devolucionesNoGravadas' : 'noGravados'; break;
                    }

                    if (targetCategoryKey) {
                        const categoryData = targetSection[targetCategoryKey];
                        categoryData.totalAuxiliar += Math.abs(doc.valor);

                        let accountDetail = categoryData.accounts.find(a => a.cuenta === doc.cuenta);
                        if (!accountDetail) {
                            accountDetail = { cuenta: doc.cuenta, nombre: doc.nombre, valorAuxiliar: 0, documentos: [] };
                            categoryData.accounts.push(accountDetail);
                        }
                        accountDetail.valorAuxiliar += Math.abs(doc.valor);
                        accountDetail.documentos!.push(doc.docDetail);
                    }
                });

                // DIAN Data processing
                files.iva_dian!.forEach(row => {
                    const normalizedGrupo = normalizeTextForSearch(row.Grupo);
                    const normalizedTipoDoc = normalizeTextForSearch(row.TipoDeDocumento);
                    const isEmitido = normalizedGrupo.includes('emitido');
                    
                    const allowedDocTypes = [
                        'factura electronica',
                        'nota de credito electronica',
                        'nota debito electronica'
                    ];

                    if (!isEmitido || !allowedDocTypes.includes(normalizedTipoDoc)) {
                        return; // Only process specific emitted documents for income section
                    }
                
                    const iva = row.IVA;
                    const total = row.Total;
                    const baseGravada = (iva !== 0) ? (iva / 0.19) : 0;
                    const baseNoGravada = total - iva - baseGravada;
                
                    const targetSection = newResult.ingresos;
                    const isCreditNote = normalizedTipoDoc.includes('nota de credito');
                
                    const docDetail = { docNum: row.DocumentoDIAN, fecha: row.Fecha, baseGravada, baseOtros: baseNoGravada, total };
                
                    if (isCreditNote) {
                        if (baseGravada !== 0) {
                            targetSection.devolucionesGravadas.totalDian += baseGravada;
                            targetSection.devolucionesGravadas.totalDianGravado = (targetSection.devolucionesGravadas.totalDianGravado || 0) + baseGravada;
                            targetSection.devolucionesGravadas.dianDocuments?.push({ ...docDetail, baseOtros: 0, total: baseGravada });
                        }
                        if (baseNoGravada !== 0) {
                             targetSection.devolucionesNoGravadas.totalDian += baseNoGravada;
                             targetSection.devolucionesNoGravadas.totalDianOtros = (targetSection.devolucionesNoGravadas.totalDianOtros || 0) + baseNoGravada;
                             targetSection.devolucionesNoGravadas.dianDocuments?.push({ ...docDetail, baseGravada: 0, total: baseNoGravada });
                        }
                    } else {
                        if (baseGravada !== 0) {
                            targetSection.gravados.totalDian += baseGravada;
                            targetSection.gravados.totalDianGravado = (targetSection.gravados.totalDianGravado || 0) + baseGravada;
                            targetSection.gravados.dianDocuments?.push({ ...docDetail, baseOtros: 0, total: baseGravada });
                        }
                        if (baseNoGravada !== 0) {
                            targetSection.noGravados.totalDian += baseNoGravada;
                            targetSection.noGravados.totalDianOtros = (targetSection.noGravados.totalDianOtros || 0) + baseNoGravada;
                            targetSection.noGravados.dianDocuments?.push({ ...docDetail, baseGravada: 0, total: baseNoGravada });
                        }
                    }
                });
                
                updateAppState({ ivaLiquidationResult: newResult, ivaNeedsRecalculation: false });

            } catch (error) {
                showError(error instanceof Error ? error.message : "Error al generar liquidación");
            } finally {
                hideLoading();
            }
        }, 50);
    };

    const handleCommentChange = (cuenta: string, comment: string) => {
        const newComments = new Map(appState.ivaIncomeComments);
        newComments.set(cuenta, comment);
        updateAppState({ ivaIncomeComments: newComments });
    };

    const handleTransactionOverride = (txKey: string, newCategory: VatCategory) => {
        const newOverrides = new Map(appState.ivaTransactionVatOverrides);
        if (newCategory === 'no_clasificado') {
            newOverrides.delete(txKey);
        } else {
            newOverrides.set(txKey, newCategory);
        }
        updateAppState({ 
            ivaTransactionVatOverrides: newOverrides,
            ivaNeedsRecalculation: true,
        });
    };

    // --- 4. CALCULOS DERIVADOS (USE MEMO) ---

    const incomeAccounts = useMemo(() => {
        if (!files.iva_auxiliar) return [];
        const accounts = new Map<string, string>();
        files.iva_auxiliar.forEach(row => {
            if (row.Cuenta && (row.Cuenta.startsWith('4'))) {
                const [code, ...nameParts] = row.Cuenta.split(' ');
                if (!accounts.has(code)) accounts.set(code, nameParts.join(' '));
            }
        });
        return Array.from(accounts.entries()).map(([cuenta, nombre]) => ({ cuenta, nombre }));
    }, [files.iva_auxiliar]);

    const prorrateoPercentages = useMemo(() => {
        if (!ivaLiquidationResult) return { gravado: 0, otros: 0 };
        const data = ivaLiquidationResult.ingresos;
        const brutoGravado = data.gravados.totalAuxiliar;
        const otrosIngresosBrutos = data.exentos.totalAuxiliar + data.excluidos.totalAuxiliar + data.noGravados.totalAuxiliar;
        const totalIngresosProrrateo = brutoGravado + otrosIngresosBrutos;
        if (totalIngresosProrrateo === 0) return { gravado: 100, otros: 0 };
        return {
            gravado: (brutoGravado / totalIngresosProrrateo) * 100,
            otros: (otrosIngresosBrutos / totalIngresosProrrateo) * 100,
        };
    }, [ivaLiquidationResult]);

    const liquidationCalculations = useMemo(() => {
        if (!files.iva_auxiliar || !ivaLiquidationResult || !files.iva_dian) return null;

        const { iva_auxiliar: auxiliar, iva_dian: dian } = files;
        const pDeclaracion = prorrateoPercentages.gravado / 100;

        let totalIvaGeneradoBrutoBp = 0, totalIvaDevolucionesVentasBp = 0;
        let totalIvaDescontableBp = 0, totalIvaTransitorioBp = 0, totalIvaDevolucionesComprasBp = 0;

        auxiliar.forEach(row => {
            if (!row.Cuenta.startsWith('2408') || !selectedIvaAccounts.get(row.Cuenta)) return;
            
            // Check classification explicitly
            const classification = appState.ivaDescontableClassification.get(row.Cuenta);
            if (classification === 'no_tener_en_cuenta') return;

            const code = row.Cuenta.split(' ')[0];
            const name = row.Cuenta.substring(code.length).trim();
            const normalizedName = normalizeTextForSearch(name);

            if (normalizedName.includes('iva gen')) totalIvaGeneradoBrutoBp += row.Creditos;
            else if (normalizedName.includes('devoluciones en ventas') && !normalizedName.includes('compras')) totalIvaDevolucionesVentasBp += row.Debitos;
            else if (isDevolucionesComprasAccountFuzzy(row.Cuenta)) totalIvaDevolucionesComprasBp += row.Creditos;
            else if (code.startsWith('240802')) totalIvaDescontableBp += row.Debitos;
            else if (code.startsWith('240803')) totalIvaTransitorioBp += row.Debitos;
        });
        
        const { ivaVentasDian, ivaDevolucionesVentasDian, ivaComprasDian, ivaDevolucionesComprasDian } = dian.reduce((acc, row) => {
            const isIngresoDian = normalizeTextForSearch(row.Grupo).includes('emitido') && !normalizeTextForSearch(row.TipoDeDocumento).includes('documento soporte');
            if (isIngresoDian) {
                if (row.IVA < 0) acc.ivaDevolucionesVentasDian += Math.abs(row.IVA);
                else acc.ivaVentasDian += row.IVA;
            } else {
                if (row.IVA < 0) acc.ivaDevolucionesComprasDian += Math.abs(row.IVA);
                else acc.ivaComprasDian += row.IVA;
            }
            return acc;
        }, { ivaVentasDian: 0, ivaDevolucionesVentasDian: 0, ivaComprasDian: 0, ivaDevolucionesComprasDian: 0 });

        const ivaGeneradoVentas = totalIvaGeneradoBrutoBp;
        const devolucionesComprasProrrateadas = totalIvaDevolucionesComprasBp * pDeclaracion;
        const devolucionesVentas = totalIvaDevolucionesVentasBp;

        const ivaDescontableFinal = (ivaTypeFilter === 'descontable' || ivaTypeFilter === 'ambos') 
            ? totalIvaDescontableBp * pDeclaracion 
            : totalIvaDescontableBp;
        
        const ivaTransitorioFinal = (ivaTypeFilter === 'transitorio' || ivaTypeFilter === 'ambos')
            ? totalIvaTransitorioBp * pDeclaracion
            : totalIvaTransitorioBp;

        const retencionIva = auxiliar.filter(r => r.Cuenta.startsWith('135517')).reduce((sum, r) => sum + r.Debitos - r.Creditos, 0);
        
        const totalIvaGenReal = ivaGeneradoVentas + devolucionesComprasProrrateadas;
        const totalIvaDescontableReal = devolucionesVentas + ivaDescontableFinal + ivaTransitorioFinal;
        const ivaAPagarReal = totalIvaGenReal - totalIvaDescontableReal - retencionIva - sobrantes;

        return {
            ivaGeneradoVentas,
            devolucionesComprasProrrateadas,
            devolucionesVentas,
            ivaDescontableFinal,
            ivaTransitorioFinal,
            retencionIva,
            ivaAPagarReal,
            ivaCalculado19: ivaLiquidationResult.ingresos.gravados.totalAuxiliar * 0.19,
            totalIvaGeneradoBrutoBp, totalIvaDevolucionesVentasBp, ivaVentasDian, ivaDevolucionesVentasDian,
            totalIvaDescontableBp, totalIvaTransitorioBp, totalIvaDevolucionesComprasBp, ivaComprasDian, ivaDevolucionesComprasDian,
        };

    }, [files, ivaLiquidationResult, selectedIvaAccounts, prorrateoPercentages, ivaTypeFilter, sobrantes, appState.ivaDescontableClassification]);

    const projectionCalculations = useMemo(() => {
        if (!liquidationCalculations) {
            return { ivaDescontableFactProrrateado: 0, facturaBruto: 0, facturaIva: 0, facturaNeto: 0, ivaAPagarProyectado: 0 };
        }

        const { 
            ivaGeneradoVentas, devolucionesComprasProrrateadas, devolucionesVentas, 
            ivaDescontableFinal, ivaTransitorioFinal, retencionIva 
        } = liquidationCalculations;

        const totalIvaGenReal = ivaGeneradoVentas + devolucionesComprasProrrateadas;
        const totalIvaDescontableReal = devolucionesVentas + ivaDescontableFinal + ivaTransitorioFinal;
        const ivaAPagarRealSinSobrantes = totalIvaGenReal - totalIvaDescontableReal - retencionIva;
        
        const ivaDescontableFactProrrateado = ivaAPagarRealSinSobrantes - ivaDeseado - sobrantes;

        let facturaBruto = 0, facturaIva = 0, facturaNeto = 0;
        const prorrateoGravado = prorrateoPercentages.gravado / 100;
        
        if (ivaDescontableFactProrrateado > 0 && prorrateoGravado > 0 && facturaIvaRate > 0) {
            facturaIva = ivaDescontableFactProrrateado / prorrateoGravado;
            facturaBruto = facturaIva / (facturaIvaRate / 100);
            facturaNeto = facturaBruto + facturaIva;
        }

        const totalIvaDescontableProyectado = totalIvaDescontableReal + Math.max(0, ivaDescontableFactProrrateado);
        const ivaAPagarProyectado = totalIvaGenReal - totalIvaDescontableProyectado - retencionIva - sobrantes;

        return {
            ivaDescontableFactProrrateado: Math.max(0, ivaDescontableFactProrrateado),
            facturaBruto, facturaIva, facturaNeto, ivaAPagarProyectado,
        };
    }, [liquidationCalculations, ivaDeseado, facturaIvaRate, prorrateoPercentages, sobrantes]);

    const incomeStatementCalculations = useMemo(() => {
        if (!ivaLiquidationResult || !files.iva_auxiliar) {
            return { totalIngNetos: 0, costosGastosPeriodo: 0 };
        }
    
        const ingresosData = ivaLiquidationResult.ingresos;
        const totalIngBrutos = ingresosData.gravados.totalAuxiliar + ingresosData.exentos.totalAuxiliar + ingresosData.excluidos.totalAuxiliar + ingresosData.noGravados.totalAuxiliar;
        const totalDevoluciones = ingresosData.devolucionesGravadas.totalAuxiliar + ingresosData.devolucionesExentas.totalAuxiliar + ingresosData.devolucionesExcluidas.totalAuxiliar + ingresosData.devolucionesNoGravadas.totalAuxiliar;
        const totalIngNetos = totalIngBrutos - totalDevoluciones;
    
        const costosGastosPeriodo = files.iva_auxiliar.reduce((sum, row) => {
            if (['5', '6', '7'].some(p => row.Cuenta.startsWith(p))) {
                sum += row.Debitos - row.Creditos;
            }
            return sum;
        }, 0);
    
        return { totalIngNetos, costosGastosPeriodo };
    }, [ivaLiquidationResult, files.iva_auxiliar]);

    // --- FORMULARIO 300 HEADER INTELLIGENCE ---
    
    // Helper to get client info from AppState
    const currentClient = useMemo(() => {
        if (!appState.razonSocial) return null;
        return appState.clients.find(c => 
            (c.tipoPersona === 'Persona Jurídica' ? c.razonSocial : c.nombreCompleto) === appState.razonSocial
        );
    }, [appState.clients, appState.razonSocial]);

    // Data Transformation for Form 300
    const formulario300Data = useMemo(() => {
        if (!ivaLiquidationResult || !files.iva_auxiliar || !liquidationCalculations || !projectionCalculations) {
            return null;
        }

        const comprasAccounts = new Map<string, { totalDebitos: number }>();
        const ivaAccounts = new Map<string, { totalDebitos: number }>();
        
        if (files.iva_auxiliar) {
            files.iva_auxiliar.forEach(row => {
                if (row.Cuenta) {
                    if (['5', '6', '7'].some(p => row.Cuenta.startsWith(p))) {
                        const current = comprasAccounts.get(row.Cuenta) || { totalDebitos: 0 };
                        current.totalDebitos += row.Debitos;
                        comprasAccounts.set(row.Cuenta, current);
                    }
                    const code = row.Cuenta.split(' ')[0];
                    if (code.startsWith('240802') || code.startsWith('240803')) {
                        const current = ivaAccounts.get(row.Cuenta) || { totalDebitos: 0 };
                        current.totalDebitos += row.Debitos;
                        ivaAccounts.set(row.Cuenta, current);
                    }
                }
            });
        }
    
        const { devolucionesComprasProrrateadas, devolucionesVentas, retencionIva } = liquidationCalculations;
        const { ivaDescontableFactProrrateado } = projectionCalculations;
        
        const ivaProyectadoAdicional = formDataSource === 'proyectado' ? ivaDescontableFactProrrateado : 0;
        const ing = ivaLiquidationResult.ingresos;
    
        const r28_base = ing.gravados.totalAuxiliar;
        const r35_base = ing.exentos.totalAuxiliar;
        const r39_base = ing.excluidos.totalAuxiliar;
        const r40_base = ing.noGravados.totalAuxiliar;
        const r41_totalIngresosBrutos = r28_base + r35_base + r39_base + r40_base;
        const r42_totalDevoluciones = ing.devolucionesGravadas.totalAuxiliar + ing.devolucionesExentas.totalAuxiliar + ing.devolucionesExcluidas.totalAuxiliar + ing.devolucionesNoGravadas.totalAuxiliar;
        const r43_ingresosNetos = r41_totalIngresosBrutos - r42_totalDevoluciones;
    
        const comprasSummary = Array.from(comprasAccounts.entries()).reduce((acc, [cuenta, data]) => {
            const category = appState.comprasAccountVatClassification.get(cuenta);
            if (category && category !== 'no_clasificado') {
                acc[category] = (acc[category] || 0) + data.totalDebitos;
            }
            return acc;
        }, {} as Record<Exclude<CompraVatCategory, 'no_clasificado'>, number>);

        const r50_base = comprasSummary.bienes_gravados_5 || 0;
        const r51_base = comprasSummary.bienes_gravados_g || 0;
        const r52_base = comprasSummary.servicios_gravados_5 || 0;
        const r53_base = comprasSummary.servicios_gravados_g || 0;
        const r54_base = comprasSummary.excluidos_exentos_no_gravados || 0;
        const r55_totalComprasBrutas = r50_base + r51_base + r52_base + r53_base + r54_base;
        const r56_devCompras = 0; 
        const r57_comprasNetas = r55_totalComprasBrutas - r56_devCompras;
    
        const totalIvaGenerado = liquidationCalculations.ivaGeneradoVentas;
        const pDeclaracion = prorrateoPercentages.gravado / 100;
    
        const ivaDescontableClasificado = Array.from(ivaAccounts.entries()).reduce((acc, [cuenta, data]) => {
            const category = appState.ivaDescontableClassification.get(cuenta);
            // Ensure filter is applied here too for form data
            if (category === 'no_tener_en_cuenta') return acc;
            
            if (category && category !== 'no_clasificado_descontable') {
                acc[category] = (acc[category] || 0) + (data.totalDebitos * pDeclaracion);
            }
            return acc;
        }, {} as Record<Exclude<IvaDescontableCategory, 'no_clasificado_descontable' | 'no_tener_en_cuenta'>, number>);
    
        const r71_iva = ivaDescontableClasificado.bienes_5 || 0;
        const r72_iva = (ivaDescontableClasificado.bienes_g || 0) + ivaProyectadoAdicional;
        const r74_iva = ivaDescontableClasificado.servicios_5 || 0;
        const r75_iva = ivaDescontableClasificado.servicios_g || 0;
    
        const r77_totalImpuestoPagado = r71_iva + r72_iva + r74_iva + r75_iva;
        const r79_ivaResultanteDevVentas = devolucionesVentas;
        const r81_totalImpuestosDescontables = r77_totalImpuestoPagado + r79_ivaResultanteDevVentas;
        const r66_ivaRecuperadoDevCompras = devolucionesComprasProrrateadas;
        const r67_totalImpuestoGenerado = totalIvaGenerado + r66_ivaRecuperadoDevCompras;
        const r82_saldoPagarPeriodo = Math.max(0, r67_totalImpuestoGenerado - r81_totalImpuestosDescontables);
        const r83_saldoFavorPeriodo = Math.max(0, r81_totalImpuestosDescontables - r67_totalImpuestoGenerado);
        const r85_retenciones = retencionIva;

        // --- HEADER DATA POPULATION ---
        const periodoCodigo = getDianPeriodCode(appState.ivaPeriodo, appState.ivaTipoPeriodo as any);
        const anio = new Date().getFullYear(); // Default current year or extract from period string logic if strictly needed

        return {
            header: {
                nit: currentClient?.nit || currentClient?.cedula || '',
                dv: currentClient?.nitDv || currentClient?.cedulaDv || '',
                razonSocial: currentClient?.tipoPersona === 'Persona Jurídica' ? currentClient?.razonSocial : '',
                primerApellido: '', // To be filled if Natural Person logic required splitting name
                segundoApellido: '',
                primerNombre: currentClient?.tipoPersona === 'Persona Natural' ? currentClient?.nombreCompleto : '',
                otrosNombres: '',
                anio: anio,
                periodoCodigo: periodoCodigo,
                periodicidad: appState.ivaTipoPeriodo as 'mensual' | 'bimestral' | 'cuatrimestral' // FIX: Added type assertion
            },
            r27: 0, r28: r28_base, r29: 0, r35: r35_base, r39: r39_base, r40: r40_base,
            r41: r41_totalIngresosBrutos, r42: r42_totalDevoluciones, r43: r43_ingresosNetos,
            r50: r50_base, r51: r51_base, r52: r52_base, r53: r53_base, r54: r54_base,
            r55: r55_totalComprasBrutas, r56: r56_devCompras, r57: r57_comprasNetas,
            r58: 0, r59: totalIvaGenerado, r60: 0,
            r66: r66_ivaRecuperadoDevCompras, r67: r67_totalImpuestoGenerado,
            r71: r71_iva, r72: r72_iva, r74: r74_iva, r75: r75_iva,
            r77: r77_totalImpuestoPagado, r79: r79_ivaResultanteDevVentas,
            r81: r81_totalImpuestosDescontables,
            r82: r82_saldoPagarPeriodo, r83: r83_saldoFavorPeriodo, r85: r85_retenciones,
        };
    }, [ivaLiquidationResult, files.iva_auxiliar, liquidationCalculations, projectionCalculations, appState.comprasAccountVatClassification, appState.ivaDescontableClassification, prorrateoPercentages, formDataSource, currentClient, appState.ivaPeriodo, appState.ivaTipoPeriodo]);


    // Retornar todo el estado y funciones necesarias
    return {
        // Estado
        modal, setModal,
        dianDetailModal, setDianDetailModal,
        isPanelExpanded, setIsPanelExpanded,
        ventaActivosFijos, setVentaActivosFijos,
        compraActivosFijos, setCompraActivosFijos,
        selectedIvaAccounts, setSelectedIvaAccounts,
        selectedReteivaAccounts, setSelectedReteivaAccounts,
        ivaTypeFilter, setIvaTypeFilter,
        ivaDeseado, setIvaDeseado,
        facturaIvaRate, setFacturaIvaRate,
        sobrantes, setSobrantes,
        formDataSource, setFormDataSource,
        
        // Datos Calculados
        allBaseFilesLoaded,
        incomeAccounts,
        prorrateoPercentages,
        liquidationCalculations,
        projectionCalculations,
        incomeStatementCalculations,
        formulario300Data,

        // Acciones
        handleAccountSelectionChange,
        handleReteivaAccountSelectionChange,
        handleFileChange,
        handleDeleteFile,
        handleGenerate,
        handleCommentChange,
        handleTransactionOverride,
    };
};
