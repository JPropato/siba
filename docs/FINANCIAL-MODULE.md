# SIBA Financial Module - Complete Documentation

## 📋 Overview

The SIBA Financial Module is a comprehensive system for managing all financial operations including:

- **Cash Flow Management**: Bank accounts, cash, petty cash, investments
- **Card Management**: Prepaid and corporate cards for employees
- **Expense Tracking**: Real-time expense registration with accounting integration
- **Supplier Management**: Suppliers, invoices, and payments
- **Payment Methods**: Checks, transfers, card payments
- **Accounting Integration**: Automatic double-entry bookkeeping with chart of accounts and cost centers

## 🎯 Core Principles

### 1. **Every Transaction Creates a Movimiento**

All financial operations in SIBA generate a `Movimiento` (transaction) record that:

- Links to a `CuentaFinanciera` (financial account)
- **MUST link to a `CuentaContable` (accounting account)** - MANDATORY for accounting integration
- Can optionally link to a `CentroCosto` (cost center) for cost allocation
- Can optionally link to context entities (`Empleado`, `Ticket`, `Proveedor`, `FacturaProveedor`)
- Updates the account balance automatically
- Maintains complete audit trail

### 2. **Tarjetas as Payment Method (Not Approval System)**

Cards are treated as a payment method integrated into the financial flow:

- Each card has its own `CuentaFinanciera` (MANDATORY)
- Expenses create immediate `Movimiento` records (no approval needed)
- **Provider is MANDATORY** for every expense (existing or new)
- Invoice attachment is OPTIONAL
- Category selection auto-maps to `CuentaContable` via `ConfigCategoriaGasto`
- Accounting integration happens automatically at expense registration

### 3. **Automatic Accounting Integration**

The system enforces proper accounting through:

- **ConfigCategoriaGasto**: Maps each expense category to a specific accounting account
- **Mandatory CuentaContable**: Every `Movimiento` must have an accounting account
- **Optional CentroCosto**: For detailed cost allocation and analysis
- **Hierarchical Chart of Accounts**: Support for multi-level account structure
- **Automatic Balance Calculation**: Both financial and accounting balances updated in real-time

## 📊 Diagrams

### 1. Entity Relationship Diagram (ERD)

**File**: `diagrams/financial-module-erd.mmd`

Shows the complete data model including:

- All entities and their relationships
- Cardinalities (1-to-1, 1-to-many, many-to-many)
- Key foreign key relationships
- Field definitions with data types

**Key Highlights**:

- `CuentaFinanciera` is central to all financial operations
- `Movimiento` connects financial and accounting domains
- `TarjetaPrecargable` MUST have a `CuentaFinanciera`
- `GastoTarjeta` MUST have a `Proveedor`

### 2. Operational Flows

**File**: `diagrams/financial-module-flows.mmd`

Visualizes the main business processes:

- **Card Load Flow**: How money is loaded onto prepaid cards
- **Card Expense Flow**: Complete expense registration with provider and invoice
- **Invoice Payment Flow**: Paying supplier invoices with transfer or check
- **Check Issuance Flow**: Creating and managing checks
- **Transfer Flow**: Moving money between accounts
- **Billing Flow**: Issuing invoices to clients
- **Accounting Integration**: How all flows integrate with accounting

### 3. Architecture & Patterns

**File**: `diagrams/financial-module-architecture.mmd`

Documents the design patterns and architectural decisions:

- Core accounting pattern (Movimiento + CuentaContable + CentroCosto)
- Tarjetas module pattern (auto-creation of transactions)
- Provider & invoice pattern
- Payment methods pattern
- Double-entry bookkeeping for transfers

## 🔑 Key Entities

### CuentaFinanciera (Financial Account)

**Purpose**: Represents real-world financial accounts (bank accounts, cash, petty cash, credit lines)

**Types**:

- `BANCO`: Bank account
- `CAJA`: Cash register
- `EFECTIVO`: General cash
- `CAJA_CHICA`: Petty cash
- `INVERSION`: Investment account
- `CREDITO`: Credit line

**Key Fields**:

- `saldoActual`: Current balance (updated automatically)
- `numeroCuenta`, `cbu`, `alias`: Bank details
- `moneda`: Currency (ARS by default)

### Movimiento (Transaction)

**Purpose**: Core transaction record that links financial and accounting domains

**Types**:

- `INGRESO`: Income/deposit
- `EGRESO`: Expense/withdrawal

**States**:

- `PENDIENTE`: Pending confirmation
- `CONFIRMADO`: Confirmed and applied to balance
- `ANULADO`: Cancelled/voided

**Mandatory Fields**:

- `cuentaFinancieraId`: Which account
- `tipo`: INGRESO or EGRESO
- `monto`: Amount
- `fecha`: Date
- `concepto`: Description
- `cuentaContableId`: **MANDATORY** - Accounting account

**Optional Context**:

- `centroCostoId`: Cost center
- `empleadoId`: Responsible employee
- `ticketId`: Related ticket
- `proveedorId`: Supplier
- `facturaProveedorId`: Supplier invoice

### CuentaContable (Accounting Account)

**Purpose**: Hierarchical chart of accounts for double-entry bookkeeping

**Types**:

- `ACTIVO`: Assets (1.x.x)
- `PASIVO`: Liabilities (2.x.x)
- `PATRIMONIO`: Equity (3.x.x)
- `INGRESO`: Revenue (4.x.x)
- `GASTO`: Expenses (5.x.x)

**Key Properties**:

- Hierarchical structure (nivel 1, 2, 3...)
- Only leaf nodes (`esImputable = true`) can have transactions
- Balance calculated automatically from child accounts

### CentroCosto (Cost Center)

**Purpose**: Allows grouping and analyzing costs by department, project, or area

**Examples**:

- Departamento Ventas
- Proyecto X
- Sucursal Norte
- Vehículos
- Mantenimiento

### TarjetaPrecargable (Card)

**Purpose**: Manages prepaid and corporate cards for employees

**Types**:

- `PRECARGABLE`: Debit/prepaid card (requires loading)
- `CORPORATIVA`: Corporate credit card

**Key Relationships**:

- **MUST have `cuentaFinancieraId`** (MANDATORY) - each card has its own financial account
- Linked to `empleadoId` (card holder)
- Optionally linked to `bancoId`

**Operations**:

- Load money (`CargaTarjeta` → creates `Movimiento INGRESO`)
- Register expenses (`GastoTarjeta` → creates `Movimiento EGRESO`)
- View balance (from `CuentaFinanciera.saldoActual`)

### GastoTarjeta (Card Expense)

**Purpose**: Records an expense made with a card

**Mandatory Fields**:

- `tarjetaId`: Which card
- `categoria`: Expense category (GAS, FERRETERIA, NAFTA, etc.)
- `monto`: Amount
- `fecha`: Date
- `concepto`: Description
- **`proveedorId`**: **MANDATORY** - Either select existing or create new provider
- `movimientoId`: Auto-created transaction (EGRESO)

**Optional Fields**:

- `categoriaOtro`: If category = OTRO, specify
- `ticketId`: Link to support ticket
- `centroCostoId`: Cost center assignment
- `facturaProveedorId`: Link to supplier invoice (if available)

**Automatic Process**:

1. Get `ConfigCategoriaGasto` for the selected category
2. Extract `cuentaContableId` from config
3. Create `Movimiento EGRESO` with:
   - `cuentaFinancieraId`: Card's account
   - `cuentaContableId`: From category config
   - `centroCostoId`: User-selected
   - `empleadoId`: Card holder
   - `ticketId`: If provided
   - `proveedorId`: Selected/created provider
   - `facturaProveedorId`: If invoice provided
   - `medioPago`: TARJETA_DEBITO or TARJETA_CREDITO
4. Update card balance

### ConfigCategoriaGasto (Category Config)

**Purpose**: Maps expense categories to accounting accounts

**Structure**:

- 11 pre-defined categories (GAS, FERRETERIA, NAFTA, etc.)
- Each maps to a specific `CuentaContable`
- Configurable from admin UI
- Ensures consistent accounting classification

**Categories**:

- GAS → 5.1.xx Combustibles
- FERRETERIA → 5.1.xx Materiales
- NAFTA → 5.1.xx Combustibles
- REPUESTOS → 5.1.xx Repuestos
- etc.

### Proveedor (Supplier)

**Purpose**: Represents suppliers/vendors

**Key Fields**:

- `razonSocial`: Business name
- `cuit`: Tax ID (unique)
- `condicionIva`: Tax condition (RESPONSABLE_INSCRIPTO, MONOTRIBUTO, etc.)
- Contact info (email, phone, address)

**Relationships**:

- Has many `FacturaProveedor` (invoices)
- Receives many `Movimiento` (payments)
- Linked from `GastoTarjeta` (card expenses)

### FacturaProveedor (Supplier Invoice)

**Purpose**: Supplier invoice that generates payment obligations

**Key Fields**:

- `proveedorId`: Which supplier
- `tipoComprobante`: Invoice type (FACTURA_A, B, C, etc.)
- `puntoVenta` + `numeroComprobante`: Invoice number
- `fechaEmision`, `fechaVencimiento`: Dates
- `subtotal`, `iva`, `total`: Amounts
- `estado`: PENDIENTE, PAGADA_PARCIAL, PAGADA, ANULADA
- `saldoPendiente`: Remaining balance to pay

**Payment Process**:

- Can be paid with `Movimiento` (transfer)
- Can be paid with `Cheque`
- Can be linked from `GastoTarjeta`
- Balance updated automatically

### Cheque (Check)

**Purpose**: Check payment method

**Key Fields**:

- `numeroCheque`: Check number (unique)
- `bancoId`, `cuentaFinancieraId`: Which account
- `proveedorId`: Payee
- `fechaEmision`, `fechaPago`: Dates
- `monto`: Amount
- `estado`: PENDIENTE, ENTREGADO, COBRADO, RECHAZADO, ANULADO
- `movimientoId`: Auto-created transaction

**Process**:

1. Admin creates check
2. Auto-creates `Movimiento EGRESO`
3. Can link to `FacturaProveedor`
4. Updates account balance
5. Track check status through lifecycle

### Transferencia (Transfer)

**Purpose**: Transfer money between financial accounts

**Key Fields**:

- `cuentaOrigenId`: Source account
- `cuentaDestinoId`: Destination account
- `monto`: Amount
- `fecha`: Date
- `concepto`: Description
- `movimientoEgresoId`: Auto-created EGRESO
- `movimientoIngresoId`: Auto-created INGRESO

**Double-Entry Process**:

1. Create `Movimiento EGRESO` in source account
2. Create `Movimiento INGRESO` in destination account
3. Link both to `Transferencia`
4. Update both balances

## 🔄 Main Workflows

### 1. Card Expense Registration (Complete Flow)

**Employee Side** (via "Mis Gastos" / Rendiciones page):

1. Select card
2. Click "Nuevo Gasto"
3. Select category (GAS, FERRETERIA, etc.)
4. Enter amount, date, description
5. **Select or create provider** (MANDATORY):
   - Search existing providers by name/CUIT
   - Or create new: enter business name, CUIT, tax condition
6. Optionally attach invoice:
   - Invoice type (FACTURA_A, B, C, etc.)
   - Point of sale + number
   - Emission date
7. Optionally link to ticket
8. Optionally select cost center
9. Upload receipt photos/PDFs
10. Save

**System Side** (automatic):

1. Validate: provider must exist or be created
2. If new provider: Create `Proveedor` with CUIT uniqueness check
3. If invoice data: Create `FacturaProveedor`
4. Get `ConfigCategoriaGasto` for category
5. Extract `cuentaContableId` from config
6. Create `Movimiento EGRESO`:
   - Account: card's `CuentaFinanciera`
   - Accounting: config's `CuentaContable`
   - Cost center: user-selected
   - Context: employee, ticket, provider, invoice
   - Payment method: TARJETA_DEBITO or TARJETA_CREDITO
   - State: CONFIRMADO
7. Create `GastoTarjeta` with `movimientoId`
8. Update card balance (deduct expense)
9. Create `Archivo` records for uploaded files

**Result**:

- ✅ Financial record: Card balance updated
- ✅ Accounting record: Expense classified to correct account
- ✅ Cost analysis: Linked to cost center
- ✅ Audit trail: Complete with provider, invoice, employee, ticket
- ✅ Documentation: Receipts attached

### 2. Supplier Invoice Payment

**Admin Side**:

1. Navigate to Compras > Facturas
2. Select pending invoice
3. Choose payment method:
   - **Transfer**: Creates simple `Movimiento EGRESO`
   - **Check**: Creates `Cheque` which creates `Movimiento EGRESO`
4. Payment links to invoice
5. Invoice state updates to PAGADA
6. Balance updates automatically

### 3. Transfer Between Accounts

**Admin Side**:

1. Navigate to Tesorería > Movimientos
2. Select "Transferencia"
3. Select source and destination accounts
4. Enter amount and description
5. Save

**System Side**:

1. Create `Movimiento EGRESO` in source
2. Create `Movimiento INGRESO` in destination
3. Link both to `Transferencia` record
4. Update both balances

## 📱 User Interfaces

### Admin Views (TarjetasPage)

**Path**: `/dashboard/finanzas/tarjetas`
**Permission**: `tarjetas:leer`

**Features**:

- View all cards (precargables + corporativas)
- Create/edit/delete cards
- View card details (loads, expenses, balance)
- Register card loads (precargables only)
- Configure category → accounting account mappings
- Manage providers and invoices

### Employee View (RendicionesPage)

**Path**: `/dashboard/finanzas/rendiciones`
**Permission**: `tarjetas:leer`

**Features**:

- **Simple, focused interface for employees**
- View assigned cards
- Quick expense registration
- View recent expenses
- See current balance
- Upload receipts

**Optimized for**:

- Quick data entry
- Mobile-friendly
- Minimal steps
- Clear validation

## 🔐 Security & Permissions

### Permission System

**tarjetas:leer**:

- View cards and expenses
- Access "Mis Gastos" page (employee view)

**tarjetas:escribir**:

- Create/edit/delete cards
- Register loads and expenses
- Configure category mappings

**tarjetas:aprobar**:

- (Reserved for future approval workflow if needed)

### Data Validation

**Backend** (Zod schemas):

- Provider is mandatory (proveedorId OR proveedor data)
- If new provider: razonSocial, CUIT, condicionIva required
- CUIT uniqueness enforced
- Positive amounts required
- Valid dates required
- Category must exist in ConfigCategoriaGasto

**Frontend** (React Hook Form + Zod):

- Same validations as backend
- Real-time error display
- Provider autocomplete with inline creation
- Category dropdown with account preview

## 🛠️ Technical Implementation

### Backend Stack

- **Express.js**: REST API
- **Prisma**: ORM and migrations
- **Zod**: Request validation
- **PostgreSQL**: Database
- **MinIO**: File storage (receipts)

### Frontend Stack

- **React**: UI framework
- **React Hook Form**: Form management
- **TanStack Query**: Data fetching & caching
- **Tailwind CSS**: Styling
- **Lucide Icons**: Icons

### Key Files

**Backend**:

- `apps/api/prisma/schema.prisma`: Data model
- `apps/api/src/controllers/tarjetas/`: Controllers
  - `tarjeta.controller.ts`: Card CRUD
  - `carga.controller.ts`: Card loads
  - `gasto.controller.ts`: Expense registration
  - `configCategoria.controller.ts`: Category config
- `apps/api/src/routes/tarjetas.routes.ts`: API routes
- `apps/api/prisma/seed.ts`: Seed data

**Frontend**:

- `apps/web/src/pages/TarjetasPage.tsx`: Admin view
- `apps/web/src/pages/RendicionesPage.tsx`: Employee view
- `apps/web/src/features/tarjetas/`: Feature module
  - `components/`: React components
  - `hooks/`: TanStack Query hooks
  - `types/`: TypeScript types
  - `api/`: HTTP client functions

## 📈 Future Enhancements

### Potential Improvements

1. **Mobile App**: Native mobile app for employees
2. **OCR Integration**: Automatic receipt data extraction
3. **Budget Controls**: Spending limits per employee/category
4. **Approval Workflow**: Optional multi-level approval for large expenses
5. **Analytics Dashboard**: Spending patterns, cost analysis by center
6. **Integration with Accounting Software**: Export to Tango, ContaPlus, etc.
7. **Recurring Expenses**: Template for repeated expenses
8. **Multi-Currency**: Support for USD, EUR, etc.

## 🐛 Troubleshooting

### Common Issues

**Problem**: "Debe proporcionar un proveedor"

- **Cause**: Provider is mandatory
- **Solution**: Select existing provider or fill in new provider fields (business name, CUIT, tax condition)

**Problem**: "Categoría no configurada"

- **Cause**: ConfigCategoriaGasto missing
- **Solution**: Run seed: `npm run db:seed --module=tarjetas`

**Problem**: Card balance not updating

- **Cause**: Transaction not confirmed or error in balance calculation
- **Solution**: Check `Movimiento.estado = CONFIRMADO` and run balance recalculation

**Problem**: Can't find provider

- **Cause**: Provider marked as deleted or inactive
- **Solution**: Check `Proveedor.fechaEliminacion IS NULL AND activo = true`

## 📚 Related Documentation

- [Schema Migrations](../apps/api/prisma/migrations/): Database schema evolution
- [API Routes](../apps/api/src/routes/tarjetas.routes.ts): Endpoint documentation
- [Seed Data](../apps/api/prisma/seed.ts): Example data for development

## 🤝 Contributing

When modifying the financial module:

1. **Update diagrams**: Keep ERD, flows, and architecture diagrams current
2. **Update documentation**: Reflect changes in this file
3. **Update seeds**: Ensure seed data covers new scenarios
4. **Update tests**: Add tests for new functionality
5. **Follow patterns**: Maintain consistency with existing code

## 📞 Support

For questions or issues:

- Check this documentation first
- Review the diagrams for understanding relationships
- Examine the seed data for examples
- Consult the API routes for endpoint details
