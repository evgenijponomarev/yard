const electron = require('electron');
const path = require('path');

const config = require('./config');

const app = electron.app; // Модуль контролирующей жизненный цикл нашего приложения.
const BrowserWindow = electron.BrowserWindow; // Модуль создающий браузерное окно.
const globalShortcut = electron.globalShortcut;

let mainWindow = null;
let closing = false;

const functioning = app.makeSingleInstance(() => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
  }
});

if (functioning) {
  app.quit();
}

function hide() {
  if (process.platform === 'darwin') {
    app.hide();
  } else {
    mainWindow.hide();
  }
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    hide();
  } else {
    mainWindow.show();
  }
}

function buildMenu() {
  return electron.Menu.buildFromTemplate([
    {
      label: mainWindow.isVisible() ? 'Hide' : 'Show',
      click: () => toggleWindow(),
    },
    {
      type: 'separator',
    },
    {
      role: 'quit',
    },
  ]);
}

function createTrayIcon() {
  const tray = new electron.Tray(path.join(__dirname, 'icon.png'));

  tray.on('click', toggleWindow);

  tray.setToolTip('Yandex radio');
  tray.setContextMenu(buildMenu());
  mainWindow.on('show', () => {
    tray.setContextMenu(buildMenu());
  });
  mainWindow.on('hide', () => {
    tray.setContextMenu(buildMenu());
  });
}

function registerShortcuts() {
  const shortcutsConfig = config.get('shortcuts');
  globalShortcut.register(shortcutsConfig.toggleWindow, () => {
    toggleWindow();
  });

  globalShortcut.register(shortcutsConfig.pausePlay, () => {
    mainWindow.webContents.executeJavaScript('document.querySelector(".player-controls__play").click()');
  });
}

function createWindow() {
  const windowState = config.get('windowState');
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    icon: process.platform === 'linux' && path.join(__dirname, 'icon.png'),
    frame: true,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(config.get('url'));

  mainWindow.on('close', event => {
    if (closing) {
      mainWindow = null;
    } else {
      event.preventDefault();
      hide();
    }
  });

  mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
    config.set('url', url);
  });

  mainWindow.setMenu(null);

  app.on('activate', () => {
    mainWindow.show();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  app.on('before-quit', () => {
    closing = true;

    if (!mainWindow.isFullScreen()) {
      config.set('windowState', mainWindow.getBounds());
    }
  });

  createTrayIcon();
  registerShortcuts();
}

app.on('ready', createWindow);
