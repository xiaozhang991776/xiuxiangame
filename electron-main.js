// 仙途·轮回诀 —— Electron 主进程（桌面版入口）
// 作用：开一个浏览器窗口，加载现有的 index.html（纯前端游戏无需改动）。
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    title: '仙途·轮回诀',
    icon: path.join(__dirname, 'wechat.png'),
    webPreferences: {
      nodeIntegration: false,   // 不让网页拿到 Node 权限，安全
      contextIsolation: true,    // 隔离上下文，避免 XSS 风险
      partition: 'persist:xiantu-game' // 命名存储分区，保证存档(localStorage)跨启动保留
    }
  });

  // 加载同目录下的游戏主页（相对路径，electron-builder 打包后会一并带上）
  win.loadFile(path.join(__dirname, 'index.html'));

  // 隐藏菜单栏，更像原生游戏
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

// 关掉所有窗口就退出（mac 例外，保留菜单栏激活行为）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
