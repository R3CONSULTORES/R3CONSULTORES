import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';

export interface DataSource {
    id: string;
    label: string;
    data: any[] | null;
    headers: {
        key: string;
        label: string;
        isNumeric?: boolean;
        isPercentage?: boolean;
        isEditable?: boolean;
    }[];
}

interface DataExplorerProps {
    title: string;
    dataSources: DataSource[];
    onUpdate: (dataSourceId: string, rowId: string, field: string, value: string | number) => void;
}

const DataExplorer: React.FC<DataExplorerProps> = ({ title, dataSources, onUpdate }) => {
    const [activeDataSourceId, setActiveDataSourceId] = useState<string>(dataSources.find(ds => ds.data)?.id || dataSources[0]?.id || '');
    const [searchTerm, setSearchTerm] = useState('');

    const activeDataSource = dataSources.find(ds => ds.id === activeDataSourceId);

    const filteredData = useMemo(() => {
        if (!activeDataSource || !activeDataSource.data) return [];
        if (!searchTerm) return activeDataSource.data;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return activeDataSource.data.filter(row => {
            return Object.values(row).some(val =>
                String(val).toLowerCase().includes(lowerCaseSearch)
            );
        });
    }, [activeDataSource, searchTerm]);

    const totals = useMemo(() => {
        if (!activeDataSource || !activeDataSource.data || filteredData.length === 0) return {};

        const numericHeaders = activeDataSource.headers.filter(h => h.isNumeric && !h.isPercentage);
        if (numericHeaders.length === 0) return {};

        const calculatedTotals: Record<string, number> = {};
        numericHeaders.forEach(header => {
            calculatedTotals[header.key] = filteredData.reduce((sum, row) => sum + (row[header.key] || 0), 0);
        });
        return calculatedTotals;
    }, [filteredData, activeDataSource]);


    const handleEditableChange = (e: React.FocusEvent<HTMLTableCellElement>, rowId: string, header: DataSource['headers'][0]) => {
        const rawValue = e.currentTarget.textContent || '';
        let parsedValue: string | number = rawValue;

        if (header.isNumeric) {
            // Remove all non-digit characters except for a leading minus sign.
            // This handles currency symbols, spaces, and thousand separators ('.' or ',').
            const justDigitsAndSign = rawValue.replace(/[^0-9-]/g, '');
            parsedValue = parseInt(justDigitsAndSign, 10) || 0;
        } else if (header.isPercentage) {
            const numericPart = parseFloat(rawValue.replace(/[^0-9.,%]/g, '').replace(',', '.'));
            parsedValue = isNaN(numericPart) ? 0 : numericPart / 100;
        }

        onUpdate(activeDataSourceId, rowId, header.key, parsedValue);
    };

    const renderTable = () => {
        if (!activeDataSource || !activeDataSource.data) {
            return <p className="text-center text-slate-500 py-8">No hay datos cargados para esta fuente.</p>;
        }

        if (filteredData.length === 0) {
            return <p className="text-center text-slate-500 py-8">No se encontraron resultados para su búsqueda.</p>;
        }

        const headers = activeDataSource.headers;

        const renderCell = (row: any, header: typeof headers[0]) => {
            const { key, isNumeric, isPercentage, isEditable } = header;
            
            let displayValue: string;
            const rawValue = row[key];

            if (isNumeric) {
                displayValue = formatCurrency(rawValue);
            } else if (isPercentage) {
                displayValue = ((rawValue || 0) * 100).toFixed(2) + '%';
            } else {
                displayValue = String(rawValue ?? '');
            }

            return (
                <td
                    key={`${row.id}-${key}`}
                    contentEditable={isEditable}
                    onBlur={(e) => isEditable && handleEditableChange(e, row.id, header)}
                    suppressContentEditableWarning={true}
                    className={`
                        py-1 px-3 text-slate-700
                        ${isNumeric || isPercentage ? 'text-right font-mono' : 'whitespace-nowrap'}
                        ${row.isModified ? 'bg-amber-100/50' : ''}
                        ${key === 'comentario' ? 'text-xs italic' : ''}
                        ${isEditable ? 'focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none' : ''}
                    `}
                >
                    {displayValue}
                </td>
            );
        };

        return (
            <table className="min-w-full text-sm divide-y divide-slate-200">
                <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                        {headers.map(h =>
                            <th key={h.key} className={`py-2 px-3 font-semibold text-slate-600 ${h.isNumeric || h.isPercentage ? 'text-right' : 'text-left'}`}>{h.label}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredData.map((row: any) => (
                        <tr key={row.id}>
                            {headers.map(header => renderCell(row, header))}
                        </tr>
                    ))}
                </tbody>
                {Object.keys(totals).length > 0 && (
                     <tfoot className="sticky bottom-0 bg-slate-200">
                        <tr>
                            {headers.map((header, index) => {
                                const totalValue = (totals as any)[header.key];
                                if (typeof totalValue === 'number') {
                                    return <td key={`total-${header.key}`} className="py-2 px-3 font-bold text-black text-right font-mono">{formatCurrency(totalValue)}</td>;
                                }
                                const firstTotalIndex = headers.findIndex(h => h.key in totals);
                                if (index === firstTotalIndex - 1) {
                                    return <td key={`total-label-${header.key}`} colSpan={firstTotalIndex} className="py-2 px-3 font-bold text-black text-right">TOTALES</td>;
                                }
                                if (index < firstTotalIndex) {
                                    return null; // The cell is covered by colSpan
                                }
                                return <td key={`total-empty-${header.key}`}></td>;
                            })}
                        </tr>
                    </tfoot>
                )}
            </table>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-3">{title}</h2>

            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {dataSources.map(ds => (
                        <button
                            key={ds.id}
                            onClick={() => setActiveDataSourceId(ds.id)}
                            disabled={!ds.data}
                            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeDataSourceId === ds.id ? 'border-b-2 border-amber-500 text-amber-600' : 'border-b-2 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'} disabled:text-slate-300 disabled:hover:bg-transparent`}
                        >
                            {ds.label} ({ds.data?.length || 0})
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Buscar en la tabla actual..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
            </div>
            <div className="max-h-[65vh] overflow-auto border rounded-lg shadow-sm">
                {renderTable()}
            </div>
        </div>
    );
};

export default DataExplorer;