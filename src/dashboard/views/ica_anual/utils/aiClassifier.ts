import { GoogleGenAI } from '@google/genai';
import { ParsedIncomeRow } from './excelParser';
import { CiiuActivity } from '../types';

// Singleton instance (Needs VITE_GEMINI_API_KEY in .env)
const getAiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Agente IA no disponible. Falta la variable de entorno VITE_GEMINI_API_KEY.");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeOrphanRowsWithAI = async (
    rows: ParsedIncomeRow[], 
    availableActivities: CiiuActivity[]
): Promise<ParsedIncomeRow[]> => {
    
    // Solo analizamos filas que sean GRAVADAS (Para no alterar Exentas por heurística)
    const rowsToAnalyze = rows.filter(r => r.tratamiento === 'GRAVADO');
    if (rowsToAnalyze.length === 0) return rows;

    const ai = getAiClient();

    // Prepare context
    const activitiesContext = availableActivities.map(a => `- ${a.id}: [${a.code}] ${a.description}`).join('\n');
    const mainActivityId = availableActivities.find(a => a.isMain)?.id || availableActivities[0]?.id;

    const dataPayload = rowsToAnalyze.map(r => ({
        id: r.id,
        cuenta: r.cuenta,
        descripcion: r.descripcion,
        tercero: r.tercero,
        neto: Math.max(0, r.credito - r.debito)
    }));

    const prompt = `
    Eres un auditor contable experto en impuestos municipales colombianos (ICA).
    Tu labor es analizar un lote de filas contables correspondientes a Ingresos Brutos y predecir:
    1. A cuál Código CIIU de la empresa pertenece la transacción.
    2. Si el tratamiento tributario debe ser EXCLUIDO (Venta de activos fijos, indemnizaciones, dividendos) o EXENTO (Exportaciones).

    ACTIVIDADES DISPONIBLES EN LA EMPRESA:
    ${activitiesContext}

    REGLAS:
    - Si la transacción menciona "exportaci", "exterior" o es una venta internacional, el tratamiento es EXENTO.
    - Si es venta de "activo fijo", "vehículo", "inmueble propio", "indemnización", "dividendos" o "rendimientos financieros" (cuenta 4210), tratamiento es EXCLUIDO.
    - De lo contrario, tratamiento es GRAVADO.
    - Clasifica el ID de la actividad (CIIU) lo más lógico posible según la descripción. Si dudas, asigna la actividad: ${mainActivityId}.

    DATOS A ANALIZAR (JSON):
    ${JSON.stringify(dataPayload)}

    RESPUESTA OBLIGATORIA:
    Devuelve ÚNICAMENTE un JSON VÁLIDO con la siguiente estructura (Array de objetos):
    [{"id":"uuid-de-fila", "ciiuId": "uuid-elegido", "tratamiento": "GRAVADO|EXCLUIDO|EXENTO"}]
    No incluyas formateo markdown ni backticks, solo el texto en crudo JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1, // Baja temperatura para mantener consistencia contable
                responseMimeType: 'application/json'
            }
        });

        if (!response.text) return rows;

        // Parse JSON securely
        const textClear = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const predictions = JSON.parse(textClear) as Array<{id: string, ciiuId: string, tratamiento: 'GRAVADO'|'EXENTO'|'EXCLUIDO'}>;

        // Mergear resultados
        const newRows = [...rows];
        predictions.forEach(p => {
            const rowIndex = newRows.findIndex(r => r.id === p.id);
            if (rowIndex !== -1) {
                newRows[rowIndex] = { 
                    ...newRows[rowIndex], 
                    ciiuId: p.ciiuId || newRows[rowIndex].ciiuId,
                    tratamiento: p.tratamiento || newRows[rowIndex].tratamiento,
                    aiSuggested: true // Marcamos como sugerido por IA para feedback visual
                };
            }
        });

        return newRows;

    } catch (err) {
        console.error("AI Error:", err);
        throw new Error("Hubo un error contactando a la IA Contable.");
    }
};
