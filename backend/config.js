require('dotenv').config();

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    MINI_APP_URL: process.env.MINI_APP_URL,
    PORT: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL || './database/dota_tournaments.db',
    
    // Ставки турниров
    STAKES: [100, 250, 500, 1000, 2000],
    
    // Коэффициент призового фонда (победитель получает ставку * 1.8)
    PRIZE_MULTIPLIER: 1.8,
    
    // Начальный баланс для новых пользователей
    INITIAL_BALANCE: 5000
};