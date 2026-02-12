import { useNavigate } from 'react-router-dom';
import { FileText, Plus, DollarSign, Clock } from 'lucide-react';
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
    id: 'emitir-factura',
    icon: <Plus className="h-6 w-6" />,
    title: 'Emitir Factura',
    description: 'Crear una factura para un cliente',
    path: '/dashboard/facturacion/facturas?action=create',
    permission: 'facturacion:escribir',
  },
  {
    id: 'registrar-cobro',
    icon: <DollarSign className="h-6 w-6" />,
    title: 'Registrar Cobro',
    description: 'Registrar cobro de factura pendiente',
    path: '/dashboard/facturacion/facturas?estado=PENDIENTE',
    permission: 'facturacion:escribir',
  },
];

const QUERY_TILES: Tile[] = [
  {
    id: 'facturas-pendientes',
    icon: <Clock className="h-6 w-6" />,
    title: 'Facturas Pendientes',
    description: 'Ver facturas con saldo pendiente',
    path: '/dashboard/facturacion/facturas?estado=PENDIENTE',
    permission: 'facturacion:leer',
  },
  {
    id: 'todas-facturas',
    icon: <FileText className="h-6 w-6" />,
    title: 'Todas las Facturas',
    description: 'Ver todas las facturas emitidas',
    path: '/dashboard/facturacion/facturas',
    permission: 'facturacion:leer',
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

export default function FacturacionHomePage() {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const canWrite = isSuperAdmin() || hasPermission('facturacion:escribir');
  const canRead = isSuperAdmin() || hasPermission('facturacion:leer');

  const visibleActions = canWrite ? ACTION_TILES : [];
  const visibleQueries = canRead ? QUERY_TILES : [];

  return (
    <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
      <PageHeader
        icon={<FileText className="h-5 w-5" />}
        breadcrumb={['Ventas', 'Facturación']}
        title="Facturación"
        subtitle="Gestión de facturas emitidas y cobros"
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
