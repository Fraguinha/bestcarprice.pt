import { useState, useEffect, useRef } from "react";
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
import { Plus, Pencil, Trash2, X, Star, Euro, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import type { Car } from "@/types/car";
import type { CarUploadProgress } from "@/lib/api";

const FUEL_OPTIONS = ["Gasolina", "Diesel", "Elétrico", "Híbrido (Gasolina)", "Híbrido (Diesel)", "Híbrido Plug-In", "GPL", "GNC", "Hidrogénio", "Etanol"];
const TRANSMISSION_OPTIONS = ["Manual", "Automática"];
const BODY_TYPE_OPTIONS = ["Citadino", "Utilitário", "Berlina", "Carrinha", "SUV", "Coupé", "Cabrio", "Monovolume", "Pick-up"];

type ImageKind = "existing" | "selected";
type SelectedImage = { id: number; file: File; url: string };
type ImageDrag = { kind: ImageKind; from: number; to: number; pointerId: number };

function moveImage<T>(images: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return images;
  const next = [...images];
  next.splice(to, 0, next.splice(from, 1)[0]!);
  return next;
}

interface CarForm {
  make: string;
  model: string;
  version: string;
  registration_date: string;
  origin: string;
  mileage: string;
  fuel: string;
  transmission: string;
  power: string;
  displacement: string;
  color: string;
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
  registration_date: "",
  origin: "",
  mileage: "",
  fuel: "",
  transmission: "",
  power: "",
  displacement: "",
  color: "",
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
    registration_date: car.registration_date || "",
    origin: car.origin || "",
    mileage: String(car.mileage),
    fuel: car.fuel,
    transmission: car.transmission,
    power: String(car.power),
    displacement: car.displacement == null ? "" : String(car.displacement),
    color: car.color,
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
  const [files, setFiles] = useState<SelectedImage[] | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Car | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<CarUploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitInFlight = useRef(false);
  const imageUrls = useRef(new Set<string>());
  const nextImageId = useRef(0);
  const dragRef = useRef<ImageDrag | null>(null);
  const [drag, setDrag] = useState<ImageDrag | null>(null);
  const visibleImages = files ?? existingImages;
  const visibleImageKind: ImageKind = files ? "selected" : "existing";
  const isFormPending = uploadProgress !== null;
  const isAdminBusy = isFormPending || createCarMutation.isPending || updateCarMutation.isPending || deleteCarMutation.isPending;
  let submitLabel = editingCar ? "Atualizar Viatura" : "Criar Viatura";
  if (uploadProgress?.phase === "uploading") {
    submitLabel = "A enviar dados...";
  } else if (uploadProgress?.phase === "processing") {
    submitLabel = files?.length ? "A processar imagens e guardar..." : "A guardar viatura...";
  }

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const urls = imageUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  if (authLoading || !user) return null;

  const handleToggleFeatured = async (car: Car) => {
    if (isAdminBusy) return;
    const formData = new FormData();
    formData.append("featured", String(!car.featured));
    try {
      await updateCarMutation.mutateAsync({ id: car.id, data: formData });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível atualizar a viatura",
        variant: "destructive",
      });
    }
  };

  const handleToggleSold = async (car: Car) => {
    if (isAdminBusy) return;
    const formData = new FormData();
    formData.append("sold", String(!car.sold));
    try {
      await updateCarMutation.mutateAsync({ id: car.id, data: formData });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível atualizar a viatura",
        variant: "destructive",
      });
    }
  };

  const clearSelectedFiles = () => {
    imageUrls.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrls.current.clear();
    setFiles(null);
    dragRef.current = null;
    setDrag(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFilesSelected = (list: FileList | null) => {
    if (!list?.length) return;
    const next = Array.from(list, (file) => ({
      id: nextImageId.current++,
      file,
      url: URL.createObjectURL(file),
    }));
    clearSelectedFiles();
    next.forEach(({ url }) => imageUrls.current.add(url));
    setFiles(next);
  };

  const removeImage = (index: number) => {
    if (!files) {
      setExistingImages((images) => images.filter((_, i) => i !== index));
      return;
    }
    const image = files[index];
    if (!image) return;
    URL.revokeObjectURL(image.url);
    imageUrls.current.delete(image.url);
    if (files.length === 1) {
      setFiles(null);
    } else {
      setFiles(files.filter((_, i) => i !== index));
    }
  };

  const moveImages = (kind: ImageKind, from: number, to: number) => {
    if (kind === "selected") {
      setFiles((images) => images && moveImage(images, from, to));
    } else {
      setExistingImages((images) => moveImage(images, from, to));
    }
  };

  const dropIndex = (event: React.PointerEvent<HTMLButtonElement>, current: ImageDrag): number => {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-image-kind][data-image-index]");
    if (target?.dataset.imageKind !== current.kind) return current.from;
    const index = Number(target.dataset.imageIndex);
    return Number.isInteger(index) ? index : current.from;
  };

  const handleDragStart = (event: React.PointerEvent<HTMLButtonElement>, kind: ImageKind, index: number) => {
    if (!event.isPrimary || event.button !== 0) return;
    const current = { kind, from: index, to: index, pointerId: event.pointerId };
    dragRef.current = current;
    setDrag(current);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const to = dropIndex(event, current);
    if (to !== current.to) {
      dragRef.current = { ...current, to };
      setDrag(dragRef.current);
    }
  };

  const cancelDrag = (pointerId: number) => {
    if (dragRef.current?.pointerId !== pointerId) return;
    dragRef.current = null;
    setDrag(null);
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const to = dropIndex(event, current);
    cancelDrag(event.pointerId);
    moveImages(current.kind, current.from, to);
  };

  const handleEdit = (car: Car) => {
    if (isAdminBusy) return;
    setEditingCar(car);
    setForm(carToForm(car));
    setFeatureInput("");
    clearSelectedFiles();
    setExistingImages(car.images);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingCar(null);
    setForm(emptyForm);
    setFeatureInput("");
    clearSelectedFiles();
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
    if (submitInFlight.current || isAdminBusy) return;
    submitInFlight.current = true;
    setUploadProgress({ phase: "uploading" });
    const formData = new FormData();
    formData.append("make", form.make);
    formData.append("model", form.model);
    if (form.version) formData.append("version", form.version);
    formData.append("registration_date", form.registration_date);
    formData.append("origin", form.origin);
    formData.append("mileage", form.mileage);
    formData.append("fuel", form.fuel);
    formData.append("transmission", form.transmission);
    formData.append("power", form.power);
    formData.append("displacement", form.displacement);
    formData.append("color", form.color);
    formData.append("seats", form.seats);
    formData.append("body_type", form.body_type);
    formData.append("price", form.price);
    if (form.description) formData.append("description", form.description);
    formData.append("featured", String(form.featured));
    form.features.forEach((f) => formData.append("features", f));

    if (files) {
      files.forEach(({ file }) => formData.append("images", file));
    } else if (editingCar && JSON.stringify(existingImages) !== JSON.stringify(editingCar.images)) {
      formData.append("existingImages", JSON.stringify(existingImages));
    }

    try {
      if (editingCar) {
        await updateCarMutation.mutateAsync({ id: editingCar.id, data: formData, onProgress: setUploadProgress });
        toast({ title: "Sucesso", description: "Viatura atualizada com sucesso" });
      } else {
        await createCarMutation.mutateAsync({ data: formData, onProgress: setUploadProgress });
        toast({ title: "Sucesso", description: "Viatura criada com sucesso" });
      }
      handleCancelEdit();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Ocorreu um erro",
        variant: "destructive",
      });
    } finally {
      submitInFlight.current = false;
      setUploadProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm || isAdminBusy) return;
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
          <form onSubmit={handleSubmit}>
            <fieldset disabled={isFormPending} className="space-y-6">
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
                <Label htmlFor="car-registration-date">Data de Registo *</Label>
                <Input id="car-registration-date" value={form.registration_date} onChange={(e) => setForm((f) => ({ ...f, registration_date: e.target.value }))} placeholder="MM/AAAA" pattern="(0[1-9]|1[0-2])/(?!0000)[0-9]{4}" title="Formato MM/AAAA (mês entre 01 e 12)" maxLength={7} required />
                <p className="text-xs text-muted-foreground">Mês e ano de registo (MM/AAAA).</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="car-origin">Origem</Label>
                <Select value={form.origin || "unknown"} onValueChange={(v) => setForm((f) => ({ ...f, origin: v === "unknown" ? "" : v }))}>
                  <SelectTrigger id="car-origin"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Por confirmar</SelectItem>
                    <SelectItem value="Nacional">Nacional</SelectItem>
                    <SelectItem value="Importado">Importado</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>Cilindrada (cc) *</Label>
                <Input type="number" min="0" step="1" value={form.displacement} onChange={(e) => setForm((f) => ({ ...f, displacement: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Cor *</Label>
                <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} required />
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
              <Label htmlFor="car-images">Imagens</Label>
              <Input id="car-images" ref={fileInputRef} type="file" multiple accept="image/*" aria-describedby="car-upload-help" onChange={(e) => handleFilesSelected(e.target.files)} />
              <p id="car-upload-help" className="text-xs text-muted-foreground">
                Arraste pelo ícone ou use as setas para ordenar as fotografias antes de guardar. Ao selecionar novas fotografias, estas substituem as existentes.
                O progresso indica apenas os dados enviados. Depois, o servidor processa as imagens enviadas e guarda a viatura; aguarde a confirmação.
              </p>
              {files && <p role="status" className="text-xs text-muted-foreground">{files.length} {files.length === 1 ? "fotografia selecionada" : "fotografias selecionadas"} para envio.</p>}
              <div role="status" aria-live="polite" className="space-y-2 text-sm">
                {uploadProgress?.phase === "uploading" && (
                  uploadProgress.loaded !== undefined && uploadProgress.total !== undefined ? (
                    <>
                      <p>
                        A enviar dados: {uploadProgress.loaded.toLocaleString("pt-PT")} de {uploadProgress.total.toLocaleString("pt-PT")} bytes ({Math.floor(uploadProgress.loaded / uploadProgress.total * 100)}%).
                      </p>
                      <progress aria-label="Envio dos dados da viatura" value={uploadProgress.loaded} max={uploadProgress.total} className="w-full" />
                    </>
                  ) : (
                    <p>A enviar dados da viatura...</p>
                  )
                )}
                {uploadProgress?.phase === "processing" && (
                  <p>{files?.length ? "O servidor está a processar as imagens e a guardar a viatura..." : "O servidor está a guardar a viatura..."}</p>
                )}
              </div>
              {visibleImages.length > 0 && (editingCar || files) && (
                <div role="list" aria-label="Ordem das fotografias" className="flex flex-wrap gap-3 mt-2">
                  {visibleImages.map((image, i) => (
                    <div
                      key={typeof image === "string" ? image : image.id}
                      role="listitem"
                      aria-label={`Fotografia ${i + 1} de ${visibleImages.length}`}
                      data-image-kind={visibleImageKind}
                      data-image-index={i}
                      className={`relative w-28 rounded-md ${drag?.kind === visibleImageKind && drag.from === i ? "opacity-50" : ""} ${drag?.kind === visibleImageKind && drag.to === i && drag.from !== i ? "ring-2 ring-primary" : ""}`}
                    >
                      <img
                        src={typeof image === "string" ? getImageUrl(image) : image.url}
                        alt={`Fotografia ${i + 1} de ${visibleImages.length}`}
                        className="w-28 h-20 object-cover rounded-md"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Mover fotografia ${i + 1} para a posição anterior`}
                          onClick={() => moveImages(visibleImageKind, i, i - 1)}
                          disabled={i === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center touch-none cursor-grab active:cursor-grabbing rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Arrastar fotografia ${i + 1} para alterar a ordem`}
                          onPointerDown={(event) => handleDragStart(event, visibleImageKind, i)}
                          onPointerMove={handleDragMove}
                          onPointerUp={handleDragEnd}
                          onPointerCancel={(event) => cancelDrag(event.pointerId)}
                          onLostPointerCapture={(event) => cancelDrag(event.pointerId)}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Mover fotografia ${i + 1} para a posição seguinte`}
                          onClick={() => moveImages(visibleImageKind, i, i + 1)}
                          disabled={i === visibleImages.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center bg-destructive text-white rounded-full focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Remover fotografia ${i + 1}`}
                        onClick={() => removeImage(i)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isAdminBusy}>
                {submitLabel}
              </Button>
              {editingCar && (
                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isAdminBusy}>
                  Cancelar
                </Button>
              )}
            </div>
            </fieldset>
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
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
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
                    {car.registration_date ? `Registo ${car.registration_date}` : "Data de Registo por confirmar"} · {formatMileage(car.mileage)} · {formatPrice(car.price)}
                  </p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${car.sold ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                    {car.sold ? "Vendido" : "Disponível"}
                  </span>
                </div>
                <div className="flex w-full justify-end gap-2 sm:w-auto sm:shrink-0">
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => handleToggleFeatured(car)} disabled={isAdminBusy} aria-pressed={car.featured} aria-label={car.featured ? `Remover ${car.make} ${car.model} dos destaques` : `Destacar ${car.make} ${car.model}`} title={car.featured ? "Remover dos destaques" : "Destacar viatura"}>
                    <Star className={`h-4 w-4 ${car.featured ? "fill-amber-400 text-amber-400" : ""}`} />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className={`h-11 w-11 sm:h-9 sm:w-9 ${car.sold ? "text-destructive" : ""}`} onClick={() => handleToggleSold(car)} disabled={isAdminBusy} aria-pressed={car.sold} aria-label={car.sold ? `Marcar ${car.make} ${car.model} como disponível` : `Marcar ${car.make} ${car.model} como vendido`} title={car.sold ? "Marcar como disponível" : "Marcar como vendido"}>
                    <Euro className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => handleEdit(car)} disabled={isAdminBusy} aria-label={`Editar ${car.make} ${car.model}`} title="Editar viatura">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => setDeleteConfirm(car)} disabled={isAdminBusy} aria-label={`Eliminar ${car.make} ${car.model}`} title="Eliminar viatura">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open && !isAdminBusy) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminação</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar {deleteConfirm?.make} {deleteConfirm?.model}? Esta ação não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isAdminBusy}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isAdminBusy}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
