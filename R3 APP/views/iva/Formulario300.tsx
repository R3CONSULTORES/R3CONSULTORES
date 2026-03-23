
import React, { useState } from 'react';
import { DianFormRow } from '../../components/iva/components/DianFormRow';
import { DianFormSection } from '../../components/iva/components/DianFormSection';

// --- Icons (Local Definition) ---
const DocumentCheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
);

interface Formulario300Props {
    data: {
        header: {
            nit: string;
            dv: string;
            razonSocial?: string;
            primerApellido?: string;
            segundoApellido?: string;
            primerNombre?: string;
            otrosNombres?: string;
            anio: number;
            periodoCodigo: string;
            periodicidad: 'mensual' | 'bimestral' | 'cuatrimestral';
        };
        // Ingresos
        r27: number, r28: number, r29: number, r35: number, r39: number, r40: number,
        r41: number, r42: number, r43: number,
        // Compras
        r50: number, r51: number, r52: number, r53: number, r54: number,
        r55: number, r56: number, r57: number,
        // Liquidacion
        r58: number, r59: number, r60: number,
        r66: number, r67: number,
        r71: number, r72: number, r74: number, r75: number,
        r77: number, r79: number,
        r81: number,
        r82: number, r83: number, r85: number,
    };
    dataSource: 'real' | 'proyectado';
    onDataSourceChange: (source: 'real' | 'proyectado') => void;
}

const Formulario300: React.FC<Formulario300Props> = ({ data, dataSource, onDataSourceChange }) => {
    // State for editable fields
    const [renglon84, setRenglon84] = useState(0); // Saldo a favor del período fiscal anterior
    const [renglon87, setRenglon87] = useState(0); // Sanciones
    
    if (!data) return null;

    // Calculate final values (using optional chaining for safety)
    const saldoDelPeriodo = (data?.r82 || 0) - (data?.r83 || 0);
    const saldoAntesDeSanciones = saldoDelPeriodo - renglon84 - (data?.r85 || 0);
    const resultadoFinal = saldoAntesDeSanciones + renglon87;

    const r86_saldoPagarImpuesto = Math.max(0, saldoAntesDeSanciones);
    const r88_totalSaldoPagar = Math.max(0, resultadoFinal);
    const r89_totalSaldoFavor = Math.max(0, -resultadoFinal);
    
    const isProjected = dataSource === 'proyectado';
    const periodicidad = data?.header?.periodicidad || 'bimestral';
    const isBimestral = periodicidad === 'bimestral';
    const isCuatrimestral = periodicidad === 'cuatrimestral';

    return (
        <div className="bg-gray-100 p-4 md:p-8 rounded-xl shadow-lg animate-fadeIn">
            
            {/* Toolbar for Mode Switching */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    Formulario 300 <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Borrador</span>
                </h2>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => onDataSourceChange('real')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 ${
                            dataSource === 'real' 
                                ? 'bg-slate-800 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                    >
                        <DocumentCheckIcon className="w-4 h-4" />
                        Escenario Real
                    </button>
                    <button
                        onClick={() => onDataSourceChange('proyectado')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 ${
                            dataSource === 'proyectado' 
                                ? 'bg-[#000040] text-white shadow-sm ring-1 ring-[#000040]' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                    >
                        <SparklesIcon className="w-4 h-4" />
                        Escenario Simulado
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            {isProjected && (
                <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-3 animate-fadeIn">
                    <div className="text-amber-500 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-800 text-sm">⚠️ VISTA PRELIMINAR: Incluye factura proyectada de compra para optimización de IVA.</h4>
                        <p className="text-xs text-amber-700 mt-1">
                            Este formulario contiene datos simulados. No utilice estos valores para la presentación oficial a menos que la factura haya sido formalizada.
                        </p>
                    </div>
                </div>
            )}

            {/* FORM CONTAINER - Paper Style */}
            <div className={`max-w-4xl mx-auto bg-white shadow-2xl overflow-hidden transition-all duration-300 ${isProjected ? 'ring-4 ring-amber-100' : ''}`}>
                
                {/* 1. HEADER DIAN STYLE */}
                <div className="border-b-2 border-[#006847] p-4 relative">
                    {/* Watermark Simulation */}
                    <div className="absolute top-2 right-2 text-[10px] text-gray-300 font-bold border border-gray-300 p-1 rounded">
                        300 - Declaración del Impuesto sobre las Ventas
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col items-center justify-center w-24 h-16 border-2 border-[#006847] rounded-full">
                            <span className="font-serif italic font-bold text-[#006847] text-xl">DIAN</span>
                        </div>
                        <div className="flex-grow text-center">
                            <h1 className="font-bold text-lg text-slate-800 uppercase tracking-tight">Declaración del Impuesto sobre las Ventas - IVA</h1>
                            <p className="text-xs text-slate-500">Privada</p>
                        </div>
                        <div className="flex flex-col gap-1 w-48">
                            <div className="flex border border-[#006847]">
                                <div className="bg-[#006847] text-white text-[10px] px-2 py-1 font-bold w-12 text-center">1. AÑO</div>
                                <div className="bg-white flex-grow text-center font-mono font-bold text-slate-800 py-1 text-lg">{data?.header?.anio}</div>
                            </div>
                            <div className="flex border border-[#006847]">
                                <div className="bg-[#006847] text-white text-[10px] px-2 py-1 font-bold w-12 text-center">3. PERIODO</div>
                                <div className="bg-white flex-grow text-center font-mono font-bold text-slate-800 py-1 text-lg">{data?.header?.periodoCodigo}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. DATOS DEL DECLARANTE */}
                <div className="border-b border-[#006847] bg-white">
                    <div className="flex text-xs">
                        <div className="w-24 bg-[#006847] text-white p-2 flex items-center justify-center font-bold text-center border-r border-white">
                            4. Datos del<br/>Declarante
                        </div>
                        <div className="flex-grow p-2">
                            {/* Linea 1: NIT, DV, Nombres */}
                            <div className="grid grid-cols-12 gap-2 mb-2">
                                <div className="col-span-3">
                                    <label className="block text-[9px] text-[#006847] font-bold">5. Número de Identificación Tributaria (NIT)</label>
                                    <div className="border-b border-gray-300 font-mono h-5 text-sm font-bold text-slate-800 px-1">{data?.header?.nit}</div>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[9px] text-[#006847] font-bold">6. DV</label>
                                    <div className="border-b border-gray-300 font-mono h-5 text-sm font-bold text-slate-800 px-1 text-center">{data?.header?.dv}</div>
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-[9px] text-[#006847] font-bold">7. Primer Apellido</label>
                                    <div className="border-b border-gray-300 h-5 font-mono text-sm px-1 text-slate-800">{data?.header?.primerApellido}</div>
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-[9px] text-[#006847] font-bold">8. Segundo Apellido</label>
                                    <div className="border-b border-gray-300 h-5 font-mono text-sm px-1 text-slate-800">{data?.header?.segundoApellido}</div>
                                </div>
                            </div>
                            
                            {/* Linea 2: Nombres y Razón Social */}
                            <div className="grid grid-cols-12 gap-2 mb-2">
                                <div className="col-span-4">
                                    <label className="block text-[9px] text-[#006847] font-bold">9. Primer Nombre</label>
                                    <div className="border-b border-gray-300 h-5 font-mono text-sm px-1 text-slate-800">{data?.header?.primerNombre}</div>
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-[9px] text-[#006847] font-bold">10. Otros Nombres</label>
                                    <div className="border-b border-gray-300 h-5 font-mono text-sm px-1 text-slate-800">{data?.header?.otrosNombres}</div>
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-[9px] text-[#006847] font-bold">11. Razón Social</label>
                                    <div className="border-b border-gray-300 h-5 font-mono text-sm px-1 text-slate-800 bg-gray-50">{data?.header?.razonSocial}</div>
                                </div>
                            </div>

                            {/* Linea 3: Dirección Seccional y Periodicidad */}
                            <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-2">
                                    <label className="block text-[9px] text-[#006847] font-bold">12. Cód. Dir. Seccional</label>
                                    <div className="border-b border-gray-300 font-mono h-5 text-center text-sm"></div>
                                </div>
                                <div className="col-span-6 flex items-end gap-4 pb-1">
                                    <span className="text-[10px] font-bold text-[#000047]">24. Periodicidad:</span>
                                    <div className="flex items-center gap-1">
                                        <div className={`w-4 h-4 border border-[#000047] flex items-center justify-center text-xs font-bold ${isBimestral ? 'text-black' : 'text-transparent'}`}>X</div>
                                        <span className="text-[10px]">Bimestral</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className={`w-4 h-4 border border-[#000047] flex items-center justify-center text-xs font-bold ${isCuatrimestral ? 'text-black' : 'text-transparent'}`}>X</div>
                                        <span className="text-[10px]">Cuatrimestral</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-4 h-4 border border-[#000047]"></div>
                                        <span className="text-[10px]">Anual</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. SECCIONES NUMÉRICAS */}
                <div className="flex flex-col md:flex-row border-b border-[#006847]">
                    
                    {/* COLUMNA IZQUIERDA */}
                    <div className="w-full md:w-1/2 md:border-r border-[#006847]">
                        
                        {/* SECCIÓN INGRESOS */}
                        <DianFormSection title="Ingresos">
                            <DianFormRow code={27} description="Por operaciones gravadas al 5%" value={data?.r27} />
                            <DianFormRow code={28} description="Por operaciones gravadas a la tarifa general" value={data?.r28} />
                            <DianFormRow code={29} description="A.I.U. por operaciones gravadas (base gravable especial)" value={data?.r29} />
                            <DianFormRow code={30} description="Por exportación de bienes" value={0} />
                            <DianFormRow code={31} description="Por exportación de servicios" value={0} />
                            <DianFormRow code={32} description="Por ventas a sociedades de comercialización internacional" value={0} />
                            <DianFormRow code={33} description="Por ventas a zonas francas" value={0} />
                            <DianFormRow code={34} description="Por juegos de suerte y azar" value={0} />
                            <DianFormRow code={35} description="Por operaciones exentas" value={data?.r35} />
                            <DianFormRow code={36} description="Por venta de cerveza de producción nacional" value={0} />
                            <DianFormRow code={37} description="Por venta de gaseosas y similares" value={0} />
                            <DianFormRow code={38} description="Por venta de licores, aperitivos, vinos y similares" value={0} />
                            <DianFormRow code={39} description="Por operaciones excluidas" value={data?.r39} />
                            <DianFormRow code={40} description="Por operaciones no gravadas" value={data?.r40} />
                            <DianFormRow code={41} description="Total ingresos brutos" value={data?.r41} isTotal />
                            <DianFormRow code={42} description="Devoluciones en ventas anuladas, rescindidas o resueltas" value={data?.r42} />
                            <DianFormRow code={43} description="Total ingresos netos recibidos durante el período" value={data?.r43} isTotal />
                        </DianFormSection>

                        {/* SECCIÓN COMPRAS */}
                        <DianFormSection title="Compras">
                            <DianFormRow code={44} description="De bienes gravados a la tarifa del 5% (Importaciones)" value={0} />
                            <DianFormRow code={45} description="De bienes gravados a la tarifa general (Importaciones)" value={0} />
                            <DianFormRow code={46} description="De bienes y servicios gravados provenientes de Zonas Francas" value={0} />
                            <DianFormRow code={47} description="De bienes no gravados (Importaciones)" value={0} />
                            <DianFormRow code={48} description="De bienes y servicios excluidos, exentos y no gravados (Zonas Francas)" value={0} />
                            <DianFormRow code={49} description="De servicios (Importaciones)" value={0} />
                            <div className="bg-gray-100 text-xs font-bold text-center py-1 border-b border-[#006847] text-gray-500">NACIONALES</div>
                            <DianFormRow code={50} description="De bienes gravados a la tarifa del 5%" value={data?.r50} />
                            <DianFormRow code={51} description="De bienes gravados a la tarifa general" value={data?.r51} />
                            <DianFormRow code={52} description="De servicios gravados a la tarifa del 5%" value={data?.r52} />
                            <DianFormRow code={53} description="De servicios gravados a la tarifa general" value={data?.r53} />
                            <DianFormRow code={54} description="De bienes y servicios excluidos, exentos y no gravados" value={data?.r54} />
                            <DianFormRow code={55} description="Total compras e importaciones brutas" value={data?.r55} isTotal />
                            <DianFormRow code={56} description="Devoluciones en compras anuladas, rescindidas o resueltas" value={data?.r56} />
                            <DianFormRow code={57} description="Total compras netas realizadas durante el período" value={data?.r57} isTotal />
                        </DianFormSection>
                    </div>

                    {/* COLUMNA DERECHA */}
                    <div className="w-full md:w-1/2">
                        
                        {/* SECCIÓN LIQUIDACIÓN PRIVADA - IMPUESTO GENERADO */}
                        <DianFormSection title="Liquidación Privada - Impuesto Generado">
                            <DianFormRow code={58} description="A la tarifa del 5%" value={data?.r58} />
                            <DianFormRow code={59} description="A la tarifa general" value={data?.r59} />
                            <DianFormRow code={60} description="Sobre A.I.U. en operaciones gravadas" value={data?.r60} />
                            <DianFormRow code={61} description="En juegos de suerte y azar" value={0} />
                            <DianFormRow code={62} description="En venta de cerveza de producción nacional" value={0} />
                            <DianFormRow code={63} description="En venta de gaseosas y similares" value={0} />
                            <DianFormRow code={64} description="En venta de licores, aperitivos, vinos y similares" value={0} />
                            <DianFormRow code={65} description="En retiro de inventario para activos fijos, consumo, muestras gratis" value={0} />
                            <DianFormRow code={66} description="IVA recuperado en devoluciones en compras" value={data?.r66} />
                            <DianFormRow code={67} description="Total impuesto generado por operaciones gravadas" value={data?.r67} isTotal />
                        </DianFormSection>

                        {/* SECCIÓN LIQUIDACIÓN PRIVADA - IMPUESTO DESCONTABLE */}
                        <DianFormSection title="Impuesto Descontable">
                            <DianFormRow code={68} description="Por importaciones gravadas a la tarifa del 5%" value={0} />
                            <DianFormRow code={69} description="Por importaciones gravadas a la tarifa general" value={0} />
                            <DianFormRow code={70} description="De bienes y servicios gravados provenientes de Zonas Francas" value={0} />
                            <DianFormRow code={71} description="Por compras de bienes gravados a la tarifa del 5%" value={data?.r71} />
                            <DianFormRow code={72} description="Por compras de bienes gravados a la tarifa general" value={data?.r72} />
                            <DianFormRow code={73} description="Por licores, aperitivos, vinos y similares" value={0} />
                            <DianFormRow code={74} description="Por compras de servicios gravados a la tarifa del 5%" value={data?.r74} />
                            <DianFormRow code={75} description="Por compras de servicios gravados a la tarifa general" value={data?.r75} />
                            <DianFormRow code={76} description="Descuento IVA exploración hidrocarburos" value={0} />
                            <DianFormRow code={77} description="Total impuesto pagado o facturado" value={data?.r77} isTotal />
                            <DianFormRow code={79} description="IVA retenido por servicios prestados en Colombia por no domiciliados" value={0} />
                            <DianFormRow code={80} description="IVA resultante por devoluciones en ventas anuladas" value={data?.r79} />
                            <DianFormRow code={81} description="Total impuestos descontables" value={data?.r81} isTotal />
                        </DianFormSection>

                        {/* SECCIÓN SALDOS */}
                        <DianFormSection title="Saldo">
                            <DianFormRow code={82} description="Saldo a pagar por el período fiscal" value={data?.r82} />
                            <DianFormRow code={83} description="Saldo a favor del período fiscal" value={data?.r83} />
                            <DianFormRow code={84} description="Saldo a favor del período fiscal anterior" value={renglon84} editable onEdit={setRenglon84} />
                            <DianFormRow code={85} description="Retenciones por IVA que le practicaron" value={data?.r85} />
                            <DianFormRow code={86} description="Saldo a pagar por impuesto" value={r86_saldoPagarImpuesto} isTotal />
                            <DianFormRow code={87} description="Sanciones" value={renglon87} editable onEdit={setRenglon87} />
                            <DianFormRow code={88} description="Total saldo a pagar" value={r88_totalSaldoPagar} isTotal />
                            <DianFormRow code={89} description="Total saldo a favor" value={r89_totalSaldoFavor} isTotal />
                        </DianFormSection>
                    </div>
                </div>

                {/* 4. FOOTER */}
                <div className="bg-gray-50 p-4 text-[10px] text-gray-500 text-center border-t border-[#006847]">
                    Este borrador es una representación visual para fines de auditoría y no constituye un documento legal válido para presentación.
                </div>
            </div>
        </div>
    );
};

export default Formulario300;
