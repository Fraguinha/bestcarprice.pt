import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, LogOut, Phone, Mail, MapPin, Home, Car, Users, Lock, Settings } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/constants";

const navLinks = [
  { href: "/", label: "Início", icon: Home },
  { href: "/inventory", label: "Viaturas", icon: Car },
  { href: "/company", label: "Sobre Nós", icon: Users },
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  return (
    <>
      <div className="hidden md:flex w-full bg-muted/50 border-b border-border/40">
        <div className="container flex h-8 items-center justify-end gap-6 text-xs text-muted-foreground">
          <a href={SITE.phoneHref} className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Phone className="h-3 w-3" />
            {SITE.phone}
          </a>
          <a href={SITE.emailHref} className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Mail className="h-3 w-3" />
            {SITE.email}
          </a>
          <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <MapPin className="h-3 w-3" />
            {SITE.location}
          </a>
        </div>
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center" aria-label={SITE.name}>
          <span className="font-logo text-base md:text-lg text-foreground">
            BEST <span className="wordmark-gold">CAR</span> PRICE
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary py-4 ${
                location.pathname === link.href
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground border-b-2 border-transparent"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/admin"
              className={`text-sm font-medium transition-colors hover:text-primary py-4 ${
                location.pathname === "/admin"
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground border-b-2 border-transparent"
              }`}
            >
              Admin
            </Link>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Link
              to="/login"
              className={`text-sm font-medium transition-colors hover:text-primary py-4 ${
                location.pathname === "/login"
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground border-b-2 border-transparent"
              }`}
            >
              Entrar
            </Link>
          )}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 flex flex-col">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>

            <div className="px-6 pt-4 pb-2">
              <span className="font-logo text-lg text-foreground">
                BEST <span className="wordmark-gold">CAR</span> PRICE
              </span>
            </div>

            <nav className="flex-1 flex flex-col gap-1 px-4">
              {navLinks.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 text-base font-medium rounded-lg px-4 py-3.5 transition-all duration-300 ${
                      location.pathname === link.href
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
              {user && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 text-base font-medium rounded-lg px-4 py-3.5 transition-all duration-300 ${
                    location.pathname === "/admin"
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  style={{ animationDelay: `${navLinks.length * 50}ms` }}
                >
                  <Settings className="h-5 w-5" />
                  Admin
                </Link>
              )}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-4 py-3.5 transition-all duration-300"
                  style={{ animationDelay: `${(navLinks.length + 1) * 50}ms` }}
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 text-base font-medium rounded-lg px-4 py-3.5 transition-all duration-300 ${
                    location.pathname === "/login"
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  style={{ animationDelay: `${navLinks.length * 50}ms` }}
                >
                  <Lock className="h-5 w-5" />
                  Entrar
                </Link>
              )}
            </nav>

            <div className="px-6 py-6 border-t border-border/40 space-y-3">
              <a href={SITE.phoneHref} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                {SITE.phone}
              </a>
              <a href={SITE.emailHref} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                {SITE.email}
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
    </>
  );
}
