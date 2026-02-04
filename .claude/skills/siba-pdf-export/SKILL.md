---
name: siba-pdf-export
description: Patrones para generar PDFs y reportes con PDFKit
---

# SIBA PDF Export

Lineamientos para generar PDFs de reportes, OTs y documentos.

## Cuándo Usar

- Generar **Órdenes de Trabajo** en PDF
- Exportar **reportes** de tickets
- Crear **documentos formales**

---

## Setup PDFKit

```typescript
// services/pdf.service.ts
import PDFDocument from 'pdfkit';
import { Response } from 'express';

export const createPDF = () => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: 'Documento SIBA',
      Author: 'Sistema SIBA',
    },
  });

  return doc;
};

export const sendPDF = (doc: PDFKit.PDFDocument, res: Response, filename: string) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.end();
};
```

---

## Estructura de OT

```typescript
// services/ot-pdf.service.ts
import PDFDocument from 'pdfkit';

interface OTData {
  numero: string;
  fecha: Date;
  cliente: string;
  sucursal: string;
  direccion: string;
  tecnico: string;
  descripcion: string;
  materiales: { nombre: string; cantidad: number }[];
}

export const generateOTPDF = (data: OTData) => {
  const doc = new PDFDocument({ size: 'A4' });

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('ORDEN DE TRABAJO', { align: 'center' }).moveDown();

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`N°: ${data.numero}`, { align: 'right' })
    .text(`Fecha: ${formatDate(data.fecha)}`, { align: 'right' })
    .moveDown();

  // Datos del cliente
  drawSection(doc, 'DATOS DEL CLIENTE');
  drawRow(doc, 'Cliente:', data.cliente);
  drawRow(doc, 'Sucursal:', data.sucursal);
  drawRow(doc, 'Dirección:', data.direccion);
  doc.moveDown();

  // Datos del servicio
  drawSection(doc, 'DATOS DEL SERVICIO');
  drawRow(doc, 'Técnico:', data.tecnico);
  drawRow(doc, 'Descripción:', data.descripcion);
  doc.moveDown();

  // Materiales
  if (data.materiales.length > 0) {
    drawSection(doc, 'MATERIALES UTILIZADOS');
    drawTable(doc, data.materiales);
  }

  // Footer con firma
  doc
    .moveDown(4)
    .text('________________________', { align: 'center' })
    .text('Firma del Cliente', { align: 'center' });

  return doc;
};

// Helpers
const drawSection = (doc: PDFKit.PDFDocument, title: string) => {
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(title)
    .moveDown(0.5)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke()
    .moveDown(0.5);
};

const drawRow = (doc: PDFKit.PDFDocument, label: string, value: string) => {
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(label, { continued: true })
    .font('Helvetica')
    .text(` ${value}`);
};

const drawTable = (doc: PDFKit.PDFDocument, items: { nombre: string; cantidad: number }[]) => {
  const startY = doc.y;

  // Header
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Material', 50, startY);
  doc.text('Cantidad', 450, startY);

  doc
    .moveTo(50, startY + 15)
    .lineTo(545, startY + 15)
    .stroke();

  // Rows
  doc.font('Helvetica');
  let y = startY + 25;

  items.forEach((item) => {
    doc.text(item.nombre, 50, y);
    doc.text(String(item.cantidad), 450, y);
    y += 20;
  });

  doc.y = y;
};
```

---

## Endpoint de Descarga

```typescript
// controllers/ot.controller.ts
import { generateOTPDF } from '../services/ot-pdf.service';
import { sendPDF } from '../services/pdf.service';

export const downloadOTPDF = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const ot = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        ticket: {
          include: {
            sucursal: { include: { cliente: true } },
            tecnico: true,
          },
        },
        materiales: { include: { material: true } },
      },
    });

    if (!ot) {
      return res.status(404).json({ error: 'OT no encontrada' });
    }

    const pdfData = {
      numero: ot.numero,
      fecha: ot.fecha,
      cliente: ot.ticket.sucursal.cliente.razonSocial,
      sucursal: ot.ticket.sucursal.nombre,
      direccion: ot.ticket.sucursal.direccion,
      tecnico: `${ot.ticket.tecnico?.nombre} ${ot.ticket.tecnico?.apellido}`,
      descripcion: ot.ticket.descripcion,
      materiales: ot.materiales.map((m) => ({
        nombre: m.material.nombre,
        cantidad: m.cantidad,
      })),
    };

    const doc = generateOTPDF(pdfData);
    sendPDF(doc, res, `OT-${ot.numero}.pdf`);
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
};
```

---

## Frontend: Botón de Descarga

```tsx
// components/OTDownloadButton.tsx
import { Download } from 'lucide-react';
import { Button } from './ui/core/Button';

interface OTDownloadButtonProps {
  otId: number;
  otNumero: string;
}

export const OTDownloadButton = ({ otId, otNumero }: OTDownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await api.get(`/ots/${otId}/pdf`, {
        responseType: 'blob',
      });

      // Crear link de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OT-${otNumero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Error al descargar PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      isLoading={isDownloading}
      leftIcon={<Download className="h-4 w-4" />}
    >
      Descargar PDF
    </Button>
  );
};
```

---

## Agregar Logo/Imagen

```typescript
import path from 'path';

const generatePDFWithLogo = () => {
  const doc = new PDFDocument();

  // Logo (desde archivo)
  const logoPath = path.join(__dirname, '../assets/logo.png');
  doc.image(logoPath, 50, 45, { width: 100 });

  // O desde buffer/base64
  doc.image(logoBuffer, 50, 45, { width: 100 });

  return doc;
};
```

---

## Checklist

- [ ] PDFDocument configurado con tamaño y márgenes
- [ ] Headers con logo y número de documento
- [ ] Secciones claramente separadas
- [ ] Tabla para listados (materiales, items)
- [ ] Footer con espacio para firma
- [ ] Content-Type y Content-Disposition correctos
- [ ] responseType: 'blob' en frontend
- [ ] Manejo de errores en generación
