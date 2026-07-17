export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const { message, currentBg } = req.body;
    const apiKey = process.env.COHERE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ reply: "Errore: chiave API non configurata." });
    }

    try {
        const response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                preamble: `Sei DIG, un assistente amichevole per la gestione della glicemia. Il valore attuale dell'utente è ${currentBg || 'non pervenuto'} mg/dL. Rispondi in modo chiaro, empatico e molto breve.`,
                model: 'command-r'
            })
        });

        const data = await response.json();
        
        if (data.text) {
            return res.status(200).json({ reply: data.text });
        } else {
            return res.status(200).json({ reply: "L'IA ha risposto in modo non corretto." });
        }
    } catch (error) {
        return res.status(500).json({ reply: "Errore di connessione con il server." });
    }
}
