import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCars, useCreateCar, useUpdateCar, useDeleteCar } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice, formatMileage, getImageUrl } from "@/lib/utils";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { Car } from "@/types/car";

const FUEL_OPTIONS = ["Gasolina", "Gasóleo", "Híbrido", "Elétrico", "GPL"];
const TRANSMISSION_OPTIONS = ["Manual", "Automática"];
const BODY_TYPE_OPTIONS = ["Berlina", "SUV", "Carrinha", "Citadino", "Coupé", "Monovolume", "Cabrio", "Pick-up"];

interface CarForm {
  make: string;
  model: string;
  version: string;
  year: string;
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
  sold: boolean;
  featured: boolean;
}

const emptyForm: CarForm = {
  make: "",
  model: "",
  version: "",
  year: "",
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
  sold: false,
  featured: false,
};

function carToForm(car: Car): CarForm {
  return {
    make: car.make,
    model: car.model,
    version: car.version || "",
    year: String(car.year),
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
    sold: car.sold,
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) return null;

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setForm(carToForm(car));
    setFiles(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingCar(null);
    setForm(emptyForm);
    setFiles(null);
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
    formData.append("sold", String(form.sold));
    formData.append("featured", String(form.featured));
    form.features.forEach((f) => formData.append("features", f));

    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]!);
      }
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
              {editingCar && editingCar.images.length > 0 && !files && (
                <p className="text-sm text-muted-foreground">
                  {editingCar.images.length} imagem(ns) existente(s). Carregue novas para substituir.
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sold"
                  checked={form.sold}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, sold: !!checked }))}
                />
                <Label htmlFor="sold">Vendido</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={form.featured}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, featured: !!checked }))}
                />
                <Label htmlFor="featured">Destaque</Label>
              </div>
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
            <div key={car.id} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
              <div className="shrink-0 w-24 h-16 rounded-md overflow-hidden bg-muted">
                {car.images.length > 0 ? (
                  <img src={getImageUrl(car.images[0]!)} alt={car.make} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {car.make} {car.model} {car.version || ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {car.year} · {formatMileage(car.mileage)} · {formatPrice(car.price)}
                  {car.sold && " · Vendido"}
                  {car.featured && " · Destaque"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon" onClick={() => handleEdit(car)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setDeleteConfirm(car)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
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
