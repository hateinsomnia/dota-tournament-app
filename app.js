// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Состояние приложения
let state = {
    balance: 5000,
    selectedStake: null,
    searchTimer: 0,
    searchInterval: null
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

// Выбор ставки
stakeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        stakeButtons.forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        state.selectedStake = parseInt(this.dataset.amount);
        findMatchBtn.disabled = false;
        tg.HapticFeedback.impactOccurred('light');
    });
});

// Найти соперника
findMatchBtn.addEventListener('click', () => {
    if (state.selectedStake > state.balance) {
        tg.showAlert('Недостаточно средств на балансе');
        return;
    }
    
    // Показать экран оплаты
    document.getElementById('payment-amount').textContent = state.selectedStake + ' ₽';
    document.getElementById('prize-amount').textContent = (state.selectedStake * 1.8).toFixed(0) + ' ₽';
    showScreen('payment');
    tg.HapticFeedback.impactOccurred('medium');
});

// Подтверждение оплаты
confirmPaymentBtn.addEventListener('click', () => {
    // Списание средств (mock)
    state.balance -= state.selectedStake;
    balanceEl.textContent = state.balance + ' ₽';
    
    // Начать поиск
    startSearch();
    tg.HapticFeedback.notificationOccurred('success');
});

// Отмена оплаты
cancelPaymentBtn.addEventListener('click', () => {
    showScreen('main');
    tg.HapticFeedback.impactOccurred('light');
});

// Начать поиск
function startSearch() {
    showScreen('search');
    document.getElementById('selected-stake').textContent = state.selectedStake;
    state.searchTimer = 0;
    
    state.searchInterval = setInterval(() => {
        state.searchTimer++;
        const minutes = Math.floor(state.searchTimer / 60).toString().padStart(2, '0');
        const seconds = (state.searchTimer % 60).toString().padStart(2, '0');
        document.getElementById('search-timer').textContent = `${minutes}:${seconds}`;
        
        // Симуляция: найти соперника через 3-7 секунд
        if (state.searchTimer >= 3 + Math.random() * 4) {
            matchFound();
        }
    }, 1000);
}

// Отменить поиск
cancelSearchBtn.addEventListener('click', () => {
    clearInterval(state.searchInterval);
    state.balance += state.selectedStake; // Возврат средств
    balanceEl.textContent = state.balance + ' ₽';
    showScreen('main');
    tg.HapticFeedback.impactOccurred('medium');
});

// Матч найден
function matchFound() {
    clearInterval(state.searchInterval);
    document.getElementById('player1-name').textContent = tg.initDataUnsafe?.user?.first_name || 'Вы';
    document.getElementById('player2-name').textContent = 'Player_' + Math.floor(Math.random() * 9999);
    document.getElementById('match-prize').textContent = (state.selectedStake * 1.8).toFixed(0) + ' ₽';
    showScreen('matchFound');
    tg.HapticFeedback.notificationOccurred('success');
}

// Закрыть экран матча
closeMatchBtn.addEventListener('click', () => {
    showScreen('main');
    // Сброс выбранной ставки
    stakeButtons.forEach(b => b.classList.remove('selected'));
    state.selectedStake = null;
    findMatchBtn.disabled = true;
});

// Обновить баланс при загрузке
balanceEl.textContent = state.balance + ' ₽';

console.log('Dota 2 Tournaments Mini App загружен');
console.log('User:', tg.initDataUnsafe?.user);