// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp || {};
if (tg.expand) tg.expand();
if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();

// URL API (для локального тестирования)
const API_URL = 'http://localhost:3000/api';

// Состояние приложения
let state = {
    user: null,
    balance: 5000,
    selectedStake: null,
    searchTimer: 0,
    searchInterval: null,
    pollInterval: null
};

// Элементы
const screens = {
    main: document.getElementById('main-screen'),
    search: document.getElementById('search-screen'),
    payment: document.getElementById('payment-screen'),
    matchFound: document.getElementById('match-found-screen')
};

const balanceEl = document.getElementById('balance');
const stakeButtons = document.querySelectorAll('.stake-btn');
const findMatchBtn = document.getElementById('find-match-btn');
const cancelSearchBtn = document.getElementById('cancel-search-btn');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
const closeMatchBtn = document.getElementById('close-match-btn');

// Функция переключения экранов
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Haptic feedback (работает только в Telegram)
function haptic(type) {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(type);
    }
}

// Инициализация пользователя
async function initUser() {
    try {
        let user = tg.initDataUnsafe?.user;
        
        // Если нет Telegram данных (тестирование в браузере), используй тестового пользователя
        if (!user) {
            console.warn('⚠️ Нет Telegram данных, используем тестового пользователя');
            user = {
                id: 123456789,
                username: 'test_user',
                first_name: 'Test User'
            };
        }

        const response = await fetch(`${API_URL}/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: user.id,
                username: user.username,
                first_name: user.first_name
            })
        });

        const data = await response.json();
        if (data.success) {
            state.user = data.user;
            state.balance = data.user.balance;
            balanceEl.textContent = state.balance + ' ₽';
            console.log('✅ Пользователь загружен:', data.user);
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        // Fallback на mock данные
        state.balance = 5000;
        balanceEl.textContent = state.balance + ' ₽';
    }
}

// Выбор ставки
stakeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        stakeButtons.forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        state.selectedStake = parseInt(this.dataset.amount);
        findMatchBtn.disabled = false;
        haptic('light');
    });
});

// Найти соперника
findMatchBtn.addEventListener('click', () => {
    if (state.selectedStake > state.balance) {
        if (tg.showAlert) {
            tg.showAlert('Недостаточно средств на балансе');
        } else {
            alert('Недостаточно средств на балансе');
        }
        return;
    }
    
    // Показать экран оплаты
    document.getElementById('payment-amount').textContent = state.selectedStake + ' ₽';
    document.getElementById('prize-amount').textContent = (state.selectedStake * 1.8).toFixed(0) + ' ₽';
    showScreen('payment');
    haptic('medium');
});

// Подтверждение оплаты
confirmPaymentBtn.addEventListener('click', async () => {
    try {
        let user = tg.initDataUnsafe?.user;
        
        // Для тестирования в браузере
        if (!user) {
            user = { id: 123456789, first_name: 'Test User' };
        }

        const response = await fetch(`${API_URL}/matchmaking/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: user.id,
                stake: state.selectedStake
            })
        });

        const data = await response.json();
        
        if (data.success) {
            state.balance -= state.selectedStake;
            balanceEl.textContent = state.balance + ' ₽';

            if (data.match_found) {
                // Матч сразу найден
                showMatchFound(data.match);
            } else {
                // Начать поиск
                startSearch();
            }
        } else {
            const errorMsg = data.error || 'Ошибка оплаты';
            if (tg.showAlert) {
                tg.showAlert(errorMsg);
            } else {
                alert(errorMsg);
            }
            showScreen('main');
        }
    } catch (error) {
        console.error('Ошибка начала поиска:', error);
        if (tg.showAlert) {
            tg.showAlert('Ошибка подключения к серверу');
        } else {
            alert('Ошибка подключения к серверу');
        }
        showScreen('main');
    }
    
    haptic('success');
});

// Отмена оплаты
cancelPaymentBtn.addEventListener('click', () => {
    showScreen('main');
    haptic('light');
});

// Начать поиск
function startSearch() {
    showScreen('search');
    document.getElementById('selected-stake').textContent = state.selectedStake;
    state.searchTimer = 0;
    
    // Таймер поиска
    state.searchInterval = setInterval(() => {
        state.searchTimer++;
        const minutes = Math.floor(state.searchTimer / 60).toString().padStart(2, '0');
        const seconds = (state.searchTimer % 60).toString().padStart(2, '0');
        document.getElementById('search-timer').textContent = `${minutes}:${seconds}`;
    }, 1000);

    // Опрос сервера каждые 2 секунды (проверить найден ли соперник)
    state.pollInterval = setInterval(checkMatch, 2000);
}

// Проверить найден ли матч
async function checkMatch() {
    try {
        // Симуляция: соперник найден через 3 секунды
        if (state.searchTimer >= 3) {
            clearInterval(state.searchInterval);
            clearInterval(state.pollInterval);
            
            const mockMatch = {
                opponent: {
                    first_name: 'Player_' + Math.floor(Math.random() * 9999),
                    username: 'player' + Math.floor(Math.random() * 9999)
                },
                stake: state.selectedStake,
                prize: Math.floor(state.selectedStake * 1.8)
            };
            
            showMatchFound(mockMatch);
        }
    } catch (error) {
        console.error('Ошибка проверки матча:', error);
    }
}

// Отменить поиск
cancelSearchBtn.addEventListener('click', async () => {
    clearInterval(state.searchInterval);
    clearInterval(state.pollInterval);
    
    try {
        let user = tg.initDataUnsafe?.user;
        
        if (!user) {
            user = { id: 123456789 };
        }

        await fetch(`${API_URL}/matchmaking/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: user.id,
                stake: state.selectedStake
            })
        });

        state.balance += state.selectedStake; // Возврат средств
        balanceEl.textContent = state.balance + ' ₽';
    } catch (error) {
        console.error('Ошибка отмены поиска:', error);
    }
    
    showScreen('main');
    haptic('medium');
});

// Показать экран "Матч найден"
function showMatchFound(match) {
    const userName = tg.initDataUnsafe?.user?.first_name || 'Test User';
    document.getElementById('player1-name').textContent = userName;
    document.getElementById('player2-name').textContent = match.opponent.first_name;
    document.getElementById('match-prize').textContent = match.prize + ' ₽';
    showScreen('matchFound');
    haptic('success');
}

// Закрыть экран матча
closeMatchBtn.addEventListener('click', () => {
    showScreen('main');
    stakeButtons.forEach(b => b.classList.remove('selected'));
    state.selectedStake = null;
    findMatchBtn.disabled = true;
    
    // Обновить баланс
    initUser();
});

// Инициализация при загрузке
initUser();

console.log('🎮 Dota 2 Tournaments Mini App загружен');
console.log('User:', tg.initDataUnsafe?.user || 'Test User');