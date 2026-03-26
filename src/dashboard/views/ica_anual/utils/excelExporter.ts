import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { IcaFormulario } from './icaAlgorithms';
import { LiquidationConfig, CiiuActivity } from '../types';

const formatMoney = (val: number): string => {
  return val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const generatePapelesExcel = (
  formulario: IcaFormulario,
  config: LiquidationConfig,
  activities: CiiuActivity[]
) => {
  const wb = XLSX.utils.book_new();

  // ===== HOJA 1: Resumen de Liquidación =====
  const resumenData = [
    ['LIQUIDACIÓN PRIVADA - ICA'],
    ['Municipio', config.municipality],
    ['Año Gravable', config.year],
    ['Fecha', config.filingDate],
    [],
    ['SECCIÓN B — DEPURACIÓN'],
    ['Renglón', 'Concepto', 'Valor ($)'],
    ['8', 'Total Ingresos Brutos', formatMoney(formulario.renglon8_totalBruto)],
    ['9', 'Ingresos fuera del municipio', formatMoney(formulario.renglon9_fueraMunicipio)],
    ['10', 'Total Ingresos en el Municipio', formatMoney(formulario.renglon10_ingresosLocales)],
    ['11', 'Devoluciones y descuentos', formatMoney(formulario.renglon11_devoluciones)],
    ['12', 'Exportaciones', formatMoney(formulario.renglon12_exportaciones)],
    ['13', 'Venta de Activos Fijos', formatMoney(formulario.renglon13_activosFijos)],
    ['14', 'Actividades Excluidas', formatMoney(formulario.renglon14_excluidos)],
    ['15', 'Actividades Exentas', formatMoney(formulario.renglon15_exentos)],
    ['16', 'TOTAL INGRESOS GRAVABLES', formatMoney(formulario.renglon16_baseGravable)],
    [],
    ['SECCIÓN D — LIQUIDACIÓN COMPLEMENTARIA'],
    ['20', 'Impuesto ICA', formatMoney(formulario.renglon20_impuestoIca)],
    ['25', 'Avisos y Tableros', formatMoney(formulario.renglon25_avisosTableros)],
    ['26', 'Sobretasa Bomberil', formatMoney(formulario.renglon26_sobretasaBomberil)],
    ['33', 'TOTAL IMPUESTO A CARGO', formatMoney(formulario.renglon33_totalImpuesto)],
    [],
    ['SECCIÓN E — SALDO'],
    ['34', 'Retenciones', formatMoney(formulario.renglon34_retenciones)],
    ['35', 'Autoretenciones', formatMoney(formulario.renglon35_autoretenciones)],
    ['36', 'Anticipo año anterior', formatMoney(formulario.renglon36_anticipoAnterior)],
    ['37', 'Sanciones', formatMoney(formulario.renglon37_sanciones)],
    ['38', 'Intereses de mora', formatMoney(formulario.renglon38_interesesMora)],
    ['39', 'TOTAL A PAGAR', formatMoney(formulario.renglon39_totalPagar)],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // ===== HOJA 2: Actividades (Sección C) =====
  const actData = [
    ['SECCIÓN C — DISCRIMINACIÓN POR ACTIVIDADES'],
    ['Código CIIU', 'Descripción', 'Ingresos Gravados', 'Tarifa (x1000)', 'Impuesto'],
    ...formulario.seccionC.map(r => [
      r.ciiuCode,
      r.description,
      formatMoney(r.ingresosGravados),
      r.tarifa,
      formatMoney(r.impuesto),
    ]),
    [],
    ['', '', '', 'TOTAL ICA (R20):', formatMoney(formulario.renglon20_impuestoIca)],
  ];

  const wsAct = XLSX.utils.aoa_to_sheet(actData);
  wsAct['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsAct, 'Actividades');

  // ===== HOJA 3: Detalle de Actividades Registradas =====
  const detData = [
    ['ACTIVIDADES ECONÓMICAS REGISTRADAS'],
    ['Código', 'Descripción', 'Tarifa (x1000)', 'Es Principal', 'Base Gravable'],
    ...activities.map(a => [
      a.code,
      a.description,
      a.rate,
      a.isMain ? 'SÍ' : 'NO',
      formatMoney(a.taxableBase || 0),
    ]),
  ];

  const wsDet = XLSX.utils.aoa_to_sheet(detData);
  wsDet['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsDet, 'Detalle Actividades');

  // ===== Exportar =====
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `PapelesTrabajo_ICA_${config.municipality}_${config.year}.xlsx`);
};
