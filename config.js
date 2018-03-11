const Config = require('electron-config');

module.exports = new Config({
  defaults: {
    url: 'https://radio.yandex.ru/',
    windowState: {
      width: 800,
      height: 700,
    },
    shortcuts: {
      toggleWindow: 'Alt+M',
      pausePlay: 'CommandOrControl+M',
    },
  },
});
