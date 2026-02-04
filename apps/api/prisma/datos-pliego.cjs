/**
 * Script para consolidar datos del Pliego N° 040/2025 con el CSV existente de sucursales
 * Solo para cliente Correo Argentino
 */

// Datos extraídos del Pliego ET Mantenimiento (imágenes del PDF)
// Campos: AREA, REGION, USO_DESTINO, DENOMINACION, DIRECCION, M2
const datosPliego = [
    // === PLANTAS Y GRANDES EDIFICIOS ===
    { area: 'CABA', region: 'Metro', usoDestino: 'CDD y Ope', denominacion: 'SERVICIOS ESPECIALES/CDD 34', direccion: 'AV. San Juan N° 1347', m2: 2600 },
    { area: 'CABA', region: 'Metro', usoDestino: 'PAQUETERIA - OFICNA', denominacion: 'EDIFICIO FRENCH', direccion: 'BRANDSEN 2070', m2: 10000 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SERVICIOS ESPECIALES', direccion: 'AV. San Juan N° 1349', m2: 77 },
    { area: 'CABA', region: 'Metro', usoDestino: 'Agencia, CTP y CDD', denominacion: 'CENTRO POSTAL INTERNACIONAL', direccion: 'Antart. Argentina y Cdro Py', m2: 9976 },
    { area: 'A6', region: 'Metro', usoDestino: 'CDD', denominacion: 'CDD CASA CENTRAL', direccion: 'Antart. Argentina y Cdro Py', m2: 634 },
    { area: 'Z1', region: 'Metro', usoDestino: 'ARCHIVO GENERAL', denominacion: 'Retiro', direccion: 'Antart. Argentina y Cdro Py', m2: 2000 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CPI Retiro', direccion: 'Antart. Argentina y Cdro Py', m2: 144 },
    { area: 'NORTE', region: 'Metro', usoDestino: 'Logística', denominacion: 'TORTUGUITAS I II y III', direccion: 'EEUU 4850', m2: 51736 },
    { area: 'OESTE', region: 'Metro', usoDestino: 'Operaciones', denominacion: 'CDP MORENO', direccion: 'Colectora ACC OESTE Y salida G. BELT', m2: 1860 },
    { area: 'SUR', region: 'Metro', usoDestino: 'Operaciones', denominacion: 'MERCADO CENTRAL', direccion: 'RICCHERI Y B. SUR MER', m2: 21600 },
    { area: 'SUR', region: 'Metro', usoDestino: 'Operaciones', denominacion: 'CDP QUILMES', direccion: 'Avda. La Plata', m2: 1845 },
    { area: 'SUR', region: 'Metro', usoDestino: 'Agencia, Adm. CPI y CTP.', denominacion: 'C. O. MONTE GRANDE', direccion: 'Fair Nº 1101', m2: 33000 },

    // === CABA - CDDs ===
    { area: 'A5', region: 'Metro', usoDestino: 'CDD', denominacion: '5', direccion: 'Machado 649', m2: 386 },
    { area: 'A5', region: 'Metro', usoDestino: 'CDD', denominacion: '6', direccion: 'Av. Alberdi N° 3177', m2: 320 },
    { area: 'A5', region: 'Metro', usoDestino: 'CDD', denominacion: '7', direccion: 'Carrasco N° 37', m2: 240 },
    { area: 'A5', region: 'Metro', usoDestino: 'CDD', denominacion: '13', direccion: 'Av. Corrientes Nº 3702', m2: 550 },
    { area: 'A5', region: 'Metro', usoDestino: 'CDD', denominacion: '23', direccion: 'La Rioja N° 1189 1°P.', m2: 282 },
    { area: 'A5', region: 'Metro', usoDestino: 'CDD / Jef. Área', denominacion: '24', direccion: 'Pje. Craig 805', m2: 221 },
    { area: 'A5', region: 'Metro', usoDestino: 'CDD', denominacion: '39', direccion: 'Murguiondo Nº 3961', m2: 155 },
    { area: 'A5', region: 'Metro', usoDestino: 'CDD', denominacion: '40', direccion: 'Juan B. Alberdi 5924', m2: 269 },
    { area: 'A6', region: 'Metro', usoDestino: 'CDD / Jef. Área', denominacion: '12', direccion: 'Av. Pueyrredón 1352', m2: 1000 },
    { area: 'A6', region: 'Metro', usoDestino: 'CDD', denominacion: '16', direccion: 'Av. San Martin 2710', m2: 200 },
    { area: 'A6', region: 'Metro', usoDestino: 'CDD', denominacion: '17', direccion: 'Helguera Nº 2901', m2: 150 },
    { area: 'A6', region: 'Metro', usoDestino: 'CDD', denominacion: '28', direccion: 'Av. Cabildo 2349', m2: 191 },
    { area: 'A6', region: 'Metro', usoDestino: 'CDD', denominacion: '30', direccion: 'Monroe 3390', m2: 375 },

    // === CABA - SUCURSALES Z1 ===
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'BELGRANO', direccion: 'Av. Cabildo 2348', m2: 200 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Suc. y Adm.', denominacion: 'CASA CENTRAL', direccion: 'Tte. Gral. Perón N° 321', m2: 462 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'COGHLAN', direccion: 'Av. Monroe Nº 3381', m2: 160 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'COLEGIALES', direccion: 'Av. Fco. Lacroze Nº 2476', m2: 200 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'PARAGUAY y MAIPU/FILATELIA/F. WEB', direccion: 'PARAGUAY 767', m2: 540 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'ESTACIÓN RETIRO', direccion: 'Av. Libertador Nº 132', m2: 144 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'NUÑEZ', direccion: 'Av. Cabildo Nº 4576', m2: 264 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'PALERMO', direccion: 'Av. Coronel Diaz Nº 2190 Uf 2', m2: 132 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'PLAZA ITALIA', direccion: 'Av. Santa Fe Nº 3882', m2: 283 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'PLAZA LAS HERAS', direccion: 'Laprida Nº 2128', m2: 94 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'PLAZA RODRIGUEZ PEÑA', direccion: 'Uruguay Nº 1069', m2: 142 },
    { area: 'Z1', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SAAVEDRA', direccion: 'Plaza Nº 3855', m2: 156 },

    // === CABA - SUCURSALES Z2 ===
    { area: 'Z2', region: 'Metro', usoDestino: 'Suc./RRHH/OF. JUDICIALES', denominacion: 'ABASTO', direccion: 'Av. Corrientes Nº 3702', m2: 1438 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'ALMAGRO', direccion: 'Av. Medrano Nº 66', m2: 405 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'BARRIO NORTE', direccion: 'Av. Pueyrredón 1352', m2: 500 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CHACARITA', direccion: 'Federico Lacroze Nº 4164', m2: 134 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'FACULTAD', direccion: 'Viamonte Nº 2449', m2: 166 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LINIERS', direccion: 'Rivadavia Nº 11256', m2: 190 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MONTE CASTRO', direccion: 'Alvarez Jonte 5150', m2: 155 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'OBELISCO', direccion: 'Pasaje Obelisco Sur', m2: 51 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Suc. / Jef. Zonal', denominacion: 'PARQUE CENTENARIO.', direccion: 'Av. Ángel Gallardo 756', m2: 271 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'PATERNAL', direccion: 'Av. San Martin 2710', m2: 227 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'TRIBUNALES', direccion: 'Paraná Nº 777', m2: 341 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA CRESPO', direccion: 'Av. Scalabrini Ortiz Nº 176', m2: 343 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA DEL PARQUE', direccion: 'Helguera Nº 2901', m2: 161 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA PUEYRREDON', direccion: 'Terrada Nº 4675', m2: 166 },
    { area: 'Z2', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA URQUIZA', direccion: 'Av. Monroe Nº 5254', m2: 309 },

    // === CABA - SUCURSALES Z3 ===
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'AV. DE MAYO', direccion: 'Av. De Mayo Nº 770', m2: 280 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'BARRACAS', direccion: 'Salmun Feijoo 565', m2: 120 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CABALLITO', direccion: 'Av. Rivadavia Nº 5337', m2: 144 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CASEROS Y LA RIOJA', direccion: 'Av. Caseros 2459', m2: 210 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CONGRESO', direccion: 'Av. Callao Nº 131', m2: 267 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'DIRECTORIO Y J. M. MORENO', direccion: 'Av. Directorio N° 552', m2: 200 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'FLORES', direccion: 'Artigas Nº 40', m2: 156 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'FLORESTA', direccion: 'Carrasco N° 31', m2: 266 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LA BOCA', direccion: 'Av. Almte. Brown Nº 780', m2: 150 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MATADEROS', direccion: 'Juan B. Alberdi 5924', m2: 183 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MONSERRAT', direccion: 'Av. Entre Ríos Nº 456', m2: 128 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'NUEVA POMPEYA', direccion: 'Del Barco Centenera', m2: 262 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'ONCE', direccion: 'Tte. Gral. Perón Nº 2821', m2: 245 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'PARQUE CHACABUCO', direccion: 'Curapaligue Nº 815', m2: 85 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SAN CRISTOBAL', direccion: 'Av. San Juan N° 3001', m2: 200 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SAN TELMO', direccion: 'Bernardo De Irigoyen Nº 698', m2: 203 },
    { area: 'Z3', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA SOLDATI', direccion: 'José Martí Nº 2995', m2: 125 },
    { area: 'CABA', region: 'Metro', usoDestino: 'CTP', denominacion: 'AEROPARQUE J. NEWBERY', direccion: 'Rafael Obligado S/N°', m2: 492 },

    // === NOROESTE - A1 ===
    { area: 'A1', region: 'Metro', usoDestino: 'CDD', denominacion: 'GENERAL PACHECO', direccion: 'Hipólito Yrigoyen 214', m2: 322 },
    { area: 'A1', region: 'Metro', usoDestino: 'CDD', denominacion: 'LOS POLVORINES', direccion: 'Rivadavia 2645', m2: 187 },
    { area: 'A1', region: 'Metro', usoDestino: 'CDD / SUC', denominacion: 'DON TORCUATO', direccion: 'Av. Alvear Nº 1656 (Ruta 202)', m2: 220 },
    { area: 'A1', region: 'Metro', usoDestino: 'CDD', denominacion: 'SAN FERNANDO', direccion: 'Av. Juan Domingo Perón Nº 724', m2: 426 },
    { area: 'A1', region: 'Metro', usoDestino: 'CDD', denominacion: 'VILLA ADELINA', direccion: 'Paraná Nº 6001', m2: 230 },
    { area: 'A1', region: 'Metro', usoDestino: 'CDD / Jef. De Área', denominacion: 'SAN ISIDRO', direccion: 'Alsina 98/102', m2: 318 },

    // === NOROESTE - A2 ===
    { area: 'A2', region: 'Metro', usoDestino: 'CDD', denominacion: 'EL PALOMAR', direccion: 'Rosetti N° 736', m2: 561 },
    { area: 'A2', region: 'Metro', usoDestino: 'CDD', denominacion: 'HURLINGHAM', direccion: 'Av. Vergara Nº 3443', m2: 319 },
    { area: 'A2', region: 'Metro', usoDestino: 'CDD', denominacion: 'SAN MIGUEL', direccion: 'Belgrano Nº 1374', m2: 343 },
    { area: 'A2', region: 'Metro', usoDestino: 'CDD', denominacion: 'JOSE C. PAZ', direccion: 'Roque Sáenz Peña 5009', m2: 251 },
    { area: 'A2', region: 'Metro', usoDestino: 'CDD / Jef. De Área', denominacion: 'SAN MARTIN', direccion: 'Intendente Campos 1951', m2: 680 },
    { area: 'A2', region: 'Metro', usoDestino: 'CDD', denominacion: 'MERLO', direccion: 'Av. Libertador 556', m2: 437 },
    { area: 'A2', region: 'Metro', usoDestino: 'CDD', denominacion: 'ITUZAINGO', direccion: 'Olazábal Nº 728', m2: 250 },
    { area: 'A2', region: 'Metro', usoDestino: 'CDD', denominacion: 'MORENO', direccion: 'Maipú 76/86', m2: 550 },

    // === NOROESTE - A4 ===
    { area: 'A4', region: 'Metro', usoDestino: 'CDD', denominacion: 'TAPIALES', direccion: 'Humaitá Nº 1156', m2: 384 },
    { area: 'A4', region: 'Metro', usoDestino: 'CDD', denominacion: 'LAFERRERE', direccion: 'Coronel Montt Nº 3951', m2: 616 },
    { area: 'A4', region: 'Metro', usoDestino: 'CDD', denominacion: 'GONZALEZ CATÁN', direccion: 'Barragán 4167', m2: 260 },
    { area: 'A4', region: 'Metro', usoDestino: 'CDD', denominacion: 'SAN JUSTO', direccion: 'Almafuerte 3171/79', m2: 346 },
    { area: 'A4', region: 'Metro', usoDestino: 'CDD', denominacion: 'RAMOS MEJIA', direccion: 'Av. Rivadavia 14178', m2: 320 },

    // === NOROESTE - Z4 SUCURSALES ===
    { area: 'Z4', region: 'Metro', usoDestino: 'Agencia', denominacion: 'BENAVIDEZ', direccion: 'Av. Benavidez 2680', m2: 58 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: '1 BOULOGNE (SOLEIL)', direccion: 'Bernardo De Irigoyen Nº 2647', m2: 33 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'ACASSUSO', direccion: 'Av. Santa Fe Nº 766', m2: 77 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'BOULOGNE', direccion: 'Av. Rolon Nº 2384', m2: 88 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'FLORIDA', direccion: 'Av. San Martin Nº 2849', m2: 168 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'GENERAL PACHECO', direccion: 'Constituyentes Nº 532', m2: 200 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MARTINEZ', direccion: 'Av. Santa Fe Nº 2052', m2: 306 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MARTINEZ UNICENTER', direccion: 'Paraná Nº 3745 Local 1270', m2: 89 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MUNRO', direccion: 'Av. Vélez Sarsfield Nº 4319', m2: 270 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'OLIVOS', direccion: 'Av. Maipú Nº 2683/89', m2: 240 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'PUENTE SAAVEDRA', direccion: 'Av. Maipú Nº 438', m2: 118 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SAN FERNANDO', direccion: '', m2: 199 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Suc. / Jef. Zonal', denominacion: 'SAN ISIDRO', direccion: 'Alsina 98/102', m2: 250 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'TIGRE', direccion: 'Av. Cazón Nº 1140', m2: 88 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VICENTE LOPEZ', direccion: 'Libertador Nº 1202', m2: 105 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VICTORIA', direccion: 'Presidente Perón Nº 2579', m2: 346 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA ADELINA', direccion: 'Paraná Nº 6001', m2: 160 },
    { area: 'Z4', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA MARTELLI', direccion: 'Laprida 3586', m2: 260 },

    // === NOROESTE - Z5 SUCURSALES ===
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'BELLA VISTA', direccion: 'Senador Morón Nº 1090', m2: 198 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CASEROS', direccion: 'Av. Urquiza Nº 4826', m2: 190 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'DEL VISO', direccion: 'Av. Madero Nº 1395', m2: 110 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'EL PALOMAR', direccion: 'Av. Marconi Nº 6595', m2: 113 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'GRAND BOURG', direccion: 'Francisco Seguí Nº 1722', m2: 110 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'HURLINGHAM', direccion: 'Av. Roca 1008', m2: 90 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'JOSE C. PAZ', direccion: 'Roque Sáenz Peña 5009', m2: 180 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'JOSE LEON SUAREZ', direccion: 'Buenos Aires Nº 7479', m2: 205 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LOMA HERMOSA', direccion: 'Ruta Nacional N° 8 Nº 9718', m2: 61 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SAN ANDRES', direccion: 'D. Aleu Nº 3063/7', m2: 91 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Suc. / Jef. Zonal / Ope', denominacion: 'SAN MARTIN', direccion: 'Intendente Campos 1951', m2: 1000 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SAN MIGUEL', direccion: 'Belgrano Nº 1398', m2: 180 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SANTOS LUGARES', direccion: 'Rodríguez Peña Nº 1846 PB', m2: 122 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SANTOS TESEI', direccion: 'Av. Pedro Díaz Nº 444 U.F. N° 2', m2: 80 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'TORTUGUITAS', direccion: 'Tte. Gral. J.D. Perón 22', m2: 74 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA BALLESTER', direccion: 'Vicente López Nº 3044', m2: 200 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA BOSCH', direccion: 'Santos Vega Nº 6121', m2: 49 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA LYNCH', direccion: 'Av. Rep. Del Líbano Nº 4041', m2: 140 },
    { area: 'Z5', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'WILLIAM MORRIS', direccion: 'Conrado Villegas, Gral. Nº 1764/66', m2: 52 },

    // === NOROESTE - Z6 SUCURSALES (OESTE) ===
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CASTELAR', direccion: 'Martin Irigoyen Nº 484', m2: 237 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CIUDAD EVITA', direccion: 'Av. Güemes Nº 4155', m2: 100 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CIUDADELA', direccion: 'Av. Rivadavia Nº 12580', m2: 200 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Agencia', denominacion: 'FRANCISCO ALVAREZ', direccion: 'Diario La Nación Nº 2052', m2: 24 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'GONZALEZ CATÁN', direccion: 'Dr. Equiza Nº 4491', m2: 200 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'HAEDO', direccion: 'Av. Rivadavia Nº 16380', m2: 100 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'ISIDRO CASANOVA', direccion: 'Av. Juan M. De Rosas Nº 6801', m2: 100 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'ITUZAINGO', direccion: 'Olazábal Nº 728/32', m2: 250 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LA TABLADA', direccion: 'Av. Crovara Nº 3035', m2: 154 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LAFERRERE', direccion: 'Esteban Echeverría Nº 6006', m2: 110 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LIBERTAD', direccion: 'Juan B. Justo Nº 2670', m2: 150 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LOMAS DEL MIRADOR', direccion: 'Juan M. Rosas Nº 699', m2: 200 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Agencia', denominacion: 'MARIANO ACOSTA', direccion: '', m2: 30 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MERCADO CENTRAL', direccion: 'Av. Riccheri y B. Sur Mer', m2: 20 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MERLO', direccion: 'Av. Libertador 556', m2: 250 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MORENO', direccion: 'Bartolomé Mitre 2402/12', m2: 300 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MORON', direccion: 'Belgrano Nº 252', m2: 500 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'PASO DEL REY', direccion: 'Av. Salvador Maria Del Carril Nº 52', m2: 79 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'RAFAEL CASTILLO', direccion: 'Santa Cruz Nº 1071', m2: 74 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Suc. / Jef. Zonal', denominacion: 'RAMOS MEJIA', direccion: 'Av. Rivadavia 14180', m2: 250 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SAN ANTONIO DE PADUA', direccion: 'Directorio Nº 202', m2: 230 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SAN JUSTO', direccion: 'Almafuerte 3171', m2: 250 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'TAPIALES', direccion: 'Evita Nº 13', m2: 134 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Agencia', denominacion: 'VILLA CELINA', direccion: 'Rivera Nº 2407', m2: 28 },
    { area: 'Z6', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA MADERO', direccion: 'Mariquita Thompson Nº 10', m2: 80 },

    // === SUR - A3 CDDs ===
    { area: 'A3', region: 'Metro', usoDestino: 'CDD', denominacion: 'ADROGUE', direccion: 'Seguí Nº 880', m2: 289 },
    { area: 'A3', region: 'Metro', usoDestino: 'CDD', denominacion: 'AVELLANEDA', direccion: 'Belgrano Nº 390', m2: 250 },
    { area: 'A3', region: 'Metro', usoDestino: 'CDD', denominacion: 'BERAZATEGUI', direccion: 'Rigolleau Nº 4457', m2: 407 },
    { area: 'A3', region: 'Metro', usoDestino: 'CDD', denominacion: 'BERNAL', direccion: 'Av. De Los Quilmes Nº 1938', m2: 200 },
    { area: 'A3', region: 'Metro', usoDestino: 'CDD', denominacion: 'CLAYPOLE', direccion: 'Remedios De Escalada Nº 723', m2: 168 },
    { area: 'A3', region: 'Metro', usoDestino: 'CDD', denominacion: 'FLORENCIO VARELA', direccion: 'Av. San Martín Nº 3041/45', m2: 280 },
    { area: 'A3', region: 'Metro', usoDestino: 'CDD / Jef. De ÁREA', denominacion: 'LANUS', direccion: 'Vélez Sarsfield Nº 1371', m2: 699 },
    { area: 'A3', region: 'Metro', usoDestino: 'CDD /SUC', denominacion: 'LONGCHAMPS', direccion: '', m2: 80 },

    // === SUR - A4 CDDs ===
    { area: 'A4', region: 'Metro', usoDestino: 'CDD', denominacion: 'LOMAS DE ZAMORA / BANFIED', direccion: 'Alsina 1953', m2: 348 },
    { area: 'A4', region: 'Metro', usoDestino: 'CDD', denominacion: 'TEMPERLEY', direccion: 'Hipólito Irigoyen Nº 9720', m2: 262 },
    { area: 'A4', region: 'Metro', usoDestino: 'CDD', denominacion: 'EZEIZA', direccion: 'French N° 198', m2: 157 },
    { area: 'A4', region: 'Metro', usoDestino: 'CDD', denominacion: 'MONTE GRANDE', direccion: 'Vicente López Nº 448', m2: 153 },

    // === SUR - Z7 SUCURSALES ===
    { area: 'Z7', region: 'Metro', usoDestino: 'Agencia', denominacion: 'AEROPUERTO EZEIZA', direccion: 'Aeropuerto De Ezeiza', m2: 12 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'ADROGUE', direccion: 'Diag. Alte. Brown 1298', m2: 110 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'BANFIELD', direccion: 'Av. Alsina Nº 658', m2: 214 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'BURZACO', direccion: 'Julio A. Roca Nº 983', m2: 120 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'EZEIZA', direccion: 'French N° 198', m2: 100 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Agencia', denominacion: 'GLEW', direccion: 'Sarmiento Nº 50', m2: 41 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'JOSE MARMOL', direccion: 'Bartolomé Mitre 2204', m2: 177 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LANUS', direccion: 'O´Higgins Nº 2055', m2: 293 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LLAVALLOL', direccion: 'A. Argentina 1620', m2: 190 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LOMAS DE ZAMORA', direccion: 'Alem 300', m2: 155 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'LUIS GUILLON', direccion: 'Bvard. Buenos Aires Nº 1758', m2: 80 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MONTE GRANDE', direccion: 'Vicente López Nº 448', m2: 100 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'REMEDIOS DE ESCALADA', direccion: 'Av. Hipólito Yrigoyen Nº 6133', m2: 189 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'TEMPERLEY', direccion: 'Av. Almte. Brown Nº 3394', m2: 380 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Agencia', denominacion: 'TRIBUNALES (BANFIELD)', direccion: 'Larroque 2450', m2: 7 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Agencia', denominacion: 'TRISTAN SUAREZ', direccion: 'Dr. Manuel Belgrano Nº 92', m2: 42 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'TURDERA', direccion: 'Antártida Argentina Nº 45', m2: 90 },
    { area: 'Z7', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VALENTIN ALSINA', direccion: 'Juan Farrell 664', m2: 605 },

    // === SUR - Z8 SUCURSALES ===
    { area: 'Z8', region: 'Metro', usoDestino: 'Agencia', denominacion: 'HUDSON', direccion: 'Calle 159 N° 5445 E/53 y 54', m2: 126 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Agencia', denominacion: 'EL PATO', direccion: 'Calle 522 Nº 1960 E/619 Y 620', m2: 29 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Suc. / Jef. Zonal / RRHH', denominacion: 'AVELLANEDA', direccion: 'Belgrano Nº 390', m2: 437 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'BERAZATEGUI', direccion: 'Calle 15 Nº 4751 E/147 y 148', m2: 200 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'BERNAL', direccion: 'Shopping Plaza Nuevo Quilmes', m2: 150 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'CRUCE VARELA', direccion: 'Av. Cno. Gral. Belgrano 6385', m2: 110 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'DOCK SUD', direccion: 'Virrey J.J. de Vertiz Nº 1043', m2: 98 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'EZPELETA', direccion: 'Chile Nº 379 Local 2', m2: 90 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'FLORENCIO VARELA', direccion: 'España Nº 190', m2: 180 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'GERLI', direccion: 'Av. Hipólito Yrigoyen 2317', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'GUTIERREZ', direccion: 'Calle 455 Nº 721', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'MONTE CHINGOLO', direccion: 'Centenario Uruguayo Nº 1471', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'QUILMES', direccion: 'H. Yrigoyen Nº 405', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'QUILMES OESTE', direccion: '12 De Octubre Nº 1964', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'RAFAEL CALZADA', direccion: 'Colon Nº 3395', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'RANELAGH', direccion: 'Calle 362 n°580', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SAN FRANCISCO SOLANO', direccion: 'Calle 897 Nº 4115', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'SARANDI', direccion: 'Av. Mitre Nº 1899', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'VILLA DOMINICO', direccion: 'Av. Bartolomé Mitre Nº 3313', m2: 0 },
    { area: 'Z8', region: 'Metro', usoDestino: 'Sucursal', denominacion: 'WILDE', direccion: 'Bragado Nº 6185', m2: 0 },
    { area: 'SUR', region: 'Metro', usoDestino: 'CTP', denominacion: 'AEROPUERTO EZEIZA', direccion: 'Aeropuerto Ezeiza', m2: 0 },
];

// Export para uso en otros scripts
module.exports = { datosPliego };

console.log(`Total sucursales en pliego: ${datosPliego.length}`);

// Mostrar resumen por área
const resumenAreas = datosPliego.reduce((acc, s) => {
    acc[s.area] = (acc[s.area] || 0) + 1;
    return acc;
}, {});
console.log('Resumen por área:', resumenAreas);

// Mostrar resumen por uso/destino
const resumenUso = datosPliego.reduce((acc, s) => {
    acc[s.usoDestino] = (acc[s.usoDestino] || 0) + 1;
    return acc;
}, {});
console.log('Resumen por uso/destino:', resumenUso);
