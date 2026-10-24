import { ipcRenderer, contextBridge } from 'electron'
import type { ElectronAPI } from '../shared/contracts.js'

const api: ElectronAPI = {
  getEngineInfo: () => ipcRenderer.invoke('workshop:engine'),
  chooseInput: operation => ipcRenderer.invoke('workshop:input', operation),
  chooseOutput: (operation, inputPath) => ipcRenderer.invoke('workshop:output', operation, inputPath),
  execute: request => ipcRenderer.invoke('workshop:execute', request),
  cancel: () => ipcRenderer.invoke('workshop:cancel'),
  revealOutput: () => ipcRenderer.invoke('workshop:reveal'),
}

contextBridge.exposeInMainWorld('electronAPI', Object.freeze(api))
