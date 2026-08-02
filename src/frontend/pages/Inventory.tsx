import { useState } from "react";
import { useCars } from "@/hooks/use-api";
import CarCard from "@/components/CarCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { CarFilters } from "@/types/car";

const FUEL_OPTIONS = ["Gasolina", "Gasóleo", "Híbrido", "Elétrico", "GPL"];
const TRANSMISSION_OPTIONS = ["Manual", "Automática"];
const BODY_TYPE_OPTIONS = ["Berlina", "SUV", "Carrinha", "Citadino", "Coupé", "Monovolume", "Cabrio", "Pick-up"];

export default function Inventory() {
  const [filters, setFilters] = useState<CarFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<CarFilters>({});
  const { data: cars, isLoading } = useCars(appliedFilters);

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    setFilters({});
    setAppliedFilters({});
  };

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Inventário</h1>

      <div className="bg-card border rounded-lg p-4 md:p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Marca</Label>
            <Input
              placeholder="Ex: BMW, Audi..."
              value={filters.make || ""}
              onChange={(e) => setFilters((f) => ({ ...f, make: e.target.value || undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Combustível</Label>
            <Select
              value={filters.fuel || ""}
              onValueChange={(v) => setFilters((f) => ({ ...f, fuel: v || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {FUEL_OPTIONS.map((fuel) => (
                  <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Transmissão</Label>
            <Select
              value={filters.transmission || ""}
              onValueChange={(v) => setFilters((f) => ({ ...f, transmission: v || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                {TRANSMISSION_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Carroçaria</Label>
            <Select
              value={filters.body_type || ""}
              onValueChange={(v) => setFilters((f) => ({ ...f, body_type: v || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {BODY_TYPE_OPTIONS.map((bt) => (
                  <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Preço Mínimo (€)</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.min_price || ""}
              onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Preço Máximo (€)</Label>
            <Input
              type="number"
              placeholder="100000"
              value={filters.max_price || ""}
              onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Ano Mínimo</Label>
            <Input
              type="number"
              placeholder="2000"
              value={filters.min_year || ""}
              onChange={(e) => setFilters((f) => ({ ...f, min_year: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Ano Máximo</Label>
            <Input
              type="number"
              placeholder="2024"
              value={filters.max_year || ""}
              onChange={(e) => setFilters((f) => ({ ...f, max_year: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Pesquisar
          </Button>
          {hasFilters && (
            <Button variant="outline" onClick={handleClear}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {cars && cars.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Nenhuma viatura encontrada.</p>
          <p className="text-sm mt-2">Tente ajustar os filtros de pesquisa.</p>
        </div>
      )}

      {cars && cars.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {cars.length} viatura{cars.length !== 1 ? "s" : ""} encontrada{cars.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
