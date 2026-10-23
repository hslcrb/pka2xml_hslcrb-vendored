import type { ElectronAPI } from '../shared/contracts.js'

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
