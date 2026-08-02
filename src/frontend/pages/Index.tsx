import { Link } from "react-router-dom";
import { useFeaturedCars } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import CarCard from "@/components/CarCard";
import { ArrowRight, Car, Shield, ThumbsUp } from "lucide-react";

export default function Index() {
  const { data: featuredCars, isLoading } = useFeaturedCars();

  return (
    <div>
      <section className="relative bg-gradient-to-br from-[#1a2332] to-[#2a3f5f] text-white">
        <div className="container py-20 md:py-32">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Stand Fraguinha
            </h1>
            <p className="text-lg md:text-xl text-gray-300">
              Viaturas de qualidade ao melhor preço. Encontre o automóvel perfeito para si.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/inventory">
                  Ver Inventário
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {featuredCars && featuredCars.length > 0 && (
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Destaques</h2>
            <Button asChild variant="ghost">
              <Link to="/inventory">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCars.slice(0, 6).map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </section>
      )}

      {isLoading && (
        <section className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </section>
      )}

      <section className="bg-muted/50 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Porquê escolher-nos?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Viaturas Selecionadas</h3>
              <p className="text-muted-foreground">
                Cada viatura é cuidadosamente inspecionada e selecionada para garantir a máxima qualidade.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Garantia Incluída</h3>
              <p className="text-muted-foreground">
                Todas as nossas viaturas incluem garantia para sua total tranquilidade.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ThumbsUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Melhor Preço</h3>
              <p className="text-muted-foreground">
                Oferecemos os melhores preços do mercado com total transparência.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
