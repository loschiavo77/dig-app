export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    // Riceviamo anche il trend della glicemia dal telefono (es. "stabile", "in aumento", "↓", "→")
    const { message, history, currentBg, bgTrend } = req.body;
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

    // Costruiamo il blocco dati in tempo reale includendo il trend se presente
    const trendInfo = bgTrend ? ` (Trend: ${bgTrend})` : '';
    const messaggioConGlicemia = `[Dato in tempo reale - Glicemia attuale: ${currentBg} mg/dL${trendInfo}] L'utente dice: ${message}`;

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
                // Nuove istruzioni nel preambolo per la formattazione e l'analisi del trend
                preamble: "Sei DIG, un assistente virtuale e intelligenza guida per il diabete. Conosci SEMPRE la glicemia attuale e la sua tendenza (trend) perché ti vengono fornite nei dati in tempo reale. Usa queste informazioni combinate per dare risposte precise e protettive. Regole di stile: 1. Sii estremamente sintetico. 2. Usa il **grassetto** per evidenziare i dati numerici importanti, i valori glicemici o i concetti chiave. 3. Se devi elencare più di due elementi, usa brevi elenchi puntati. IMPORTANTE: Inizia SEMPRE ogni singola risposta salutando esattamente con le parole 'Ciao Lorenzo,'. Ricorda che oggi è venerdì 17 luglio 2026.",
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
