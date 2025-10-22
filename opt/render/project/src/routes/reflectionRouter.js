// 🌟 Spirit Reflection Router v3.1 — Fully Integrated, Durable, and Modular
// Routes for Spirit's reflection system, optimized for Render + Supabase.
// Includes input validation, error protection, pagination, and clean JSON output.

import express from "express";
import { logReflection, getReflections } from "../reflection.js";

const router = express.Router();

/**
 * ✅ GET /reflections
 * Retrieve recent reflections, supports pagination.
 * Example: /reflections?limit=25&offset=0
 */
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200); // safety cap
    const offset = parseInt(req.query.offset) || 0;

    const result = await getReflections(limit, offset);
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch reflections");
    }

    res.status(200).json({
      success: true,
      count: result.reflections?.length || 0,
      reflections: result.reflections || [],
    });
  } catch (err) {
    console.error("❌ [GET /reflections] Error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
});

/**
 * ✅ POST /reflections
 * Log a new reflection into Supabase.
 * Required: { summary }
 * Optional: { user, category, sentiment }
 */
router.post("/", async (req, res) => {
  try {
    const { user = "anonymous", summary, category = "general", sentiment = 0 } = req.body;

    if (!summary || typeof summary !== "string" || summary.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid 'summary' text.",
      });
    }

    const result = await logReflection({ user, summary, category, sentiment });
    if (!result.success) {
      throw new Error(result.error || "Failed to log reflection");
    }

    res.status(201).json({
      success: true,
      message: "Reflection successfully recorded.",
      reflectionId: result.id,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ [POST /reflections] Error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
});

/**
 * ✅ Fallback Route
 * Ensures API always returns JSON, never HTML 404s.
 */
router.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Reflection route not found.",
    path: req.originalUrl,
  });
});

export default router;
