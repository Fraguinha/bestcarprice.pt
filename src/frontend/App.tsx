import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import WhatsAppButton from "@/components/WhatsAppButton";
import Index from "@/pages/Index";
import Inventory from "@/pages/Inventory";
import CarDetail from "@/pages/CarDetail";
import Company from "@/pages/Company";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

function App() {
  const location = useLocation();
  const hideWhatsApp = location.pathname === "/admin" || location.pathname === "/login";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/car/:id" element={<CarDetail />} />
          <Route path="/company" element={<Company />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideWhatsApp && <WhatsAppButton />}
    </div>
  );
}

export default App;
