import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  legacyLogin,
  firebaseLogin,
  registerUser,
  AuthError,
} from "../services/authService.js";
import { getAuth, getFirestoreDb } from "../services/firebaseAdmin.js";

const router = Router();

/* ---------------- RATE LIMIT ---------------- */

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip || "unknown",
  message: "Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.ip || "unknown",
  message: "Too many registration attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/* ---------------- ERROR HANDLER ---------------- */

function sendError(res: Response, error: unknown) {
  if (error instanceof AuthError) {
    const statusCode =
      {
        INVALID_INPUT: 400,
        USER_NOT_FOUND: 401,
        ALREADY_MIGRATED: 400,
        INVALID_CREDENTIALS: 401,
        INVALID_TOKEN: 401,
        EMAIL_EXISTS: 409,
        INTERNAL_ERROR: 500,
      }[error.code] || 500;

    return res.status(statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }

  console.error("Unexpected error:", error);
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

/* ---------------- LEGACY LOGIN (WP → FIREBASE) ---------------- */

router.post("/legacy-login", loginLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const result = await legacyLogin(email, password);

    return res.json({
      success: true,
      message: "User authenticated successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

/* ---------------- FIREBASE LOGIN ---------------- */

router.post("/login", loginLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: "ID token required",
      });
    }

    const result = await firebaseLogin(idToken);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

/* ---------------- REGISTER ---------------- */

router.post("/register", registerLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const result = await registerUser(email, password, phone);

    return res.json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

/* ---------------- PROFILE ---------------- */

router.get("/profile", async (req: Request, res: Response): Promise<any> => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
        code: "INVALID_INPUT",
      });
    }

    const auth = getAuth();
    const db = getFirestoreDb();

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    const userQuery = await db
      .collection("users")
      .where("firebaseUid", "==", decodedToken.uid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    const userData = userQuery.docs[0].data();

    const { legacyPasswordHash, password, ...safeUserData } = userData;

    return res.json({
      success: true,
      data: safeUserData,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});

/* ---------------- LOGOUT ---------------- */

router.post("/logout", (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/* ---------------- HEALTH ---------------- */

router.get("/health", (req: Request, res: Response) => {
  return res.json({
    success: true,
    status: "healthy",
  });
});

export default router;