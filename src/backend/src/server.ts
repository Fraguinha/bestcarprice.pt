import express from "express";
import authentication from "./lib/setup/authentication.js";
import compression from "./lib/setup/compression.js";
import cors from "./lib/setup/cors.js";
import database from "./lib/setup/database.js";
import parser from "./lib/setup/parser.js";
import routes from "./lib/setup/routes.js";

const PORT = Number(process.env.PORT) || 8080;
const SECRET = process.env.SECRET ?? "secret";
const DATABASE = process.env.DATABASE || "postgresql://localhost:5432/bestcarprice";

const app = express();

async function startServer() {
  await database.connect(DATABASE);

  cors.configure(app);

  parser.configure(app);

  compression.configure(app);

  authentication.configure(app, SECRET, DATABASE);

  routes.configure(app);

  app.listen(PORT, () => console.log(`Started listening on port ${PORT}`));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
