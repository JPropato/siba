import fs from 'fs';
import pdfParse from 'pdf-parse';

const pdfBuffer = fs.readFileSync('docs/Pliego ET Mantenimiento_octubre 2025 .pdf');

pdfParse(pdfBuffer).then(data => {
    console.log(data.text);
}).catch(err => {
    console.error('Error:', err.message);
});
