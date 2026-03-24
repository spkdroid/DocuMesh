import { app, BrowserWindow, protocol, net, shell } from 'electron';
import path from 'path';
import fs from 'fs';

const isDev = !app.isPackaged;
const DIST_PATH = path.join(__dirname, '../dist');
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

// Custom protocol for serving built files (supports client-side routing)
const PROTOCOL_SCHEME = 'docmesh';

if (!isDev) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PROTOCOL_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'DocMesh',
    icon: path.join(__dirname, '../public/docmesh.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
  });

  // Open external links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL(DEV_URL);
  } else {
    win.loadURL(`${PROTOCOL_SCHEME}://app/index.html`);
  }

  return win;
}

app.whenReady().then(() => {
  // Register custom protocol to serve built files in production
  if (!isDev) {
    protocol.handle(PROTOCOL_SCHEME, (request) => {
      const url = new URL(request.url);
      let filePath = path.join(DIST_PATH, decodeURIComponent(url.pathname));

      // If the file doesn't exist, serve index.html (SPA client-side routing)
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_PATH, 'index.html');
      }

      return net.fetch(`file://${filePath}`);
    });
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
