// Система аналитики для отслеживания посетителей
(function() {
    'use strict';

    // Функция для определения типа устройства
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        const screen = {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            colorDepth: window.screen.colorDepth,
            pixelDepth: window.screen.pixelDepth
        };

        let deviceType = 'Unknown';
        let deviceModel = 'Unknown';
        let os = 'Unknown';
        let browser = 'Unknown';

        // Определение ОС
        if (ua.match(/iPhone/i)) {
            deviceType = 'iPhone';
            os = 'iOS';
            // Попытка определить модель iPhone
            if (ua.match(/iPhone\s?OS\s?(\d+)/i)) {
                const version = ua.match(/iPhone\s?OS\s?(\d+)/i)[1];
                os = `iOS ${version}`;
            }
            // Определение модели по разрешению экрана
            if (screen.width === 428 && screen.height === 926) deviceModel = 'iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max';
            else if (screen.width === 393 && screen.height === 852) deviceModel = 'iPhone 14 Pro / 15 Pro / 16 Pro';
            else if (screen.width === 390 && screen.height === 844) deviceModel = 'iPhone 13 Pro / 14 / 15 / 16';
            else if (screen.width === 375 && screen.height === 812) deviceModel = 'iPhone X / XS / 11 Pro';
            else if (screen.width === 414 && screen.height === 896) deviceModel = 'iPhone XR / 11 / 11 Pro Max';
            else if (screen.width === 414 && screen.height === 736) deviceModel = 'iPhone 6 Plus / 7 Plus / 8 Plus';
            else if (screen.width === 375 && screen.height === 667) deviceModel = 'iPhone 6 / 7 / 8';
            else deviceModel = 'iPhone (Unknown Model)';
        } else if (ua.match(/iPad/i)) {
            deviceType = 'iPad';
            os = 'iOS';
            deviceModel = 'iPad';
        } else if (ua.match(/Android/i)) {
            deviceType = 'Android';
            os = 'Android';
            const androidVersion = ua.match(/Android\s([\d.]+)/i);
            if (androidVersion) os = `Android ${androidVersion[1]}`;
            // Попытка определить модель Android
            const modelMatch = ua.match(/;\s*([^)]+)\s*\)/i);
            if (modelMatch) deviceModel = modelMatch[1].trim();
        } else if (ua.match(/Windows/i)) {
            deviceType = 'Desktop';
            os = 'Windows';
            if (ua.match(/Windows NT 10.0/i)) os = 'Windows 10/11';
            else if (ua.match(/Windows NT 6.3/i)) os = 'Windows 8.1';
            else if (ua.match(/Windows NT 6.2/i)) os = 'Windows 8';
            else if (ua.match(/Windows NT 6.1/i)) os = 'Windows 7';
        } else if (ua.match(/Macintosh/i)) {
            deviceType = 'Desktop';
            os = 'macOS';
            if (ua.match(/Mac OS X 10[._](\d+)/i)) {
                const version = ua.match(/Mac OS X 10[._](\d+)/i)[1];
                os = `macOS 10.${version}`;
            }
        } else if (ua.match(/Linux/i)) {
            deviceType = 'Desktop';
            os = 'Linux';
        }

        // Определение браузера
        if (ua.match(/Chrome/i) && !ua.match(/Edg|OPR|Samsung/i)) {
            browser = 'Chrome';
            const chromeVersion = ua.match(/Chrome\/([\d.]+)/i);
            if (chromeVersion) browser = `Chrome ${chromeVersion[1].split('.')[0]}`;
        } else if (ua.match(/Safari/i) && !ua.match(/Chrome/i)) {
            browser = 'Safari';
            const safariVersion = ua.match(/Version\/([\d.]+)/i);
            if (safariVersion) browser = `Safari ${safariVersion[1].split('.')[0]}`;
        } else if (ua.match(/Firefox/i)) {
            browser = 'Firefox';
            const firefoxVersion = ua.match(/Firefox\/([\d.]+)/i);
            if (firefoxVersion) browser = `Firefox ${firefoxVersion[1].split('.')[0]}`;
        } else if (ua.match(/Edg/i)) {
            browser = 'Edge';
            const edgeVersion = ua.match(/Edg\/([\d.]+)/i);
            if (edgeVersion) browser = `Edge ${edgeVersion[1].split('.')[0]}`;
        } else if (ua.match(/OPR/i)) {
            browser = 'Opera';
        } else if (ua.match(/Samsung/i)) {
            browser = 'Samsung Internet';
        }

        return {
            deviceType,
            deviceModel,
            os,
            browser,
            screen,
            userAgent: ua,
            language: navigator.language || navigator.userLanguage,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset()
        };
    }

    // Функция для получения IP-адреса
    function getIPAddress() {
        return new Promise((resolve) => {
            // Пробуем несколько API для надежности
            const apis = [
                'https://api.ipify.org?format=json',
                'https://api64.ipify.org?format=json',
                'https://ipapi.co/json/'
            ];

            let attempts = 0;
            const maxAttempts = apis.length;

            function tryAPI(index) {
                if (index >= maxAttempts) {
                    resolve({ ip: 'Unknown', location: 'Unknown' });
                    return;
                }

                fetch(apis[index])
                    .then(response => response.json())
                    .then(data => {
                        if (data.ip) {
                            resolve({
                                ip: data.ip,
                                location: data.country ? `${data.country}, ${data.city || ''}`.trim() : 'Unknown',
                                country: data.country || 'Unknown',
                                city: data.city || 'Unknown',
                                region: data.region || 'Unknown',
                                isp: data.org || data.isp || 'Unknown'
                            });
                        } else {
                            tryAPI(index + 1);
                        }
                    })
                    .catch(() => {
                        tryAPI(index + 1);
                    });
            }

            tryAPI(0);
        });
    }

    // Функция для получения дополнительной информации
    function getAdditionalInfo() {
        return {
            referrer: document.referrer || 'Direct',
            page: window.location.pathname,
            fullUrl: window.location.href,
            timestamp: new Date().toISOString(),
            localTime: new Date().toLocaleString('ru-RU'),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            pixelRatio: window.devicePixelRatio || 1
        };
    }

    // Функция для сохранения данных в localStorage
    function saveToLocalStorage(visitorData) {
        try {
            const existingData = JSON.parse(localStorage.getItem('visitorAnalytics') || '[]');
            existingData.push(visitorData);
            
            // Ограничиваем количество записей (последние 100)
            if (existingData.length > 100) {
                existingData.shift();
            }
            
            localStorage.setItem('visitorAnalytics', JSON.stringify(existingData));
            localStorage.setItem('lastVisit', JSON.stringify(visitorData));
        } catch (e) {
            console.error('Ошибка сохранения в localStorage:', e);
        }
    }

    // Функция для отправки данных на сервер (если настроен)
    function sendToServer(visitorData) {
        // Раскомментируйте и настройте URL вашего сервера
        /*
        const serverUrl = 'https://your-server.com/api/analytics';
        
        fetch(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(visitorData)
        }).catch(err => {
            console.error('Ошибка отправки данных на сервер:', err);
        });
        */
    }

    // Основная функция сбора данных
    async function collectAnalytics() {
        const deviceInfo = getDeviceInfo();
        const additionalInfo = getAdditionalInfo();
        const ipInfo = await getIPAddress();

        const visitorData = {
            ...deviceInfo,
            ...ipInfo,
            ...additionalInfo,
            sessionId: generateSessionId(),
            visitNumber: getVisitNumber()
        };

        // Сохраняем в localStorage
        saveToLocalStorage(visitorData);

        // Отправляем на сервер (если настроен)
        sendToServer(visitorData);

        // Выводим в консоль для отладки
        console.log('📊 Аналитика посетителя:', visitorData);

        return visitorData;
    }

    // Генерация уникального ID сессии
    function generateSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    // Подсчет номера визита
    function getVisitNumber() {
        let visitCount = parseInt(localStorage.getItem('visitCount') || '0');
        visitCount++;
        localStorage.setItem('visitCount', visitCount.toString());
        return visitCount;
    }

    // Функция для получения всех сохраненных данных
    function getAllAnalytics() {
        try {
            return JSON.parse(localStorage.getItem('visitorAnalytics') || '[]');
        } catch (e) {
            console.error('Ошибка чтения из localStorage:', e);
            return [];
        }
    }

    // Функция для экспорта данных
    function exportAnalytics() {
        const data = getAllAnalytics();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Инициализация при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(collectAnalytics, 1000);
        });
    } else {
        setTimeout(collectAnalytics, 1000);
    }

    // Отслеживание событий (опционально)
    let interactionCount = 0;
    const trackInteraction = () => {
        interactionCount++;
        const lastData = JSON.parse(localStorage.getItem('lastVisit') || '{}');
        lastData.interactions = interactionCount;
        localStorage.setItem('lastVisit', JSON.stringify(lastData));
    };

    document.addEventListener('click', trackInteraction);
    document.addEventListener('touchstart', trackInteraction, { passive: true });

    // Экспорт функций для использования в консоли
    window.analytics = {
        collect: collectAnalytics,
        getAll: getAllAnalytics,
        export: exportAnalytics,
        getLast: () => JSON.parse(localStorage.getItem('lastVisit') || '{}')
    };

})();

