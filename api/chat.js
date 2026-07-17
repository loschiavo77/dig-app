export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    // Riceviamo il messaggio corrente e la cronologia inviata dal telefono
    const { message, history } = req.body;
    const apiKey = process.env.COHERE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ reply: "Errore: chiave API non configurata." });
    }

    // Convertiamo la cronologia nel formato ufficiale richiesto da Cohere (chat_history)
    let cohereChatHistory = [];
    if (history && Array.isArray(history)) {
        cohereChatHistory = history
            .filter(msg => msg.role === 'user' || msg.role === 'assistant') // Escludiamo il prompt di sistema vecchio
            .map(msg => ({
                role: msg.role === 'user' ? 'USER' : 'CHATBOT',
                message: msg.content
            }));
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
                chat_history: cohereChatHistory, // Passiamo la memoria storica a Cohere!
                // Nel preambolo impostiamo la data, la sinteticità e l'obbligo del saluto fisso
                preamble: "Sei DIG, un assistente virtuale e intelligenza guida per il diabete, amichevole e intelligente. Sfrutta i messaggi passati della chat per dare risposte precise. Sii estremamente sintetico e rispondi in pochissime battute. IMPORTANTE: Inizia SEMPRE ogni singola risposta salutando esattamente con le parole 'Ciao Lorenzo,'. Ricorda che oggi è venerdì 17 luglio 2026. Non hai accesso a Internet in tempo reale: se l'utente ti chiede notizie recenti o risultati sportivi che non conosci, non inventare risposte, ma spiega che non hai l'informazione aggiornata.",
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
