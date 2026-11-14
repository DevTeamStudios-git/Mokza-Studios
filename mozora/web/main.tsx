import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'virtual:mozora-host-tokens.css';
import { App } from './App';
import './mozora.css';

const root = document.getElementById('mozora-root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
