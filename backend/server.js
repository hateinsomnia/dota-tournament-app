const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: '🎮 Dota 2 Tournaments API работает!',
        endpoints: {
            user: 'POST /api/user',
            matchmaking: 'POST /api/matchmaking/start'
        }
    });
});


// Заглушка данных пользователей (в памяти)
const users = new Map();

// API: Получить/создать пользователя
app.post('/api/user', async (req, res) => {
    try {
        const { telegram_id, username, first_name } = req.body;
        
        if (!telegram_id) {
            return res.status(400).json({ success: false, error: 'telegram_id обязателен' });
        }

        let user = users.get(telegram_id);
        
        if (!user) {
            user = {
                telegram_id,
                username: username || 'user_' + telegram_id,
                first_name: first_name || 'User',
                balance: 5000
            };
            users.set(telegram_id, user);
            console.log(`✅ Новый пользователь: ${first_name} (${telegram_id})`);
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Ошибка /api/user:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// API: Начать матчмейкинг
app.post('/api/matchmaking/start', async (req, res) => {
    try {
        const { telegram_id, stake } = req.body;
        
        if (!telegram_id || !stake) {
            return res.status(400).json({ success: false, error: 'Неверные данные' });
        }

        console.log(`🎮 Игрок ${telegram_id} ищет матч со ставкой ${stake}₽`);

        // Имитация: сразу найден соперник
        res.json({
            success: true,
            match_found: true,
            match: {
                opponent: {
                    first_name: 'Player_' + Math.floor(Math.random() * 9999),
                    username: 'player' + Math.floor(Math.random() * 9999)
                },
                stake: stake,
                prize: Math.floor(stake * 1.8)
            }
        });
    } catch (error) {
        console.error('Ошибка /api/matchmaking/start:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dota 2 Tournaments API запущен`);
    console.log(`🌐 Порт: ${PORT}`);
    console.log(`📡 Railway URL: https://dota-tournament-app-production.up.railway.app`);
});