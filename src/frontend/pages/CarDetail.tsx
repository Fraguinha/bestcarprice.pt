import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useCar, useCars } from "@/hooks/use-api";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import ImageGallery from "@/components/ImageGallery";
import CarCard from "@/components/CarCard";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatMileage } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { ArrowLeft, ArrowRight, Calendar, Fuel, Gauge, Cog, Palette, DoorOpen, Users, Car, MessageCircle, Share2 } from "lucide-react";

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: car, isLoading, error } = useCar(Number(id) || 0);
  const { data: allCars } = useCars();

  useEffect(() => {
    if (car) addRecentlyViewed(car.id);
  }, [car]);

  const similarCars = (() => {
    if (!car || !allCars) return [];
    const score = (c: typeof car) => {
      let s = 0;
      if (c.body_type === car.body_type) s += 3;
      if (c.fuel === car.fuel) s += 2;
      if (c.transmission === car.transmission) s += 1;
      if (c.make === car.make) s += 2;
      const priceDiff = Math.abs(c.price - car.price) / car.price;
      if (priceDiff <= 0.3) s += 3;
      else if (priceDiff <= 0.5) s += 1;
      const yearDiff = Math.abs(c.year - car.year);
      if (yearDiff <= 3) s += 2;
      else if (yearDiff <= 5) s += 1;
      return s;
    };
    return allCars
      .filter((c) => c.id !== car.id && (car.transmission === "Manual" || c.transmission === car.transmission))
      .map((c) => ({ car: c, score: score(c) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.car);
  })();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${car!.make} ${car!.model}`, url });
      } catch {
        // ignored
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!" });
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="w-full aspect-[3/2] md:aspect-[2/1] bg-muted animate-pulse" />
        <div className="container py-8 animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-10 bg-muted rounded w-32" />
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
            Voltar
          </Link>
        </Button>
      </div>
    );
  }

  const specs = [
    { icon: Calendar, label: "Ano", value: car.registration_date || String(car.year) },
    { icon: Gauge, label: "Quilómetros", value: formatMileage(car.mileage) },
    { icon: Fuel, label: "Combustível", value: car.fuel },
    { icon: Cog, label: "Transmissão", value: car.transmission },
    { icon: Cog, label: "Potência", value: `${car.power} cv` },
    ...(car.displacement ? [{ icon: Car, label: "Cilindrada", value: `${car.displacement} cc` }] : []),
    { icon: Palette, label: "Cor", value: car.color },
    { icon: DoorOpen, label: "Portas", value: String(car.doors) },
    { icon: Users, label: "Lugares", value: String(car.seats) },
    { icon: Car, label: "Carroçaria", value: car.body_type },
  ];

  return (
    <div><Helmet><title>{car.make} {car.model} {car.version || ""} | Best Car Price</title><meta name="description" content={`${car.make} ${car.model} ${car.year} - ${car.fuel} ${car.transmission} ${car.power}cv`} /><meta property="og:image" content={car.images.length > 0 ? `/api/images/${car.images[0]}` : ""} /></Helmet>
      <div className="w-full bg-muted">
        <ImageGallery images={car.images} alt={`${car.make} ${car.model}`} fullWidth />
      </div>

      <div className="container py-8">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar às viaturas
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {car.featured && <Badge variant="secondary">Destaque</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {car.make} {car.model}
              </h1>
              {car.version && <p className="text-lg text-muted-foreground mt-1">{car.version}</p>}
              <div className="flex items-center justify-between mt-4">
                <p className="text-3xl font-bold text-primary">{formatPrice(car.price)}</p>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {specs.map((spec, i) => (
                <div key={i} className="bg-card rounded-xl p-4 shadow-sm text-center">
                  <spec.icon className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">{spec.label}</p>
                  <p className="text-sm font-semibold">{spec.value}</p>
                </div>
              ))}
            </div>

            {car.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Descrição</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{car.description}</p>
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

          <div>
            <div className="bg-card rounded-xl shadow-sm p-6 sticky top-20 space-y-4">
              <h3 className="font-semibold">Interessado nesta viatura?</h3>
              <p className="text-sm text-muted-foreground">
                Entre em contacto connosco para mais informações ou para agendar um test drive.
              </p>
              <a
                href={`${SITE.whatsapp}?text=${encodeURIComponent(`Olá, estou interessado na viatura ${car.make} ${car.model} ${car.version || ""} (${car.year}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20BA5C] text-white font-medium py-3 rounded-lg transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Contactar via WhatsApp
              </a>
              <a
                href={SITE.phoneHref}
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-colors"
              >
                Ligar {SITE.phone}
              </a>
            </div>
          </div>
        </div>

        {similarCars.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Viaturas semelhantes</h2>
              <Link to="/inventory" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Ver todo o inventário
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarCars.map((c) => (
                <CarCard key={c.id} car={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
