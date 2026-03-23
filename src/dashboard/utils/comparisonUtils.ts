import type { 
    RevisionHistoryItem, 
    ComparisonResult, 
    AnyFinding,
    Diferencia,
    RetencionFinding,
    CoherenciaFinding,
    DocumentoDiscrepancia,
    DocumentoDiscrepanciaClasificacion,
} from '@/dashboard/types';

// Generic helper to compare two arrays of findings
function compareFindingArray<T extends { [key: string]: any }>(
    antes: T[] | undefined,
    despues: T[] | undefined,
    getKey: (item: T) => string,
    isEqual: (a: T, b: T) => boolean
): { corregidos: T[], nuevos: T[], modificados: { antes: T, despues: T }[], identicos: T[] } {
    const result = { corregidos: [] as T[], nuevos: [] as T[], modificados: [] as { antes: T, despues: T }[], identicos: [] as T[] };
    if (!antes && !despues) return result;

    const antesMap = new Map((antes || []).map(item => [getKey(item), item]));
    const despuesMap = new Map((despues || []).map(item => [getKey(item), item]));

    antesMap.forEach((itemAntes, key) => {
        if (despuesMap.has(key)) {
            const itemDespues = despuesMap.get(key)!;
            if (isEqual(itemAntes, itemDespues)) {
                result.identicos.push(itemDespues);
            } else {
                result.modificados.push({ antes: itemAntes, despues: itemDespues });
            }
        } else {
            result.corregidos.push(itemAntes);
        }
    });

    despuesMap.forEach((itemDespues, key) => {
        if (!antesMap.has(key)) {
            result.nuevos.push(itemDespues);
        }
    });

    return result;
}

// Main comparison function
export const compareRevisions = (
    revAntes: RevisionHistoryItem['results'],
    revDespues: RevisionHistoryItem['results']
): ComparisonResult => {
    const finalResult: ComparisonResult = { corregidos: [], nuevos: [], modificados: [], identicos: [] };

    const processCategory = <T extends AnyFinding>(
        categoria: string,
        antes: T[] | undefined,
        despues: T[] | undefined,
        getKey: (item: T) => string,
        isEqual: (a: T, b: T) => boolean
    ) => {
        const comparison = compareFindingArray(antes, despues, getKey, isEqual);
        finalResult.corregidos.push(...comparison.corregidos.map(hallazgo => ({ categoria, hallazgo })));
        finalResult.nuevos.push(...comparison.nuevos.map(hallazgo => ({ categoria, hallazgo })));
        finalResult.modificados.push(...comparison.modificados.map(m => ({ categoria, hallazgoAntes: m.antes, hallazgoDespues: m.despues })));
        finalResult.identicos.push(...comparison.identicos.map(hallazgo => ({ categoria, hallazgo })));
    };

    // 1. Conciliación Contable (Diferencia)
    const isEqualDiferencia = (a: Diferencia, b: Diferencia) => Math.abs(a.diferencia - b.diferencia) < 1;
    processCategory('Contable: Ingresos', revAntes.resumenDiferencias?.ingresos, revDespues.resumenDiferencias?.ingresos, (h: any) => h.nit, isEqualDiferencia as any);
    processCategory('Contable: IVA Generado', revAntes.resumenDiferencias?.ivaGen, revDespues.resumenDiferencias?.ivaGen, (h: any) => h.nit, isEqualDiferencia as any);
    processCategory('Contable: Compras', revAntes.resumenDiferencias?.compras, revDespues.resumenDiferencias?.compras, (h: any) => h.nit, isEqualDiferencia as any);
    processCategory('Contable: IVA Descontable', revAntes.resumenDiferencias?.ivaDesc, revDespues.resumenDiferencias?.ivaDesc, (h: any) => h.nit, isEqualDiferencia as any);

    // 2. Retenciones (RetencionFinding)
    const isEqualRetencion = (a: RetencionFinding, b: RetencionFinding) => a.tipoHallazgo === b.tipoHallazgo && Math.abs(a.base - b.base) < 1 && Math.abs(a.retencionAplicada - b.retencionAplicada) < 1;
    processCategory('Retenciones', revAntes.retencionesResult, revDespues.retencionesResult, (h: any) => h.id, isEqualRetencion as any);
    
    // 3. Coherencia Contable (CoherenciaFinding)
    const isEqualCoherencia = (a: CoherenciaFinding, b: CoherenciaFinding) => a.inconsistencia === b.inconsistencia;
    processCategory('Coherencia Contable', revAntes.coherenciaContableResult, revDespues.coherenciaContableResult, (h: any) => h.id, isEqualCoherencia as any);
    
    // 4. Revisión de IVA (DocumentoDiscrepancia y DocumentoDiscrepanciaClasificacion)
    const ivaAntes = revAntes.ivaRevisionResult;
    const ivaDespues = revDespues.ivaRevisionResult;
    const isEqualDocDiscrepancia = (a: DocumentoDiscrepancia, b: DocumentoDiscrepancia) => Math.abs(a.diferencia - b.diferencia) < 1;
    const getKeyDocDiscrepancia = (h: any) => `${h.nit}-${h.docNum}`;
    
    const allIvaIngresosAntes = (ivaAntes?.ingresos?.faltantesEnDian || []).concat(ivaAntes?.ingresos?.faltantesEnWo || [], ivaAntes?.ingresos?.conDiferenciaValor || []);
    const allIvaIngresosDespues = (ivaDespues?.ingresos?.faltantesEnDian || []).concat(ivaDespues?.ingresos?.faltantesEnWo || [], ivaDespues?.ingresos?.conDiferenciaValor || []);
    processCategory('IVA: Ingresos (Faltantes/Dif)', allIvaIngresosAntes, allIvaIngresosDespues, getKeyDocDiscrepancia, isEqualDocDiscrepancia as any);

    const allIvaComprasAntes = (ivaAntes?.compras?.faltantesEnDian || []).concat(ivaAntes?.compras?.faltantesEnWo || [], ivaAntes?.compras?.conDiferenciaValor || []);
    const allIvaComprasDespues = (ivaDespues?.compras?.faltantesEnDian || []).concat(ivaDespues?.compras?.faltantesEnWo || [], ivaDespues?.compras?.conDiferenciaValor || []);
    processCategory('IVA: Compras (Faltantes/Dif)', allIvaComprasAntes, allIvaComprasDespues, getKeyDocDiscrepancia, isEqualDocDiscrepancia as any);

    const isEqualClasificacion = (a: DocumentoDiscrepanciaClasificacion, b: DocumentoDiscrepanciaClasificacion) => a.observacion === b.observacion && Math.abs(a.diferenciaTotal - b.diferenciaTotal) < 1;
    processCategory('IVA: Ingresos (Clasificación)', ivaAntes?.ingresosClasificacion, ivaDespues?.ingresosClasificacion, (h: any) => `${h.nit}-${h.docNum}`, isEqualClasificacion as any);

    return finalResult;
};