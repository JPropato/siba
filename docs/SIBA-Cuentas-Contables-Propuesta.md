# SIBA - Clasificacion Contable y Centros de Costo

**Febrero 2026 | Propuesta para aprobacion**

---

## El problema de hoy

Cuando registramos un gasto en SIBA, elegimos una categoria de una lista fija: "Materiales", "Combustible", "Mano de Obra". Eso esta bien para saber _que compramos_, pero no nos dice:

- Cuanto gastamos **en total por area** (Zona Norte vs Zona Sur)
- Como se comparan nuestros gastos **mes a mes**
- Donde se concentra la mayor parte del dinero
- Como separar un gasto de la empresa de un retiro del socio

**En resumen: registramos datos, pero no generamos informacion para tomar decisiones.**

---

## Lo que vamos a hacer

Agregar dos campos nuevos cuando se carga un movimiento:

### 1. Cuenta Contable - _"Que tipo de gasto o ingreso es"_

En vez de una lista plana, usamos un arbol de cuentas (como usan SAP, Tango, o cualquier sistema contable profesional):

```
GASTOS
  Costos Directos
    Materiales              <-- el gasto se carga aca
    Mano de Obra Directa
    Subcontratistas
  Gastos Operativos
    Combustible
    Viaticos
  Gastos de Personal
    Sueldos y Jornales
    Cargas Sociales
  ...
```

**Ventaja**: Puedo ver cuanto gastamos en "Materiales", pero tambien cuanto gastamos en "Costos Directos" (la suma de materiales + mano de obra + subcontratistas), o cuanto gastamos en "Gastos" en total. Todo se suma automaticamente hacia arriba.

### 2. Centro de Costo - _"A que area va este gasto"_

```
Administracion
Operaciones
  Zona Norte
  Zona Sur
  Zona Oeste
Comercial
Logistica
```

**Ventaja**: Saber que Zona Norte gasta $2.100.000 y Zona Sur $1.800.000. Comparar. Decidir.

---

## Ejemplos concretos: como queda en la practica

### Ejemplo 1: Un tecnico compra tornillos con la caja chica

Juan de Zona Norte compro tornillos por $15.000 en la ferreteria. Pago efectivo.

**El administrativo carga en SIBA:**

|                     |                       |
| ------------------- | --------------------- |
| **Tipo**            | Egreso                |
| **Cuenta bancaria** | Caja Chica Zona Norte |
| **Monto**           | $15.000               |
| **Medio de pago**   | Efectivo              |
| **Cuenta contable** | 5.1.01 - Materiales   |
| **Centro de costo** | Zona Norte            |
| **Obra**            | OBR-00042             |
| **Comprobante**     | Foto del ticket       |

El gasto queda clasificado como "Materiales", asignado a "Zona Norte", y vinculado a la obra. Cuando el directivo mire el reporte, este gasto aparece sumado dentro de "Costos Directos".

---

### Ejemplo 2: Pagamos una factura de un proveedor de hormigon

Factura por $850.000. Se paga con transferencia desde Banco Nacion.

|                     |                     |
| ------------------- | ------------------- |
| **Tipo**            | Egreso              |
| **Cuenta bancaria** | Banco Nacion CC     |
| **Monto**           | $850.000            |
| **Cuenta contable** | 5.1.01 - Materiales |
| **Centro de costo** | Zona Sur            |
| **Obra**            | OBR-00038           |
| **Comprobante**     | PDF de la factura   |

---

### Ejemplo 3: Un cliente nos paga una factura

Correo Argentino paga $2.500.000 por la obra de remodelacion de Retiro.

|                     |                             |
| ------------------- | --------------------------- |
| **Tipo**            | Ingreso                     |
| **Cuenta bancaria** | Banco Nacion CC             |
| **Monto**           | $2.500.000                  |
| **Cuenta contable** | 4.1.01 - Cobros de Facturas |
| **Centro de costo** | Comercial                   |
| **Cliente**         | Correo Argentino            |
| **Obra**            | OBR-00015                   |

---

### Ejemplo 4: Pagamos los sueldos del mes

Sueldos de tecnicos de Zona Norte: $1.200.000.

|                     |                             |
| ------------------- | --------------------------- |
| **Tipo**            | Egreso                      |
| **Cuenta bancaria** | Banco Galicia CC            |
| **Monto**           | $1.200.000                  |
| **Cuenta contable** | 5.3.01 - Sueldos y Jornales |
| **Centro de costo** | Zona Norte                  |

---

### Ejemplo 5: Pagamos el IVA del mes

Se liquida IVA. Debito fiscal $420.000, credito fiscal $310.000, retenciones $25.000. Saldo a pagar: $85.000.

|                     |                            |
| ------------------- | -------------------------- |
| **Tipo**            | Egreso                     |
| **Cuenta bancaria** | Banco Nacion CC            |
| **Monto**           | $85.000                    |
| **Cuenta contable** | 2.1.07 - IVA Saldo a Pagar |
| **Centro de costo** | Administracion             |

_El IVA no es un gasto de la empresa. Es una deuda con AFIP que se cancela. Por eso va a "Pasivo" y no a "Gastos"._

---

### Ejemplo 6: Un cliente nos retiene Ingresos Brutos al pagarnos

Nos pagan una factura de $1.000.000 pero nos retienen $30.000 de IIBB. Nos transfieren $970.000.

**Se cargan 2 movimientos:**

1. **Cobro neto**: Ingreso por $970.000 en cuenta contable "4.1.01 - Cobros de Facturas"
2. **Retencion sufrida**: $30.000 en cuenta contable "1.1.11 - Retenciones de IIBB sufridas"

_Esa retencion es plata a favor nuestro que ARBA/AGIP nos debe. Se descuenta cuando liquidamos IIBB._

---

### Ejemplo 7: Un director carga un gasto personal

Martin (director) cargo nafta de su auto personal por $45.000 con plata de la caja chica.

|                     |                                    |
| ------------------- | ---------------------------------- |
| **Tipo**            | Egreso                             |
| **Cuenta bancaria** | Caja Chica Oficina                 |
| **Monto**           | $45.000                            |
| **Cuenta contable** | 3.3 - Cuenta particular directores |
| **Centro de costo** | Administracion                     |

_No se carga como "Combustible" (gasto) porque no es un gasto de la empresa. Es un retiro del socio que se descuenta de sus utilidades._

---

### Ejemplo 8: Tecnico usa la tarjeta precargable del Credicoop

Cada tecnico tiene una tarjeta precargable asociada al Banco Credicoop. La empresa recarga la tarjeta y el tecnico la usa para compras operativas.

**Paso 1 - La empresa recarga la tarjeta de Juan por $50.000:**

|             |                                |
| ----------- | ------------------------------ |
| **Tipo**    | Transferencia                  |
| **Origen**  | Banco Credicoop CC             |
| **Destino** | Tarjeta Precargable Juan Perez |
| **Monto**   | $50.000                        |

_Es un movimiento de fondos interno: la plata sale de la cuenta corriente y va a la tarjeta. No lleva cuenta contable._

**Paso 2 - Juan compra materiales con la tarjeta por $32.000:**

|                     |                                |
| ------------------- | ------------------------------ |
| **Tipo**            | Egreso                         |
| **Cuenta bancaria** | Tarjeta Precargable Juan Perez |
| **Monto**           | $32.000                        |
| **Medio de pago**   | Tarjeta Debito                 |
| **Cuenta contable** | 5.1.01 - Materiales            |
| **Centro de costo** | Zona Norte                     |
| **Obra**            | OBR-00042                      |
| **Empleado**        | Juan Perez                     |
| **Comprobante**     | Foto del ticket                |

_El gasto se imputa contra la tarjeta precargable (que es una cuenta financiera del sistema). El saldo de la tarjeta baja automaticamente._

**Paso 3 - Juan carga combustible con la tarjeta por $15.000:**

|                     |                                    |
| ------------------- | ---------------------------------- |
| **Tipo**            | Egreso                             |
| **Cuenta bancaria** | Tarjeta Precargable Juan Perez     |
| **Monto**           | $15.000                            |
| **Cuenta contable** | 5.2.01 - Combustible y Lubricantes |
| **Centro de costo** | Zona Norte                         |
| **Empleado**        | Juan Perez                         |

_Cada tarjeta precargable es una cuenta financiera mas en SIBA, con su propio saldo. Cuando se recarga sube, cuando se usa baja. Todo queda trazado por tecnico._

---

### Ejemplo 9: Transferencia entre cuentas

Pasamos $500.000 de Banco Nacion a la Caja Chica de Zona Norte.

|             |                       |
| ----------- | --------------------- |
| **Tipo**    | Transferencia         |
| **Origen**  | Banco Nacion CC       |
| **Destino** | Caja Chica Zona Norte |
| **Monto**   | $500.000              |

_Las transferencias internas no llevan cuenta contable ni centro de costo. Es simplemente mover plata de un lugar a otro._

---

### Ejemplo 10: Certificado de obra con fondo de reparo (si aplica)

La empresa certifica $2.000.000 de avance de obra publica. El comitente retiene el 5% como fondo de reparo y paga el resto.

**Se cargan 2 movimientos:**

1. **Cobro neto**: Ingreso por $1.900.000 en cuenta contable "4.1.03 - Certificados de Obra"
2. **Fondo de reparo retenido**: $100.000 en cuenta contable "1.1.15 - Fondos de Reparo Retenidos"

_Esos $100.000 son plata que nos deben. Se cobran cuando el comitente recibe la obra definitivamente (puede ser meses despues). Mientras tanto, quedan registrados como un activo de la empresa._

---

### Ejemplo 11: Deposito del Fondo de Cese Laboral de un obrero (si aplica)

Juan Perez (obrero UOCRA, primer ano) cobra $800.000 de sueldo. La empresa debe depositar el 12% en su cuenta bancaria personal.

|                     |                                |
| ------------------- | ------------------------------ |
| **Tipo**            | Egreso                         |
| **Cuenta bancaria** | Banco Nacion CC                |
| **Monto**           | $96.000                        |
| **Cuenta contable** | 5.3.06 - Fondo de Cese Laboral |
| **Centro de costo** | Zona Norte                     |
| **Empleado**        | Juan Perez                     |

_No es un sueldo. Es un deposito obligatorio por ley (Ley 22.250) que el obrero retira cuando termina la relacion laboral. Es como un "ahorro forzoso" que la empresa hace por cada obrero de la construccion._

---

## Flujo visual: como se registra un movimiento

### Flujo general de un egreso

```
  NUEVO MOVIMIENTO
       |
       v
  Elegir tipo: INGRESO / EGRESO / TRANSFERENCIA
       |
       v (si es EGRESO)
  +-----------------------------+
  | 1. Datos basicos            |
  |    - Cuenta bancaria        |
  |    - Monto                  |
  |    - Fecha                  |
  |    - Medio de pago          |
  +-----------------------------+
       |
       v
  +-----------------------------+
  | 2. Clasificacion contable   |
  |    - Cuenta contable (*)    | <-- NUEVO: antes era "Categoria"
  |      Solo muestra cuentas   |
  |      de tipo GASTO          |
  |    - Centro de costo        | <-- NUEVO
  +-----------------------------+
       |
       v
  +-----------------------------+
  | 3. Vinculaciones            |
  |    - Obra (opcional)        |
  |    - Cliente (opcional)     |
  |    - Empleado (opcional)    |
  |    - Ticket (opcional)      |
  +-----------------------------+
       |
       v
  +-----------------------------+
  | 4. Comprobante              |
  |    - Foto o PDF adjunto     |
  +-----------------------------+
       |
       v
     GUARDAR
       |
       v
  El movimiento queda clasificado
  y disponible para analisis
```

### Flujo de un ingreso (cobro de cliente)

```
  INGRESO
    |
    v
  Cuenta bancaria donde entra el dinero
    |
    +---> Cuenta contable: solo se muestran cuentas tipo INGRESO
    |       Ej: "4.1.01 - Cobros de Facturas"
    |
    +---> Centro de costo: Comercial
    |
    +---> Vinculaciones: Cliente + Obra
    |
    v
  GUARDAR --> aparece en reportes de ingresos
```

### Flujo de una transferencia interna

```
  TRANSFERENCIA
    |
    +---> Cuenta ORIGEN (de donde sale)
    |
    +---> Cuenta DESTINO (a donde va)
    |
    +---> Monto
    |
    v
  GUARDAR
  (sin cuenta contable ni centro de costo,
   es movimiento de fondos interno)
```

### Flujo de un cobro con retencion

```
  Cliente paga factura de $1.000.000
  Pero nos retiene $30.000 de IIBB
  Nos transfieren $970.000
    |
    +---> MOVIMIENTO 1: Ingreso $970.000
    |       Cuenta contable: 4.1.01 Cobros de Facturas
    |       Centro de costo: Comercial
    |
    +---> MOVIMIENTO 2: Ingreso $30.000
    |       Cuenta contable: 1.1.11 Ret. IIBB sufridas
    |       (es un credito a favor nuestro, NO entro plata)
    |
    v
  Ambos quedan registrados. La retencion
  se acumula y se descuenta al liquidar IIBB.
```

### Flujo mensual del IVA

```
  Durante el mes se acumula:
    |
    +---> Cada COMPRA (factura de proveedor)
    |       genera IVA Credito Fiscal (1.1.09)
    |       "AFIP nos debe"
    |
    +---> Cada VENTA (factura a cliente)
    |       genera IVA Debito Fiscal (2.1.06)
    |       "le debemos a AFIP"
    |
    v
  Al cierre del mes:
    |
    Debito Fiscal - Credito Fiscal - Retenciones = Saldo
    |
    +---> Si SALDO > 0: pagamos DDJJ (2.1.07)
    +---> Si SALDO < 0: queda a favor para el mes siguiente
```

---

## Propuestas de reportes

### Reporte 1: Posicion de IVA (IVA Compras vs IVA Ventas)

Este reporte es **clave para el seguimiento diario**. Muestra en tiempo real cuanto IVA se acumulo por compras (credito fiscal) y cuanto por ventas (debito fiscal).

**Vista propuesta:**

```
  POSICION DE IVA - Febrero 2026
  ================================================

  IVA VENTAS (Debito Fiscal)         $1.250.000
    Facturas emitidas este mes:
    - Fact A 0001-00000234  $420.000
    - Fact A 0001-00000235  $380.000
    - Fact A 0001-00000236  $450.000
    ...

  IVA COMPRAS (Credito Fiscal)        ($890.000)
    Facturas recibidas este mes:
    - Hormigon SA           $210.000
    - Ferreteria Lopez      $45.000
    - Petrolera YPF         $78.000
    ...

  RETENCIONES SUFRIDAS                ($125.000)
    - Ret. IVA clientes     $85.000
    - Percepciones IVA      $40.000

  ------------------------------------------------
  SALDO POSICION IVA                   $235.000
  (a pagar en la DDJJ del mes)
  ================================================
```

**Grafico complementario**: Barras mensuales mostrando IVA Ventas vs IVA Compras de los ultimos 12 meses, con linea del saldo neto. Permite ver tendencia y estacionalidad.

```
  IVA Compras vs Ventas - Ultimos 12 meses

  Mes      |  Ventas (DF)  |  Compras (CF)  |  Saldo
  ---------|---------------|----------------|--------
  Mar 25   |  $980.000     |  $720.000      |  $260.000
  Abr 25   |  $1.100.000   |  $850.000      |  $250.000
  May 25   |  $890.000     |  $910.000      | -$20.000  <-- saldo a favor
  Jun 25   |  $1.200.000   |  $780.000      |  $420.000
  ...      |  ...          |  ...           |  ...
  Feb 26   |  $1.250.000   |  $890.000      |  $235.000
```

**Alertas automaticas**:

- Si el saldo a pagar supera un umbral configurable
- Si el credito fiscal crece mucho (puede indicar acumulacion de stock)
- Acercandose al vencimiento de la DDJJ

---

### Reporte 2: Libro IVA Compras

Detalle de todas las facturas de proveedores con su IVA discriminado.

```
  LIBRO IVA COMPRAS - Febrero 2026
  ==================================================================
  Fecha    Proveedor           CUIT           Comp.   Neto       IVA 21%    IVA 10.5%  Total
  -------- ------------------- -------------- ------- ---------- ---------- ---------- ----------
  03/02    Hormigon SA         30-12345678-9  FC A    $826.000   $173.460              $999.460
  05/02    Ferreteria Lopez    20-98765432-1  FC A    $180.000   $37.800               $217.800
  07/02    YPF SA              30-55555555-5  FC A    $295.000   $61.950               $356.950
  12/02    Vet. del Sur        20-44444444-4  FC A    $42.000               $4.410     $46.410
  ...
  ==================================================================
                               TOTALES:       $4.200.000  $882.000   $45.000    $5.127.000
```

---

### Reporte 3: Libro IVA Ventas

Detalle de todas las facturas emitidas a clientes.

```
  LIBRO IVA VENTAS - Febrero 2026
  ==================================================================
  Fecha    Cliente              CUIT           Comp.   Neto        IVA 21%    Total
  -------- -------------------- -------------- ------- ----------- ---------- -----------
  01/02    Correo Argentino     30-11111111-1  FC A    $2.066.000  $433.860   $2.499.860
  10/02    Municipio CABA       30-22222222-2  FC A    $1.500.000  $315.000   $1.815.000
  15/02    Telecom Argentina    30-33333333-3  FC A    $830.000    $174.300   $1.004.300
  ...
  ==================================================================
                               TOTALES:        $5.952.000  $1.249.920  $7.201.920
```

---

### Reporte 4: Retenciones y Percepciones

Seguimiento de todos los creditos a favor por retenciones y percepciones sufridas, y las retenciones practicadas pendientes de depositar.

```
  RETENCIONES Y PERCEPCIONES - Acumulado 2026
  ==================================================================

  A FAVOR NUESTRO (creditos impositivos):

  Concepto                         Ene       Feb       Acum.
  -------------------------------- --------- --------- ---------
  Ret. IVA sufridas (1.1.10)       $42.000   $85.000   $127.000
  Ret. IIBB sufridas (1.1.11)      $18.000   $30.000   $48.000
  Ret. Ganancias sufridas (1.1.12) $35.000   $52.000   $87.000
  Perc. IVA sufridas (1.1.13)      $12.000   $40.000   $52.000
  Perc. IIBB sufridas (1.1.14)     $8.000    $15.000   $23.000
  -------------------------------- --------- --------- ---------
  TOTAL A FAVOR                    $115.000  $222.000  $337.000

  PENDIENTE DE DEPOSITAR (lo que retenimos a otros):

  Concepto                         Saldo pendiente
  -------------------------------- ---------------
  Ret. IVA a depositar (2.1.10)    $65.000
  Ret. IIBB a depositar (2.1.11)   $22.000
  Ret. Ganancias a depositar (2.1.12) $41.000
  -------------------------------- ---------------
  TOTAL A DEPOSITAR                $128.000
```

---

### Reporte 5: Resultado por centro de costo

Comparar cuanto gasta (y genera) cada area de la empresa.

```
  RESULTADO POR CENTRO DE COSTO - Febrero 2026
  ==================================================================
  Centro de Costo     Ingresos     Egresos      Resultado   % del total
  ------------------- ------------ ------------ ----------- ----------
  Zona Norte          $3.200.000   $2.100.000   $1.100.000    35%
  Zona Sur            $2.800.000   $1.800.000   $1.000.000    32%
  Zona Oeste          $1.500.000   $1.200.000   $300.000      10%
  Comercial           $1.000.000   $400.000     $600.000      19%
  Administracion                   $700.000     -$700.000
  Logistica                        $400.000     -$400.000
  ------------------- ------------ ------------ ----------- ----------
  TOTAL               $8.500.000   $6.600.000   $1.900.000   100%
```

Con grafico de barras agrupado: cada zona con su ingreso y egreso lado a lado.

---

### Reporte 6: Evolucion mensual

Grafico de lineas mostrando ingresos, gastos y resultado neto mes a mes. Permite detectar estacionalidad y tendencias.

```
  Evolucion Mensual - Ultimos 12 meses

  $10M |
       |          *           *
   $8M |    *         *   *       *
       |  *   *             *
   $6M | ---- x --- x --- x --- x --- x    <-- Gastos
       |        x       x           x
   $4M |
       |
   $2M | .... o ... o ... o ... o ... o    <-- Resultado
       |
    $0 +----+----+----+----+----+----+-->
       Mar  Abr  May  Jun  Jul  Ago  ...

  * = Ingresos    x = Gastos    o = Resultado
```

---

### Reporte 7: Vencimientos impositivos (calendario)

Vista de calendario con fechas clave del mes:

```
  VENCIMIENTOS - Febrero 2026
  ==================================================================
  Dia   Concepto                                Estado
  ----- --------------------------------------- -------------------
  13    DDJJ IVA (periodo enero)                Pagado $85.000
  15    IIBB CABA (periodo enero)               Pendiente ~$42.000
  18    Ret. y Perc. IVA a depositar            Pendiente ~$65.000
  20    DDJJ Ganancias anticipo                 Pendiente ~$120.000
  22    Contrib. Patronales y SUSS              Pendiente ~$380.000
  28    IIBB Prov. Buenos Aires (periodo enero) Pendiente ~$35.000
  ==================================================================
```

---

## Que vamos a poder analizar (pantalla nueva)

### Numeros del periodo de un vistazo

```
  INGRESOS          GASTOS           RESULTADO         MARGEN
  $8.500.000        $6.200.000       $2.300.000        27%
  +12% vs mes ant.  +5% vs mes ant.
```

### Donde se va la plata (grafico circular)

```
  Costos Directos      52%  ============
  Gastos Operativos    23%  ======
  Gastos de Personal   12%  ===
  Gastos Admin.         8%  ==
  Impuestos             3%  =
  Gastos Financieros    2%  =
```

### Cuanto gasta cada area (grafico de barras)

```
  Zona Norte    $2.100.000  ================
  Zona Sur      $1.800.000  ==============
  Zona Oeste    $1.200.000  =========
  Admin           $700.000  =====
  Logistica       $400.000  ===
```

### Tendencia mes a mes (grafico de linea)

Ingresos vs gastos de los ultimos 12 meses. Para ver si estamos mejorando, empeorando, o estables.

### Detalle con drill-down

Se puede hacer click en cualquier rubro para ver el detalle:

**Gastos** ($6.200.000) -- click para abrir --

- Costos Directos ($3.200.000) -- click para abrir --
  - Materiales: $1.800.000
  - Mano de Obra: $900.000
  - Subcontratistas: $500.000
- Gastos Operativos ($1.400.000)
- Gastos de Personal ($750.000)
- ...

---

## Plan de Cuentas completo

Este es el arbol de cuentas que viene precargado en SIBA. Es **totalmente personalizable**: se pueden agregar, modificar o desactivar cuentas en cualquier momento.

### 1 - ACTIVO (lo que la empresa tiene)

```
1.1   Activo Corriente (disponible)
  1.1.01  Caja
  1.1.02  Bancos Cuenta Corriente
  1.1.03  Bancos Caja de Ahorro
  1.1.04  Billeteras Virtuales (MercadoPago, etc.)
  1.1.05  Inversiones Temporarias (Plazo Fijo, FCI, Cauciones)
  1.1.06  Creditos por Ventas (facturas que nos deben)
  1.1.07  Anticipos a Proveedores
  1.1.08  Otros Creditos
  1.1.09  IVA Credito Fiscal
  1.1.10  Retenciones de IVA sufridas
  1.1.11  Retenciones de IIBB sufridas
  1.1.12  Retenciones de Ganancias sufridas
  1.1.13  Percepciones de IVA sufridas
  1.1.14  Percepciones de IIBB sufridas
  1.1.15  Fondos de Reparo Retenidos (*)         (*) si hacen obra publica

1.2   Activo No Corriente (bienes)
  1.2.01  Rodados
  1.2.02  Herramientas y Equipos
  1.2.03  Muebles y Utiles
```

### 2 - PASIVO (lo que la empresa debe)

```
2.1   Pasivo Corriente (deudas a corto plazo)
  2.1.01  Proveedores
  2.1.02  Sueldos a Pagar
  2.1.03  Cargas Sociales a Pagar
  2.1.04  ART a Pagar
  2.1.05  Anticipos de Clientes
  2.1.06  IVA Debito Fiscal
  2.1.07  IVA Saldo a Pagar
  2.1.08  IIBB a Pagar
  2.1.09  Ganancias a Pagar
  2.1.10  Retenciones de IVA a depositar
  2.1.11  Retenciones de IIBB a depositar
  2.1.12  Retenciones de Ganancias a depositar
  2.1.13  Otros Impuestos a Pagar
  2.1.14  Fondos de Reparo a Devolver (*)        (*) si retienen a subcontratistas

2.2   Pasivo No Corriente (deudas a largo plazo)
  2.2.01  Prestamos Bancarios
```

### 3 - PATRIMONIO NETO (capital de los socios)

```
3.1   Capital
3.2   Resultados Acumulados
3.3   Retiros de socios / Cuenta particular directores
```

### 4 - INGRESOS (dinero que entra)

```
4.1   Ingresos por Servicios
  4.1.01  Cobros de Facturas
  4.1.02  Cobros de Obras
  4.1.03  Certificados de Obra

4.2   Ingresos Financieros
  4.2.01  Intereses Ganados (plazos fijos, cauciones)
  4.2.02  Rendimiento FCI
  4.2.03  Diferencia de Cambio a Favor

4.3   Otros Ingresos
  4.3.01  Reintegros
  4.3.02  Recupero de Seguros
  4.3.03  Otros Ingresos Varios
```

### 5 - GASTOS (dinero que sale)

```
5.1   Costos Directos de Obra
  5.1.01  Materiales
  5.1.02  Mano de Obra Directa
  5.1.03  Subcontratistas
  5.1.04  Alquiler de Equipos y Maquinaria
  5.1.05  Fletes y Transporte de Materiales

5.2   Gastos Operativos
  5.2.01  Combustible y Lubricantes
  5.2.02  Viaticos y Movilidad
  5.2.03  Mantenimiento de Herramientas
  5.2.04  Mantenimiento de Rodados
  5.2.05  Peajes y Estacionamiento
  5.2.06  Indumentaria y EPP

5.3   Gastos de Personal
  5.3.01  Sueldos y Jornales
  5.3.02  Cargas Sociales (aportes patronales)
  5.3.03  ART
  5.3.04  Seguro de Vida Obligatorio
  5.3.05  Capacitacion
  5.3.06  Fondo de Cese Laboral (*)              (*) si tienen obreros UOCRA (12%/8% del sueldo)
  5.3.07  Aporte IERIC (*)                       (*) registro obligatorio de constructoras

5.4   Gastos Administrativos
  5.4.01  Alquiler de Oficina
  5.4.02  Servicios (luz, gas, agua)
  5.4.03  Telefonia e Internet
  5.4.04  Seguros (oficina, responsabilidad civil)
  5.4.05  Utiles y Papeleria
  5.4.06  Honorarios Profesionales (contador, abogado)
  5.4.07  Sistemas y Software (licencias)
  5.4.08  Seguros de Caucion (*)                 (*) polizas para licitaciones y obras
  5.4.09  Seguros Todo Riesgo Construccion (*)   (*) poliza TRC obligatoria en obras

5.5   Gastos Financieros
  5.5.01  Comisiones Bancarias
  5.5.02  Intereses Pagados
  5.5.03  Impuesto al Cheque (Ley 25.413)
  5.5.04  Diferencia de Cambio en Contra
  5.5.05  Gastos de Mantenimiento de Cuenta

5.6   Impuestos
  5.6.01  IIBB (Ingresos Brutos)
  5.6.02  Tasa Municipal / ABL
  5.6.03  Impuesto a las Ganancias
  5.6.04  Bienes Personales (si aplica)
  5.6.05  Otros Impuestos y Tasas
```

---

## Guia rapida: impuestos y situaciones especiales

### IVA

| Cuando pasa esto...                    | Se carga en esta cuenta   | Por que                  |
| -------------------------------------- | ------------------------- | ------------------------ |
| Compramos algo (proveedor nos factura) | 1.1.09 IVA Credito Fiscal | Es plata a favor nuestro |
| Facturamos a un cliente                | 2.1.06 IVA Debito Fiscal  | Lo debemos a AFIP        |
| Pagamos la DDJJ mensual                | 2.1.07 IVA Saldo a Pagar  | Cancelamos la deuda      |

### Retenciones que nos hacen (sufridas)

| Quien nos retiene                | Cuenta | Que pasa despues                   |
| -------------------------------- | ------ | ---------------------------------- |
| Un cliente nos retiene IVA       | 1.1.10 | Se descuenta al liquidar IVA       |
| Un cliente nos retiene IIBB      | 1.1.11 | Se descuenta al liquidar IIBB      |
| Un cliente nos retiene Ganancias | 1.1.12 | Se descuenta al liquidar Ganancias |

### Retenciones que nosotros hacemos (practicadas)

| A quien le retenemos             | Cuenta | Que hacemos              |
| -------------------------------- | ------ | ------------------------ |
| Le retenemos IVA a un proveedor  | 2.1.10 | Depositamos en AFIP      |
| Le retenemos IIBB a un proveedor | 2.1.11 | Depositamos en ARBA/AGIP |
| Le retenemos Ganancias           | 2.1.12 | Depositamos en AFIP      |

### Gastos de directores/socios

Si un director carga un gasto personal (nafta de su auto, comida personal, etc.), **no va a "Gastos"**. Va a **3.3 Cuenta particular directores** porque no es un gasto de la empresa sino un retiro que se descuenta de utilidades.

---

## Que cambia para el usuario que carga movimientos

Casi nada. El formulario es el mismo. La unica diferencia es que donde antes elegia una "Categoria" (Materiales, Combustible, etc.) ahora elige:

1. **Cuenta contable** (obligatorio): De que tipo es el gasto o ingreso
2. **Centro de costo** (opcional): A que area se imputa

El sistema sugiere opciones basadas en el tipo de movimiento (ingreso/egreso), asi que el usuario no ve las 65+ cuentas, solo las que aplican.

---

## Cobertura impositiva: que impuestos maneja SIBA

A continuacion se detalla cada impuesto que impacta en la operatoria diaria y como se refleja en el plan de cuentas. Verificamos que no falte nada.

### IVA (Impuesto al Valor Agregado)

| Situacion                         | Cuenta contable             | Donde se ve en SIBA       |
| --------------------------------- | --------------------------- | ------------------------- |
| Compramos (factura de proveedor)  | 1.1.09 IVA Credito Fiscal   | Reporte Libro IVA Compras |
| Vendemos (factura a cliente)      | 2.1.06 IVA Debito Fiscal    | Reporte Libro IVA Ventas  |
| Pagamos la DDJJ mensual           | 2.1.07 IVA Saldo a Pagar    | Reporte Posicion de IVA   |
| Cliente nos retiene IVA           | 1.1.10 Ret. IVA sufridas    | Reporte Retenciones       |
| Proveedor sufre percepcion de IVA | 1.1.13 Perc. IVA sufridas   | Reporte Retenciones       |
| Retenemos IVA a un proveedor      | 2.1.10 Ret. IVA a depositar | Reporte Retenciones       |

**Cobertura: COMPLETA**

### Ingresos Brutos (IIBB)

| Situacion                             | Cuenta contable              | Donde se ve en SIBA        |
| ------------------------------------- | ---------------------------- | -------------------------- |
| Pagamos IIBB mensual                  | 5.6.01 IIBB                  | Reporte Gastos > Impuestos |
| Cliente nos retiene IIBB              | 1.1.11 Ret. IIBB sufridas    | Reporte Retenciones        |
| Sufrimos percepcion IIBB (al comprar) | 1.1.14 Perc. IIBB sufridas   | Reporte Retenciones        |
| Retenemos IIBB a un proveedor         | 2.1.11 Ret. IIBB a depositar | Reporte Retenciones        |

_Nota: Si la empresa opera en multiples jurisdicciones (CABA + Provincia de Buenos Aires, por ejemplo), se puede desagregar la cuenta 5.6.01 en sub-cuentas por jurisdiccion (5.6.01.01 IIBB CABA, 5.6.01.02 IIBB PBA, etc.)._

**Cobertura: COMPLETA**

### Impuesto a las Ganancias

| Situacion                          | Cuenta contable                   | Donde se ve en SIBA        |
| ---------------------------------- | --------------------------------- | -------------------------- |
| Anticipo mensual de Ganancias      | 5.6.03 Ganancias                  | Reporte Gastos > Impuestos |
| Pago anual de Ganancias            | 2.1.09 Ganancias a Pagar          | Reporte Vencimientos       |
| Cliente nos retiene Ganancias      | 1.1.12 Ret. Ganancias sufridas    | Reporte Retenciones        |
| Retenemos Ganancias a un proveedor | 2.1.12 Ret. Ganancias a depositar | Reporte Retenciones        |

**Cobertura: COMPLETA**

### SUSS / Contribuciones Patronales

| Situacion                                          | Cuenta contable                | Donde se ve en SIBA       |
| -------------------------------------------------- | ------------------------------ | ------------------------- |
| Aportes patronales (jubilacion, obra social, etc.) | 5.3.02 Cargas Sociales         | Reporte Gastos > Personal |
| ART                                                | 5.3.03 ART                     | Reporte Gastos > Personal |
| Seguro de Vida Obligatorio                         | 5.3.04 Seguro de Vida          | Reporte Gastos > Personal |
| Pago de F.931 (AFIP)                               | 2.1.03 Cargas Sociales a Pagar | Reporte Vencimientos      |

**Cobertura: COMPLETA**

### Impuesto al Cheque (Ley 25.413)

| Situacion                          | Cuenta contable           | Donde se ve en SIBA          |
| ---------------------------------- | ------------------------- | ---------------------------- |
| Debito bancario por imp. al cheque | 5.5.03 Impuesto al Cheque | Reporte Gastos > Financieros |

_El 34% se puede tomar a cuenta de Ganancias (gestion contable externa)._

**Cobertura: COMPLETA**

### Tasas Municipales / ABL

| Situacion                                      | Cuenta contable             | Donde se ve en SIBA        |
| ---------------------------------------------- | --------------------------- | -------------------------- |
| Pago de ABL, tasa de seguridad e higiene, etc. | 5.6.02 Tasa Municipal / ABL | Reporte Gastos > Impuestos |

**Cobertura: COMPLETA**

### Bienes Personales (si aplica a socios)

| Situacion                 | Cuenta contable          | Donde se ve en SIBA        |
| ------------------------- | ------------------------ | -------------------------- |
| Pago de Bienes Personales | 5.6.04 Bienes Personales | Reporte Gastos > Impuestos |

**Cobertura: COMPLETA**

### Obligaciones especificas del sector construccion (confirmar con directivos)

Las siguientes cuentas aplican **solo si la empresa tiene obreros bajo convenio UOCRA y/o realiza obra publica**. Las marcamos con (\*) en el plan de cuentas para que los directivos confirmen cuales aplican.

#### Fondo de Cese Laboral (Ley 22.250)

En la industria de la construccion, los obreros no cobran indemnizacion por despido. En su lugar, el empleador deposita todos los meses un porcentaje del sueldo en una cuenta bancaria a nombre del obrero:

- **12% del sueldo** durante el primer ano de trabajo
- **8% del sueldo** a partir del segundo ano

Cuando termina la relacion laboral (se termina la obra, por ejemplo), el obrero retira esa plata. Es un costo laboral importante que conviene tener visible por separado.

| Situacion                           | Cuenta contable              | Donde se ve en SIBA       |
| ----------------------------------- | ---------------------------- | ------------------------- |
| Deposito mensual FCL (primer ano)   | 5.3.06 Fondo de Cese Laboral | Reporte Gastos > Personal |
| Deposito mensual FCL (segundo ano+) | 5.3.06 Fondo de Cese Laboral | Reporte Gastos > Personal |

#### IERIC (Registro de la Industria de la Construccion)

Las empresas constructoras deben estar inscriptas en el IERIC y pagar un aporte patronal mensual de hasta el 4% sobre lo depositado en el Fondo de Cese Laboral, mas una inscripcion anual.

| Situacion               | Cuenta contable     | Donde se ve en SIBA       |
| ----------------------- | ------------------- | ------------------------- |
| Aporte mensual IERIC    | 5.3.07 Aporte IERIC | Reporte Gastos > Personal |
| Inscripcion anual IERIC | 5.3.07 Aporte IERIC | Reporte Gastos > Personal |

#### Fondo de Reparo (Retencion de garantia en obras)

En obras publicas (y muchas privadas), el comitente retiene entre el 5% y 10% de cada certificado de obra como garantia. Esa plata queda retenida hasta la recepcion definitiva de la obra (puede ser 6 meses a 1 ano despues).

Ejemplo: La empresa certifica $1.000.000 de avance de obra. El comitente paga $950.000 y retiene $50.000 (5%) como fondo de reparo.

| Situacion                                         | Cuenta contable                    | Donde se ve en SIBA             |
| ------------------------------------------------- | ---------------------------------- | ------------------------------- |
| Nos retienen fondo de reparo sobre un certificado | 1.1.15 Fondos de Reparo Retenidos  | Es un activo: nos deben plata   |
| Nos devuelven el fondo al recibir la obra         | Se cancela la cuenta 1.1.15        | El activo baja                  |
| Retenemos fondo de reparo a un subcontratista     | 2.1.14 Fondos de Reparo a Devolver | Es un pasivo: les debemos plata |

#### Seguros de Caucion

Para licitaciones y ejecucion de obras se necesitan polizas de caucion:

- **Mantenimiento de oferta**: Garantiza que si ganamos la licitacion, ejecutamos la obra
- **Ejecucion de contrato**: Garantiza cumplimiento del contrato
- **Sustitucion de fondo de reparo**: Reemplaza la retencion en efectivo por una poliza

| Situacion                                     | Cuenta contable           | Donde se ve en SIBA              |
| --------------------------------------------- | ------------------------- | -------------------------------- |
| Pago de poliza de caucion                     | 5.4.08 Seguros de Caucion | Reporte Gastos > Administrativos |
| Pago de poliza TRC (Todo Riesgo Construccion) | 5.4.09 Seguros TRC        | Reporte Gastos > Administrativos |

---

### Otros que podrian sumarse si fuera necesario

| Impuesto                            | Se necesita?                   | Nota                                |
| ----------------------------------- | ------------------------------ | ----------------------------------- |
| Monotributo                         | No aplica                      | La empresa es Responsable Inscripto |
| Impuesto PAIS / dolar               | Solo si hay operaciones en USD | Se agrega cuenta si hace falta      |
| Debitos y creditos (imp. al cheque) | Ya cubierto                    | Cuenta 5.5.03                       |
| Tasa de Justicia                    | Raro en esta actividad         | Se puede agregar si surge           |
| Impuesto al Sello                   | Si hay contratos importantes   | Se agrega cuenta 5.6.05             |

**Resumen: El plan de cuentas propuesto cubre todos los impuestos que aplican a una PyME del rubro construccion/servicios en Argentina. Si surge alguno adicional, se agrega una cuenta nueva sin cambiar nada del sistema.**

---

## Proximos pasos (fuera de esta etapa)

| Mejora                      | Descripcion                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| **Cashflow proyectado**     | Proyeccion de ingresos y gastos futuros                            |
| **Presupuesto por area**    | Asignar presupuesto a cada centro de costo y comparar real vs plan |
| **Facturacion electronica** | Vincular movimientos con comprobantes de AFIP                      |
| **Conciliacion bancaria**   | Importar extractos y conciliar automaticamente                     |
| **Integracion AFIP**        | Importar automaticamente CF/DF desde comprobantes en linea         |

---

_Este plan de cuentas y los centros de costo son completamente personalizables._
_Se pueden agregar, modificar o desactivar cuentas en cualquier momento._
