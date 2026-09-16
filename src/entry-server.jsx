// Point d'entrée du pré-rendu (scripts/prerender.mjs) : rend une URL en HTML statique
// avec la configuration du site, pour Google et les robots IA (qui n'exécutent pas le JS).
// renderToPipeableStream + onAllReady : attend les pages chargées en lazy avant d'émettre.
import React from 'react';
import { Writable } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import { SiteProvider } from './site/SiteProvider.jsx';

export function render(url, site) {
  const helmetContext = {};
  return new Promise((resolve, reject) => {
    const chunks = [];
    const sink = new Writable({ write(c, _e, cb) { chunks.push(c); cb(); } });
    const { pipe } = renderToPipeableStream(
      <HelmetProvider context={helmetContext}>
        <SiteProvider initial={site}>
          <StaticRouter location={url}>
            <App ssr />
          </StaticRouter>
        </SiteProvider>
      </HelmetProvider>,
      {
        onAllReady() {
          pipe(sink);
          sink.on('finish', () => {
            const { helmet } = helmetContext;
            const head = helmet ? [helmet.title.toString(), helmet.meta.toString(), helmet.link.toString(), helmet.script.toString()].join('\n') : '';
            resolve({ html: Buffer.concat(chunks).toString('utf8'), head, htmlAttrs: helmet ? helmet.htmlAttributes.toString() : '' });
          });
        },
        onShellError: reject,
        onError(e) { console.error('[prerender]', url, e?.message || e); },
      },
    );
  });
}
