import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Car, LogOut } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/inventory", label: "Inventário" },
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Car className="h-6 w-6 text-primary" />
          <span>Stand Fraguinha</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/admin"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/admin" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Admin
            </Link>
          )}
          {user && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className={`text-lg font-medium transition-colors hover:text-primary ${
                    location.pathname === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className={`text-lg font-medium transition-colors hover:text-primary ${
                    location.pathname === "/admin" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Admin
                </Link>
              )}
              {user && (
                <Button variant="ghost" className="justify-start px-0" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
