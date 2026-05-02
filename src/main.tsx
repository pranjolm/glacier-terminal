import React from 'react';
import ReactDOM from 'react-dom/client';
import { invoke } from '@tauri-apps/api/core';
import App from './App';
import './styles/global.css';

declare global {
  var __HOME__: string | undefined;
}

// Fetch home dir once at startup so all components can use globalThis.__HOME__
invoke<string>('get_home_dir').then((home) => {
  globalThis.__HOME__ = home;
}).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
