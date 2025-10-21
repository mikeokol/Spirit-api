import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/spirit", async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You are Spirit: a mystical yet human AI that speaks with empathy, curiosity, and calm wisdom. Respond concisely but poetically when appropriate."
          },
          ...messages
        ]
      })
    });
    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content ?? "..." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Spirit connection error." });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("⚡ Spirit API running on port", process.env.PORT || 3000)
);
