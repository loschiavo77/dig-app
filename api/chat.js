export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const { message, currentBg } = req.body;
    const apiKey = process.env.COHERE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ reply: "Errore: chiave API di Cohere non configurata su Vercel." });
    }

    const prompt = `Sei DIG, un assistente virtuale amichevole per la gestione della glicemia.
Il valore glicemico attuale dell'utente è di ${currentBg || 'non pervenuto'} mg/dL.
Rispondi in modo chiaro, empatico e breve alla seguente richiesta dell'utente. 

Richiesta dell'utente: "${message}"`;

    try {
        const response = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command',
                prompt: prompt,
                max_tokens: 150,
                temperature: 0.7,
                k: 0,
                stop_sequences: [],
                return_likelihoods: 'NONE'
            })
        });

        const data = await response.json();
        const reply = data.generations && data.generations[0] ? data.generations[0].text.trim() : "Non sono riuscito a elaborare una risposta.";
        
        return res.status(200).json({ reply: reply });
    } catch (error) {
        return res.status(500).json({ reply: "C'è stato un problema di connessione con il cervello dell'IA." });
    }
}
