import { useNavigate } from 'react-router-dom';
import { FileText, DollarSign, UserPlus, Banknote, Clock, Wallet, Store } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { usePermissions } from '../../../hooks/usePermissions';

interface Tile {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  permission: string;
}

const ACTION_TILES: Tile[] = [
  {
    id: 'registrar-factura',
    icon: <FileText className="h-6 w-6" />,
    title: 'Registrar Factura',
    description: 'Cargar una factura de proveedor',
    path: '/dashboard/compras/facturas?action=create',
    permission: 'compras:escribir',
  },
  {
    id: 'registrar-pago',
    icon: <DollarSign className="h-6 w-6" />,
    title: 'Registrar Pago',
    description: 'Registrar pago de una factura pendiente',
    path: '/dashboard/compras/facturas?estado=PENDIENTE',
    permission: 'compras:escribir',
  },
  {
    id: 'nuevo-proveedor',
    icon: <UserPlus className="h-6 w-6" />,
    title: 'Nuevo Proveedor',
    description: 'Dar de alta un nuevo proveedor',
    path: '/dashboard/compras/proveedores?action=create',
    permission: 'compras:escribir',
  },
  {
    id: 'nuevo-cheque',
    icon: <Banknote className="h-6 w-6" />,
    title: 'Nuevo Cheque',
    description: 'Registrar cheque recibido',
    path: '/dashboard/compras/cheques?action=create',
    permission: 'compras:escribir',
  },
];

const QUERY_TILES: Tile[] = [
  {
    id: 'facturas-pendientes',
    icon: <Clock className="h-6 w-6" />,
    title: 'Facturas Pendientes',
    description: 'Ver facturas con saldo pendiente',
    path: '/dashboard/compras/facturas?estado=PENDIENTE',
    permission: 'compras:leer',
  },
  {
    id: 'cheques-cartera',
    icon: <Wallet className="h-6 w-6" />,
    title: 'Cheques en Cartera',
    description: 'Ver cheques en cartera',
    path: '/dashboard/compras/cheques?estado=CARTERA',
    permission: 'compras:leer',
  },
  {
    id: 'proveedores',
    icon: <Store className="h-6 w-6" />,
    title: 'Proveedores',
    description: 'Gestionar proveedores',
    path: '/dashboard/compras/proveedores',
    permission: 'compras:leer',
  },
];

function TileCard({ tile, onClick }: { tile: Tile; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 text-left hover:shadow-md hover:border-brand/30 transition-all group"
    >
      <div className="p-2.5 rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-all">
        {tile.icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">{tile.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{tile.description}</p>
      </div>
    </button>
  );
}

export default function ComprasHomePage() {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const canWrite = isSuperAdmin() || hasPermission('compras:escribir');
  const canRead = isSuperAdmin() || hasPermission('compras:leer');

  const visibleActions = canWrite ? ACTION_TILES : [];
  const visibleQueries = canRead ? QUERY_TILES : [];

  return (
    <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
      <PageHeader
        icon={<Store className="h-5 w-5" />}
        breadcrumb={['Compras', 'Inicio']}
        title="Compras"
        subtitle="Gestión de proveedores, facturas y cheques"
      />

      {visibleActions.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Acciones</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleActions.map((tile) => (
              <TileCard key={tile.id} tile={tile} onClick={() => navigate(tile.path)} />
            ))}
          </div>
        </div>
      )}

      {visibleQueries.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Consultas
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleQueries.map((tile) => (
              <TileCard key={tile.id} tile={tile} onClick={() => navigate(tile.path)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
