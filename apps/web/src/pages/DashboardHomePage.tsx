import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { PageHeader } from '../components/ui/PageHeader';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { ActionTile } from '../components/tiles/ActionTile';
import { TileGrid } from '../components/tiles/TileGrid';
import { TileSection } from '../components/tiles/TileSection';
import { EmptyState } from '../components/ui/EmptyState';
import { LayoutGrid } from 'lucide-react';

// Import all tile configs
import {
  operacionesTiles,
  tesoreriaTiles,
  contabilidadTiles,
  rrhhTiles,
  adminTiles,
  seguridadTiles,
} from '../config/tiles';
import type { ModuleTilesConfig, TileConfig } from '../types/tiles';

const ALL_MODULES: ModuleTilesConfig[] = [
  operacionesTiles,
  tesoreriaTiles,
  contabilidadTiles,
  rrhhTiles,
  adminTiles,
  seguridadTiles,
];

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin } = usePermissions();

  // Filter modules and tiles by permissions
  const visibleModules = ALL_MODULES.map((module) => {
    // Flatten all tiles from all categories
    const allTiles = module.categories.flatMap((cat) => cat.tiles);

    // Filter tiles by permission
    const visibleTiles = allTiles.filter((tile) => {
      if (isSuperAdmin()) return true;
      return hasPermission(tile.permission);
    });

    return {
      ...module,
      visibleTiles,
    };
  }).filter((module) => module.visibleTiles.length > 0);

  const handleTileClick = (tile: TileConfig) => {
    navigate(tile.path);
  };

  if (visibleModules.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <PageHeader
          title="Inicio"
          subtitle="Acceso rápido a todas las funcionalidades"
          breadcrumb={['Inicio']}
          icon={<LayoutGrid className="h-5 w-5" />}
        />
        <div className="px-4 py-8">
          <EmptyState
            icon={<LayoutGrid className="h-12 w-12" />}
            title="Sin acceso"
            description="No tienes permisos para acceder a ningún módulo"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <PullToRefresh onRefresh={async () => window.location.reload()}>
        <PageHeader
          title="Inicio"
          subtitle="Acceso rápido a todas las funcionalidades"
          breadcrumb={['Inicio']}
          icon={<LayoutGrid className="h-5 w-5" />}
        />

        <div className="px-4 py-6 space-y-8">
          {visibleModules.map((module) => {
            const ModuleIcon = module.icon;

            return (
              <TileSection
                key={module.moduleId}
                title={module.moduleName}
                icon={<ModuleIcon className="h-5 w-5" />}
              >
                <TileGrid columns={4}>
                  {module.visibleTiles.map((tile) => {
                    const TileIcon = tile.icon;
                    return (
                      <ActionTile
                        key={tile.id}
                        icon={<TileIcon className="h-5 w-5" />}
                        title={tile.title}
                        description={tile.description}
                        variant={tile.type}
                        onClick={() => handleTileClick(tile)}
                      />
                    );
                  })}
                </TileGrid>
              </TileSection>
            );
          })}
        </div>
      </PullToRefresh>
    </div>
  );
}
