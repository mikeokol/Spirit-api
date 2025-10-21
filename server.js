// ----------------------------
// 🌟 Spirit API — server.js
// ----------------------------

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

// ---------- ROUTES ----------

// Health check & browser-friendly root
app.get("/", (req, res) => {
  res.json({
    message: "Spirit API is alive 🔥",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// Chat endpoint
app.post("/api/spirit", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
    }

    const { messages, temperature } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'messages' array." });
    }

    const payload = {
      model: "gpt-4o-mini",
      temperature:
        typeof temperature === "number" && temperature >= 0 && temperature <= 2
          ? temperature
          : 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are Spirit — a mystical yet grounded AI who speaks with empathy, curiosity, and calm wisdom. Respond clearly and concisely; be poetic only when it adds meaning.",
        },
        ...messages,
      ],
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Handle non-2xx responses from OpenAI
    if (!r.ok) {
      let errDetail = "";
      try {
        const errJson = await r.json();
        errDetail = errJson?.error?.message || JSON.stringify(errJson);
      } catch {
        errDetail = await r.text();
      }
      return res
        .status(r.status)
        .json({ error: `OpenAI error (${r.status}): ${errDetail}` });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res
        .status(502)
        .json({ error: "Empty reply from model.", raw: data });
    }

    res.json({ reply });
  } catch (err) {
    console.error("❌ Spirit server error:", err);
    res.status(500).json({ error: "Spirit connection error." });
  }
});

// 404 guard (optional)
app.use((req, res) => res.status(404).json({ error: "Not found." }));

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`⚡ Spirit API running on port ${PORT}`);
});
