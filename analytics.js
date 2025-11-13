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

    // Функция для получения IP-адреса и местоположения
    function getIPAddress() {
        return new Promise((resolve) => {
            // Сначала получаем IP - пробуем несколько источников
            const ipAPIs = [
                'https://api.ipify.org?format=json',
                'https://api64.ipify.org?format=json',
                'https://api.ipify.org?format=json'
            ];
            
            let ipAttempts = 0;
            const maxIpAttempts = ipAPIs.length;
            
            function tryGetIP(apiIndex) {
                if (apiIndex >= maxIpAttempts) {
                    resolve({ ip: 'Unknown', location: 'Unknown' });
                    return;
                }
                
                fetch(ipAPIs[apiIndex], {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                })
                .then(response => {
                    if (!response.ok) throw new Error('IP API error');
                    return response.json();
                })
                .then(ipData => {
                    const ip = ipData.ip;
                    
                    if (!ip) {
                        tryGetIP(apiIndex + 1);
                        return;
                    }

                    // Теперь получаем данные о местоположении по IP
                    // Пробуем несколько API для получения координат (приоритет для мобильных)
                    const locationAPIs = [
                        `https://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`,
                        `https://ipapi.co/${ip}/json/`,
                        `https://freeipapi.com/api/json/${ip}`,
                        `https://ipwho.is/${ip}`
                    ];

                    let locationAttempts = 0;
                    const maxLocationAttempts = locationAPIs.length;

                    function tryLocationAPI(apiIndex) {
                        if (apiIndex >= maxLocationAttempts) {
                            // Если не удалось получить данные, возвращаем хотя бы IP
                            resolve({
                                ip: ip,
                                location: 'Unknown',
                                country: 'Unknown',
                                city: 'Unknown',
                                region: 'Unknown',
                                isp: 'Unknown',
                                latitude: null,
                                longitude: null,
                                timezone: null
                            });
                            return;
                        }

                        fetch(locationAPIs[apiIndex], {
                            method: 'GET',
                            mode: 'cors',
                            cache: 'no-cache',
                            headers: {
                                'Accept': 'application/json'
                            }
                        })
                            .then(response => {
                                if (!response.ok) throw new Error('Location API error');
                                return response.json();
                            })
                            .then(data => {
                                // Обработка для ip-api.com (приоритетный для мобильных)
                                if (data.status === 'success' || (data.countryCode && data.city)) {
                                    const country = data.country || 'Unknown';
                                    const city = data.city || 'Unknown';
                                    const region = data.regionName || data.region || 'Unknown';
                                    
                                    resolve({
                                        ip: ip,
                                        location: country && city ? `${country}, ${city}`.trim() : (country || 'Unknown'),
                                        country: country,
                                        city: city,
                                        region: region,
                                        isp: data.isp || data.org || data.as || 'Unknown',
                                        latitude: data.lat || null,
                                        longitude: data.lon || null,
                                        timezone: data.timezone || null
                                    });
                                    return;
                                }
                                
                                // Обработка для ipapi.co
                                if (data.country || data.countryCode || data.country_name) {
                                    const country = data.country_name || data.country || 'Unknown';
                                    const city = data.city || 'Unknown';
                                    const region = data.region || data.regionName || 'Unknown';
                                    
                                    resolve({
                                        ip: ip,
                                        location: country && city ? `${country}, ${city}`.trim() : (country || 'Unknown'),
                                        country: country,
                                        city: city,
                                        region: region,
                                        isp: data.org || data.isp || data.as || 'Unknown',
                                        latitude: data.latitude || data.lat || null,
                                        longitude: data.longitude || data.lon || null,
                                        timezone: data.timezone || null
                                    });
                                    return;
                                }
                                
                                // Обработка для ipwho.is
                                if (data.success !== false && (data.country || data.city)) {
                                    resolve({
                                        ip: ip,
                                        location: data.country && data.city ? `${data.country}, ${data.city}`.trim() : (data.country || 'Unknown'),
                                        country: data.country || 'Unknown',
                                        city: data.city || 'Unknown',
                                        region: data.region || data.regionName || 'Unknown',
                                        isp: data.isp || data.org || data.connection?.isp || 'Unknown',
                                        latitude: data.latitude || data.lat || null,
                                        longitude: data.longitude || data.lon || null,
                                        timezone: data.timezone?.id || data.timezone || null
                                    });
                                    return;
                                }
                                
                                // Если данные неполные, пробуем следующий API
                                tryLocationAPI(apiIndex + 1);
                            })
                            .catch((error) => {
                                console.log('Location API error:', locationAPIs[apiIndex], error);
                                tryLocationAPI(apiIndex + 1);
                            });
                    }

                    tryLocationAPI(0);
                })
                .catch((error) => {
                    console.log('IP API error:', ipAPIs[apiIndex], error);
                    tryGetIP(apiIndex + 1);
                });
            }
            
            tryGetIP(0);
        });
    }

    // Функция для определения имени страницы
    function getPageNameFromPath(pathname) {
        // Проверяем полный URL для более точного определения
        const fullUrl = window.location.href;
        const fileName = window.location.pathname.split('/').pop() || '';
        
        // Если в URL есть gallery, это gallery
        if (fullUrl.includes('gallery') || pathname.includes('gallery') || fileName.includes('gallery')) {
            return 'gallery';
        }
        
        // Если путь пустой, корневой, или заканчивается на /, это index
        if (!pathname || pathname === '/' || pathname === '' || pathname.endsWith('/')) {
            return 'index';
        }
        
        // Убираем начальный и конечный слэш
        const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
        
        // Если путь пустой после очистки, это index
        if (!cleanPath || cleanPath === '') {
            return 'index';
        }
        
        // Разбиваем путь на части
        const pathParts = cleanPath.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        
        // Убираем расширение и параметры
        const nameWithoutExt = lastPart.split('.')[0];
        const nameWithoutParams = nameWithoutExt.split('?')[0];
        
        // Если это index или gallery, возвращаем
        if (nameWithoutParams === 'index' || nameWithoutParams === 'gallery') {
            return nameWithoutParams;
        }
        
        // Если путь содержит gallery, это gallery
        if (cleanPath.includes('gallery') || lastPart.includes('gallery')) {
            return 'gallery';
        }
        
        // Если путь содержит index или это корень, это index
        if (cleanPath.includes('index') || lastPart.includes('index')) {
            return 'index';
        }
        
        // Если имя файла пустое или это корневая страница, это index
        if (!lastPart || lastPart === '' || fileName === '' || fileName === 'index.html') {
            return 'index';
        }
        
        // По умолчанию index (для всех остальных случаев)
        return 'index';
    }

    // Функция для определения типа источника перехода
    function getReferrerInfo() {
        const referrer = document.referrer || '';
        const currentUrl = window.location.href;
        const currentDomain = window.location.hostname;
        
        // Если referrer пустой, это прямой вход
        if (!referrer || referrer === '') {
            return {
                type: 'Direct',
                source: 'Прямой вход',
                url: '',
                domain: '',
                isInternal: false
            };
        }
        
        try {
            const referrerUrl = new URL(referrer);
            const referrerDomain = referrerUrl.hostname;
            
            // Проверяем, внутренний ли это переход (с того же сайта)
            const isInternal = referrerDomain === currentDomain || 
                              referrerDomain.replace('www.', '') === currentDomain.replace('www.', '');
            
            if (isInternal) {
                // Внутренний переход
                const referrerPath = referrerUrl.pathname;
                const referrerPage = getPageNameFromPath(referrerPath);
                return {
                    type: 'Internal',
                    source: `Внутренний переход (${referrerPage})`,
                    url: referrer,
                    domain: referrerDomain,
                    page: referrerPage,
                    isInternal: true
                };
            } else {
                // Внешний источник
                let sourceType = 'Внешний сайт';
                
                // Определяем тип источника
                if (referrerDomain.includes('google')) {
                    sourceType = 'Google';
                } else if (referrerDomain.includes('yandex')) {
                    sourceType = 'Yandex';
                } else if (referrerDomain.includes('facebook')) {
                    sourceType = 'Facebook';
                } else if (referrerDomain.includes('instagram')) {
                    sourceType = 'Instagram';
                } else if (referrerDomain.includes('twitter') || referrerDomain.includes('x.com')) {
                    sourceType = 'Twitter/X';
                } else if (referrerDomain.includes('vk.com')) {
                    sourceType = 'VKontakte';
                } else if (referrerDomain.includes('telegram')) {
                    sourceType = 'Telegram';
                } else if (referrerDomain.includes('whatsapp')) {
                    sourceType = 'WhatsApp';
                } else if (referrerDomain.includes('mail')) {
                    sourceType = 'Email';
                }
                
                return {
                    type: 'External',
                    source: sourceType,
                    url: referrer,
                    domain: referrerDomain,
                    isInternal: false
                };
            }
        } catch (e) {
            // Если не удалось распарсить URL
            return {
                type: 'Unknown',
                source: 'Неизвестный источник',
                url: referrer,
                domain: '',
                isInternal: false
            };
        }
    }

    // Функция для получения дополнительной информации
    function getAdditionalInfo() {
        const pathname = window.location.pathname;
        const pageName = getPageNameFromPath(pathname);
        const referrerInfo = getReferrerInfo();
        
        // Проверяем параметры URL (UTM и другие)
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source');
        const utmMedium = urlParams.get('utm_medium');
        const utmCampaign = urlParams.get('utm_campaign');
        const refParam = urlParams.get('ref');
        
        return {
            referrer: document.referrer || 'Direct',
            referrerInfo: referrerInfo,
            page: pageName, // Сохраняем короткое имя страницы
            pagePath: pathname, // Сохраняем полный путь для справки
            fullUrl: window.location.href,
            timestamp: new Date().toISOString(),
            localTime: new Date().toLocaleString('ru-RU'),
            utm: {
                source: utmSource || null,
                medium: utmMedium || null,
                campaign: utmCampaign || null,
                ref: refParam || null
            },
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
        console.log('📍 Страница:', visitorData.page, '| Путь:', visitorData.pagePath);
        console.log('🌍 Местоположение:', visitorData.location, '| IP:', visitorData.ip);
        console.log('📱 Устройство:', visitorData.deviceType, '| Модель:', visitorData.deviceModel);
        console.log('🔗 Источник перехода:', visitorData.referrerInfo?.source || visitorData.referrer || 'Direct', '| Тип:', visitorData.referrerInfo?.type || 'Unknown');
        if (visitorData.utm && (visitorData.utm.source || visitorData.utm.ref)) {
            console.log('📊 UTM метки:', visitorData.utm);
        }

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

