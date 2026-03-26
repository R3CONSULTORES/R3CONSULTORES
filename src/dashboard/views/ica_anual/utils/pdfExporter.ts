import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IcaFormulario } from './icaAlgorithms';
import { LiquidationConfig } from '../types';

const formatMoney = (val: number): string => {
  return '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const generateIcaPDF = (
  formulario: IcaFormulario,
  config: LiquidationConfig
) => {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ===== HEADER =====
  doc.setFillColor(30, 41, 59); // #1e293b
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(246, 176, 52); // #f6b034
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LIQUIDACIÓN PRIVADA - IMPUESTO DE INDUSTRIA Y COMERCIO', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Municipio: ${config.municipality}  |  Año Gravable: ${config.year}  |  Fecha: ${config.filingDate}`, pageWidth / 2, 30, { align: 'center' });

  let y = 50;

  // ===== SECCIÓN B: DEPURACIÓN =====
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SECCIÓN B — DEPURACIÓN DE INGRESOS', margin, y);
  y += 3;

  const depRows = [
    ['8', 'Total Ingresos Brutos Ordinarios y Extraordinarios', formatMoney(formulario.renglon8_totalBruto)],
    ['9', '(-) Ingresos obtenidos fuera del municipio', formatMoney(formulario.renglon9_fueraMunicipio)],
    ['10', 'Total Ingresos en el Municipio', formatMoney(formulario.renglon10_ingresosLocales)],
    ['11', '(-) Devoluciones, rebajas y descuentos', formatMoney(formulario.renglon11_devoluciones)],
    ['12', '(-) Exportaciones', formatMoney(formulario.renglon12_exportaciones)],
    ['13', '(-) Venta de Activos Fijos', formatMoney(formulario.renglon13_activosFijos)],
    ['14', '(-) Actividades Excluidas', formatMoney(formulario.renglon14_excluidos)],
    ['15', '(-) Actividades Exentas', formatMoney(formulario.renglon15_exentos)],
    ['16', 'TOTAL INGRESOS GRAVABLES', formatMoney(formulario.renglon16_baseGravable)],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Rng', 'Concepto', 'Valor ($)']],
    body: depRows,
    theme: 'striped',
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const rng = depRows[data.row.index]?.[0];
        if (rng === '10' || rng === '16') {
          data.cell.styles.fillColor = rng === '16' ? [220, 252, 231] : [241, 245, 249];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ===== SECCIÓN C: ACTIVIDADES =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SECCIÓN C — DISCRIMINACIÓN POR ACTIVIDAD ECONÓMICA', margin, y);
  y += 3;

  const actRows = formulario.seccionC.map(r => [
    r.ciiuCode,
    r.description,
    formatMoney(r.ingresosGravados),
    r.tarifa.toString(),
    formatMoney(r.impuesto),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['CIIU', 'Descripción', 'Ingresos Gravados', 'Tarifa', 'Impuesto']],
    body: actRows,
    foot: [['', '', '', 'R20 — ICA:', formatMoney(formulario.renglon20_impuestoIca)]],
    theme: 'grid',
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    footStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      2: { halign: 'right' },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ===== SECCIÓN D + E: COMPLEMENTARIOS Y SALDO =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SECCIONES D y E — LIQUIDACIÓN COMPLEMENTARIA Y SALDO', margin, y);
  y += 3;

  const compRows = [
    ['25', 'Impuesto de Avisos y Tableros', formatMoney(formulario.renglon25_avisosTableros)],
    ['26', 'Sobretasa Bomberil', formatMoney(formulario.renglon26_sobretasaBomberil)],
    ['33', 'TOTAL IMPUESTO A CARGO', formatMoney(formulario.renglon33_totalImpuesto)],
    ['34', '(-) Retenciones practicadas', formatMoney(formulario.renglon34_retenciones)],
    ['35', '(-) Autoretenciones', formatMoney(formulario.renglon35_autoretenciones)],
    ['36', '(-) Anticipo año anterior', formatMoney(formulario.renglon36_anticipoAnterior)],
    ['37', '(+) Sanciones', formatMoney(formulario.renglon37_sanciones)],
    ['38', '(+) Intereses de mora', formatMoney(formulario.renglon38_interesesMora)],
    ['39', 'TOTAL A PAGAR / SALDO A FAVOR', formatMoney(formulario.renglon39_totalPagar)],
  ];

  autoTable(doc, {
    startY: y,
    body: compRows,
    theme: 'striped',
    margin: { left: margin, right: margin },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const rng = compRows[data.row.index]?.[0];
        if (rng === '33') {
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.fontStyle = 'bold';
        }
        if (rng === '39') {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 10;
        }
      }
    },
  });

  // ===== FOOTER =====
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Documento generado por R3 Consultores — Liquidador ICA Anual. Este es un borrador y no constituye declaración oficial.', pageWidth / 2, finalY, { align: 'center' });

  doc.save(`ICA_${config.municipality}_${config.year}_Borrador.pdf`);
};
