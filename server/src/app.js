import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");

const app = express();

if (process.env.SESSION_COOKIE_SECURE === "true") app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.vary("Origin");
  if (req.get("origin") && req.get("origin") === process.env.CLIENT_ORIGIN) {
    res.set("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET, HEAD, POST, PATCH, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

const secret = process.env.SESSION_SECRET;
if (!secret) {
  console.error("Thiếu SESSION_SECRET");
  app.use((req, res) => {
    res.status(500).json({ error: "Thiếu SESSION_SECRET" });
  });
} else {
  app.use(
    session({
      name: "sid",
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: process.env.SESSION_COOKIE_SAME_SITE || "lax",
        secure: process.env.SESSION_COOKIE_SECURE === "true",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );
}
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/dashboard", dashboardRoutes);

// shortcut: chỉ khi đã có client/dist (image). Dev vẫn mở Vite ở cổng 5173.
if (fs.existsSync(path.join(clientDist, "index.html"))) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use("/api", (req, res) => res.status(404).json({ error: "Không tìm thấy API" }));
app.use(errorHandler);

export default app;
