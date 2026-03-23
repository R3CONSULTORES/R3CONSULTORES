
import { useCallback } from 'react';
import { generateProfessionalExcel } from '../utils/excelGenerator';
import type { 
    AppState, 
    LiquidationCalculations, 
    IvaSectionResult, 
    IvaDescontableCategory,
    VatCategory,
    CompraVatCategory
} from '../types';

interface ExcelExportParams {
    fileName: string;
    razonSocial: string;
    nit: string;
    periodo: string;
    liquidationCalculations: LiquidationCalculations;
    prorrateoPercentages: { gravado: number; otros: number };
    ingresosData: IvaSectionResult;
    files: AppState['files'];
    ivaDescontableClassification: Map<string, IvaDescontableCategory>;
    selectedIvaAccounts: Map<string, boolean>;
    formulario300Data: any; 
    incomeAccountVatClassification: Map<string, VatCategory>;
    comprasAccountVatClassification?: Map<string, CompraVatCategory>;
}

export const useExcelExport = () => {

    const generateExcel = useCallback((params: ExcelExportParams) => {
        // Delegate to the new professional generator
        generateProfessionalExcel(params).catch(err => {
            console.error("Error generating excel:", err);
            alert("Hubo un error al generar el archivo Excel.");
        });
    }, []);

    return { generateExcel };
};
