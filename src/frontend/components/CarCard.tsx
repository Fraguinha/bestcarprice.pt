import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatMileage, getImageUrl } from "@/lib/utils";
import { Fuel, Gauge, Calendar, Cog } from "lucide-react";
import type { Car } from "@/types/car";

interface CarCardProps {
  car: Car;
}

export default function CarCard({ car }: CarCardProps) {
  return (
    <Link to={`/car/${car.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {car.images.length > 0 ? (
            <img
              src={getImageUrl(car.images[0]!)}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Gauge className="h-12 w-12" />
            </div>
          )}
          {car.sold && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              Vendido
            </Badge>
          )}
          {car.featured && !car.sold && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              Destaque
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate">
            {car.make} {car.model}
          </h3>
          {car.version && (
            <p className="text-sm text-muted-foreground truncate">{car.version}</p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{car.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" />
              <span>{formatMileage(car.mileage)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" />
              <span>{car.fuel}</span>
            </div>
            <div className="flex items-center gap-1">
              <Cog className="h-3.5 w-3.5" />
              <span>{car.power} cv</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-xl font-bold text-primary">{formatPrice(car.price)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
