/// <reference types="vite/client" />

interface Window {
  Hands: new (config: { locateFile: (file: string) => string }) => any;
  Camera: new (video: HTMLVideoElement, config: any) => any;
}
