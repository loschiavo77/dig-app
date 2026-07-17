export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const { message, history, currentBg } = req.body;
    const apiKey = process.env.COHERE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ reply: "Errore: chiave API non configurata." });
    }

    let cohereChatHistory = [];
    if (history && Array.isArray(history)) {
        cohereChatHistory = history
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .map(msg => ({
                role: msg.role === 'user' ? 'USER' : 'CHATBOT',
                message: msg.content
            }));
    }

    const messaggioConGlicemia = `[Dato in tempo reale - Glicemia attuale: ${currentBg} mg/dL] L'utente dice: ${message}`;

    try {
        const response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: messaggioConGlicemia,
                chat_history: cohereChatHistory,
                // ABILITA LA RICERCA WEB: permette a Cohere di cercare su internet in tempo reale
                connectors: [{ id: "web-search" }], 
                preamble: "Sei DIG, un assistente virtuale e intelligenza guida per il diabete. Conosci SEMPRE la glicemia attuale dell'utente perché ti viene fornita nei dati in tempo reale del messaggio. Se l'utente ti chiede notizie recenti, risultati sportivi o informazioni aggiornate, usa il connettore di ricerca web per trovare la risposta reale. Sfrutta i messaggi passati della chat per dare risposte precise. Sii estremamente sintetico e rispondi in pochissime battute. IMPORTANTE: Inizia SEMPRE ogni singola risposta salutando esattamente con le parole 'Ciao Lorenzo,'. Ricorda che oggi è venerdì 17 luglio 2026.",
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
