import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import DataExplorer, { DataSource } from '../DataExplorer';
import { formatCurrency } from '../../utils/formatters';

const ExploradorDocRetenciones: React.FC = () => {
    const context = useContext(AppContext);

    if (!context) {
        return <div>Cargando contexto...</div>;
    }

    const { appState, updateAppState } = context;
    const { retencion_auxiliar, retencion_compras, retencion_ventas, retencion_base } = appState.files;

    const handleUpdate = (
        dataSourceId: string,
        rowId: string,
        field: string,
        newValue: string | number
    ) => {
        const fileKey = dataSourceId === 'base' ? 'retencion_base' : `retencion_${dataSourceId}` as const;
        const dataArray = appState.files[fileKey];

        if (!dataArray) return;

        const newArray = [...dataArray];
        const rowIndex = newArray.findIndex((r: any) => r.id === rowId);

        if (rowIndex === -1) return;

        const rowToUpdate = { ...newArray[rowIndex] };
        const originalValue = rowToUpdate[field as keyof typeof rowToUpdate];

        if (!rowToUpdate.isModified && originalValue !== newValue) {
            let originalFormatted: string;
            if (field === 'Porcentaje') {
                originalFormatted = `${(((originalValue as unknown) as number) * 100).toFixed(2)}%`;
            } else if (typeof originalValue === 'number') {
                originalFormatted = formatCurrency(originalValue);
            } else {
                originalFormatted = String(originalValue);
            }
            rowToUpdate.comentario = `Valor original '${field}': ${originalFormatted}. ${rowToUpdate.comentario || ''}`.trim();
            rowToUpdate.isModified = true;
        }

        (rowToUpdate as any)[field] = newValue;
        newArray[rowIndex] = rowToUpdate;

        updateAppState({
            files: { ...appState.files, [fileKey]: newArray },
            retencionesNeedsRecalculation: true
        });
    };

    const dataSources: DataSource[] = [
        {
            id: 'auxiliar',
            label: 'Auxiliar General',
            data: retencion_auxiliar,
            headers: [
                { key: 'Cuenta', label: 'Cuenta' },
                { key: 'Tercero', label: 'Tercero' },
                { key: 'NIT', label: 'NIT' },
                { key: 'Fecha', label: 'Fecha' },
                { key: 'Nota', label: 'Nota' },
                { key: 'DocNum', label: 'DocNum' },
                { key: 'Debitos', label: 'Debitos', isNumeric: true, isEditable: true },
                { key: 'Creditos', label: 'Creditos', isNumeric: true, isEditable: true },
                { key: 'comentario', label: 'Comentario', isEditable: true },
            ]
        },
        {
            id: 'compras',
            label: 'Informe de Compras',
            data: retencion_compras,
            headers: [
                { key: 'Documento', label: 'Documento' },
                { key: 'Fecha', label: 'Fecha' },
                { key: 'Cliente', label: 'Cliente' },
                { key: 'NIT', label: 'NIT' },
                { key: 'VentaNeta', label: 'VentaNeta', isNumeric: true, isEditable: true },
                { key: 'IVA', label: 'IVA', isNumeric: true, isEditable: true },
                { key: 'comentario', label: 'Comentario', isEditable: true },
            ]
        },
        {
            id: 'ventas',
            label: 'Informe de Ventas',
            data: retencion_ventas,
            headers: [
                { key: 'Documento', label: 'Documento' },
                { key: 'Fecha', label: 'Fecha' },
                { key: 'Cliente', label: 'Cliente' },
                { key: 'NIT', label: 'NIT' },
                { key: 'VentaNeta', label: 'VentaNeta', isNumeric: true, isEditable: true },
                { key: 'IVA', label: 'IVA', isNumeric: true, isEditable: true },
                { key: 'comentario', label: 'Comentario', isEditable: true },
            ]
        },
        {
            id: 'base',
            label: 'Auxiliar con Bases',
            data: retencion_base,
            headers: [
                { key: 'Codigo', label: 'Codigo' },
                { key: 'CuentaDocumento', label: 'CuentaDocumento' },
                { key: 'Fecha', label: 'Fecha' },
                { key: 'Tercero', label: 'Tercero' },
                { key: 'Valor', label: 'Valor', isNumeric: true, isEditable: true },
                { key: 'Porcentaje', label: 'Porcentaje', isPercentage: true, isEditable: true },
                { key: 'Base', label: 'Base', isNumeric: true, isEditable: true },
                { key: 'comentario', label: 'Comentario', isEditable: true },
            ]
        },
    ];

    return (
        <DataExplorer
            title="Explorador de Documentos de Retenciones"
            dataSources={dataSources}
            onUpdate={handleUpdate}
        />
    );
};

export default ExploradorDocRetenciones;
