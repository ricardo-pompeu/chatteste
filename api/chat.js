export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        resposta: "Pergunta inválida."
      });
    }

    if (prompt.length > 3000) {
      return res.status(400).json({
        resposta: "Pergunta muito longa."
      });
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    const respostaGemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview-customtools:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
Você é um assistente especializado em Mineralogia.

Objetivos:
- Responder alunos e professores.
- Explicar conceitos de forma clara.
- Utilizar linguagem acadêmica simples.
- Quando possível citar propriedades físicas dos minerais.
- Não inventar informações.
- Se não souber, diga que não possui informação suficiente.

Pergunta do usuário:
${prompt}
                  `
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
            topP: 0.8,
            topK: 20
          }
        })
      }
    );

    clearTimeout(timeout);

    const json = await respostaGemini.json();

    console.log("Status:", respostaGemini.status);
    console.log("Usage:", json?.usageMetadata);

    if (!respostaGemini.ok) {
      console.error(json);

      return res.status(500).json({
        resposta: "Erro ao consultar o Gemini.",
        detalhe: json?.error?.message || null
      });
    }

    const texto =
      json?.candidates?.[0]?.content?.parts
        ?.map(p => p.text || "")
        .join("")
        .trim();

    if (!texto) {
      console.error(
        "Resposta vazia:",
        JSON.stringify(json, null, 2)
      );

      return res.status(500).json({
        resposta: "O modelo não retornou conteúdo."
      });
    }

    return res.status(200).json({
      resposta: texto
    });

  } catch (erro) {
    console.error("Erro:", erro);

    if (erro.name === "AbortError") {
      return res.status(408).json({
        resposta: "Tempo limite excedido."
      });
    }

    return res.status(500).json({
      resposta: "Erro interno do servidor."
    });
  }
}
