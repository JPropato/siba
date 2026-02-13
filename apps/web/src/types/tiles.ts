import type { LucideIcon } from 'lucide-react';

export type TileType = 'action' | 'query' | 'report' | 'danger';

export interface TileConfig {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  permission: string;
  type: TileType;
  badge?: () => Promise<number | string>;
  category?: string;
}

export interface TileCategory {
  id: string;
  title: string;
  tiles: TileConfig[];
}

export interface ModuleTilesConfig {
  moduleId: string;
  moduleName: string;
  icon: LucideIcon;
  breadcrumb: string[];
  subtitle: string;
  categories: TileCategory[];
  quickStats?: QuickStatConfig[];
}

export interface QuickStatConfig {
  title: string;
  icon: LucideIcon;
  color: 'gold' | 'indigo' | 'orange' | 'emerald' | 'brand';
  loader: () => Promise<{ value: string | number; description?: string }>;
}
