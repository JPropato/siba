import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { User } from '../../types/user';

export interface UserFormData {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  rolId: number;
}

const USERS_KEY = ['users'];

export function useUsers(search?: string) {
  return useQuery({
    queryKey: [...USERS_KEY, { search }],
    queryFn: async () => {
      const res = await api.get('/users', {
        params: { search: search || undefined },
      });
      return (res.data?.data ?? []) as User[];
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserFormData) => api.post('/users', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserFormData }) => api.put(`/users/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
