import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ResumenPendientesTicket {
  codigoInterno: number;
  descripcion: string;
  sucursal: string;
  cliente: string;
  tecnico: string | null;
  estado: string;
  tipoTicket: string;
  rubro: string;
  fechaCreacion: string;
}

interface ResumenPendientesData {
  zona: { nombre: string; codigo: number };
  fecha: string;
  tickets: ResumenPendientesTicket[];
  totales: {
    nuevo: number;
    asignado: number;
    enCurso: number;
    pendienteCliente: number;
    total: number;
  };
}

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

  async generarResumenPendientes(data: ResumenPendientesData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryColor = '#B8860B';
      const secondaryColor = '#444444';
      const tableHeaderColor = '#F8F9FA';
      const borderColor = '#EEEEEE';

      const estadoColors: Record<string, string> = {
        NUEVO: '#3B82F6',
        ASIGNADO: '#F59E0B',
        EN_CURSO: '#8B5CF6',
        PENDIENTE_CLIENTE: '#EF4444',
      };

      // --- Header ---
      const logoPath = path.join(__dirname, '../../assets/logo-bauman.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 35, { width: 80 });
      }

      doc
        .fillColor(primaryColor)
        .fontSize(18)
        .text('TICKETS PENDIENTES', 150, 40, { align: 'center' });

      doc
        .fillColor(secondaryColor)
        .fontSize(11)
        .text(`Zona: ${data.zona.nombre}`, 150, 65, { align: 'center' })
        .fontSize(9)
        .text(`Fecha de generación: ${data.fecha}`, 150, 82, { align: 'center' });

      // --- Resumen por estado ---
      let badgeX = 50;
      const badgeY = 105;
      const badgeItems = [
        { label: 'Nuevo', count: data.totales.nuevo, color: estadoColors.NUEVO },
        { label: 'Asignado', count: data.totales.asignado, color: estadoColors.ASIGNADO },
        { label: 'En Curso', count: data.totales.enCurso, color: estadoColors.EN_CURSO },
        {
          label: 'Pend. Cliente',
          count: data.totales.pendienteCliente,
          color: estadoColors.PENDIENTE_CLIENTE,
        },
      ];

      for (const badge of badgeItems) {
        doc.roundedRect(badgeX, badgeY, 100, 22, 4).fill(badge.color);
        doc
          .fillColor('#FFFFFF')
          .fontSize(8)
          .text(`${badge.label}: ${badge.count}`, badgeX + 5, badgeY + 6, {
            width: 90,
            align: 'center',
          });
        badgeX += 110;
      }

      // Total
      doc.roundedRect(badgeX, badgeY, 120, 22, 4).fill(primaryColor);
      doc
        .fillColor('#FFFFFF')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`TOTAL: ${data.totales.total} tickets`, badgeX + 5, badgeY + 6, {
          width: 110,
          align: 'center',
        });

      doc.font('Helvetica');

      // --- Tabla ---
      const tableTop = 145;
      const colX = {
        codigo: 50,
        fecha: 120,
        descripcion: 195,
        sucursal: 395,
        tecnico: 525,
        estado: 640,
        tipo: 720,
      };

      // Encabezado tabla
      doc.rect(50, tableTop, 742, 20).fill(tableHeaderColor);
      doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold');
      doc.text('Código', colX.codigo + 3, tableTop + 5, { width: 65 });
      doc.text('Fecha', colX.fecha + 3, tableTop + 5, { width: 70 });
      doc.text('Descripción', colX.descripcion + 3, tableTop + 5, { width: 195 });
      doc.text('Sucursal / Cliente', colX.sucursal + 3, tableTop + 5, { width: 125 });
      doc.text('Técnico', colX.tecnico + 3, tableTop + 5, { width: 110 });
      doc.text('Estado', colX.estado + 3, tableTop + 5, { width: 75 });
      doc.text('Tipo', colX.tipo + 3, tableTop + 5, { width: 72 });

      doc.font('Helvetica');

      let currentY = tableTop + 25;

      const estadoLabels: Record<string, string> = {
        NUEVO: 'Nuevo',
        ASIGNADO: 'Asignado',
        EN_CURSO: 'En Curso',
        PENDIENTE_CLIENTE: 'Pend. Cliente',
      };
      const tipoLabels: Record<string, string> = {
        SEA: 'Emergencia Alta',
        SEP: 'Emerg. Prog.',
        SN: 'Normal',
      };

      for (const ticket of data.tickets) {
        if (currentY > 520) {
          doc.addPage();
          currentY = 50;
        }

        const descripcionTruncada =
          ticket.descripcion.length > 60
            ? ticket.descripcion.substring(0, 57) + '...'
            : ticket.descripcion;

        const sucursalCliente =
          ticket.sucursal !== ticket.cliente
            ? `${ticket.sucursal} - ${ticket.cliente}`
            : ticket.sucursal;

        const sucursalTruncada =
          sucursalCliente.length > 35 ? sucursalCliente.substring(0, 32) + '...' : sucursalCliente;

        doc.fillColor(secondaryColor).fontSize(8);
        doc.text(
          `TKT-${String(ticket.codigoInterno).padStart(5, '0')}`,
          colX.codigo + 3,
          currentY,
          { width: 65 }
        );
        doc.text(ticket.fechaCreacion, colX.fecha + 3, currentY, { width: 70 });
        doc.text(descripcionTruncada, colX.descripcion + 3, currentY, { width: 195 });
        doc.text(sucursalTruncada, colX.sucursal + 3, currentY, { width: 125 });
        doc.text(ticket.tecnico || 'Sin asignar', colX.tecnico + 3, currentY, { width: 110 });

        // Estado con color
        const estadoColor = estadoColors[ticket.estado] || secondaryColor;
        doc
          .fillColor(estadoColor)
          .text(estadoLabels[ticket.estado] || ticket.estado, colX.estado + 3, currentY, {
            width: 75,
          });

        doc
          .fillColor(secondaryColor)
          .text(tipoLabels[ticket.tipoTicket] || ticket.tipoTicket, colX.tipo + 3, currentY, {
            width: 72,
          });

        currentY += 18;
        doc
          .moveTo(50, currentY - 3)
          .lineTo(792, currentY - 3)
          .stroke(borderColor);
      }

      // --- Vacío ---
      if (data.tickets.length === 0) {
        doc
          .fillColor('#999999')
          .fontSize(12)
          .text('No hay tickets pendientes en esta zona.', 50, currentY + 20, {
            align: 'center',
            width: 742,
          });
      }

      // --- Footer ---
      doc.fontSize(7).fillColor('#AAAAAA').text('Generado automáticamente por SIBA', 50, 560, {
        align: 'center',
        width: 742,
      });

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
