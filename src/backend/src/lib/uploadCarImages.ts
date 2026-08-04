import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import sharp from "sharp";

const UPLOAD_DEADLINE_MS = 120_000;
const CLEANUP_DEADLINE_MS = 10_000;

const IMAGE_WIDTHS = [1920, 240, 800, 1280] as const;

const carImageObjectKeys = (key: string): string[] => {
  if (!key.startsWith("cars/") || !key.endsWith(".webp")) return [key];
  const stem = key.slice(0, -".webp".length);
  return [key, `${stem}-thumb.webp`, `${stem}-card.webp`, `${stem}-gallery.webp`];
};

const cleanupObjectKeys = async (
  keys: readonly string[],
  client: S3Client,
  bucket: string,
  deadlineMs: number
): Promise<void> => {
  if (keys.length === 0) return;

  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve();
    }, deadlineMs);
  });
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < keys.length && !controller.signal.aborted) {
      const key = keys[nextIndex++]!;
      try {
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key }),
          { abortSignal: controller.signal }
        );
      } catch {}
    }
  };

  try {
    await Promise.race([
      Promise.all(Array.from({ length: Math.min(16, keys.length) }, () => worker())),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
};

export const cleanupCarImages = async (
  keys: readonly string[],
  client: S3Client,
  bucket: string,
  deadlineMs = CLEANUP_DEADLINE_MS
): Promise<void> => {
  await cleanupObjectKeys(keys.flatMap(carImageObjectKeys), client, bucket, deadlineMs);
};

export const uploadCarImages = async (
  files: readonly Express.Multer.File[],
  client: S3Client,
  bucket: string,
  options: { uploadDeadlineMs?: number; cleanupDeadlineMs?: number } = {}
): Promise<string[]> => {
  if (files.length === 0) return [];

  const controller = new AbortController();
  const deadline = new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(new Error("Image upload timed out")), { once: true });
  });
  const timer = setTimeout(() => controller.abort(), options.uploadDeadlineMs ?? UPLOAD_DEADLINE_MS);
  const attemptedKeys: string[] = [];
  const imageKeys = new Array<string>(files.length);
  let nextIndex = 0;
  let firstError: unknown;
  let failed = false;

  const worker = async (): Promise<void> => {
    while (nextIndex < files.length && !failed && !controller.signal.aborted) {
      const index = nextIndex++;
      try {
        const key = `cars/${crypto.randomUUID()}.webp`;
        const objects = carImageObjectKeys(key);
        attemptedKeys.push(key);
        const source = sharp(files[index]!.buffer);

        for (let variant = 0; variant < objects.length; variant++) {
          if (failed || controller.signal.aborted) return;
          const buffer = await Promise.race([
            source.clone()
              .resize({ width: IMAGE_WIDTHS[variant]!, withoutEnlargement: true })
              .webp({ quality: 80 })
              .toBuffer(),
            deadline,
          ]);
          if (failed || controller.signal.aborted) return;

          const objectKey = objects[variant]!;
          const send = client.send(
            new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: buffer, ContentType: "image/webp" }),
            { abortSignal: controller.signal }
          );
          void send.then(() => {
            if (controller.signal.aborted) {
              return cleanupObjectKeys([objectKey], client, bucket, options.cleanupDeadlineMs ?? CLEANUP_DEADLINE_MS);
            }
          }).catch(() => {});
          await Promise.race([send, deadline]);
        }
        imageKeys[index] = key;
      } catch (error) {
        if (!failed) {
          firstError = error;
          failed = true;
          controller.abort();
        }
        return;
      }
    }
  };

  try {
    await Promise.all(Array.from({ length: Math.min(2, files.length) }, () => worker()));
  } finally {
    clearTimeout(timer);
  }

  if (failed || controller.signal.aborted) {
    await cleanupCarImages(attemptedKeys, client, bucket, options.cleanupDeadlineMs);
    throw failed ? firstError : new Error("Image upload timed out");
  }

  return imageKeys;
};
