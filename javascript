// index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// USUARIOS
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { studyPlans: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }
    try {
        const newUser = await prisma.user.create({
            data: { name, email },
        });
        res.status(201).json(newUser);
    } catch (error) {
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'El email ya existe' });
        } else {
            res.status(500).json({ error: 'Error al crear usuario' });
        }
    }
});

// PLANES DE ESTUDIO
app.get('/api/study-plans', async (req, res) => {
    try {
        const studyPlans = await prisma.studyPlan.findMany({
            include: { 
                user: true,
                days: true 
            }
        });
        res.json(studyPlans);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener planes de estudio' });
    }
});

app.post('/api/study-plans', async (req, res) => {
    const { title, description, userId, days } = req.body;
    
    if (!title || !userId || !days) {
        return res.status(400).json({ 
            error: 'Título, userId y días son requeridos' 
        });
    }

    try {
        const newStudyPlan = await prisma.studyPlan.create({
            data: {
                title,
                description,
                userId: parseInt(userId),
                days: {
                    create: days.map(day => ({
                        dayName: day.dayName,
                        subjects: day.subjects
                    }))
                }
            },
            include: { days: true }
        });
        res.status(201).json(newStudyPlan);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear plan de estudio' });
    }
});

app.get('/api/study-plans/:id', async (req, res) => {
    try {
        const studyPlan = await prisma.studyPlan.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { 
                user: true,
                days: true 
            }
        });
        if (!studyPlan) {
            return res.status(404).json({ error: 'Plan de estudio no encontrado' });
        }
        res.json(studyPlan);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener plan de estudio' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
