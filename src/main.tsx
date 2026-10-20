import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update for offline caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, reloading...');
  },
  onOfflineReady() {
    console.log('hypeMitra is ready to work offline!');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
