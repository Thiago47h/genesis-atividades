export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const { prompt, estilo } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt não enviado." });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return res.status(500).json({ error: "GEMINI_API_KEY não configurada." });

  const estiloTexto = {
    "didatica": "Educational illustration, clean lines, white background, no text in image",
    "infantil": "Colorful children cartoon illustration, cheerful, white background",
    "realista": "Realistic educational photo, high quality, clean background",
    "colorir": "Black line drawing for coloring, no fill, simple lines, white background",
    "esquema": "Educational diagram, arrows, labels, white background",
    "automatico": "Clear educational illustration, white background",
  };

  const promptFinal = `${estiloTexto[estilo] || estiloTexto["automatico"]}. ${prompt}. Suitable for elementary school activities.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: promptFinal }],
          parameters: { sampleCount: 1, aspectRatio: "1:1" },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Imagen: " + (data?.error?.message || JSON.stringify(data).substring(0, 300)),
      });
    }

    const img = data?.predictions?.[0];
    if (img?.bytesBase64Encoded) {
      return res.status(200).json({
        image: img.bytesBase64Encoded,
        mimeType: img.mimeType || "image/png",
      });
    }

    return res.status(500).json({ error: "Imagen respondeu sem imagem." });
  } catch (error) {
    return res.status(500).json({ error: "Erro: " + error.message });
  }
}
