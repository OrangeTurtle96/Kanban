const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_PATH = path.join(app.getPath('userData'), 'tasks.json');

// Log the DATA_PATH to the console
console.log('Data path is:', DATA_PATH);

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    win.loadFile('src/index.html');
}

app.on('ready', createWindow);

ipcMain.handle('load-tasks', async () => {
    try {
        const data = fs.readFileSync(DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Error loading tasks:', error);
        return [];
    }
});

ipcMain.handle('save-tasks', async (event, tasks) => {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(tasks, null, 2));
    } catch (error) {
        console.log('Error saving tasks:', error);
    }
});