import { Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Index from "@/pages/Index";
import Inventory from "@/pages/Inventory";
import CarDetail from "@/pages/CarDetail";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/car/:id" element={<CarDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
