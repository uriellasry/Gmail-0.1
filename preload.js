const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  submitPassword: (password) => {
    ipcRenderer.send('submitPassword', password);
  },
  navigate: (direction) => {
    ipcRenderer.send('navigate', direction);
  },
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  goBack: () => {
    ipcRenderer.send('menu-go-back');
  },
  goForward: () => {
    ipcRenderer.send('menu-go-forward');
  },
  reload: () => {
    ipcRenderer.send('menu-reload');
  },
  print: () => {
    ipcRenderer.send('menu-print');
  },
  changeToEnglish: () => {
    ipcRenderer.send('change-to-english');
  },
  changeToHebrew: () => {
    ipcRenderer.send('change-to-hebrew');
  },
  openExternal: (url) => {
    shell.openExternal(url);
  },
});

window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) {
    console.error("Form not found");
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const passwordInput = document.querySelector('#masterPassword');
    if (!passwordInput) {
      console.error("Password input not found");
      return;
    }

    const password = passwordInput.value;
    window.electron.submitPassword(password);
  });

  window.electron.on('passwordError', (message) => {
    console.error(message);
  });  

  window.electron.on('menu-go-back', () => {
    console.log('Menu go back event triggered');
  });

  window.electron.on('menu-go-forward', () => {
    console.log('Menu go forward event triggered');
  });

  window.electron.on('menu-reload', () => {
    console.log('Menu reload event triggered');
  });

  window.electron.on('menu-print', () => {
    console.log('Menu print event triggered');
  });

  window.electron.on('change-to-english', () => {
    console.log('Change to English event triggered');
  });

  window.electron.on('change-to-hebrew', () => {
    console.log('Change to Hebrew event triggered');
  });

  const webview = document.querySelector('webview');
  if (webview) {
    webview.addEventListener('new-window', (event) => {
      window.electron.openExternal(event.url);
    });
  }
});
