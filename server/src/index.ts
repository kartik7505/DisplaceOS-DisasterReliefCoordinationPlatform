import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import requestsRouter from "./routes/requests";
import inventoryRouter from "./routes/inventory";
import campsRouter from "./routes/camps";
import regionsRouter from "./routes/regions";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV || "development" });
});

app.use("/api/requests", requestsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/camps", campsRouter);
app.use("/api/regions", regionsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`DisplaceOS API server running on http://localhost:${PORT}`);
});

export default app;
