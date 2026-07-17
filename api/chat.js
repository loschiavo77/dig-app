export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const { message, currentBg } = req.body;
    const msg = message.toLowerCase();
    let reply = "";

    // Il "cervello locale" dell'assistente DIG
    if (msg.includes("ciao") || msg.includes("salva")) {
        reply = `Ciao! Sono il tuo assistente DIG. La tua glicemia attuale è di ${currentBg} mg/dL. Come posso aiutarti oggi?`;
    } else if (msg.includes("glicemia") || msg.includes("valore") || msg.includes("sto")) {
        const bg = parseInt(currentBg);
        if (isNaN(bg)) {
            reply = "Al momento non ho ricevuto letture valide da xDrip+. Controlla che l'app sia avviata sul telefono!";
        } else if (bg < 70) {
            reply = `La tua glicemia è bassa (${bg} mg/dL). Ricordati di assumere carboidrati a rapido assorbimento e avvisa un adulto se non ti senti bene!`;
        } else if (bg > 180) {
            reply = `La tua glicemia è alta (${bg} mg/dL). Controlla se è il caso di fare una correzione o di bere dell'acqua, e parlane con un adulto.`;
        } else {
            reply = `La tua glicemia è di ${currentBg} mg/dL, sei perfettamente all'interno del tuo target! Ottimo lavoro, continua così.`;
        }
    } else if (msg.includes("grazie")) {
        reply = "Di nulla! Sono sempre qui a disposizione per darti una mano con i dati del sensore.";
    } else {
        reply = `Ho ricevuto il tuo messaggio! Ti ricordo che la tua glicemia attuale è ${currentBg} mg/dL. Se hai dubbi sulla terapia o sui valori, confrontati sempre con un adulto o con il tuo medico.`;
    }

    return res.status(200).json({ reply: reply });
}
