// 🌟 Spirit API v3 — Scalable, Secure, Modular

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { logReflection, getReflections } from "./reflection.js"; // ✅ moved to top

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_TOKEN = process.env.DASH_ADMIN_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "spirit_jwt_secret";

app.use(cors({ origin: "*" }));
app.use(express.json());

// ---------- RATE LIMITING ----------
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
});
app.use(limiter);

// ---------- ROOT ROUTE ----------
app.get("/", (req, res) => {
  res.json({
    message: "Spirit API v3 is alive 🔥",
    status: "online",
    version: "3.0",
    timestamp: new Date().toISOString(),
  });
});

// ---------- AUTH MIDDLEWARE ----------
const verifyAdmin = (req, res, next) => {
  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_TOKEN)
    return res.status(403).json({ error: "Forbidden" });
  next();
};

// ---------- INVITE SYSTEM ----------
const inviteStore = new Map(); // Replace with Supabase later

app.post("/v1/invite/create", verifyAdmin, async (req, res) => {
  const code = crypto.randomUUID();
  inviteStore.set(code, { used: false, created: new Date().toISOString() });
  res.json({ code });
});

app.post("/v1/invite/verify", (req, res) => {
  const { code } = req.body;
  if (!inviteStore.has(code)) return res.status(404).json({ error: "Invalid code" });
  const invite = inviteStore.get(code);
  if (invite.used) return res.status(400).json({ error: "Code already used" });

  invite.used = true;
  const token = jwt.sign({ code, user: `tester-${Date.now()}` }, JWT_SECRET, {
    expiresIn: "30d",
  });

  res.json({ message: "Welcome to Spirit.", token });
});

// ---------- SPIRIT ENDPOINT ----------
app.post("/v1/spirit", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ error: "Missing 'messages' array." });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You are Spirit — a mystical yet grounded AI who speaks with empathy, curiosity, and calm wisdom. Respond concisely and meaningfully.",
          },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ?? "Spirit is silent right now.";
    res.json({ reply });
  } catch (err) {
    console.error("Spirit error:", err);
    res.status(500).json({ error: "Spirit connection error." });
  }
});

// ---------- REFLECTION MODE ROUTES ----------
app.post("/v1/reflection/log", async (req, res) => {
  const result = await logReflection(req.body);
  res.json(result);
});

app.get("/v1/reflection/all", async (req, res) => {
  const result = await getReflections();
  res.json(result);
});

// ---------- START SERVER ----------
app.listen(PORT, () => console.log(`⚡ Spirit API v3 running on port ${PORT}`));
