
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Route test
app.get('/api/test', (req, res) => {
    res.json({ message: 'API fonctionne' });
});

// Route pays
app.get('/api/goals', (req, res) => {
    res.json([
        { code: "energie", name: "Énergie" },
        { code: "sommeil", name: "Sommeil" },
        { code: "immunite", name: "Immunité" }
    ]);
});

// Route demande (sans OpenAI pour tester)
app.post('/api/submit-anonymous-case', (req, res) => {
    const { country, goal, age, gender, description, language } = req.body;

    console.log('📋 Demande reçue:', country, goal, age, gender);

    const reference = 'NUT_' + Date.now().toString(36).toUpperCase();

    res.json({
        success: true,
        message: 'Votre demande a été reçue',
        reference: reference,
        aiResponse: `Conseil test pour ${country} - ${goal} - Âge: ${age}`,
        date: new Date().toISOString()
    });
});

// Pages
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

// Démarrage
const server = app.listen(PORT, () => {
    console.log(`🚀 Suppléments AI sur http://localhost:${PORT}`);
    console.log('🧪 Serveur test activé');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} déjà utilisé.`);
    } else {
        console.error('❌ Erreur:', err);
    }
});