const fs = require('fs');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const pdfBuffer = fs.readFileSync('docs/Pliego ET Mantenimiento_octubre 2025 .pdf');

pdfParse(pdfBuffer).then(data => {
    fs.writeFileSync('docs/pliego-text.txt', data.text);
    console.log('Text extracted successfully!');
    console.log('Pages:', data.numpages);
    console.log('Text length:', data.text.length);
}).catch(err => {
    console.error('Error:', err.message);
});
