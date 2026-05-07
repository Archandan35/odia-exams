import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.json({
    status: "Gemini OCR API Running",
  });
});

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
Extract MCQ questions from this image.
Return ONLY valid JSON array.
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

    res.json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
