
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3003;

// === OpenAI ===
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// === Middleware ===
app.use(express.json());
app.use(express.static('public'));

// === Route test ===
app.get('/api/test', (req, res) => {
    res.json({ message: 'API fonctionne' });
});

// === Route objectifs ===
app.get('/api/goals', (req, res) => {
    res.json([
        { code: "energie", name: "Énergie" },
        { code: "sommeil", name: "Sommeil" },
        { code: "immunite", name: "Immunité" },
        { code: "poids", name: "Perte de poids" },
        { code: "stress", name: "Gestion du stress" },
        { code: "digestion", name: "Digestion" },
        { code: "peau", name: "Peau / cheveux / ongles" },
        { code: "sport", name: "Performance sportive" },
        { code: "memoire", name: "Mémoire / concentration" },
        { code: "articulations", name: "Articulations / os" },
        { code: "detox", name: "Détoxification" },
        { code: "grossesse", name: "Grossesse / allaitement" },
        { code: "senior", name: "Bien-être senior" },
        { code: "enfant", name: "Croissance enfant" }
    ]);
});

// === Route demande anonyme + IA ===
app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, goal, age, gender, description, language } = req.body;

    console.log('📋 Demande nutrition reçue:', goal, 'Âge:', age, 'Pays:', country);

    const reference = 'NUT_' + Date.now().toString(36).toUpperCase();

    let aiResponse = "Service IA en cours d'activation...";

    const languageNames = {
        fr: 'français',
        en: 'anglais',
        es: 'espagnol',
        de: 'allemand',
        ar: 'arabe',
        pt: 'portugais',
        it: 'italien',
        ru: 'russe',
        zh: 'chinois',
        ja: 'japonais',
        ko: 'coréen',
        hi: 'hindi'
    };

    const promptLang = languageNames[language] || 'français';

    const prompt = `
Tu es un conseiller en micronutrition professionnel.

⚠️ RÈGLE D'OR : Tu ne dois JAMAIS recommander une marque, un produit ou un site de vente.

Pays: ${country}
Objectif: ${goal}
Âge: ${age}
Sexe: ${gender}
Description: ${description}

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
            messages: [
                { role: "system", content: "Tu es un conseiller en micronutrition." },
                { role: "user", content: prompt }
            ],
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

// === Route admin ===
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

// === Pages ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
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

// === Démarrage ===
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