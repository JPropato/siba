import { useMemo } from 'react';
import { usePermissions } from './usePermissions';
import type { TileConfig } from '../types/tiles';

export function useTilePermissions(tiles: TileConfig[]) {
  const { hasPermission, isSuperAdmin } = usePermissions();

  return useMemo(() => {
    return tiles.filter((tile) => {
      if (isSuperAdmin()) return true;
      return hasPermission(tile.permission);
    });
  }, [tiles, hasPermission, isSuperAdmin]);
}
