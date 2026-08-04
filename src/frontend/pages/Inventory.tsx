import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useCars } from "@/hooks/use-api";
import CarCard from "@/components/CarCard";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer";
import { Car as CarIcon, SlidersHorizontal, X } from "lucide-react";
import type { Car, CarFilters } from "@/types/car";

type SortOption = "recent" | "price_asc" | "price_desc" | "year_desc";

function sortCars(cars: Car[], sort: SortOption): Car[] {
  const sorted = [...cars];
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "year_desc":
      return sorted.sort((a, b) => b.year - a.year);
    case "recent":
    default:
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<CarFilters>(() => {
    const f: CarFilters = {};
    const make = searchParams.get("make");
    const fuel = searchParams.get("fuel");
    const transmission = searchParams.get("transmission");
    const body_type = searchParams.get("body_type");
    const min_price = searchParams.get("min_price");
    const max_price = searchParams.get("max_price");
    const min_year = searchParams.get("min_year");
    const max_year = searchParams.get("max_year");
    if (make) f.make = make;
    if (fuel) f.fuel = fuel;
    if (transmission) f.transmission = transmission;
    if (body_type) f.body_type = body_type;
    if (min_price) f.min_price = Number(min_price);
    if (max_price) f.max_price = Number(max_price);
    if (min_year) f.min_year = Number(min_year);
    if (max_year) f.max_year = Number(max_year);
    return f;
  });
  const [sort, setSort] = useState<SortOption>(() => {
    const s = searchParams.get("sort");
    if (s === "price_asc" || s === "price_desc" || s === "year_desc" || s === "recent") return s;
    return "recent";
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [makeInput, setMakeInput] = useState(() => searchParams.get("make") || "");
  const [makeSuggestionsOpen, setMakeSuggestionsOpen] = useState(false);
  const makeRef = useRef<HTMLDivElement>(null);
  const makeRefDesktop = useRef<HTMLDivElement>(null);

  const { data: allCars, isLoading } = useCars();

  const syncParams = useCallback((f: CarFilters, s: SortOption) => {
    const params: Record<string, string> = {};
    if (f.make) params.make = f.make;
    if (f.fuel) params.fuel = f.fuel;
    if (f.transmission) params.transmission = f.transmission;
    if (f.body_type) params.body_type = f.body_type;
    if (f.min_price) params.min_price = String(f.min_price);
    if (f.max_price) params.max_price = String(f.max_price);
    if (f.min_year) params.min_year = String(f.min_year);
    if (f.max_year) params.max_year = String(f.max_year);
    if (s !== "recent") params.sort = s;
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    syncParams(filters, sort);
  }, [filters, sort, syncParams]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inMobile = makeRef.current?.contains(target);
      const inDesktop = makeRefDesktop.current?.contains(target);
      if (!inMobile && !inDesktop) {
        setMakeSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableOptions = useMemo(() => {
    if (!allCars || allCars.length === 0) {
      return { makes: [], fuels: [], transmissions: [], bodyTypes: [], minYear: 2000, maxYear: 2024, minPrice: 0, maxPrice: 100000 };
    }
    const makes = [...new Set(allCars.map((c) => c.make))].sort();
    const fuels = [...new Set(allCars.map((c) => c.fuel))].sort();
    const transmissions = [...new Set(allCars.map((c) => c.transmission))].sort();
    const bodyTypes = [...new Set(allCars.map((c) => c.body_type))].sort();
    const years = allCars.map((c) => c.year);
    const prices = allCars.map((c) => c.price);
    return {
      makes,
      fuels,
      transmissions,
      bodyTypes,
      minYear: Math.min(...years),
      maxYear: Math.max(...years),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [allCars]);

  const makeSuggestions = useMemo(() => {
    if (!makeInput.trim()) return availableOptions.makes;
    const lower = makeInput.toLowerCase();
    return availableOptions.makes.filter((m) => m.toLowerCase().includes(lower));
  }, [makeInput, availableOptions.makes]);

  const filteredCars = useMemo(() => {
    if (!allCars) return [];
    return allCars.filter((car) => {
      if (filters.make && !car.make.toLowerCase().includes(filters.make.toLowerCase())) return false;
      if (filters.fuel && car.fuel !== filters.fuel) return false;
      if (filters.transmission && car.transmission !== filters.transmission) return false;
      if (filters.body_type && car.body_type !== filters.body_type) return false;
      if (filters.min_price && car.price < filters.min_price) return false;
      if (filters.max_price && car.price > filters.max_price) return false;
      if (filters.min_year && car.year < filters.min_year) return false;
      if (filters.max_year && car.year > filters.max_year) return false;
      return true;
    });
  }, [allCars, filters]);

  const sortedCars = useMemo(() => sortCars(filteredCars, sort), [filteredCars, sort]);

  const newestIds = useMemo(() => {
    if (!allCars) return new Set<number>();
    const sorted = [...allCars].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return new Set(sorted.slice(0, 6).map((c) => c.id));
  }, [allCars]);

  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortedCars]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((v) => Math.min(v + PAGE_SIZE, sortedCars.length));
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [sortedCars.length]);

  const recentlyViewedCars = useMemo(() => {
    if (!allCars) return [];
    const ids = getRecentlyViewed();
    const carMap = new Map(allCars.map((c) => [c.id, c]));
    return ids.map((id) => carMap.get(id)).filter((c): c is Car => c !== undefined);
  }, [allCars]);

  const handleMakeSelect = (make: string) => {
    setMakeInput(make);
    setFilters((f) => ({ ...f, make }));
    setMakeSuggestionsOpen(false);
  };

  const handleMakeChange = (value: string) => {
    setMakeInput(value);
    setFilters((f) => ({ ...f, make: value || undefined }));
    setMakeSuggestionsOpen(true);
  };

  const handleClear = () => {
    setFilters({});
    setMakeInput("");
  };

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");
  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

  const filterContent = (
    <div className="space-y-4">
      <div className="space-y-1 relative" ref={makeRef}>
        <Label className="text-xs text-muted-foreground">Marca</Label>
        <Input
          className="h-9"
          placeholder="Pesquisar marca..."
          value={makeInput}
          onChange={(e) => handleMakeChange(e.target.value)}
          onFocus={() => setMakeSuggestionsOpen(true)}
        />
        {makeSuggestionsOpen && makeSuggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {makeSuggestions.map((make) => (
              <button
                key={make}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => handleMakeSelect(make)}
              >
                {make}
              </button>
            ))}
          </div>
        )}
        {makeSuggestionsOpen && makeSuggestions.length === 0 && makeInput.trim() && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover rounded-lg shadow-lg p-3">
            <p className="text-sm text-muted-foreground">Nenhuma marca encontrada</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Combustível</Label>
          <Select
            value={filters.fuel || ""}
            onValueChange={(v) => setFilters((f) => ({ ...f, fuel: v === "_all" ? undefined : v }))}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              {availableOptions.fuels.map((fuel) => (
                <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Transmissão</Label>
          <Select
            value={filters.transmission || ""}
            onValueChange={(v) => setFilters((f) => ({ ...f, transmission: v === "_all" ? undefined : v }))}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas</SelectItem>
              {availableOptions.transmissions.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Carroçaria</Label>
        <Select
          value={filters.body_type || ""}
          onValueChange={(v) => setFilters((f) => ({ ...f, body_type: v === "_all" ? undefined : v }))}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos</SelectItem>
            {availableOptions.bodyTypes.map((bt) => (
              <SelectItem key={bt} value={bt}>{bt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Preço mín. (€)</Label>
          <Input
            className="h-9 text-sm"
            type="number"
            placeholder={String(availableOptions.minPrice)}
            value={filters.min_price || ""}
            onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value ? Number(e.target.value) : undefined }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Preço máx. (€)</Label>
          <Input
            className="h-9 text-sm"
            type="number"
            placeholder={String(availableOptions.maxPrice)}
            value={filters.max_price || ""}
            onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value ? Number(e.target.value) : undefined }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Ano mín.</Label>
          <Input
            className="h-9 text-sm"
            type="number"
            placeholder={String(availableOptions.minYear)}
            value={filters.min_year || ""}
            onChange={(e) => setFilters((f) => ({ ...f, min_year: e.target.value ? Number(e.target.value) : undefined }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Ano máx.</Label>
          <Input
            className="h-9 text-sm"
            type="number"
            placeholder={String(availableOptions.maxYear)}
            value={filters.max_year || ""}
            onChange={(e) => setFilters((f) => ({ ...f, max_year: e.target.value ? Number(e.target.value) : undefined }))}
          />
        </div>
      </div>
      {hasFilters && (
        <button
          onClick={handleClear}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 inline-flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="container py-8"><Helmet><title>Viaturas | Best Car Price</title><meta name="description" content="Explore o nosso inventário de viaturas premium" /></Helmet>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Viaturas</h1>
        {!isLoading && (
          <Badge variant="secondary" className="text-sm font-normal">
            {sortedCars.length}
          </Badge>
        )}
      </div>

      <div className="hidden lg:block mb-6">
        <div className="bg-card shadow-sm rounded-lg p-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1 relative" ref={makeRefDesktop}>
              <Label className="text-xs text-muted-foreground">Marca</Label>
              <Input
                className="h-9"
                placeholder="Pesquisar marca..."
                value={makeInput}
                onChange={(e) => handleMakeChange(e.target.value)}
                onFocus={() => setMakeSuggestionsOpen(true)}
              />
              {makeSuggestionsOpen && makeSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {makeSuggestions.map((make) => (
                    <button
                      key={make}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => handleMakeSelect(make)}
                    >
                      {make}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Combustível</Label>
              <Select value={filters.fuel || ""} onValueChange={(v) => setFilters((f) => ({ ...f, fuel: v === "_all" ? undefined : v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos</SelectItem>
                  {availableOptions.fuels.map((fuel) => (<SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Transmissão</Label>
              <Select value={filters.transmission || ""} onValueChange={(v) => setFilters((f) => ({ ...f, transmission: v === "_all" ? undefined : v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas</SelectItem>
                  {availableOptions.transmissions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Carroçaria</Label>
              <Select value={filters.body_type || ""} onValueChange={(v) => setFilters((f) => ({ ...f, body_type: v === "_all" ? undefined : v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos</SelectItem>
                  {availableOptions.bodyTypes.map((bt) => (<SelectItem key={bt} value={bt}>{bt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Preço mín. (€)</Label>
              <Input className="h-9 text-sm" type="number" placeholder={String(availableOptions.minPrice)} value={filters.min_price || ""} onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Preço máx. (€)</Label>
              <Input className="h-9 text-sm" type="number" placeholder={String(availableOptions.maxPrice)} value={filters.max_price || ""} onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ano mín.</Label>
              <Input className="h-9 text-sm" type="number" placeholder={String(availableOptions.minYear)} value={filters.min_year || ""} onChange={(e) => setFilters((f) => ({ ...f, min_year: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ano máx.</Label>
              <Input className="h-9 text-sm" type="number" placeholder={String(availableOptions.maxYear)} value={filters.max_year || ""} onChange={(e) => setFilters((f) => ({ ...f, max_year: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
          </div>
          {hasFilters && (
            <button onClick={handleClear} className="mt-3 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 inline-flex items-center gap-1">
              <X className="h-3 w-3" /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2 min-w-0 lg:hidden">
          <Drawer open={filtersOpen} onOpenChange={setFiltersOpen} autoFocus={false}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerTitle className="sr-only">Filtros</DrawerTitle>
              <div className="px-6 pt-4 pb-2">
                <h2 className="text-lg font-semibold">Filtros</h2>
              </div>
              <div className="px-6 pb-8 max-h-[60vh] overflow-y-auto">
                {filterContent}
              </div>
              <div className="px-6 pb-6">
                <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                  Ver {sortedCars.length} viatura{sortedCars.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        <div className="hidden lg:block" />
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="price_asc">Preço crescente</SelectItem>
            <SelectItem value="price_desc">Preço decrescente</SelectItem>
            <SelectItem value="year_desc">Ano decrescente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl bg-card overflow-hidden">
              <div className="aspect-[16/10] bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-3 bg-muted animate-pulse rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && sortedCars.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CarIcon className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <p className="text-xl font-medium text-muted-foreground">Nenhuma viatura encontrada</p>
          <p className="text-sm text-muted-foreground/70 mt-2 max-w-sm">
            Não encontrámos viaturas com os critérios selecionados. Tente ajustar ou limpar os filtros.
          </p>
          {hasFilters && (
            <button
              onClick={handleClear}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {!isLoading && sortedCars.length > 0 && (
        <>
          {recentlyViewedCars.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Vistos recentemente</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {recentlyViewedCars.map((car) => (
                  <div key={car.id} className="w-[70vw] sm:w-[280px] max-w-[320px] snap-start shrink-0">
                    <CarCard car={car} isNew={newestIds.has(car.id)} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCars.slice(0, visibleCount).map((car) => (
              <CarCard key={car.id} car={car} isNew={newestIds.has(car.id)} />
            ))}
          </div>
          {visibleCount < sortedCars.length && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
