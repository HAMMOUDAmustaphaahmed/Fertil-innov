import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App, { preloadRoute } from './App.jsx';
import { SiteProvider } from './site/SiteProvider.jsx';
import { ESPACE_PATH } from './data/infos.js';
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

// Espace propriétaire : le serveur renvoie le gabarit de l'accueil (pré-rendu) pour cette adresse. On le vide avant
// d'afficher l'espace, au lieu de tenter de « réveiller » une page qui n'est pas la bonne (index.html le masque déjà).
const path = window.location.pathname;
const espace = path === ESPACE_PATH || path.startsWith(`${ESPACE_PATH}/`) || path.startsWith('/admin');
if (espace) { root.innerHTML = ''; delete root.dataset.prerendered; }

// Page pré-rendue (SEO) → hydratation ; sinon rendu classique.
if (root.hasChildNodes() && root.dataset.prerendered === '1') preloadRoute(window.location.pathname).then(() => ReactDOM.hydrateRoot(root, app));
else ReactDOM.createRoot(root).render(app);
