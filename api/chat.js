export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                resposta: "Prompt vazio."
            });
        }

        const respostaGemini = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 2048,
                        temperature: 0.4
                    }
                })
            }
        );

        const json = await respostaGemini.json();

        console.log(
            "Finish Reason:",
            json?.candidates?.[0]?.finishReason
        );

        console.log(
            "Usage:",
            json?.usageMetadata
        );

        if (!respostaGemini.ok) {

            console.error(json);

            return res.status(500).json({
                resposta: "Erro ao consultar Gemini."
            });
        }

        const parts =
            json?.candidates?.[0]?.content?.parts || [];

        const texto = parts
            .map(part => part.text || "")
            .join("");

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

        console.error(erro);

        return res.status(500).json({
            resposta: "Erro interno do servidor."
        });
    }
}
