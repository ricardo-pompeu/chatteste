export default async function handler(req,res){

    if(req.method !== "POST"){
        return res.status(405).end();
    }

    try{

        const { prompt } = req.body;

        const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    contents:[
                        {
                            parts:[
                                {
                                    text:prompt
                                }
                            ]
                        }
                    ],
                    generationConfig:{
                        maxOutputTokens:300,
                        temperature:0.4
                    }
                })
            }
        );

        const json = await r.json();

        res.status(200).json({
            resposta:
                json.candidates?.[0]?.content?.parts?.[0]?.text
                || "Sem resposta"
        });

    }catch{

        res.status(500).json({
            resposta:"Erro interno"
        });

    }

}
