export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { prompt, estilo } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: "O prompt da imagem não foi enviado." });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(500).json({ error: "Chave da API do Gemini não configurada." });
  }

  // Adicionar estilo ao prompt
  const estiloTexto = {
    "didatica": "Ilustração didática educacional, traços limpos, fundo branco, sem texto na imagem",
    "infantil": "Ilustração infantil colorida, estilo cartoon educacional, alegre, fundo branco",
    "realista": "Imagem realista fotográfica educacional, alta qualidade, fundo limpo",
    "colorir": "Desenho em linhas pretas para colorir, sem preenchimento, traços simples, fundo branco",
    "esquema": "Esquema educacional técnico, diagrama didático, setas, labels, fundo branco",
    "automatico": "Ilustração educacional clara e didática, fundo branco",
  };

  const promptFinal = `${estiloTexto[estilo] || estiloTexto["automatico"]}. ${prompt}. A imagem deve ser adequada para atividades escolares de ensino fundamental.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptFinal }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Gemini:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "Erro na API do Gemini.",
      });
    }

    // Extrair imagem da resposta
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      return res.status(500).json({ error: "O Gemini não retornou imagem." });
    }

    return res.status(200).json({
      image: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    });
  } catch (error) {
    console.error("Erro interno gerar-imagem:", error);
    return res.status(500).json({
      error: error?.message || "Erro interno ao gerar imagem.",
    });
  }
}
