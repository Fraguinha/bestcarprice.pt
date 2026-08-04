import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import express, { Request, Response } from "express";
import s3Config from "../lib/setup/s3.js";
import { cleanupCarImages, uploadCarImages } from "../lib/uploadCarImages.js";
import authenticator from "../middlewares/authentication.js";
import uploader from "../middlewares/uploader.js";
import {
  CarFilters,
  createCar,
  deleteCar,
  findAllCars,
  findCarById,
  findFeaturedCars,
  updateCar,
} from "../models/car.js";
import { User } from "../models/user.js";

const router = express.Router();

const isValidDisplacement = (value: unknown): boolean =>
  (typeof value === "string" || typeof value === "number") &&
  String(value).trim() !== "" &&
  Number.isInteger(Number(value)) &&
  Number(value) >= 0;

const isValidOrigin = (value: unknown): boolean =>
  value === undefined || value === null || value === "" ||
  value === "Nacional" || value === "Importado";

const isValidRegistrationDate = (value: unknown): value is string =>
  typeof value === "string" && /^(0[1-9]|1[0-2])\/(?!0000)[0-9]{4}$/.test(value);

const isValidRegistrationYear = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9]{1,4}$/.test(value) && Number(value) >= 1;

const deleteImageFromS3 = async (key: string): Promise<void> => {
  await s3Config.s3.send(
    new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    })
  );
};

router.get("/cars/featured", async (_req, res) => {
  const cars = await findFeaturedCars();
  res.json(cars);
});

router.get("/cars", async (req, res) => {
  const minRegistrationYear = req.query.min_registration_year;
  const maxRegistrationYear = req.query.max_registration_year;
  if (minRegistrationYear !== undefined && !isValidRegistrationYear(minRegistrationYear)) {
    res.status(400).json({ error: "Invalid min_registration_year (1-9999)" });
    return;
  }
  if (maxRegistrationYear !== undefined && !isValidRegistrationYear(maxRegistrationYear)) {
    res.status(400).json({ error: "Invalid max_registration_year (1-9999)" });
    return;
  }

  const filters: CarFilters = {
    make: req.query.make as string | undefined,
    fuel: req.query.fuel as string | undefined,
    transmission: req.query.transmission as string | undefined,
    body_type: req.query.body_type as string | undefined,
    min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
    max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
    min_registration_year: minRegistrationYear === undefined ? undefined : Number(minRegistrationYear),
    max_registration_year: maxRegistrationYear === undefined ? undefined : Number(maxRegistrationYear),
  };
  const cars = await findAllCars(filters);
  res.json(cars);
});

router.get("/cars/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid car id" });
    return;
  }
  const car = await findCarById(id);
  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  res.json(car);
});

router.post("/cars", authenticator, uploader.array("images", 50), async (req, res) => {
  const user = req.user as User;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const requiredStrings = ['make', 'model', 'fuel', 'transmission', 'body_type', 'color'] as const;
  for (const field of requiredStrings) {
    if (!req.body[field] || typeof req.body[field] !== 'string' || !req.body[field].trim()) {
      res.status(400).json({ error: `Missing required field: ${field}` });
      return;
    }
  }

  const requiredNumbers = ['mileage', 'power', 'seats', 'price'] as const;
  for (const field of requiredNumbers) {
    if (req.body[field] === undefined || req.body[field] === '' || isNaN(Number(req.body[field]))) {
      res.status(400).json({ error: `Invalid or missing numeric field: ${field}` });
      return;
    }
  }
  if (!isValidRegistrationDate(req.body.registration_date)) {
    res.status(400).json({ error: "Invalid or missing registration_date (MM/AAAA)" });
    return;
  }

  if (!isValidDisplacement(req.body.displacement)) {
    res.status(400).json({ error: "Invalid or missing numeric field: displacement" });
    return;
  }

  if (!isValidOrigin(req.body.origin)) {
    res.status(400).json({ error: "Invalid origin" });
    return;
  }

  const files = (req.files as Express.Multer.File[]) || [];
  let imageKeys: string[];
  try {
    imageKeys = await uploadCarImages(files, s3Config.s3, s3Config.bucket);
  } catch {
    res.status(500).json({ error: "Failed to upload images" });
    return;
  }
  const features = req.body.features
    ? Array.isArray(req.body.features)
      ? req.body.features
      : [req.body.features]
    : [];

  try {
    const car = await createCar({
      make: req.body.make,
      model: req.body.model,
      version: req.body.version,
      mileage: Number(req.body.mileage),
      fuel: req.body.fuel,
      transmission: req.body.transmission,
      power: Number(req.body.power),
      displacement: Number(req.body.displacement),
      color: req.body.color,
      seats: Number(req.body.seats),
      body_type: req.body.body_type,
      price: Number(req.body.price),
      description: req.body.description,
      features,
      images: imageKeys,
      featured: req.body.featured === "true" || req.body.featured === true,
      registration_date: req.body.registration_date,
      origin: req.body.origin || null,
    });
    res.status(201).json(car);
  } catch (error) {
    await cleanupCarImages(imageKeys, s3Config.s3, s3Config.bucket);
    throw error;
  }
});

router.put("/cars/:id", authenticator, uploader.array("images", 50), async (req, res) => {
  const user = req.user as User;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid car id" });
    return;
  }

  const existing = await findCarById(id);
  if (!existing) {
    res.status(404).json({ error: "Car not found" });
    return;
  }

  if (req.body.displacement !== undefined && !isValidDisplacement(req.body.displacement)) {
    res.status(400).json({ error: "Invalid numeric field: displacement" });
    return;
  }

  if (!isValidOrigin(req.body.origin)) {
    res.status(400).json({ error: "Invalid origin" });
    return;
  }
  if (req.body.sold !== undefined && req.body.sold !== "true" && req.body.sold !== "false") {
    res.status(400).json({ error: "Invalid sold value" });
    return;
  }

  if (req.body.registration_date !== undefined && !isValidRegistrationDate(req.body.registration_date)) {
    res.status(400).json({ error: "Invalid registration_date (MM/AAAA)" });
    return;
  }

  const files = (req.files as Express.Multer.File[]) || [];
  let imageKeys: string[] | undefined;
  let removedKeys: string[] = [];

  if (files.length > 0) {
    try {
      imageKeys = await uploadCarImages(files, s3Config.s3, s3Config.bucket);
    } catch {
      res.status(500).json({ error: "Failed to upload images" });
      return;
    }
    removedKeys = existing.images;
  } else if (req.body.existingImages) {
    let parsed: string[];
    try {
      parsed = JSON.parse(req.body.existingImages);
    } catch {
      res.status(400).json({ error: "Invalid existingImages format" });
      return;
    }
    imageKeys = parsed.filter((k: string) => existing.images.includes(k));
    removedKeys = existing.images.filter((k) => !imageKeys!.includes(k));
  }

  const updateData: any = {};
  if (req.body.make !== undefined) updateData.make = req.body.make;
  if (req.body.model !== undefined) updateData.model = req.body.model;
  if (req.body.version !== undefined) updateData.version = req.body.version;
  if (req.body.mileage !== undefined) updateData.mileage = Number(req.body.mileage);
  if (req.body.fuel !== undefined) updateData.fuel = req.body.fuel;
  if (req.body.transmission !== undefined) updateData.transmission = req.body.transmission;
  if (req.body.power !== undefined) updateData.power = Number(req.body.power);
  if (req.body.displacement !== undefined) updateData.displacement = Number(req.body.displacement);
  if (req.body.color !== undefined) updateData.color = req.body.color;
  if (req.body.seats !== undefined) updateData.seats = Number(req.body.seats);
  if (req.body.body_type !== undefined) updateData.body_type = req.body.body_type;
  if (req.body.price !== undefined) updateData.price = Number(req.body.price);
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.featured !== undefined) updateData.featured = req.body.featured === "true" || req.body.featured === true;
  if (req.body.sold !== undefined) updateData.sold = req.body.sold === "true";
  if (req.body.registration_date !== undefined) updateData.registration_date = req.body.registration_date;
  if (req.body.origin !== undefined) updateData.origin = req.body.origin || null;
  if (req.body.features !== undefined) {
    updateData.features = Array.isArray(req.body.features)
      ? req.body.features
      : [req.body.features];
  }
  if (imageKeys !== undefined) updateData.images = imageKeys;

  let car;
  try {
    car = await updateCar(id, updateData);
  } catch (error) {
    if (files.length > 0 && imageKeys) {
      await cleanupCarImages(imageKeys, s3Config.s3, s3Config.bucket);
    }
    throw error;
  }
  if (!car && files.length > 0 && imageKeys) {
    await cleanupCarImages(imageKeys, s3Config.s3, s3Config.bucket);
  }
  if (car && removedKeys.length > 0) {
    await cleanupCarImages(removedKeys, s3Config.s3, s3Config.bucket);
  }
  res.json(car);
});

router.delete("/cars/:id", authenticator, async (req, res) => {
  const user = req.user as User;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid car id" });
    return;
  }

  const existing = await findCarById(id);
  if (!existing) {
    res.status(404).json({ error: "Car not found" });
    return;
  }

  for (const key of existing.images) {
    await deleteImageFromS3(key);
  }

  await deleteCar(id);
  res.json({ success: true });
});

const serveS3Object = async (key: string, req: Request, res: Response): Promise<void> => {
  try {
    const headCommand = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });
    const headResponse = await s3Config.s3.send(headCommand);
    if (!headResponse.Body) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const contentType = headResponse.ContentType || "application/octet-stream";
    const contentLength = headResponse.ContentLength || 0;
    const rangeHeader = req.headers.range;

    if (rangeHeader && contentLength) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1]!, 10);
        const end = match[2] ? parseInt(match[2], 10) : contentLength - 1;
        const rangeCommand = new GetObjectCommand({
          Bucket: s3Config.bucket,
          Key: key,
          Range: `bytes=${start}-${end}`,
        });
        const rangeResponse = await s3Config.s3.send(rangeCommand);
        const bytes = await rangeResponse.Body!.transformToByteArray();
        res.status(206);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Length", bytes.length);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${contentLength}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.end(Buffer.from(bytes));
        return;
      }
    }

    const bytes = await headResponse.Body!.transformToByteArray();
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", bytes.length);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(Buffer.from(bytes));
  } catch {
    res.status(404).json({ error: "Not found" });
  }
};

router.get("/images/cars/:filename", async (req, res) => {
  const key = `cars/${req.params.filename}`;
  await serveS3Object(key, req, res);
});

router.get("/images/assets/:filename", async (req, res) => {
  const key = `assets/${req.params.filename}`;
  await serveS3Object(key, req, res);
});

export default router;
