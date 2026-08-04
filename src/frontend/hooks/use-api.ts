import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { CarFilters } from "@/types/car";
import type { CarUploadProgress } from "@/lib/api";

type CarMutationPayload = {
  data: FormData;
  onProgress?: (progress: CarUploadProgress) => void;
};

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
    mutationFn: ({ data, onProgress }: CarMutationPayload) => api.createCar(data, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
  });
}

export function useUpdateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, onProgress }: CarMutationPayload & { id: number }) => api.updateCar(id, data, onProgress),
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
