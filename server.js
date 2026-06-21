require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3003;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static('public'));

// Restrictions légales par pays
const legalRestrictions = {
    fr: {
        interdits: ["éphédra", "DHEA", "CBD non autorisé", "kava", "yohimbine"],
        reglementes: ["mélatonine (sur ordonnance)", "vitamine D (>2000 UI)", "CBD (<0.3% THC avec autorisation)"],
        msg: "En France, l'ANSES réglemente les compléments alimentaires."
    },
    ca: {
        interdits: ["éphédra", "DHEA", "kava"],
        reglementes: ["CBD (autorisation spéciale Santé Canada)", "mélatonine (>5mg)", "vitamine D (>4000 UI)"],
        msg: "Au Canada, les suppléments sont réglementés par Santé Canada."
    },
    us: {
        interdits: ["éphédra (interdit FDA)", "DHEA (interdit dans certains états)", "kava (interdit dans certains états)"],
        reglementes: ["CBD (varie selon les états)", "mélatonine (dose limitée)", "vitamine D (>4000 UI)"],
        msg: "Aux États-Unis, la FDA réglemente les suppléments. Les lois varient considérablement d'un état à l'autre."
    }
};

app.get('/api/goals', (req, res) => {
    res.json([
        { code: "energie", name: "Augmenter l'énergie" },
        { code: "sommeil", name: "Améliorer le sommeil" },
        { code: "immunite", name: "Renforcer l'immunité" }
    ]);
});

app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, goal, age, gender, description, language } = req.body;

    console.log('📋 Demande nutrition reçue:', goal, 'Âge:', age, 'Pays:', country);

    const reference = 'NUT_' + Date.now().toString(36).toUpperCase();

    let aiResponse = "Service IA en cours d'activation...";

    const languageNames = {
        fr: 'français',
        en: 'anglais'
    };

    const promptLang = languageNames[language] || 'français';

    const restrictions = legalRestrictions[country] || {
        interdits: [],
        reglementes: [],
        msg: "Veuillez vérifier la législation locale."
    };

    const legalWarning = `
⚠️ ATTENTION - LÉGISLATION LOCALE
Pays: ${country}
- Interdits: ${restrictions.interdits.join(', ') || 'Aucun'}
- Réglementés: ${restrictions.reglementes.join(', ') || 'Aucun'}
${restrictions.msg}
`;

    const prompt = `
Tu es un conseiller en micronutrition professionnel.

⚠️ RÈGLE D'OR : Tu ne dois JAMAIS recommander une marque, un produit ou un site de vente.

Pays: ${country}
Objectif: ${goal}
Âge: ${age}
Sexe: ${gender}
Description: ${description}

${legalWarning}

Langue: ${promptLang}

Structure ta réponse:
1. ANALYSE DES BESOINS
2. RECOMMANDATIONS GÉNÉRALES (catégories, pas de marques)
3. CONSEILS PRATIQUES
4. RECOMMANDATION FINALE (consulter un professionnel)
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "Tu es un conseiller en micronutrition." }, { role: "user", content: prompt }],
            max_tokens: 800
        });
        aiResponse = completion.choices[0].message.content;
        console.log('✅ IA a répondu');
    } catch (err) {
        console.error('❌ Erreur IA:', err.message);
        aiResponse = "Service IA indisponible. Réponse sous 24h.";
    }

    res.json({
        success: true,
        message: 'Votre demande nutrition a bien été reçue',
        reference: reference,
        aiResponse: aiResponse,
        date: new Date().toISOString()
    });
});

app.get('/api/admin/demandes', (req, res) => {
    try {
        const data = fs.readFileSync('./data/demandes.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.json([]);
    }
});

app.get('/admin', (req, res) => {
    const password = req.query.password;
    if (password !== 'nutri2026') {
        res.send('<h1>🔒 Accès refusé</h1><a href="/">Retour</a>');
        return;
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Suppléments AI sur http://localhost:${PORT}`);
    console.log('🧪 IA nutrition activée');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} déjà utilisé.`);
        console.log(`💡 Essaie de libérer le port ou utilise un autre port.`);
    } else {
        console.error('❌ Erreur:', err);
    }
});
