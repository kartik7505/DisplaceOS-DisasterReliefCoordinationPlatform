import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthPayload, UserRole } from "../types";

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

const VALID_ROLES: UserRole[] = ["admin", "regional_coordinator", "camp_manager", "volunteer"];

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === "production";
  const authHeader = req.headers.authorization;
  const devUserId = req.headers["x-user-id"] as string | undefined;
  const devUserRole = req.headers["x-user-role"] as UserRole | undefined;
  const devUserRegion = req.headers["x-user-region"] as string | undefined;
  const devUserCamp = req.headers["x-user-camp"] as string | undefined;

  // STRICT PRODUCTION SECURITY RULE:
  // Development headers MUST NOT authenticate users or override identity in production.
  if (isProduction) {
    if (devUserId || devUserRole) {
      // Reject attempt to forge or use dev headers in production mode
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Production requires verified Supabase authentication. Development headers are rejected.",
          code: "PRODUCTION_AUTH_REQUIRED",
        });
      }
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or invalid authorization token",
        code: "UNAUTHORIZED",
      });
    }

    const token = authHeader.slice(7);
    try {
      const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ error: "Server authentication misconfigured", code: "CONFIG_ERROR" });
      }
      const decoded = jwt.verify(token, jwtSecret) as any;
      // Derive identity STRICTLY from token payload, ignoring any client-sent headers
      req.user = {
        userId: decoded.sub || decoded.userId || decoded.id,
        role: (decoded.role || decoded.user_role || "volunteer") as UserRole,
        email: decoded.email || "user@displaceos.org",
        region_id: decoded.region_id,
        camp_id: decoded.camp_id,
      };
      return next();
    } catch {
      return res.status(401).json({
        error: "Invalid or expired authorization token",
        code: "INVALID_TOKEN",
      });
    }
  }

  // DEVELOPMENT / TEST MODE:
  // 1. Check Bearer token first if present
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || "dev-secret-key-123456";
      const decoded = jwt.verify(token, jwtSecret) as any;
      req.user = {
        userId: decoded.sub || decoded.userId || decoded.id,
        role: (decoded.role || decoded.user_role || "volunteer") as UserRole,
        email: decoded.email || "user@displaceos.org",
        region_id: decoded.region_id,
        camp_id: decoded.camp_id,
      };
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token", code: "INVALID_TOKEN" });
    }
  }

  // 2. Allow simulated dev headers in non-production environments
  if (devUserId && devUserRole) {
    if (!VALID_ROLES.includes(devUserRole)) {
      return res.status(400).json({
        error: `Invalid user role '${devUserRole}'. Allowed: ${VALID_ROLES.join(", ")}`,
        code: "INVALID_ROLE",
      });
    }

    req.user = {
      userId: devUserId,
      role: devUserRole,
      email: `${devUserRole}@displaceos.local`,
      region_id: devUserRegion,
      camp_id: devUserCamp,
    };
    return next();
  }

  return res.status(401).json({
    error: "Authentication required. Provide Bearer token or development headers (in dev mode).",
    code: "UNAUTHORIZED",
  });
};

export const requireRole = (...allowedRoles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' lacks required permission for this resource.`,
        code: "FORBIDDEN",
      });
    }
    next();
  };

export const requireCampAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
  if (req.user.role === "admin" || req.user.role === "regional_coordinator") {
    return next();
  }
  const requestedCamp = req.body?.camp_id || req.params?.camp_id || req.params?.id;
  if (req.user.role === "camp_manager" && req.user.camp_id && requestedCamp && req.user.camp_id !== requestedCamp) {
    return res.status(403).json({
      error: "Camp managers are restricted to actions within their assigned camp",
      code: "CAMP_SCOPE_VIOLATION",
    });
  }
  next();
};
