import { Express } from "express";
import auth from "../../routes/auth.js";
import cars from "../../routes/cars.js";

const configure = (app: Express) => {
  app.use("/api", auth);
  app.use("/api", cars);
};

export default { configure };
