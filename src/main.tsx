import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGlobalLogCleanup } from './lib/userAuthStore';

// Purge persistent debug logs and temporary sync cache on startup
initGlobalLogCleanup();

createRoot(document.getElementById('root')!).render(<App />);
