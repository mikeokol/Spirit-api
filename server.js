// 🌟 Spirit API v3.2 RC — Hardened for beta scale

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { logReflection, getReflections } from "./reflection.js";
import reflectionRouter from "./routes/reflectionRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ----- ENV VALIDATION -----
const requiredEnv = [
  "OPENAI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "DASH_ADMIN_TOKEN",
  "JWT_SECRET"
];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("❌ Missing ENV:", missing.join(", "));
  process.exit(1);
}
const ADMIN_TOKEN = process.env.DASH_ADMIN_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

if (JWT_SECRET.length < 16) {
  console.warn("⚠️ JWT_SECRET is short; consider a longer, random value.");
}

// ----- MIDDLEWARE -----
app.set("trust proxy", 1);

// CORS: keep '*' for beta; switch to allowlist when public
const corsOptions = { origin: "*"}; // e.g., { origin: ["https://yourdomain.com"] }
app.use(cors(corsOptions));

// Body parser with guard
app.use(express.json({ limit: "1mb" }));

// Global rate limit (coarse)
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Endpoint-specific (cost protection)
const spiritLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use("/v1/spirit", spiritLimiter);

// ----- ROOT / HEALTH -----
app.get("/", (req, res) => {
  res.json({
    message: "Spirit API v3.2 RC is alive 🔥",
    status: "online",
    version: "3.2-rc",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", async (req, res) => {
  try {
    const probe = await getReflections(1, 0);
    return res.json({ ok: true, db: !!probe.success, service: "Spirit API v3.2-rc" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ----- ADMIN AUTH -----
const verifyAdmin = (req, res, next) => {
  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// ----- INVITE SYSTEM (in-memory for alpha) -----
// NOTE: For persistence, switch to Supabase table (schema below).
const inviteStore = new Map();

app.post("/v1/invite/create", verifyAdmin, (req, res) => {
  const code = crypto.randomUUID();
  inviteStore.set(code, { used: false, created: new Date().toISOString() });
  res.json({ code });
});

app.post("/v1/invite/verify", (req, res) => {
  const { code } = req.body || {};
  if (!code || !inviteStore.has(code)) {
    return res.status(404).json({ error: "Invalid code" });
  }
  const invite = inviteStore.get(code);
  if (invite.used) return res.status(400).json({ error: "Code already used" });

  invite.used = true;
  const token = jwt.sign({ code, user: `tester-${Date.now()}` }, JWT_SECRET, {
    expiresIn: "30d"
  });
  res.json({ message: "Welcome to Spirit.", token });
});

// ----- SPIRIT CHAT (OpenAI passthrough) -----
app.post("/v1/spirit", async (req, res, next) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing 'messages' array." });
    }
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You are Spirit — a mystical yet grounded AI who speaks with empathy, curiosity, and calm wisdom. Be concise and meaningful."
          },
          ...messages
        ]
      })
    });
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content ?? "Spirit is silent.";
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

// ----- REFLECTION MODE (Direct endpoints) -----
app.post("/v1/reflection/log", async (req, res, next) => {
  try {
    const result = await logReflection(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (err) {
    next(err);
  }
});

app.get("/v1/reflection/all", async (req, res, next) => {
  try {
    const result = await getReflections();
    res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    next(err);
  }
});

// ----- ADMIN VIEW (Protected) -----
app.get("/v1/reflection/admin", verifyAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const result = await getReflections(limit, offset);
    res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    next(err);
  }
});

// ----- ROUTER (Modular /reflections) -----
app.use("/reflections", reflectionRouter);

// ----- 404 -----
app.use((req, res, next) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

// ----- ERROR HANDLER -----
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ----- START -----
app.listen(PORT, () => {
  console.log(`⚡ Spirit API v3.2-rc running on port ${PORT}`);
});
