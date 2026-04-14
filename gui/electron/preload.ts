import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (options: any) => ipcRenderer.invoke('dialog:openFile', options),
  execute: (args: string[]) => ipcRenderer.invoke('execute-pka2xml', args),
  onMessage: (callback: any) => ipcRenderer.on('main-process-message', callback)
})
