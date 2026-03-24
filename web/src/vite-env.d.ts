/// <reference types="vite/client" />

interface ElectronAPI {
  isElectron: boolean;
  platform: NodeJS.Platform;
}

interface Window {
  electronAPI?: ElectronAPI;
}
