const { app, BrowserWindow, session, Menu, MenuItem, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const os = require('os');
const { shell } = require('electron');
const { autoUpdater } = require('electron-updater');

require('events').EventEmitter.defaultMaxListeners = 100; // Add this line

let mainWindow;
let passwordPrompt;

let language = 'hebrew'; // default language
const hebrewLabels = { menu: 'תפריט', back: 'חזור', forward: 'קדימה', refresh: 'רענן', changeToEnglish: 'שנה שפה לאנגלית', changeToHebrew: 'שנה שפה לעברית', copy: 'העתק', paste: 'הדבק', cut: 'גזור', mouse: 'עכבר' };
const englishLabels = { menu: 'Menu', back: 'Back', forward: 'Forward', refresh: 'Refresh', print: 'Print', changeToEnglish: 'Change language to English', changeToHebrew: 'Change language to Hebrew', copy: 'Copy', paste: 'Paste', cut: 'Cut', mouse: 'Mouse' };

const languageConfigPath = path.join(app.getPath('userData'), 'language.json');
const masterPasswordFile = path.join(app.getPath('userData'), 'master-password.json');
const secretKey = 'your-secret-key';

function loadLanguage() {
  try {
    const languageConfig = JSON.parse(fs.readFileSync(languageConfigPath));
    language = languageConfig.language;
  } catch (err) {
    console.log('Could not load language configuration. Using default language.')
  }
}

function saveLanguage() {
  const languageConfig = { language };
  fs.writeFileSync(languageConfigPath, JSON.stringify(languageConfig));
}

function changeLanguageToEnglish() {
  language = 'english';
  saveLanguage();
  updateLabels();
  updateMenu();
}

function changeLanguageToHebrew() {
  language = 'hebrew';
  saveLanguage();
  updateLabels();
  updateMenu();
}

function updateLabels() {
  const labels = language === 'hebrew' ? hebrewLabels : englishLabels;
  
  mainWindow.webContents.executeJavaScript(`
  if (document.getElementById('menu-label')) document.getElementById('menu-label').textContent = '${labels.menu}';
  if (document.getElementById('back-label')) document.getElementById('back-label').textContent = '${labels.back}';
  if (document.getElementById('forward-label')) document.getElementById('forward-label').textContent = '${labels.forward}';
  if (document.getElementById('refresh-label')) document.getElementById('refresh-label').textContent = '${labels.refresh}';
`);
}

function updateMenu() {
  const labels = language === 'hebrew' ? hebrewLabels : englishLabels;
  
  const template = [
    {
      label: labels.menu,
      submenu: [
        {
          label: labels.back,
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            mainWindow.webContents.goBack();
          },
        },
        {
          label: labels.forward,
          accelerator: 'CmdOrCtrl+X',
          click: () => {
            mainWindow.webContents.goForward();
          },
        },
        {
          type: 'separator',
        },
        {
          label: labels.refresh,
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.reload();
          },
        },
        {
          type: 'separator',
        },
        {
          label: labels.changeToEnglish,
          click: () => {
            changeLanguageToEnglish();
          },
        },
        {
          label: labels.changeToHebrew,
          click: () => {
            changeLanguageToHebrew();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createPasswordPrompt() {
  passwordPrompt = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  passwordPrompt.loadFile(path.join(__dirname, 'password prompt.html'));
  passwordPrompt.setMenuBarVisibility(false);
  passwordPrompt.setResizable(false);
  passwordPrompt.setMenu(null);
  passwordPrompt.setClosable(false);

  return passwordPrompt;
}

const CryptoJS = require("crypto-js");

function encrypt(text) {
  let cipherText = CryptoJS.AES.encrypt(text, secretKey).toString();
  return cipherText;
}

function decrypt(cipherText) {
  let bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  let originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
}

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: 'C:\\bh\\resources\\ico.ico', 
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      worldSafeExecuteJavaScript: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  let titleCheckInterval = setInterval(() => {
    mainWindow.webContents.executeJavaScript("document.title")
      .then((pageTitle) => {
        if (pageTitle !== '') {
          mainWindow.setTitle(pageTitle);
          clearInterval(titleCheckInterval);
        }
      });
  }, 1000); // Check every second

  mainWindow.on('close', function() {
    clearInterval(titleCheckInterval);
  });

  mainWindow.webContents.on('context-menu', (event, params) => {
    const contextMenu = new Menu();

    contextMenu.append(new MenuItem({
      role: 'copy',
      label: language === 'hebrew' ? hebrewLabels.copy : englishLabels.copy,
      accelerator: 'CmdOrCtrl+C',
    }));
    contextMenu.append(new MenuItem({
      role: 'paste',
      label: language === 'hebrew' ? hebrewLabels.paste : englishLabels.paste,
      accelerator: 'CmdOrCtrl+V',
    }));
    contextMenu.append(new MenuItem({
      type: 'separator',
    }));
    contextMenu.append(new MenuItem({
      role: 'cut',
      label: language === 'hebrew' ? hebrewLabels.cut : englishLabels.cut,
      accelerator: 'CmdOrCtrl+X',
    }));

    contextMenu.popup(mainWindow, params.x, params.y);
  });

  const template = [
    {
      label: language === 'hebrew' ? hebrewLabels.menu : englishLabels.menu,
      submenu: [
        {
          label: language === 'hebrew' ? hebrewLabels.back : englishLabels.back,
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            mainWindow.webContents.goBack();
          },
        },
        {
          label: language === 'hebrew' ? hebrewLabels.forward : englishLabels.forward,
          accelerator: 'CmdOrCtrl+X',
          click: () => {
            mainWindow.webContents.goForward();
          },
        },
        {
          type: 'separator',
        },
        {
          label: language === 'hebrew' ? hebrewLabels.refresh : englishLabels.refresh,
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.reload();
          },
        },
        {
          type: 'separator',
        },
        {
          label: language === 'hebrew' ? hebrewLabels.changeToEnglish : englishLabels.changeToEnglish,
          click: () => {
            changeLanguageToEnglish();
          },
        },
        {
          label: language === 'hebrew' ? hebrewLabels.changeToHebrew : englishLabels.changeToHebrew,
          click: () => {
            changeLanguageToHebrew();
          },
        },
      ],
    },
  ];

const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  updateLabels();
  updateMenu();
}

app.on('ready', () => {
  
  autoUpdater.checkForUpdatesAndNotify();

  const passwordCheckFilePath = path.join(app.getPath('userData'), 'password_check_file.json');
  
  if (fs.existsSync(passwordCheckFilePath)) {
    createMainWindow();
  } else {
    const passwordPrompt = createPasswordPrompt();

    ipcMain.on('submitPassword', (event, password) => {
      const hardcodedPassword = "URla26@0548446005";

      if (password === hardcodedPassword) {
        fs.writeFileSync(passwordCheckFilePath, JSON.stringify({ passwordEntered: true }));
        createMainWindow();
        passwordPrompt.hide();
      } else {
        event.sender.send('incorrectPassword');
      }
   });
  }

  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Set the save path to the user's Downloads directory
    const savePath = path.join(os.homedir(), 'Downloads', item.getFilename());
    item.setSavePath(savePath);
  
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed');
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused');
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`);
        }
      }
    });
  
    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download successfully');
        shell.openPath(savePath); // Open the file automatically
      } else {
        console.log(`Download failed: ${state}`);
      }
    });
  });
  
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
  
  setInterval(function() {
    app.relaunch();
    app.exit();
  }, 36000000);
  
  });
