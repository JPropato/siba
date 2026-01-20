import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PDFItem {
  tipo: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  subtotal: number;
}

interface PDFData {
  codigo: string;
  titulo: string;
  cliente: string;
  sucursal?: string;
  fecha: string;
  validezDias: number;
  items: PDFItem[];
  subtotal: number;
  total: number;
  condicionesPago?: string;
}

export const pdfService = {
  async generarPresupuesto(data: PDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Estilos y Colores ---
      const primaryColor = '#B8860B'; // Gold/Brand color
      const secondaryColor = '#444444';
      const tableHeaderColor = '#F8F9FA';
      const borderColor = '#EEEEEE';

      // --- Header ---
      const logoPath = path.join(__dirname, '../../assets/logo-bauman.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 100 });
      }

      doc.fillColor(primaryColor).fontSize(20).text('PRESUPUESTO', 200, 50, { align: 'right' });

      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .text(`Código: ${data.codigo}`, 200, 75, { align: 'right' })
        .text(`Fecha: ${data.fecha}`, 200, 90, { align: 'right' })
        .text(`Validez: ${data.validezDias} días`, 200, 105, { align: 'right' });

      doc.moveDown(4);

      // --- Informacion del Cliente ---
      doc.fillColor(primaryColor).fontSize(12).text('INFORMACIÓN DEL CLIENTE', 50, 150);
      doc.moveTo(50, 165).lineTo(300, 165).stroke(borderColor);

      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .text(`Cliente: ${data.cliente}`, 50, 175)
        .text(`Sucursal: ${data.sucursal || 'Central'}`, 50, 190);

      // --- Datos de la Obra ---
      doc.fillColor(primaryColor).fontSize(12).text('DATOS DE LA OBRA', 350, 150);
      doc.moveTo(350, 165).lineTo(550, 165).stroke(borderColor);

      doc.fillColor(secondaryColor).fontSize(10).text(`Título: ${data.titulo}`, 350, 175);

      doc.moveDown(5);

      // --- Tabla de Items ---
      const tableTop = 240;
      const itemX = 50;
      const cantX = 300;
      const unitX = 350;
      const priceX = 400;
      const subtotalX = 480;

      // Encabezado Tabla
      doc.rect(50, tableTop, 500, 20).fill(tableHeaderColor);
      doc.fillColor('#000000').fontSize(9);
      doc.text('Descripción', itemX + 5, tableTop + 5);
      doc.text('Cant.', cantX, tableTop + 5, { width: 40, align: 'center' });
      doc.text('Unid.', unitX, tableTop + 5, { width: 40, align: 'center' });
      doc.text('P. Unit.', priceX, tableTop + 5, { width: 70, align: 'right' });
      doc.text('Subtotal', subtotalX, tableTop + 5, { width: 70, align: 'right' });

      let currentY = tableTop + 25;

      data.items.forEach((item) => {
        // Check page break
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.fillColor(secondaryColor).fontSize(9);
        doc.text(item.descripcion, itemX + 5, currentY, { width: 240 });
        doc.text(item.cantidad.toString(), cantX, currentY, { width: 40, align: 'center' });
        doc.text(item.unidad, unitX, currentY, { width: 40, align: 'center' });
        doc.text(this.formatMoney(item.precioUnitario), priceX, currentY, {
          width: 70,
          align: 'right',
        });
        doc.text(this.formatMoney(item.subtotal), subtotalX, currentY, {
          width: 70,
          align: 'right',
        });

        currentY += Math.max(20, doc.heightOfString(item.descripcion, { width: 240 }) + 5);
        doc
          .moveTo(itemX, currentY - 2)
          .lineTo(550, currentY - 2)
          .stroke(borderColor);
      });

      // --- Totales ---
      currentY += 10;
      const totalsX = 350;

      doc.fillColor(secondaryColor).fontSize(10);
      doc.text('Subtotal:', totalsX, currentY);
      doc.text(this.formatMoney(data.subtotal), subtotalX, currentY, { width: 70, align: 'right' });

      currentY += 20;
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', totalsX, currentY);
      doc.text(this.formatMoney(data.total), subtotalX, currentY, { width: 70, align: 'right' });

      // --- Pie de página y Notas ---
      doc.font('Helvetica').fontSize(9).fillColor(secondaryColor);
      if (data.condicionesPago) {
        doc.text('Condiciones de pago:', 50, 720);
        doc.text(data.condicionesPago, 50, 735, { width: 500 });
      }

      doc
        .fontSize(8)
        .fillColor('#AAAAAA')
        .text(
          'Este presupuesto tiene carácter informativo y está sujeto a cambios si las condiciones técnicas varían.',
          50,
          780,
          { align: 'center' }
        );

      doc.end();
    });
  },

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  },
};

export default pdfService;
