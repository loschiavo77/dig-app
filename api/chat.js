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
        const response = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Sei DIG, un assistente virtuale amichevole per la gestione della glicemia. Il valore attuale dell'utente è ${currentBg || 'non pervenuto'} mg/dL. Rispondi in modo chiaro, empatico e breve a questa richiesta: ${message}`,
                model: 'command-r-plus'
            })
        });

        const data = await response.json();
        const reply = data.text || "Non sono riuscito a generare una risposta.";
        return res.status(200).json({ reply: reply });
    } catch (error) {
        return res.status(500).json({ reply: "Errore di connessione con l'IA." });
    }
}
