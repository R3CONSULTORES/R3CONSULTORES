export const formatCurrency = (value: number): string => {
    if (isNaN(value)) return '$ -';
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const formatted = new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        maximumFractionDigits: 0,
    }).format(absValue);
    return isNegative ? `-$ ${formatted}` : `$ ${formatted}`;
};
