import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App, { preloadRoute } from './App.jsx';
import { SiteProvider } from './site/SiteProvider.jsx';
import './index.css';

const root = document.getElementById('root');
const app = (
  <React.StrictMode>
    <HelmetProvider>
      <SiteProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SiteProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// Page pré-rendue (SEO) → hydratation ; sinon rendu classique.
if (root.hasChildNodes() && root.dataset.prerendered === '1') preloadRoute(window.location.pathname).then(() => ReactDOM.hydrateRoot(root, app));
else ReactDOM.createRoot(root).render(app);
