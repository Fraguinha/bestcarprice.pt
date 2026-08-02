import cors from "cors";
import { Express } from "express";

const configure = (app: Express) => {
  app.use(
    cors({
      origin: process.env.NODE_ENV === "production"
        ? "https://stand.fraguinha.com"
        : "http://backend:8080",
      credentials: true,
    })
  );
};

export default { configure };
