const electron = require('electron');
const isDev = require('electron-is-dev');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({width: 1200, height: 2000});

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  if(isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
    app.quit();
})
