const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    loadTasks: () => ipcRenderer.invoke('load-tasks'),
    saveTasks: (tasks) => ipcRenderer.invoke('save-tasks', tasks)
});