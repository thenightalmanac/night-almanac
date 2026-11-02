// The Night Almanac desktop app: a secure window around the same offline app file.
const { app, BrowserWindow, shell, session } = require("electron");
const path = require("node:path");

app.setName("The Night Almanac");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 860, minWidth: 380, minHeight: 500,
    title: "The Night Almanac", backgroundColor: "#f7f1f4", show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  win.once("ready-to-show", () => win.show());
  // Links to outside websites (e.g., findahelpline.com) open in the user's normal browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file://")) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); }
  });
  win.loadFile(path.join(__dirname, "app", "night-almanac.html"));
}

app.whenReady().then(() => {
  // The app needs no camera, microphone, location or notifications.
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  // Nothing should ever be fetched from the internet.
  session.defaultSession.webRequest.onBeforeRequest((d, cb) => cb({ cancel: /^(https?|wss?):/.test(d.url) }));
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
