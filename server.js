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

// ===== RESTRICTIONS LÉGALES PAR PAYS =====
const legalRestrictions = {
    fr: { interdits: ["éphédra", "DHEA", "CBD non autorisé", "kava", "yohimbine"], reglementes: ["mélatonine (sur ordonnance)", "vitamine D (>2000 UI)", "CBD (<0.3% THC)"], msg: "En France, l'ANSES réglemente les compléments alimentaires." },
    ca: { interdits: ["éphédra", "DHEA", "kava"], reglementes: ["CBD (autorisation spéciale)", "mélatonine (>5mg)", "vitamine D (>4000 UI)"], msg: "Au Canada, les suppléments sont réglementés par Santé Canada." },
    us: { interdits: ["éphédra (interdit FDA)", "DHEA (interdit dans certains états)", "kava"], reglementes: ["CBD (varie selon les états)", "mélatonine (dose limitée)", "vitamine D (>4000 UI)"], msg: "Aux États-Unis, la FDA réglemente les suppléments. Les lois varient selon les états." },
    ma: { interdits: ["CBD", "DHEA", "éphédra", "kava"], reglementes: ["mélatonine (sur prescription)", "vitamine D (>2000 UI)"], msg: "Au Maroc, les compléments alimentaires sont réglementés par le ministère de la Santé." },
    dz: { interdits: ["CBD", "DHEA", "éphédra"], reglementes: ["mélatonine", "vitamine D (>2000 UI)"], msg: "En Algérie, la législation sur les compléments alimentaires est stricte." },
    tn: { interdits: ["CBD", "DHEA", "éphédra"], reglementes: ["mélatonine", "vitamine D (>2000 UI)"], msg: "En Tunisie, les compléments alimentaires sont soumis à l'autorisation du ministère de la Santé." },
    sn: { interdits: ["CBD", "DHEA", "éphédra"], reglementes: ["mélatonine", "vitamine D"], msg: "Au Sénégal, la réglementation des compléments alimentaires est en développement." },
    ci: { interdits: ["CBD", "DHEA", "éphédra"], reglementes: ["mélatonine", "vitamine D"], msg: "En Côte d'Ivoire, les compléments alimentaires sont réglementés par le ministère de la Santé." },
    cm: { interdits: ["CBD", "DHEA", "éphédra"], reglementes: ["mélatonine", "vitamine D"], msg: "Au Cameroun, les compléments alimentaires sont soumis à la réglementation du ministère de la Santé publique." },
    be: { interdits: ["éphédra", "DHEA", "kava"], reglementes: ["CBD (<0.3% THC)", "mélatonine", "vitamine D (>2000 UI)"], msg: "En Belgique, l'AFMPS réglemente les compléments alimentaires." },
    ch: { interdits: ["éphédra", "DHEA", "kava"], reglementes: ["CBD (<1% THC)", "mélatonine", "vitamine D (>4000 UI)"], msg: "En Suisse, l'OFSP réglemente les compléments alimentaires." },
    de: { interdits: ["éphédra", "DHEA", "kava"], reglementes: ["CBD (<0.2% THC)", "mélatonine", "vitamine D (>4000 UI)"], msg: "En Allemagne, le BfR et le BVL réglementent les compléments alimentaires." },
    es: { interdits: ["éphédra", "DHEA", "kava"], reglementes: ["CBD (<0.2% THC)", "mélatonine", "vitamine D (>4000 UI)"], msg: "En Espagne, l'AESAN réglemente les compléments alimentaires." },
    it: { interdits: ["éphédra", "DHEA", "kava"], reglementes: ["CBD (<0.2% THC)", "mélatonine", "vitamine D (>4000 UI)"], msg: "En Italie, le Ministère de la Santé réglemente les compléments alimentaires." },
    pt: { interdits: ["éphédra", "DHEA", "kava"], reglementes: ["CBD (<0.2% THC)", "mélatonine", "vitamine D (>4000 UI)"], msg: "Au Portugal, l'INFARMED réglemente les compléments alimentaires." },
    gb: { interdits: ["éphédra", "DHEA", "kava"], reglementes: ["CBD (autorisation FSA)", "mélatonine (sur prescription)", "vitamine D (>4000 UI)"], msg: "Au Royaume-Uni, la FSA et la MHRA réglementent les compléments alimentaires." },
    br: { interdits: ["éphédra", "DHEA", "CBD"], reglementes: ["mélatonine", "vitamine D (>4000 UI)"], msg: "Au Brésil, l'ANVISA réglemente les compléments alimentaires." },
    mx: { interdits: ["éphédra", "DHEA", "CBD"], reglementes: ["mélatonine", "vitamine D (>4000 UI)"], msg: "Au Mexique, la COFEPRIS réglemente les compléments alimentaires." },
    in: { interdits: ["CBD", "DHEA", "éphédra"], reglementes: ["mélatonine", "vitamine D"], msg: "En Inde, le FSSAI réglemente les compléments alimentaires." },
    cn: { interdits: ["CBD", "DHEA", "éphédra"], reglementes: ["mélatonine", "vitamine D"], msg: "En Chine, la NMPA réglemente les compléments alimentaires." },
    jp: { interdits: ["CBD", "DHEA", "éphédra"], reglementes: ["mélatonine", "vitamine D"], msg: "Au Japon, le MHLW réglemente les compléments alimentaires." },
    kr: { interdits: ["CBD", "DHEA", "éphédra"], reglementes: ["mélatonine", "vitamine D"], msg: "En Corée du Sud, le MFDS réglemente les compléments alimentaires." },
    ru: { interdits: ["CBD", "DHEA", "éphédra", "kava"], reglementes: ["mélatonine", "vitamine D"], msg: "En Russie, le Rospotrebnadzor réglemente les compléments alimentaires." }
};

app.get('/api/goals', (req, res) => {
    res.json([
        { code: "energie", name: "Augmenter l'énergie" },
        { code: "sommeil", name: "Améliorer le sommeil" },
        { code: "immunite", name: "Renforcer l'immunité" },
        { code: "poids", name: "Perte de poids" },
        { code: "stress", name: "Gestion du stress" },
        { code: "digestion", name: "Améliorer la digestion" },
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

app.post('/api/submit-anonymous-case', async (req, res) => {
    const { country, goal, age, gender, description, language } = req.body;

    console.log('📋 Demande nutrition reçue:', goal, 'Âge:', age, 'Pays:', country);

    const reference = 'NUT_' + Date.now().toString(36).toUpperCase();

    let aiResponse = "Service IA en cours d'activation...";

    const languageNames = { fr: 'français', en: 'anglais' };
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

// ===== PAGES ANNEXES =====
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

// ===== DÉMARRAGE =====
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