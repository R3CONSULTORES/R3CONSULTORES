export const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) { matrix[0][i] = i; }
    for (let j = 0; j <= b.length; j++) { matrix[j][0] = j; }
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
};

export const normalizeTextForSearch = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export const isDevolucionesComprasAccountFuzzy = (fullAccountName: string) => {
    const normalized = normalizeTextForSearch(fullAccountName);
    // Rule 1: Must not be a sales return
    if (normalized.includes('ventas')) return false;
    
    const accountCode = fullAccountName.split(' ')[0];
    // Rule 2: Specific account codes are always purchase returns
    if (accountCode.startsWith('24080105') || accountCode.startsWith('24080106')) {
        return true;
    }

    const words = normalized.split(/\s+/);
    const LEVENSHTEIN_THRESHOLD = 2; // Allow up to 2 character differences (e.g., 'devolucones' vs 'devoluciones')

    // Rule 3: Must contain a word that looks like "devolución"
    const hasDevolucion = words.some(word => 
        levenshteinDistance(word, 'devolucion') <= LEVENSHTEIN_THRESHOLD ||
        levenshteinDistance(word, 'devoluciones') <= LEVENSHTEIN_THRESHOLD
    );
    if (!hasDevolucion) return false;

    // Rule 4: Must contain "compra" or "servicio" to differentiate from sales returns
    const hasCompraOrServicio = normalized.includes('compra') || normalized.includes('servicio');

    return hasCompraOrServicio;
};
