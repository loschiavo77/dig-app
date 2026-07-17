export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    // Riceviamo tutte le nuove variabili utili dal telefono
    const { message, history, currentBg, bgTrend, lastBoloTime, lastBoloUnits, stockSensors, stockInsulin, stressLevel } = req.body;
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

    // Costruiamo un blocco dati in tempo reale super dettagliato per DIG
    const trendInfo = bgTrend ? `, Trend: ${bgTrend}` : '';
    const iobInfo = (lastBoloTime && lastBoloUnits) ? `, Ultimo bolo: ${lastBoloUnits} U alle ore ${lastBoloTime}` : '';
    const stockInfo = (stockSensors || stockInsulin) ? `, Scorte attuali -> Sensori: ${stockSensors || 'N/D'}, Cartucce: ${stockInsulin || 'N/D'}` : '';
    const stressInfo = stressLevel ? `, Livello stress/emozioni: ${stressLevel}` : '';

    const messaggioContestuale = `[DATI IN TEMPO REALE - Glicemia: ${currentBg} mg/dL${trendInfo}${iobInfo}${stockInfo}${stressInfo}] L'utente dice: ${message}`;

    try {
        const response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: messaggioContestuale,
                chat_history: cohereChatHistory,
                preamble: "Sei DIG, un assistente virtuale avanzato per la gestione del diabete. Hai accesso a dati in tempo reale critici: glicemia, trend, ore dall'ultimo bolo (per stimare l'Insulina Attiva - IOB ed evitare sovrapposizioni pericolose), scorte rimanenti e livello di stress (usalo per spiegare iperglicemie resistenti). Se l'utente ti parla di sport o attività fisica, calcola e suggerisci strategie per prevenire ipoglicemie. Regole di stile: Sii estremamente sintetico, usa il **grassetto** per i dati numerici e usa brevi elenchi puntati se elenchi più cose. IMPORTANTE: Inizia SEMPRE ogni singola risposta dicendo esattamente 'Ciao Lorenzo,'. Oggi è sabato 18 luglio 2026.",
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
