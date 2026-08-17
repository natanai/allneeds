import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { App } from './app/App';
import './styles/tokens.css';
import './styles/global.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Unable to find the application root.');
}

const basename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL;

createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
