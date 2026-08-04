import { Helmet } from "react-helmet-async";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCars } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import CarCard from "@/components/CarCard";
import { SITE } from "@/lib/constants";
import {
  ArrowRight,
  Star,
  MessageCircle,
  Car,
  Shield,
  FileText,
  Truck,
  CreditCard,
  RefreshCw,
  ChevronDown,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

const reviews = [
  {
    name: "Ricardo Ferreira",
    text: "Excelente experiência! Comprei o meu carro aqui e o processo foi impecável do início ao fim. Recomendo vivamente.",
  },
  {
    name: "Ana Sousa",
    text: "Profissionalismo e transparência. Encontrei exatamente o que procurava a um preço justo. Voltarei certamente.",
  },
  {
    name: "Miguel Santos",
    text: "Atendimento cinco estrelas. Muito atenciosos e disponíveis para esclarecer todas as dúvidas. Viatura impecável.",
  },
  {
    name: "Carla Oliveira",
    text: "Já é o segundo carro que compro aqui. Confiança total na qualidade das viaturas e na honestidade do stand.",
  },
  {
    name: "João Martins",
    text: "Processo de financiamento muito simples e rápido. A equipa tratou de tudo sem complicações. Muito satisfeito.",
  },
  {
    name: "Sofia Pereira",
    text: "Recomendo a 100%. Carro em estado impecável, preço competitivo e entrega rápida. Nada a apontar.",
  },
  {
    name: "Tiago Almeida",
    text: "Fiquei surpreendido com a qualidade do serviço. Desde a primeira visita até à entrega do carro, tudo correu na perfeição.",
  },
  {
    name: "Marta Rodrigues",
    text: "O meu marido e eu comprámos aqui os nossos dois carros. Preços honestos e carros sempre em ótimo estado. Obrigada!",
  },
  {
    name: "Pedro Costa",
    text: "Viatura entregue exatamente como descrita no anúncio. Sem surpresas, sem problemas. É assim que deve ser.",
  },
  {
    name: "Inês Fernandes",
    text: "Equipa muito simpática e prestável. Ajudaram-me a escolher o carro ideal para as minhas necessidades. Super satisfeita.",
  },
  {
    name: "Bruno Silva",
    text: "Já recomendei a vários amigos e todos ficaram igualmente satisfeitos. Stand de referência na zona.",
  },
  {
    name: "Catarina Lopes",
    text: "Trataram da documentação toda de forma rápida e eficiente. Entrega ao domicílio impecável. Nota máxima!",
  },
];

const services = [
  { icon: CreditCard, title: "Financiamento", description: "Soluções de crédito adaptadas ao seu perfil" },
  { icon: RefreshCw, title: "Retoma de viaturas", description: "Avaliamos e retomamos o seu carro atual" },
  { icon: FileText, title: "Transferência de propriedade", description: "Tratamos de toda a documentação" },
  { icon: Car, title: "Preparação de viaturas", description: "Entrega com revisão completa e garantia" },
  { icon: Shield, title: "Seguro automóvel", description: "Parcerias com as melhores seguradoras" },
  { icon: Truck, title: "Entrega ao domicílio", description: "Levamos o seu carro a qualquer ponto do país" },
];

const faqs = [
  {
    question: "Como funciona o financiamento?",
    answer: "Trabalhamos com diversas entidades financeiras para encontrar a melhor solução para si. O processo é simples: escolha a viatura, apresente os documentos necessários e nós tratamos de tudo. Resposta em 24-48 horas.",
  },
  {
    question: "Posso fazer um test drive?",
    answer: "Sim, todos os nossos clientes podem agendar um test drive. Basta contactar-nos por telefone ou WhatsApp e combinamos a melhor data e hora para si.",
  },
  {
    question: "As viaturas têm garantia?",
    answer: "Todas as nossas viaturas incluem garantia mínima de 18 meses conforme a legislação. Oferecemos também extensões de garantia para maior tranquilidade.",
  },
  {
    question: "Que documentos preciso para comprar?",
    answer: "Necessita do cartão de cidadão, comprovativo de morada e NIF. Para financiamento, são também necessários os últimos 3 recibos de vencimento e declaração de IRS.",
  },
  {
    question: "Aceitam retoma do meu carro atual?",
    answer: "Sim, fazemos avaliação gratuita e sem compromisso do seu carro atual. O valor de retoma pode ser utilizado como entrada na compra de uma nova viatura.",
  },
  {
    question: "Fazem entrega ao domicílio?",
    answer: "Sim, entregamos viaturas em todo o território nacional. O custo de entrega varia consoante a distância. Para a zona de Oliveira de Frades a entrega é gratuita.",
  },
];

export default function Index() {
  const { data: allCars, isLoading: carsLoading } = useCars();
  const featuredCars = allCars?.filter((c) => c.featured);
  const featuredLoading = carsLoading;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const reviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CARD_WIDTH = 340;
  const CARD_GAP = 24;
  const CARD_STEP = CARD_WIDTH + CARD_GAP;

  const getCardIndex = () => {
    const el = reviewsRef.current;
    if (!el) return 0;
    return Math.round(el.scrollLeft / CARD_STEP);
  };

  const scrollToCard = (index: number) => {
    const el = reviewsRef.current;
    if (!el) return;
    el.scrollTo({ left: index * CARD_STEP, behavior: "smooth" });
  };

  const scheduleNext = () => {
    if (reviewTimer.current) clearTimeout(reviewTimer.current);
    reviewTimer.current = setTimeout(() => {
      const el = reviewsRef.current;
      if (!el) return;
      const current = getCardIndex();
      const total = reviews.length;
      if (current >= total - 1) {
        el.scrollTo({ left: total * CARD_STEP, behavior: "smooth" });
        setTimeout(() => {
          el.scrollTo({ left: 0 });
        }, 700);
      } else {
        scrollToCard(current + 1);
      }
      scheduleNext();
    }, 3000);
  };

  useEffect(() => {
    scheduleNext();
    return () => { if (reviewTimer.current) clearTimeout(reviewTimer.current); };
  }, []);

  const handleReviewInteraction = () => {
    if (reviewTimer.current) clearTimeout(reviewTimer.current);
    reviewTimer.current = setTimeout(() => {
      scheduleNext();
    }, 5000);
  };

  const featuredIds = new Set((featuredCars ?? []).map((c) => c.id));
  const latestCars = (allCars ?? [])
    .filter((c) => !featuredIds.has(c.id))
    .slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen"><Helmet><title>Best Car Price | Viaturas premium</title><meta name="description" content="Viaturas premium selecionadas com rigor em Oliveira de Frades" /></Helmet>
      <section className="relative overflow-hidden bg-dark-section aspect-[9/16] md:aspect-[1280/544]">
        <video
          autoPlay
          muted
          loop
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          src="/api/images/assets/hero-video.mp4"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center">
            <h1 className="sr-only">{SITE.name}</h1>
            <img
              src="/logo.png"
              alt={SITE.name}
              className="mx-auto w-full max-w-md md:max-w-xl lg:max-w-2xl h-auto drop-shadow-2xl"
            />
            <div className="mt-8 md:mt-10">
              <Link
                to="/inventory"
                className="inline-flex items-center gap-2 border-2 border-white/80 text-white px-6 py-3 md:px-8 md:py-4 text-sm md:text-base font-semibold rounded-lg hover:bg-white hover:text-black hover:border-white backdrop-blur-sm transition-all duration-300"
              >
                Ver Viaturas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {featuredLoading && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredCars && featuredCars.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Destaques
              </h2>
              <div className="mt-4 w-12 h-0.5 bg-primary/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCars.slice(0, 6).map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button asChild variant="outline" size="lg">
                <Link to="/inventory">
                  Ver todo o inventário
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {carsLoading && (
        <section className="py-20 px-6 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      )}

      {latestCars.length > 0 && (
        <section className="py-20 px-6 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Últimas entradas
              </h2>
              <div className="mt-4 w-12 h-0.5 bg-primary/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestCars.map((car) => (
                <CarCard key={car.id} car={car} isNew />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-dark-section py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-dark-section-foreground mb-6">
            Compramos o seu carro
          </h2>
          <p className="text-dark-section-foreground/70 text-lg mb-8 max-w-2xl mx-auto">
            Quer vender ou trocar o seu carro? Nós tratamos de tudo.
          </p>
          <ul className="text-left max-w-md mx-auto space-y-4 mb-10">
            <li className="flex items-center gap-3 text-dark-section-foreground/80">
              <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
              Avaliação justa e rápida
            </li>
            <li className="flex items-center gap-3 text-dark-section-foreground/80">
              <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
              Pagamento rápido e transparente
            </li>
            <li className="flex items-center gap-3 text-dark-section-foreground/80">
              <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
              Processo simples e sem complicações
            </li>
          </ul>
          <Button
            asChild
            size="lg"
            className="bg-[#25D366] hover:bg-[#20BA5C] text-white px-8 py-6 text-base font-medium"
          >
            <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-5 w-5" />
              Contactar via WhatsApp
            </a>
          </Button>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              O que dizem os nossos clientes
            </h2>
            <div className="mt-4 w-12 h-0.5 bg-primary/20" />
          </div>
          <div className="relative">
            <div
              ref={reviewsRef}
              onScroll={handleReviewInteraction}
              onTouchStart={handleReviewInteraction}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {[...reviews, ...reviews].map((review, idx) => (
                <div
                  key={idx}
                  className="w-[340px] shrink-0 snap-start rounded-xl bg-card p-8 space-y-4 shadow-sm"
                >
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{review.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{review.name}</p>
                      <p className="text-xs text-muted-foreground">Google Review</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Os nossos serviços
            </h2>
            <div className="mt-4 w-12 h-0.5 bg-primary/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-xl bg-card shadow-sm p-6 text-center space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                  <service.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Porquê nós?
            </h2>
            <div className="mt-4 w-12 h-0.5 bg-primary/20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl bg-card shadow-sm p-8 space-y-4">
              <h3 className="font-bold text-xl">Qualidade e seleção criteriosa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Cada viatura é cuidadosamente inspecionada e selecionada. Apenas os melhores exemplares chegam ao nosso stand, garantindo a máxima qualidade e fiabilidade em cada compra.
              </p>
            </div>
            <div className="rounded-xl bg-card shadow-sm p-8 space-y-4">
              <h3 className="font-bold text-xl">Confiança construída com transparência</h3>
              <p className="text-muted-foreground leading-relaxed">
                Acreditamos que a confiança se conquista com honestidade. Apresentamos o histórico completo de cada viatura, sem surpresas nem letras pequenas. O que vê é o que leva.
              </p>
            </div>
            <div className="rounded-xl bg-card shadow-sm p-8 space-y-4">
              <h3 className="font-bold text-xl">Assistência e apoio pós-venda</h3>
              <p className="text-muted-foreground leading-relaxed">
                O nosso compromisso não termina na venda. Estamos disponíveis para o apoiar em qualquer questão após a compra, desde manutenção a esclarecimento de dúvidas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Perguntas frequentes
            </h2>
            <div className="mt-4 w-12 h-0.5 bg-primary/20" />
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-medium hover:bg-muted/50 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${openFaq === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pt-2 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Onde estamos
            </h2>
            <div className="mt-4 w-12 h-0.5 bg-primary/20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="rounded-xl overflow-hidden h-[350px]">
              <iframe
                src={SITE.mapsEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Best Car Price"
              />
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Morada</p>
                  <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">{SITE.location}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Telefone</p>
                  <a href={SITE.phoneHref} className="text-muted-foreground hover:text-foreground transition-colors">{SITE.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Email</p>
                  <a href={SITE.emailHref} className="text-muted-foreground hover:text-foreground transition-colors">{SITE.email}</a>
                </div>
              </div>
              <Button asChild variant="outline" size="lg" className="mt-4">
                <a
                  href={SITE.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Abrir no Google Maps
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-dark-section py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div className="space-y-3">
              <span className="font-logo text-xl text-dark-section-foreground">
                BEST <span className="wordmark-gold">CAR</span> PRICE
              </span>
              <p className="text-dark-section-foreground/60 text-sm leading-relaxed">
                Viaturas premium selecionadas com rigor. Qualidade e confiança desde o primeiro contacto.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-dark-section-foreground font-semibold">Contactos</span>
              <div className="space-y-2 text-sm text-dark-section-foreground/60">
                <a href={SITE.phoneHref} className="flex items-center gap-2 hover:text-dark-section-foreground transition-colors">
                  <Phone className="h-4 w-4" />
                  {SITE.phone}
                </a>
                <a href={SITE.emailHref} className="flex items-center gap-2 hover:text-dark-section-foreground transition-colors">
                  <Mail className="h-4 w-4" />
                  {SITE.email}
                </a>
              </div>
            </div>
            <div className="space-y-3">
              <span className="text-dark-section-foreground font-semibold">Localização</span>
              <p className="text-sm text-dark-section-foreground/60">{SITE.location}</p>
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-dark-section-foreground/70 hover:text-dark-section-foreground transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Ver no Google Maps
              </a>
            </div>
          </div>
          <div className="border-t border-dark-section-foreground/10 pt-8 text-center text-sm text-dark-section-foreground/40">
            © {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
