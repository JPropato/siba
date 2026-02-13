import React from 'react';

interface TileGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

const GRID_COLUMNS = {
  2: 'grid grid-cols-2',
  3: 'grid grid-cols-2 md:grid-cols-3',
  4: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

const GRID_GAP = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export function TileGrid({ children, columns = 4, gap = 'md' }: TileGridProps) {
  return <div className={`${GRID_COLUMNS[columns]} ${GRID_GAP[gap]}`}>{children}</div>;
}
