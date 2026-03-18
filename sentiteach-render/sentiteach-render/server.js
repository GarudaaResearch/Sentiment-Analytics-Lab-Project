import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve built frontend
app.use(express.static(path.join(__dirname, "dist")));

// Health check
app.get("/api/health", (req, res) => {
  const keySet = !!process.env.GEMINI_API_KEY;
  const keyPreview = keySet
    ? process.env.GEMINI_API_KEY.slice(0, 10) + "..."
    : "NOT SET";
  res.json({ status: "ok", apiKeySet: keySet, keyPreview });
});

// Chat route using Google Gemini
app.post("/api/chat", async (req, res) => {
  const { messages, system } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    return res.status(500).json({ error: "GEMINI_API_KEY not set in environment variables." });
  }

  console.log("/api/chat called with", messages?.length, "messages");

  try {
    // Convert messages to Gemini format
    const geminiContents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = {
      system_instruction: {
        parts: [{ text: system }],
      },
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", response.status, JSON.stringify(data));
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API error",
        status: response.status,
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from model.";

    console.log("Reply OK, length:", reply.length);
    res.json({ reply });

  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: err.message || "Server error." });
  }
});

// Fallback — serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log("SentiTeach server running on port", PORT);
  console.log("Gemini API Key set:", !!process.env.GEMINI_API_KEY);
});
