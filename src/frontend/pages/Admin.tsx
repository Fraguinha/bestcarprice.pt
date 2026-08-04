import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCars, useCreateCar, useUpdateCar, useDeleteCar } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice, formatMileage, getImageUrl } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import type { Car } from "@/types/car";

const FUEL_OPTIONS = ["Gasolina", "Diesel", "Elétrico", "Híbrido (Gasolina)", "Híbrido (Diesel)", "Híbrido Plug-In", "GPL", "GNC", "Hidrogénio", "Etanol"];
const TRANSMISSION_OPTIONS = ["Manual", "Automática"];
const BODY_TYPE_OPTIONS = ["Citadino", "Utilitário", "Berlina", "Carrinha", "SUV", "Coupé", "Cabrio", "Monovolume", "Pick-up"];

interface CarForm {
  make: string;
  model: string;
  version: string;
  year: string;
  registration_date: string;
  mileage: string;
  fuel: string;
  transmission: string;
  power: string;
  displacement: string;
  color: string;
  doors: string;
  seats: string;
  body_type: string;
  price: string;
  description: string;
  features: string[];
  featured: boolean;
}

const emptyForm: CarForm = {
  make: "",
  model: "",
  version: "",
  year: "",
  registration_date: "",
  mileage: "",
  fuel: "",
  transmission: "",
  power: "",
  displacement: "",
  color: "",
  doors: "5",
  seats: "5",
  body_type: "",
  price: "",
  description: "",
  features: [],
  featured: false,
};

function carToForm(car: Car): CarForm {
  return {
    make: car.make,
    model: car.model,
    version: car.version || "",
    year: String(car.year),
    registration_date: car.registration_date || "",
    mileage: String(car.mileage),
    fuel: car.fuel,
    transmission: car.transmission,
    power: String(car.power),
    displacement: car.displacement ? String(car.displacement) : "",
    color: car.color,
    doors: String(car.doors),
    seats: String(car.seats),
    body_type: car.body_type,
    price: String(car.price),
    description: car.description || "",
    features: car.features,
    featured: car.featured,
  };
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: cars, isLoading: carsLoading } = useCars();
  const createCarMutation = useCreateCar();
  const updateCarMutation = useUpdateCar();
  const deleteCarMutation = useDeleteCar();

  const [form, setForm] = useState<CarForm>(emptyForm);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Car | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) return null;

  const handleToggleFeatured = async (car: Car) => {
    const formData = new FormData();
    formData.append("featured", String(!car.featured));
    try {
      await updateCarMutation.mutateAsync({ id: car.id, data: formData });
    } catch {}
  };

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setForm(carToForm(car));
    setFiles(null);
    setExistingImages(car.images);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingCar(null);
    setForm(emptyForm);
    setFiles(null);
    setExistingImages([]);
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setForm((f) => ({ ...f, features: [...f.features, featureInput.trim()] }));
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("make", form.make);
    formData.append("model", form.model);
    if (form.version) formData.append("version", form.version);
    formData.append("year", form.year);
    if (form.registration_date) formData.append("registration_date", form.registration_date);
    formData.append("mileage", form.mileage);
    formData.append("fuel", form.fuel);
    formData.append("transmission", form.transmission);
    formData.append("power", form.power);
    if (form.displacement) formData.append("displacement", form.displacement);
    formData.append("color", form.color);
    formData.append("doors", form.doors);
    formData.append("seats", form.seats);
    formData.append("body_type", form.body_type);
    formData.append("price", form.price);
    if (form.description) formData.append("description", form.description);
    formData.append("featured", String(form.featured));
    form.features.forEach((f) => formData.append("features", f));

    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]!);
      }
    } else if (editingCar && JSON.stringify(existingImages) !== JSON.stringify(editingCar.images)) {
      formData.append("existingImages", JSON.stringify(existingImages));
    }

    try {
      if (editingCar) {
        await updateCarMutation.mutateAsync({ id: editingCar.id, data: formData });
        toast({ title: "Sucesso", description: "Viatura atualizada com sucesso" });
      } else {
        await createCarMutation.mutateAsync(formData);
        toast({ title: "Sucesso", description: "Viatura criada com sucesso" });
      }
      handleCancelEdit();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Ocorreu um erro",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCarMutation.mutateAsync(deleteConfirm.id);
      toast({ title: "Sucesso", description: "Viatura eliminada" });
      setDeleteConfirm(null);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Ocorreu um erro",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Administração</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingCar ? "Editar Viatura" : "Nova Viatura"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Input value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Versão</Label>
                <Input value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ano *</Label>
                <Input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Data de Registo</Label>
                <Input value={form.registration_date} onChange={(e) => setForm((f) => ({ ...f, registration_date: e.target.value }))} placeholder="MM/AAAA" />
              </div>
              <div className="space-y-2">
                <Label>Quilómetros *</Label>
                <Input type="number" value={form.mileage} onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Combustível *</Label>
                <Select value={form.fuel} onValueChange={(v) => setForm((f) => ({ ...f, fuel: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {FUEL_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transmissão *</Label>
                <Select value={form.transmission} onValueChange={(v) => setForm((f) => ({ ...f, transmission: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {TRANSMISSION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Potência (cv) *</Label>
                <Input type="number" value={form.power} onChange={(e) => setForm((f) => ({ ...f, power: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Cilindrada (cc)</Label>
                <Input type="number" value={form.displacement} onChange={(e) => setForm((f) => ({ ...f, displacement: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Cor *</Label>
                <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Portas *</Label>
                <Input type="number" value={form.doors} onChange={(e) => setForm((f) => ({ ...f, doors: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Lugares *</Label>
                <Input type="number" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Carroçaria *</Label>
                <Select value={form.body_type} onValueChange={(v) => setForm((f) => ({ ...f, body_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {BODY_TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preço (€) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Características</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Adicionar característica"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddFeature(); } }}
                />
                <Button type="button" variant="secondary" onClick={handleAddFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.features.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                      {f}
                      <button type="button" onClick={() => handleRemoveFeature(i)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Imagens</Label>
              <Input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
              {editingCar && existingImages.length > 0 && !files && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {existingImages.map((img, i) => (
                    <div key={img} className="relative group">
                      <img
                        src={getImageUrl(img)}
                        className="w-20 h-14 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          className="bg-black/60 text-white rounded-full p-0.5"
                          onClick={() => {
                            if (i === 0) return;
                            setExistingImages((imgs) => {
                              const next = [...imgs];
                              [next[i - 1]!, next[i]!] = [next[i]!, next[i - 1]!];
                              return next;
                            });
                          }}
                          disabled={i === 0}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="bg-black/60 text-white rounded-full p-0.5"
                          onClick={() => {
                            if (i === existingImages.length - 1) return;
                            setExistingImages((imgs) => {
                              const next = [...imgs];
                              [next[i]!, next[i + 1]!] = [next[i + 1]!, next[i]!];
                              return next;
                            });
                          }}
                          disabled={i === existingImages.length - 1}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5"
                        onClick={() => setExistingImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>



            <div className="flex gap-2">
              <Button type="submit" disabled={createCarMutation.isPending || updateCarMutation.isPending}>
                {editingCar ? "Atualizar" : "Criar"} Viatura
              </Button>
              {editingCar && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <h2 className="text-2xl font-bold mb-4">Viaturas Existentes</h2>

      {carsLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {cars && cars.length === 0 && (
        <p className="text-muted-foreground">Nenhuma viatura registada.</p>
      )}

      {cars && cars.length > 0 && (
        <div className="space-y-3">
          {cars.map((car) => (
            <div key={car.id} className="p-3 md:p-4 rounded-lg bg-card shadow-sm">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-16 h-12 md:w-24 md:h-16 rounded-md overflow-hidden bg-muted">
                  {car.images.length > 0 ? (
                    <img src={getImageUrl(car.images[0]!)} alt={car.make} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      Sem foto
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm md:text-base">
                    {car.make} {car.model} {car.version || ""}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {car.year} · {formatMileage(car.mileage)} · {formatPrice(car.price)}
                  </p>
                </div>
                <div className="flex gap-1 md:gap-2 shrink-0">
                  <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={() => handleToggleFeatured(car)}>
                    <Star className={`h-3.5 w-3.5 md:h-4 md:w-4 ${car.featured ? "fill-amber-400 text-amber-400" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={() => handleEdit(car)}>
                    <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={() => setDeleteConfirm(car)}>
                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminação</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar {deleteConfirm?.make} {deleteConfirm?.model}? Esta ação não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCarMutation.isPending}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
