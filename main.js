// Modules to control application life and create native browser window
import { app, BrowserWindow, shell, session } from 'electron';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import fetch from 'cross-fetch'; // required 'fetch'

const streamingServices = {
  youtube: {
    appUrl: 'https://youtube.com/tv',
    userAgent: 'Mozilla/5.0 (PS4; Leanback Shell) Gecko/20100101 Firefox/65.0 LeanbackShell/01.00.01.75 Sony PS4/ (PS4, , no, CH)',
    zoomFactor: 0.5,
  },
  // Add other services here
};

function getServiceName() {
  // Logic to determine the service name
  return 'youtube';
}

function createWindow() {
  let serviceName, appUrl, userAgent, zoomFactor;

  ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInSession(session.defaultSession);
  });

  if (process.env.APP_URL) {
    // user provided manual APP_URL override, use it instead
    appUrl = process.env.APP_URL;

    // other manual overrides
    if (process.env.USER_AGENT) userAgent = process.env.USER_AGENT;
    if (process.env.ZOOM_FACTOR)
      zoomFactor = parseFloat(process.env.ZOOM_FACTOR);
  } else {
    serviceName = getServiceName();

    if (serviceName === "default") {
      // render index.html, since no appName was provided
      const win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1280,
        minHeight: 720,
        maxWidth: 1280,
        maxHeight: 720,
        fullscreen: false,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      win.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: "deny" };
      });
    }

    ({ appUrl, userAgent, zoomFactor } = streamingServices[serviceName] || {});
  }

  const win = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // pressing alt can bring up the menu bar even when its hidden. This accounts for that and disables it entirely
  win.setMenu(null);

  win.loadURL(
    appUrl,
    userAgent?.length
      ? {
          userAgent,
        }
      : {},
  );

  if (zoomFactor && zoomFactor > 0) {
    win.webContents.on("did-finish-load", () => {
      win.webContents.setZoomFactor(zoomFactor);
    });
  }

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});