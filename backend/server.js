const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./database/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Очередь игроков для матчмейкинга
const matchmakingQueue = new Map(); // stake -> [players]

// Инициализация базы данных
db.connect().then(() => {
    console.log('🚀 Сервер запущен');
}).catch(err => {
    console.error('Ошибка запуска:', err);
    process.exit(1);
});

// API: Получить/создать пользователя
app.post('/api/user', async (req, res) => {
    try {
        const { telegram_id, username, first_name } = req.body;
        
        if (!telegram_id) {
            return res.status(400).json({ error: 'telegram_id обязателен' });
        }

        let user = await db.getUser(telegram_id);
        
        if (!user) {
            // Создать нового пользователя
            await db.createUser(telegram_id, username, first_name);
            user = await db.getUser(telegram_id);
            console.log(`✅ Новый пользователь: ${first_name} (${telegram_id})`);
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Ошибка /api/user:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// API: Начать поиск соперника
app.post('/api/matchmaking/start', async (req, res) => {
    try {
        const { telegram_id, stake } = req.body;

        if (!telegram_id || !stake) {
            return res.status(400).json({ error: 'Неверные данные' });
        }

        // Проверить баланс
        const user = await db.getUser(telegram_id);
        if (!user || user.balance < stake) {
            return res.status(400).json({ error: 'Недостаточно средств' });
        }

        // Списать ставку
        await db.updateBalance(telegram_id, -stake);
        await db.createTransaction(telegram_id, 'bet', -stake);

        // Добавить в очередь
        if (!matchmakingQueue.has(stake)) {
            matchmakingQueue.set(stake, []);
        }

        const queue = matchmakingQueue.get(stake);
        
        // Проверить есть ли ожидающий игрок
        if (queue.length > 0) {
            const opponent = queue.shift();
            
            // Создать матч
            const prize = Math.floor(stake * config.PRIZE_MULTIPLIER);
            const matchId = await db.createMatch(telegram_id, opponent.telegram_id, stake, prize);

            console.log(`🎮 Матч создан: ${user.first_name} vs ${opponent.first_name} (${stake}₽)`);

            res.json({
                success: true,
                match_found: true,
                match: {
                    id: matchId,
                    opponent: {
                        telegram_id: opponent.telegram_id,
                        first_name: opponent.first_name,
                        username: opponent.username
                    },
                    stake,
                    prize
                }
            });

            // Уведомить оппонента (через WebSocket или сохраним для следующего этапа)
        } else {
            // Добавить в очередь ожидания
            queue.push({
                telegram_id,
                first_name: user.first_name,
                username: user.username,
                timestamp: Date.now()
            });

            res.json({
                success: true,
                match_found: false,
                message: 'В очереди поиска'
            });
        }
    } catch (error) {
        console.error('Ошибка /api/matchmaking/start:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// API: Отменить поиск
app.post('/api/matchmaking/cancel', async (req, res) => {
    try {
        const { telegram_id, stake } = req.body;

        const queue = matchmakingQueue.get(stake);
        if (queue) {
            const index = queue.findIndex(p => p.telegram_id === telegram_id);
            if (index !== -1) {
                queue.splice(index, 1);
                
                // Вернуть ставку
                await db.updateBalance(telegram_id, stake);
                await db.createTransaction(telegram_id, 'refund', stake);

                console.log(`❌ Поиск отменен: ${telegram_id}`);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка /api/matchmaking/cancel:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Запуск сервера
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`🌐 Сервер работает на http://localhost:${PORT}`);
});