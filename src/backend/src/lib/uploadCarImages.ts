import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import sharp from "sharp";

const UPLOAD_DEADLINE_MS = 120_000;
const CLEANUP_DEADLINE_MS = 10_000;

export const cleanupCarImages = async (
  keys: readonly string[],
  client: S3Client,
  bucket: string,
  deadlineMs = CLEANUP_DEADLINE_MS
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

  try {
    await Promise.race([
      Promise.all(keys.map(async (key) => {
        try {
          await client.send(
            new DeleteObjectCommand({ Bucket: bucket, Key: key }),
            { abortSignal: controller.signal }
          );
        } catch {}
      })),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
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
        const buffer = await Promise.race([
          sharp(files[index]!.buffer)
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer(),
          deadline,
        ]);
        if (failed || controller.signal.aborted) return;

        const key = `cars/${crypto.randomUUID()}.webp`;
        attemptedKeys.push(key);
        const send = client.send(
          new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: "image/webp" }),
          { abortSignal: controller.signal }
        );
        void send.then(() => {
          if (controller.signal.aborted) {
            return cleanupCarImages([key], client, bucket, options.cleanupDeadlineMs);
          }
        }).catch(() => {});
        await Promise.race([send, deadline]);
        imageKeys[index] = key;
      } catch (error) {
        if (!failed) {
          firstError = error;
          failed = true;
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
