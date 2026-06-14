import { Router, Request, Response } from "express";
import { getFirestoreDb } from "../services/firebaseAdmin.js";

const router = Router();

// Simple middleware — checks x-admin-password header against env var
function requireAdminPassword(req: Request, res: Response, next: Function) {
  const provided = req.headers["x-admin-password"] as string | undefined;
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || provided !== expected) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }
  next();
}

// PUT /api/admin/products/:id/grind-options
// Body: { grindOptions: string[] }
router.put("/products/:id/grind-options", requireAdminPassword, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { grindOptions } = req.body;

  if (!id) {
    res.status(400).json({ success: false, error: "Product ID required" });
    return;
  }

  if (!Array.isArray(grindOptions)) {
    res.status(400).json({ success: false, error: "grindOptions must be an array" });
    return;
  }

  try {
    const db = getFirestoreDb();
    await db.collection("products").doc(id).update({ grindOptions });
    res.json({ success: true, id, grindOptions });
  } catch (err: any) {
    console.error(`❌ [admin] grind update failed for ${id}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
