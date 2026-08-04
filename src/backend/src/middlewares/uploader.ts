import { Request } from "express";
import multer, { FileFilterCallback } from "multer";

const storage = multer.memoryStorage();

const filter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.split("/")[0] === "image") {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const uploader = multer({
  storage,
  fileFilter: filter,
  limits: {
    files: 50,
    fileSize: 1000 * 1000 * 10,
    parts: 100,
  },
});

export default uploader;
