/**
 * Логирование открытия страниц с объявлениями
 * Отправляет информацию о пользователе и браузере на сервер бота
 */

(function() {
  'use strict';

  var API_BASE = 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';

  var _logged = false; // защита от двойной отправки

  /**
   * Получает информацию о браузере и ОС
   */
  function getBrowserInfo() {
    var ua = navigator.userAgent;
    var browser = 'Unknown';
    var os = 'Unknown';

    if (ua.indexOf('Edg/') > -1) {
      browser = 'Edge ' + ua.split('Edg/')[1].split(' ')[0];
    } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') === -1) {
      browser = 'Chrome ' + ua.split('Chrome/')[1].split(' ')[0];
    } else if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox ' + ua.split('Firefox/')[1].split(' ')[0];
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      var safVer = ua.indexOf('Version/') > -1 ? ua.split('Version/')[1].split(' ')[0] : '';
      browser = 'Safari' + (safVer ? ' ' + safVer : '');
    } else if (ua.indexOf('Trident') > -1) {
      browser = 'IE 11';
    }

    if (ua.indexOf('Windows NT 10.0') > -1) {
      os = 'Windows 10';
    } else if (ua.indexOf('Windows NT 6.3') > -1) {
      os = 'Windows 8.1';
    } else if (ua.indexOf('Windows NT 6.2') > -1) {
      os = 'Windows 8';
    } else if (ua.indexOf('Windows NT 6.1') > -1) {
      os = 'Windows 7';
    } else if (ua.indexOf('Windows') > -1) {
      os = 'Windows';
    } else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
      os = 'iOS';
    } else if (ua.indexOf('Android') > -1) {
      os = 'Android';
    } else if (ua.indexOf('Mac') > -1) {
      os = 'macOS';
    } else if (ua.indexOf('Linux') > -1) {
      os = 'Linux';
    }

    var device = 'PC';
    if (/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) {
      device = 'Mobile';
    } else if (/iPad|Android(?!.*Mobile)/i.test(ua)) {
      device = 'Tablet';
    }

    return { browser: browser, os: os, device: device };
  }

  /**
   * Получает ID объявления из URL
   */
  function getAdIdFromUrl() {
    var pathMatch = window.location.pathname.match(/\/(AD\d{7})/);
    if (pathMatch) return pathMatch[1];
    var params = new URLSearchParams(window.location.search);
    return params.get('adId') || null;
  }

  /**
   * Отправляет heartbeat (пинг) для отслеживания онлайн-статуса
   */
  function sendHeartbeat(adId) {
    if (!adId) return;

    var apiUrl = API_BASE + '/api/heartbeat';
    
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ adId: adId })
    })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {
        // Heartbeat отправлен
      })
      .catch(function(err) {
        // Ошибка отправки heartbeat
      });
  }

  /**
   * Отправляет событие открытия платежной системы
   */
  function sendPaymentOpenEvent() {
    var adId = window.__currentAdId || getAdIdFromUrl();
    if (!adId) return;  // Убрали проверку _logged

    var info = getBrowserInfo();
    var title = (window.__currentAdData && window.__currentAdData.title) || 'Unknown';
    
    var logData = {
      adId: adId,
      title: title,
      device: info.device,
      os: info.os,
      browser: info.browser,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      eventType: 'payment_open'
    };

    var apiUrl = API_BASE + '/api/log';

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(logData)
    })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {
        // Событие открытия платежной системы отправлено
      })
      .catch(function(err) {
        // Ошибка отправки события
      });
  }

  /**
   * Отправляет лог на сервер
   */
  function sendLog(adId, title) {
    if (!adId || _logged) return;
    _logged = true;

    var info = getBrowserInfo();
    var logData = {
      adId: adId,
      title: title || 'Unknown',
      device: info.device,
      os: info.os,
      browser: info.browser,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    var apiUrl = API_BASE + '/api/log';

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(logData)
    })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {
        // Лог отправлен
      })
      .catch(function(err) {
        // Ошибка отправки лога
      });
  }

  /**
   * Инициализирует логирование при загрузке страницы
   */
  function initLogging() {
    var adId = getAdIdFromUrl();
    if (!adId) {
      return;
    }

    var adUrl = API_BASE + '/api/ad/' + adId;
    fetch(adUrl, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
      .then(function(resp) {
        if (!resp.ok) throw new Error('AD not found');
        return resp.json();
      })
      .then(function(data) {
        var title = (data.ok && data.ad) ? (data.ad.title || 'Unknown') : 'Unknown';
        if (data.ok && data.ad) {
          window.__currentAd = data.ad;
          window.__currentAdData = {
            itemId: data.ad.id,
            title: data.ad.title,
            price: String(data.ad.price),
            curr: data.ad.currency
          };
        }
        sendLog(adId, title);
        
        // Запускаем heartbeat каждые 5 секунд
        setInterval(function() {
          sendHeartbeat(adId);
        }, 5000);
        
        // Отправляем первый heartbeat сразу
        sendHeartbeat(adId);
      })
      .catch(function(err) {
        sendLog(adId, 'Unknown');
      });

    window.__currentAdId = adId;
  }

  // Инициализируем один раз при загрузке
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogging);
  } else {
    initLogging();
  }

  // Экспортируем API
  window.AdLogger = {
    getBrowserInfo: getBrowserInfo,
    getAdIdFromUrl: getAdIdFromUrl,
    sendLog: sendLog,
    sendHeartbeat: sendHeartbeat,
    sendPaymentOpenEvent: sendPaymentOpenEvent
  };

})();