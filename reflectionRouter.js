// 🔗 Spirit Reflection Router
import express from "express";
import { logReflection, getReflections } from "../reflection.js";

const router = express.Router();

// GET /reflections → fetch latest reflections
router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const result = await getReflections(limit, offset);
  res.status(result.success ? 200 : 500).json(result);
});

// POST /reflections → log a new reflection
router.post("/", async (req, res) => {
  const { user, summary, category, sentiment } = req.body;
  const result = await logReflection({ user, summary, category, sentiment });
  res.status(result.success ? 200 : 400).json(result);
});

export default router;
import { logReflection, getReflections } from "../reflection.js";
