/**
 * Script para cruzar datos del Pliego con el CSV existente
 * y generar el CSV consolidado con campos nuevos
 */
const fs = require('fs');
const path = require('path');
const { datosPliego } = require('./datos-pliego.cjs');

// Leer CSV existente
const csvPath = path.join(__dirname, 'sucursales.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parsear CSV
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = lines[0].split(',').map(h => h.trim());
const rows = lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());

    return headers.reduce((obj, header, i) => {
        obj[header] = values[i] || '';
        return obj;
    }, {});
});

console.log(`CSV existente: ${rows.length} sucursales`);
console.log(`Pliego: ${datosPliego.length} sucursales`);
console.log('');

// Función para normalizar nombres para comparación
function normalizar(str) {
    return str
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^A-Z0-9\s]/g, '') // Solo letras, números y espacios
        .replace(/\s+/g, ' ')
        .trim();
}

// Mapeo de zonas del CSV a zonas del pliego
const mapaZonas = {
    'CABA': ['CABA', 'Z1', 'Z2', 'Z3', 'A5', 'A6'],
    'NORTE': ['NORTE', 'A1', 'A2', 'Z4', 'Z5'],
    'OESTE': ['OESTE', 'A4', 'Z6'],
    'SUR': ['SUR', 'A3', 'A4', 'Z7', 'Z8'],
    'EDIFICIOS': ['CABA', 'NORTE', 'OESTE', 'SUR']
};

// Cruzar datos
const sucursalesConsolidadas = [];
const noEncontradas = [];
const matcheados = new Set();

for (const csvRow of rows) {
    const nombreCSV = normalizar(csvRow['SUCURSALES'] || '');
    const zonaCSV = csvRow['ZONAS'] || '';

    // Buscar en pliego
    let match = null;
    let mejorScore = 0;

    for (let i = 0; i < datosPliego.length; i++) {
        const pliego = datosPliego[i];
        const nombrePliego = normalizar(pliego.denominacion);

        // Match exacto
        if (nombrePliego === nombreCSV) {
            match = pliego;
            matcheados.add(i);
            break;
        }

        // Match parcial (contiene)
        if (nombrePliego.includes(nombreCSV) || nombreCSV.includes(nombrePliego)) {
            const score = nombreCSV.length > nombrePliego.length ?
                nombrePliego.length / nombreCSV.length :
                nombreCSV.length / nombrePliego.length;

            if (score > mejorScore && score > 0.5) {
                match = pliego;
                mejorScore = score;
                matcheados.add(i);
            }
        }
    }

    // Construir registro consolidado
    const consolidado = {
        zona: zonaCSV,
        nombre: csvRow['SUCURSALES'] || '',
        direccionCSV: csvRow['DIRECCION'] || '',
        telefono: csvRow['TELEFONO'] || '',
        imagenSucursal: csvRow['IMAGEN SUCURSAL'] || '',
        // Campos del pliego
        areaInterna: match?.area || '',
        regionOperativa: match?.region || '',
        usoDestino: match?.usoDestino || '',
        metrosCuadrados: match?.m2 || '',
        direccionPliego: match?.direccion || '',
        matchStatus: match ? 'ENCONTRADO' : 'NO_ENCONTRADO'
    };

    sucursalesConsolidadas.push(consolidado);

    if (!match) {
        noEncontradas.push({ nombre: nombreCSV, zona: zonaCSV });
    }
}

// Estadísticas
const encontradas = sucursalesConsolidadas.filter(s => s.matchStatus === 'ENCONTRADO');
console.log(`Matches encontrados: ${encontradas.length}/${rows.length}`);
console.log(`No encontradas en pliego: ${noEncontradas.length}`);

// Sucursales del pliego que no están en CSV
const soloEnPliego = datosPliego.filter((_, i) => !matcheados.has(i));
console.log(`Solo en pliego (no en CSV): ${soloEnPliego.length}`);

// Generar CSV consolidado
const headersNuevos = [
    'ZONA', 'NOMBRE', 'DIRECCION', 'TELEFONO', 'IMAGEN_SUCURSAL',
    'AREA_INTERNA', 'REGION_OPERATIVA', 'USO_DESTINO', 'METROS_CUADRADOS'
];

const csvNuevo = [
    headersNuevos.join(','),
    ...sucursalesConsolidadas.map(s => [
        s.zona,
        `"${s.nombre}"`,
        `"${s.direccionPliego || s.direccionCSV}"`,
        s.telefono,
        s.imagenSucursal,
        s.areaInterna,
        s.regionOperativa,
        `"${s.usoDestino}"`,
        s.metrosCuadrados
    ].join(','))
].join('\n');

// Guardar CSV consolidado
const outputPath = path.join(__dirname, 'sucursales-consolidado.csv');
fs.writeFileSync(outputPath, csvNuevo);
console.log(`\nCSV consolidado guardado en: ${outputPath}`);

// Mostrar algunas no encontradas
if (noEncontradas.length > 0) {
    console.log('\n--- Primeras 10 no encontradas en pliego: ---');
    noEncontradas.slice(0, 10).forEach(s => {
        console.log(`  - ${s.nombre} (${s.zona})`);
    });
}

// Mostrar primeras solo en pliego
if (soloEnPliego.length > 0) {
    console.log('\n--- Primeras 10 solo en pliego (no en CSV): ---');
    soloEnPliego.slice(0, 10).forEach(s => {
        console.log(`  - ${s.denominacion} (${s.area})`);
    });
}
