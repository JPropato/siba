import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { StatCard } from '../dashboard/StatCard';
import { EmptyState } from '../ui/EmptyState';
import { ActionTile } from './ActionTile';
import { TileGrid } from './TileGrid';
import { TileSection } from './TileSection';
import { usePermissions } from '../../hooks/usePermissions';
import { useTileBadge } from '../../hooks/useTileBadge';
import type { ModuleTilesConfig } from '../../types/tiles';

interface ModuleHomePageProps {
  config: ModuleTilesConfig;
}

function TileWithBadge({
  tile,
  onClick,
}: {
  tile: ModuleTilesConfig['categories'][0]['tiles'][0];
  onClick: () => void;
}) {
  const badge = useTileBadge(tile.badge);

  return (
    <ActionTile
      icon={<tile.icon className="h-6 w-6" />}
      title={tile.title}
      description={tile.description}
      onClick={onClick}
      variant={tile.type}
      badge={badge}
    />
  );
}

export function ModuleHomePage({ config }: ModuleHomePageProps) {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin } = usePermissions();

  // Filter tiles by permissions
  const visibleCategories = config.categories
    .map((category) => ({
      ...category,
      tiles: category.tiles.filter((tile) => {
        if (isSuperAdmin()) return true;
        return hasPermission(tile.permission);
      }),
    }))
    .filter((category) => category.tiles.length > 0);

  return (
    <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
      {/* Page Header */}
      <PageHeader
        icon={<config.icon className="h-5 w-5" />}
        breadcrumb={config.breadcrumb}
        title={config.moduleName}
        subtitle={config.subtitle}
      />

      {/* Optional Quick Stats */}
      {config.quickStats && config.quickStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {config.quickStats.map((stat) => (
            <QuickStat key={stat.title} config={stat} />
          ))}
        </div>
      )}

      {/* Tile Sections */}
      {visibleCategories.length > 0 ? (
        <>
          {visibleCategories.map((category) => (
            <TileSection key={category.id} title={category.title}>
              <TileGrid>
                {category.tiles.map((tile) => (
                  <TileWithBadge key={tile.id} tile={tile} onClick={() => navigate(tile.path)} />
                ))}
              </TileGrid>
            </TileSection>
          ))}
        </>
      ) : (
        <EmptyState
          icon={<ShieldCheck className="h-12 w-12" />}
          title="Sin acceso"
          description="No tienes permisos para ninguna acción en este módulo"
        />
      )}
    </div>
  );
}

function QuickStat({ config }: { config: NonNullable<ModuleTilesConfig['quickStats']>[0] }) {
  // TODO: Implement async stat loading with useQuery
  // For now, just show placeholder
  return <StatCard title={config.title} value="--" icon={config.icon} color={config.color} />;
}
