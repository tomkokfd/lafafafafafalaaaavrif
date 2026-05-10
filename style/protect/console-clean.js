/**
 * Очистка консоли - показывает только одну ошибку "Hello"
 */

(function() {
  'use strict';

  // Сохраняем оригинальные методы
  var originalError = console.error;

  // Переопределяем все методы console
  console.log = function() {};
  console.info = function() {};
  console.warn = function() {};
  console.debug = function() {};
  console.trace = function() {};
  console.dir = function() {};
  console.dirxml = function() {};
  console.group = function() {};
  console.groupCollapsed = function() {};
  console.groupEnd = function() {};
  console.time = function() {};
  console.timeEnd = function() {};
  console.timeLog = function() {};
  console.assert = function() {};
  console.clear = function() {};
  console.count = function() {};
  console.countReset = function() {};
  console.table = function() {};
  console.profile = function() {};
  console.profileEnd = function() {};
  console.timeStamp = function() {};

  // Переопределяем console.error чтобы показывать только нашу ошибку
  var errorShown = false;
  console.error = function() {
    if (!errorShown) {
      errorShown = true;
      originalError.call(console, 'Access denied');
    }
  };

  // Показываем ошибку при загрузке
  setTimeout(function() {
    console.error('Access denied');
  }, 100);

  // Блокируем попытки восстановить console
  Object.freeze(console);

})();
