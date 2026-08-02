import { useParams, Link } from "react-router-dom";
import { useCar } from "@/hooks/use-api";
import ImageGallery from "@/components/ImageGallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatMileage } from "@/lib/utils";
import { ArrowLeft, Calendar, Fuel, Gauge, Cog, Palette, DoorOpen, Users, Car } from "lucide-react";

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: car, isLoading, error } = useCar(Number(id) || 0);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="aspect-[16/9] bg-muted rounded-lg" />
          <div className="h-6 bg-muted rounded w-64" />
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="container py-16 text-center">
        <p className="text-lg text-muted-foreground">Viatura não encontrada.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/inventory">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao inventário
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link to="/inventory">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery images={car.images} alt={`${car.make} ${car.model}`} />

          {car.description && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Descrição</h2>
              <p className="text-muted-foreground whitespace-pre-line">{car.description}</p>
            </div>
          )}

          {car.features.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Características</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {car.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 sticky top-20">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {car.sold && <Badge variant="destructive">Vendido</Badge>}
                {car.featured && !car.sold && <Badge className="bg-accent text-accent-foreground">Destaque</Badge>}
              </div>
              <h1 className="text-2xl font-bold">
                {car.make} {car.model}
              </h1>
              {car.version && <p className="text-muted-foreground">{car.version}</p>}
              <p className="text-3xl font-bold text-primary">{formatPrice(car.price)}</p>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Ano
                </span>
                <span className="font-medium">{car.year}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="h-4 w-4" /> Quilómetros
                </span>
                <span className="font-medium">{formatMileage(car.mileage)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Fuel className="h-4 w-4" /> Combustível
                </span>
                <span className="font-medium">{car.fuel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Cog className="h-4 w-4" /> Transmissão
                </span>
                <span className="font-medium">{car.transmission}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Cog className="h-4 w-4" /> Potência
                </span>
                <span className="font-medium">{car.power} cv</span>
              </div>
              {car.displacement && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Car className="h-4 w-4" /> Cilindrada
                  </span>
                  <span className="font-medium">{car.displacement} cc</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Palette className="h-4 w-4" /> Cor
                </span>
                <span className="font-medium">{car.color}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <DoorOpen className="h-4 w-4" /> Portas
                </span>
                <span className="font-medium">{car.doors}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> Lugares
                </span>
                <span className="font-medium">{car.seats}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Car className="h-4 w-4" /> Carroçaria
                </span>
                <span className="font-medium">{car.body_type}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
