const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('fileStore', {
  get:    (key)        => ipcRenderer.sendSync('store:get', key),
  set:    (key, value) => ipcRenderer.sendSync('store:set', { key, value }),
  remove: (key)        => ipcRenderer.sendSync('store:remove', key),
  exportFile: (name, text) => ipcRenderer.invoke('dialog:save', { name, text }),
  importFile: ()           => ipcRenderer.invoke('dialog:open'),
});
