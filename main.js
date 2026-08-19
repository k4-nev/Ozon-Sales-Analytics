const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function dataDir(){ return path.join(app.getPath('userData'), 'store'); }
function ensureDir(){ try{ fs.mkdirSync(dataDir(), { recursive: true }); }catch(e){} }
function fileFor(key){ return path.join(dataDir(), encodeURIComponent(String(key)) + '.json'); }

ipcMain.on('store:get', (e, key) => {
  try { e.returnValue = fs.readFileSync(fileFor(key), 'utf8'); }
  catch (err) { e.returnValue = null; }
});
ipcMain.on('store:set', (e, arg) => {
  try { ensureDir(); fs.writeFileSync(fileFor(arg.key), String(arg.value), 'utf8'); e.returnValue = true; }
  catch (err) { e.returnValue = false; }
});
ipcMain.on('store:remove', (e, key) => {
  try { fs.unlinkSync(fileFor(key)); e.returnValue = true; }
  catch (err) { e.returnValue = false; }
});

ipcMain.handle('dialog:save', async (e, arg) => {
  try {
    const win = BrowserWindow.getFocusedWindow();
    const res = await dialog.showSaveDialog(win, {
      title: 'Экспорт данных',
      defaultPath: arg.name || 'ozon-analytics-backup.json',
      filters: [{ name: 'Данные приложения', extensions: ['json'] }]
    });
    if (res.canceled || !res.filePath) return { canceled: true };
    fs.writeFileSync(res.filePath, String(arg.text), 'utf8');
    return { ok: true, path: res.filePath };
  } catch (err) { return { ok: false, error: String(err) }; }
});

ipcMain.handle('dialog:open', async () => {
  try {
    const win = BrowserWindow.getFocusedWindow();
    const res = await dialog.showOpenDialog(win, {
      title: 'Импорт данных',
      properties: ['openFile'],
      filters: [{ name: 'Данные приложения', extensions: ['json'] }]
    });
    if (res.canceled || !res.filePaths || !res.filePaths[0]) return { canceled: true };
    const text = fs.readFileSync(res.filePaths[0], 'utf8');
    return { ok: true, text };
  } catch (err) { return { ok: false, error: String(err) }; }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1320, height: 880, minWidth: 900, minHeight: 600,
    backgroundColor: '#EAEEEC', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    title: 'Аналитика магазина',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
