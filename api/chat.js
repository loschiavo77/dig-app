export default async function handler(req, res) {
    // Permetti solo richieste POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const { message, currentBg } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Il server non ha ancora la chiave API configurata.' });
    }

    try {
        // Prompt di sistema che istruisce l'IA su chi è e qual è la tua glicemia attuale
        const systemPrompt = `Tu sei DIG (Diabetes Intelligence Guide), un assistente virtuale empatico, intelligente e ironico.
La glicemia attuale dell'utente letta in tempo reale da xDrip+ è: ${currentBg || 'Non disponibile'} mg/dL.

Istruzioni per le risposte:
1. Puoi rispondere a QUALSIASI domanda ti venga posta, anche totalmente fuori dal tema del diabete (scienza, compiti, curiosità, programmazione, barzellette, ecc.).
2. Se l'utente ti fa domande sul diabete, sulla sua glicemia attuale o ti chiede consigli pratici, offri risposte utili e scientificamente fondate, ma inserisci SEMPRE un piccolo promemoria sul fatto che sei un'IA e che le decisioni finali sulla terapia vanno discusse con un medico o un adulto.
3. Mantieni le risposte coincise, amichevoli, scansionabili e facili da leggere sul telefono.`;

        // Chiamata diretta alle API di Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `${systemPrompt}\n\nDomanda dell'utente: ${message}` }]
                    }
                ]
            })
        });

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Scusami, ho avuto un piccolo vuoto di memoria. Puoi riprovare?";

        return res.status(200).json({ reply: replyText });

    } catch (error) {
        return res.status(500).json({ error: 'Errore di connessione con il cervello dell\'IA.' });
    }
}
