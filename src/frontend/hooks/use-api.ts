import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { CarFilters } from "@/types/car";

export function useCars(filters?: CarFilters) {
  return useQuery({
    queryKey: ["cars", filters],
    queryFn: () => api.getCars(filters),
  });
}

export function useFeaturedCars() {
  return useQuery({
    queryKey: ["cars", "featured"],
    queryFn: api.getFeaturedCars,
  });
}

export function useCar(id: number) {
  return useQuery({
    queryKey: ["car", id],
    queryFn: () => api.getCarById(id),
    enabled: id > 0,
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}

export function useUpdateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => api.updateCar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car"] });
    },
  });
}

export function useDeleteCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}
