import { Express } from "express";
import auth from "../../routes/auth.js";
import cars from "../../routes/cars.js";
import { findAllCars } from "../../models/car.js";

const configure = (app: Express) => {
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api", auth);
  app.use("/api", cars);

  app.get("/api/sitemap.xml", async (_req, res) => {
    const cars = await findAllCars();
    const base = "https://bestcarprice.pt";
    const staticUrls = [
      { loc: "/", priority: "1.0" },
      { loc: "/inventory", priority: "0.9" },
      { loc: "/company", priority: "0.7" },
    ];
    const carUrls = cars.map((c) => ({ loc: `/car/${c.id}`, priority: "0.8" }));
    const urls = [...staticUrls, ...carUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url>\n    <loc>${base}${u.loc}</loc>\n    <priority>${u.priority}</priority>\n  </url>`).join("\n")}\n</urlset>`;
    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  });
};

export default { configure };
