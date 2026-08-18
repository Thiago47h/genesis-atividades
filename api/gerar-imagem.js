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
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify({
          model: "gemini-3.1-flash-image",
          input: [
            { type: "text", text: promptFinal }
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Gemini:", JSON.stringify(data));
      return res.status(response.status).json({
        error: data?.error?.message || "Erro na API do Gemini.",
      });
    }

    let imageData = null;
    let mimeType = "image/png";

    if (data.output_image) {
      imageData = data.output_image.data;
      mimeType = data.output_image.mime_type || "image/png";
    }

    if (!imageData && data.steps) {
      for (const step of data.steps) {
        if (step.type === "model_output" && step.content) {
          for (const block of step.content) {
            if (block.type === "image" && block.data) {
              imageData = block.data;
              mimeType = block.mime_type || "image/png";
              break;
            }
          }
        }
        if (imageData) break;
      }
    }

    if (!imageData) {
      return res.status(500).json({ error: "O Gemini não retornou imagem." });
    }

    return res.status(200).json({
      image: imageData,
      mimeType: mimeType,
    });
  } catch (error) {
    console.error("Erro interno gerar-imagem:", error);
    return res.status(500).json({
      error: error?.message || "Erro interno ao gerar imagem.",
    });
  }
}
