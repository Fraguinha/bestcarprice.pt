import { Helmet } from "react-helmet-async";
import { Phone, Mail, MapPin, Shield, Star, Handshake } from "lucide-react";
import { SITE } from "@/lib/constants";

export default function Company() {
  return (
    <div className="flex flex-col"><Helmet><title>Sobre Nós | Best Car Price</title><meta name="description" content="Conheça a nossa equipa e os nossos valores" /></Helmet>
      <section className="bg-dark-section py-16 md:py-24">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-dark-section-foreground">
            Sobre Nós
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-dark-section-foreground/70">
            Somos um stand automóvel dedicado à venda de viaturas usadas e seminovas de qualidade.
            Com anos de experiência no mercado, oferecemos um serviço personalizado para que cada
            cliente encontre o veículo perfeito às suas necessidades e orçamento.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight mb-12">
            Os Nossos Valores
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center rounded-xl bg-card shadow-sm p-8">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Transparência</h3>
              <p className="text-muted-foreground">
                Todas as informações sobre as nossas viaturas são claras e detalhadas.
                Sem surpresas, sem custos ocultos.
              </p>
            </div>
            <div className="flex flex-col items-center text-center rounded-xl bg-card shadow-sm p-8">
              <Star className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Qualidade</h3>
              <p className="text-muted-foreground">
                Cada viatura passa por uma inspeção rigorosa antes de ser disponibilizada
                para venda, garantindo a melhor qualidade.
              </p>
            </div>
            <div className="flex flex-col items-center text-center rounded-xl bg-card shadow-sm p-8">
              <Handshake className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Confiança</h3>
              <p className="text-muted-foreground">
                Construímos relações duradouras com os nossos clientes, baseadas na
                honestidade e no compromisso com a satisfação.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-6">A Nossa Equipa</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A nossa equipa está disponível para o ajudar a encontrar a viatura ideal.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight mb-12">Contactos</h2>
          <div className="mx-auto max-w-md space-y-4">
            <a href={SITE.phoneHref} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              <span>{SITE.phone}</span>
            </a>
            <a href={SITE.emailHref} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-5 w-5 text-primary" />
              <span>{SITE.email}</span>
            </a>
            <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{SITE.location}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
