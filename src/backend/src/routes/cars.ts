import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import express from "express";
import { Readable } from "stream";
import s3Config from "../lib/setup/s3.js";
import authenticator from "../middlewares/authentication.js";
import uploader from "../middlewares/uploader.js";
import sharp from "sharp";
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

const uploadImageToS3 = async (file: Express.Multer.File): Promise<string> => {
  const key = `cars/${crypto.randomUUID()}.webp`;
  const buffer = await sharp(file.buffer)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  await s3Config.s3.send(
    new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
    })
  );

  return key;
};

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
  const filters: CarFilters = {
    make: req.query.make as string | undefined,
    fuel: req.query.fuel as string | undefined,
    transmission: req.query.transmission as string | undefined,
    body_type: req.query.body_type as string | undefined,
    min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
    max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
    min_year: req.query.min_year ? Number(req.query.min_year) : undefined,
    max_year: req.query.max_year ? Number(req.query.max_year) : undefined,
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

  const files = (req.files as Express.Multer.File[]) || [];
  const imageKeys: string[] = [];

  for (const file of files) {
    const key = await uploadImageToS3(file);
    imageKeys.push(key);
  }

  const features = req.body.features
    ? Array.isArray(req.body.features)
      ? req.body.features
      : [req.body.features]
    : [];

  const car = await createCar({
    make: req.body.make,
    model: req.body.model,
    version: req.body.version,
    year: Number(req.body.year),
    mileage: Number(req.body.mileage),
    fuel: req.body.fuel,
    transmission: req.body.transmission,
    power: Number(req.body.power),
    displacement: req.body.displacement ? Number(req.body.displacement) : undefined,
    color: req.body.color,
    doors: Number(req.body.doors),
    seats: Number(req.body.seats),
    body_type: req.body.body_type,
    price: Number(req.body.price),
    description: req.body.description,
    features,
    images: imageKeys,
    sold: req.body.sold === "true" || req.body.sold === true,
    featured: req.body.featured === "true" || req.body.featured === true,
  });

  res.status(201).json(car);
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

  const files = (req.files as Express.Multer.File[]) || [];
  let imageKeys: string[] | undefined;

  if (files.length > 0) {
    imageKeys = [];
    for (const file of files) {
      const key = await uploadImageToS3(file);
      imageKeys.push(key);
    }
    for (const oldKey of existing.images) {
      await deleteImageFromS3(oldKey);
    }
  }

  const updateData: any = {};
  if (req.body.make !== undefined) updateData.make = req.body.make;
  if (req.body.model !== undefined) updateData.model = req.body.model;
  if (req.body.version !== undefined) updateData.version = req.body.version;
  if (req.body.year !== undefined) updateData.year = Number(req.body.year);
  if (req.body.mileage !== undefined) updateData.mileage = Number(req.body.mileage);
  if (req.body.fuel !== undefined) updateData.fuel = req.body.fuel;
  if (req.body.transmission !== undefined) updateData.transmission = req.body.transmission;
  if (req.body.power !== undefined) updateData.power = Number(req.body.power);
  if (req.body.displacement !== undefined) updateData.displacement = req.body.displacement ? Number(req.body.displacement) : undefined;
  if (req.body.color !== undefined) updateData.color = req.body.color;
  if (req.body.doors !== undefined) updateData.doors = Number(req.body.doors);
  if (req.body.seats !== undefined) updateData.seats = Number(req.body.seats);
  if (req.body.body_type !== undefined) updateData.body_type = req.body.body_type;
  if (req.body.price !== undefined) updateData.price = Number(req.body.price);
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.sold !== undefined) updateData.sold = req.body.sold === "true" || req.body.sold === true;
  if (req.body.featured !== undefined) updateData.featured = req.body.featured === "true" || req.body.featured === true;
  if (req.body.features !== undefined) {
    updateData.features = Array.isArray(req.body.features)
      ? req.body.features
      : [req.body.features];
  }
  if (imageKeys !== undefined) updateData.images = imageKeys;

  const car = await updateCar(id, updateData);
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

router.get("/images/:key(*)", async (req, res) => {
  const key = (req.params as any)["key(*)"];
  const command = new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  const response = await s3Config.s3.send(command);
  if (!response.Body) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  res.setHeader("Content-Type", response.ContentType || "image/webp");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  const stream = response.Body as Readable;
  stream.pipe(res);
});

export default router;
