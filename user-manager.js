// js/user-manager.js

const UserManager = {
    // Текущий режим пользователя
    currentMode: 'guest', // 'guest' или 'registered'
    
    // Инициализация
    init() {
        const savedMode = localStorage.getItem('scentme_user_mode');
        if (savedMode) {
            this.currentMode = savedMode;
        }
        return this;
    },
    
    // Получить текущий режим
    getMode() {
        return this.currentMode;
    },
    
    // Установить режим
    setMode(mode) {
        this.currentMode = mode;
        localStorage.setItem('scentme_user_mode', mode);
        return this;
    },
    
    // Проверить, зарегистрирован ли пользователь
    isRegistered() {
        return this.currentMode === 'registered';
    },
    
    // Проверить, проходил ли тест
    isQuizCompleted() {
        if (!this.isRegistered()) return false;
        const userData = this.getUserData();
        return userData?.quizCompleted || false;
    },
    
    // Пометить тест как пройденный
    markQuizCompleted() {
        if (this.isRegistered()) {
            const userData = this.getUserData();
            userData.quizCompleted = true;
            userData.quizCompletedDate = new Date().toISOString();
            this.saveUserData(userData);
        }
        return this;
    },
    
    // Получить данные пользователя
    getUserData() {
        const data = localStorage.getItem('scentme_user_data');
        return data ? JSON.parse(data) : {
            quizCompleted: false,
            registrationDate: new Date().toISOString(),
            preferences: {},
            quizHistory: [],      // ← ДОБАВИТЬ
            collections: {        // ← ДОБАВИТЬ
                perfumes: [],
                oils: [],
                articles: []
            }
        };
    },
    
    // Сохранить данные пользователя
    saveUserData(data) {
        localStorage.setItem('scentme_user_data', JSON.stringify(data));
        return this;
    },
    
    // Регистрация нового пользователя
    register(email, name) {
        const userData = {
            email: email,
            name: name,
            registrationDate: new Date().toISOString(),
            quizCompleted: false,
            preferences: {},
            quizHistory: [],      // ← ДОБАВИТЬ
            collections: {        // ← ДОБАВИТЬ
                perfumes: [],
                oils: [],
                articles: []
            }
        };
        
        this.saveUserData(userData);
        this.setMode('registered');
        
        return userData;
    },
    
    // Выход (в гостевой режим)
    logout() {
        this.setMode('guest');
        return this;
    },
    
    // === ДОБАВЛЕННЫЕ ФУНКЦИИ ДЛЯ ИСТОРИИ И КОЛЛЕКЦИЙ ===
    
    // Сохранить результат теста в историю
    saveQuizResult(quizData) {
        if (!this.isRegistered()) {
            console.log('👤 Гость - результат не сохраняется в профиль');
            return null;
        }
        
        const userData = this.getUserData();
        
        // Создаем запись результата
        const resultRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            quizType: quizData.quizType || 'perfume',
            level: quizData.level || 'standard',
            matchesCount: quizData.matches?.length || 0,
            accuracy: quizData.accuracy || 0,
            matches: quizData.matches?.slice(0, 5) || [] // Сохраняем только первые 5
        };
        
        // Добавляем в историю
        if (!userData.quizHistory) {
            userData.quizHistory = [];
        }
        
        userData.quizHistory.unshift(resultRecord); // Новые сверху
        
        // Ограничиваем историю 10 последними тестами
        if (userData.quizHistory.length > 10) {
            userData.quizHistory = userData.quizHistory.slice(0, 10);
        }
        
        // Помечаем тест как пройденный
        userData.quizCompleted = true;
        userData.quizCompletedDate = new Date().toISOString();
        
        // Сохраняем
        this.saveUserData(userData);
        
        console.log(`💾 Результат сохранен в историю (${userData.quizHistory.length} тестов)`);
        return resultRecord;
    },
    
    // Получить историю тестов
    getQuizHistory() {
        if (!this.isRegistered()) return [];
        const userData = this.getUserData();
        return userData.quizHistory || [];
    },
    
    // Очистить историю тестов
    clearQuizHistory() {
        if (this.isRegistered()) {
            const userData = this.getUserData();
            userData.quizHistory = [];
            this.saveUserData(userData);
        }
        return this;
    },
    
    // Добавить в коллекцию
    addToCollection(itemId, collectionType = 'perfumes') {
        if (!this.isRegistered()) {
            console.log('👤 Гость - добавлено в локальную коллекцию');
            return this._addToGuestCollection(itemId, collectionType);
        }
        
        const userData = this.getUserData();
        
        if (!userData.collections) {
            userData.collections = {
                perfumes: [],
                oils: [],
                articles: []
            };
        }
        
        if (!userData.collections[collectionType]) {
            userData.collections[collectionType] = [];
        }
        
        // Добавляем, если ещё нет
        if (!userData.collections[collectionType].includes(itemId)) {
            userData.collections[collectionType].push(itemId);
            this.saveUserData(userData);
            console.log(`✅ Добавлен в коллекцию ${collectionType}: ${itemId}`);
        }
        
        return this;
    },
    
    // Удалить из коллекции
    removeFromCollection(itemId, collectionType = 'perfumes') {
        if (!this.isRegistered()) {
            console.log('👤 Гость - удалено из локальной коллекции');
            return this._removeFromGuestCollection(itemId, collectionType);
        }
        
        const userData = this.getUserData();
        
        if (userData.collections && userData.collections[collectionType]) {
            const index = userData.collections[collectionType].indexOf(itemId);
            if (index !== -1) {
                userData.collections[collectionType].splice(index, 1);
                this.saveUserData(userData);
                console.log(`❌ Удален из коллекции ${collectionType}: ${itemId}`);
            }
        }
        
        return this;
    },
    
    // Проверить, есть ли в коллекции
    isInCollection(itemId, collectionType = 'perfumes') {
        if (!this.isRegistered()) {
            return this._isInGuestCollection(itemId, collectionType);
        }
        
        const userData = this.getUserData();
        
        if (userData.collections && userData.collections[collectionType]) {
            return userData.collections[collectionType].includes(itemId);
        }
        
        return false;
    },
    
    // Получить всю коллекцию
    getCollection(collectionType = 'perfumes') {
        if (!this.isRegistered()) {
            return this._getGuestCollection(collectionType);
        }
        
        const userData = this.getUserData();
        return userData.collections?.[collectionType] || [];
    },
    
    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ГОСТЕЙ ===
    
    // Добавить в гостевую коллекцию
    _addToGuestCollection(itemId, collectionType) {
        const key = `scentme_guest_collection_${collectionType}`;
        const collection = JSON.parse(localStorage.getItem(key) || '[]');
        
        if (!collection.includes(itemId)) {
            collection.push(itemId);
            localStorage.setItem(key, JSON.stringify(collection));
        }
        
        return this;
    },
    
    // Удалить из гостевой коллекции
    _removeFromGuestCollection(itemId, collectionType) {
        const key = `scentme_guest_collection_${collectionType}`;
        const collection = JSON.parse(localStorage.getItem(key) || '[]');
        const index = collection.indexOf(itemId);
        
        if (index !== -1) {
            collection.splice(index, 1);
            localStorage.setItem(key, JSON.stringify(collection));
        }
        
        return this;
    },
    
    // Проверить в гостевой коллекции
    _isInGuestCollection(itemId, collectionType) {
        const key = `scentme_guest_collection_${collectionType}`;
        const collection = JSON.parse(localStorage.getItem(key) || '[]');
        return collection.includes(itemId);
    },
    
    // Получить гостевую коллекцию
    _getGuestCollection(collectionType) {
        const key = `scentme_guest_collection_${collectionType}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    },
    
    // Перенести гостевую коллекцию в профиль (при регистрации)
    transferGuestCollections() {
        if (!this.isRegistered()) return this;
        
        const userData = this.getUserData();
        
        // Переносим коллекции
        ['perfumes', 'oils', 'articles'].forEach(collectionType => {
            const guestKey = `scentme_guest_collection_${collectionType}`;
            const guestCollection = JSON.parse(localStorage.getItem(guestKey) || '[]');
            
            if (guestCollection.length > 0) {
                if (!userData.collections) userData.collections = {};
                if (!userData.collections[collectionType]) {
                    userData.collections[collectionType] = [];
                }
                
                // Добавляем уникальные элементы
                guestCollection.forEach(itemId => {
                    if (!userData.collections[collectionType].includes(itemId)) {
                        userData.collections[collectionType].push(itemId);
                    }
                });
                
                // Очищаем гостевую коллекцию
                localStorage.removeItem(guestKey);
                console.log(`🔄 Перенесено ${guestCollection.length} элементов из гостевой коллекции ${collectionType}`);
            }
        });
        
        this.saveUserData(userData);
        return this;
    },
    
    // Обновить предпочтения пользователя
    updatePreferences(prefs) {
        if (!this.isRegistered()) return this;
        
        const userData = this.getUserData();
        userData.preferences = { ...userData.preferences, ...prefs };
        this.saveUserData(userData);
        
        return this;
    },
    
    // Получить статистику пользователя
    getUserStats() {
        if (!this.isRegistered()) {
            return {
                testsTaken: 0,
                totalItemsInCollections: 0,
                registered: false
            };
        }
        
        const userData = this.getUserData();
        const collections = userData.collections || {};
        
        const totalItems = Object.values(collections).reduce((sum, collection) => {
            return sum + (Array.isArray(collection) ? collection.length : 0);
        }, 0);
        
        return {
            testsTaken: userData.quizHistory?.length || 0,
            totalItemsInCollections: totalItems,
            registered: true,
            memberSince: userData.registrationDate
        };
    }
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
}

// Автоматическая инициализация при загрузке
window.userManager = UserManager.init();