import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  })
);

// HEALTH CHECK
app.get("/api", (req, res) => {
  res.json({
    status: "Gemini OCR API Running",
  });
});

// OCR API
app.post("/api/gemini-ocr", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "No image provided",
      });
    }

    const cleanBase64 = image.replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      ""
    );

    const prompt = `
You are an advanced OCR and MCQ extraction AI.

Extract ALL MCQ questions accurately.

Rules:
- Preserve exact wording
- Preserve Odia and English text
- Extract all options correctly
- Do not skip questions
- Return ONLY valid JSON
- No markdown
- No extra explanation

Format:
[
  {
    "question":"",
    "options":["","","",""],
    "correctAnswer":0,
    "difficulty":"easy",
    "language":"english",
    "explanation":""
  }
]
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    let text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed = [];

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = [];
    }

    res.json({
      success: true,
      questions: parsed,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// SERVE REACT BUILD
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
