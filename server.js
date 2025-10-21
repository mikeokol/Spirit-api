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
app.use(express.json());

// ---------- ROUTES ----------

// ✅ Health check & browser route
app.get("/", (req, res) => {
  res.json({
    message: "Spirit API is alive 🔥",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// 💬 AI interaction route
app.post("/api/spirit", async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array." });
    }

    // Send request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You are Spirit — a mystical yet grounded AI who speaks with empathy, curiosity, and calm wisdom. You respond clearly, concisely, and poetically when it fits.",
          },
          ...messages,
        ],
      }),
    });

    const data = await response.json();

    // Check for valid response
    const reply = data?.choices?.[0]?.message?.content ?? "…Spirit is silent right now.";
    res.json({ reply });
  } catch (err) {
    console.error("❌ Spirit connection error:", err);
    res.status(500).json({ error: "Spirit connection error." });
  }
});

// ---------- START SERVER ----------

app.listen(PORT, () => {
  console.log(`⚡ Spirit API running on port ${PORT}`);
});
