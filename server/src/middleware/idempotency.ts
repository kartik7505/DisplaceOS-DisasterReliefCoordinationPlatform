import { Response, NextFunction } from "express";
import crypto from "crypto";
import dbStore from "../db/store";
import { AuthRequest } from "./auth";

export function idempotency(req: AuthRequest, res: Response, next: NextFunction) {
  const key = req.headers["idempotency-key"] as string | undefined;
  if (!key) {
    return next();
  }

  const action = `${req.method} ${req.baseUrl || ""}${req.path}`;
  const bodyString = JSON.stringify(req.body || {});
  const requestBodyHash = crypto.createHash("sha256").update(bodyString).digest("hex");

  const existing = dbStore.getIdempotencyRecord(key);
  if (existing) {
    if (existing.action === action && existing.requestBodyHash === requestBodyHash) {
      res.setHeader("Idempotent-Replay", "true");
      return res.status(existing.statusCode).json(existing.responseBody);
    } else {
      return res.status(409).json({
        error: "Idempotency key conflict: This key was already used with different request parameters.",
        code: "IDEMPOTENCY_CONFLICT",
      });
    }
  }

  // Intercept response to store on successful completion
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      dbStore.saveIdempotencyRecord({
        key,
        action,
        requestBodyHash,
        statusCode: res.statusCode,
        responseBody: body,
        createdAt: new Date().toISOString(),
      });
    }
    return originalJson(body);
  };

  next();
}
