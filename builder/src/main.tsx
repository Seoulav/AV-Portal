import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './styles.css';
import { App } from './App';
import { startTheme } from './state/theme';
import { builderStore } from './state/useBuilder';

// 그리기 전에 테마를 정한다(첫 화면 깜빡임 방지)
startTheme(builderStore, (() => { try { return window.localStorage; } catch { return null; } })(), document.documentElement);

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
