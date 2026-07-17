export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const { message } = req.body;
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
                preamble: "Sei DIG, un assistente virtuale tuttofare, amichevole e intelligente. L'anno corrente è il 2026. Non hai accesso a Internet in tempo reale: se l'utente ti chiede notizie recenti, eventi in corso o risultati sportivi del 2026 che non conosci, non inventare risposte false, ma spiega con gentilezza che non hai questa informazione aggiornata.",
                model: 'command-r-08-2024'
            })
        });

        const data = await response.json();
        const replyText = data.text || (data.generations && data.generations[0] && data.generations[0].text) || data.response || null;

        if (replyText) {
            return res.status(200).json({ reply: replyText.trim() });
        } else {
            const errorMsg = data.message || JSON.stringify(data);
            return res.status(200).json({ reply: `Nota di Cohere: ${errorMsg}` });
        }
    } catch (error) {
        return res.status(500).json({ reply: "Errore di connessione con il server." });
    }
}
