import { useQuery } from '@tanstack/react-query';

export function useTileBadge(loader?: () => Promise<number | string>) {
  const { data } = useQuery({
    queryKey: ['tile-badge', loader?.toString()],
    queryFn: loader,
    staleTime: 60000, // 1 min
    refetchInterval: 300000, // 5 min
    enabled: !!loader,
  });

  return data;
}
