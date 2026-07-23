// 仙途·轮回诀 —— Electron 主进程（桌面版入口）
// 作用：开一个浏览器窗口，加载现有的 index.html（纯前端游戏无需改动）。
const { app, BrowserWindow } = require('electron');
const path = require('path');

// 单实例锁：避免重复双击打开多个游戏窗口
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  return;
}
app.on('second-instance', () => {
  if (mainWin) {
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.focus();
  }
});

let mainWin = null;

function createWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    center: true,
    title: '仙途·轮回诀',
    webPreferences: {
      nodeIntegration: false,        // 不让网页拿到 Node 权限，安全
      contextIsolation: true,        // 隔离上下文，避免 XSS 风险
      partition: 'persist:xiantu-game' // 命名存储分区，保证存档(localStorage)跨启动保留
    }
  });

  // 加载同目录下的游戏主页（相对路径，打包后会一并带上）
  mainWin.loadFile(path.join(__dirname, 'index.html'));

  // 彻底隐藏菜单栏，更像原生游戏（F12 仍可临时开开发者工具排查）
  mainWin.removeMenu();

  // 渲染进程崩溃/卡死时给个提示，而不是直接黑屏
  mainWin.webContents.on('render-process-gone', (e, details) => {
    console.error('[render-process-gone]', details);
  });

  mainWin.on('closed', () => { mainWin = null; });
}

app.whenReady().then(createWindow);

// 关掉所有窗口就退出（mac 例外，保留菜单栏激活行为）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
