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

// Health check — visit /api/health to verify API key is set
app.get("/api/health", (req, res) => {
  const keySet = !!process.env.ANTHROPIC_API_KEY;
  const keyPreview = keySet
    ? process.env.ANTHROPIC_API_KEY.slice(0, 16) + "..."
    : "NOT SET";
  res.json({ status: "ok", apiKeySet: keySet, keyPreview });
});

// Proxy route — keeps API key server-side only
app.post("/api/chat", async (req, res) => {
  const { messages, system } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set");
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in environment variables." });
  }

  console.log("/api/chat called with", messages?.length, "messages");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", response.status, JSON.stringify(data));
      return res.status(response.status).json({
        error: data.error?.message || "Anthropic API error",
        type: data.error?.type || "unknown",
        status: response.status,
      });
    }

    const reply = data.content?.[0]?.text || "No response from model.";
    console.log("Reply OK, length:", reply.length);
    res.json({ reply });

  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: err.message || "Server error. Please try again." });
  }
});

// Fallback — serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log("SentiTeach server running on port", PORT);
  console.log("API Key set:", !!process.env.ANTHROPIC_API_KEY);
});
