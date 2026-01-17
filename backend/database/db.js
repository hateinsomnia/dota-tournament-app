const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config');

class Database {
    constructor() {
        this.db = null;
    }

    // Подключение к базе данных
    connect() {
        return new Promise((resolve, reject) => {
            const dbPath = path.resolve(__dirname, 'dota_tournaments.db');
            
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Ошибка подключения к БД:', err);
                    reject(err);
                } else {
                    console.log('✅ База данных подключена');
                    this.initTables().then(resolve).catch(reject);
                }
            });
        });
    }

    // Создание таблиц из schema.sql
    initTables() {
        return new Promise((resolve, reject) => {
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Ошибка создания таблиц:', err);
                    reject(err);
                } else {
                    console.log('✅ Таблицы созданы');
                    resolve();
                }
            });
        });
    }

    // Получить пользователя по telegram_id
    getUser(telegramId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE telegram_id = ?',
                [telegramId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    // Создать нового пользователя
    createUser(telegramId, username, firstName) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO users (telegram_id, username, first_name, balance) VALUES (?, ?, ?, ?)',
                [telegramId, username, firstName, config.INITIAL_BALANCE],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    // Обновить баланс пользователя
    updateBalance(telegramId, amount) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET balance = balance + ? WHERE telegram_id = ?',
                [amount, telegramId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // Создать транзакцию
    createTransaction(userId, type, amount, matchId = null) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO transactions (user_id, type, amount, match_id) VALUES (?, ?, ?, ?)',
                [userId, type, amount, matchId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    // Создать матч
    createMatch(player1Id, player2Id, stake, prize) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO matches (player1_id, player2_id, stake, prize, status) VALUES (?, ?, ?, ?, ?)',
                [player1Id, player2Id, stake, prize, 'in_progress'],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    // Закрыть соединение
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = new Database();