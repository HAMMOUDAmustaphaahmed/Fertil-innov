// Point d'entrée pour les hébergeurs qui démarrent l'application avec require() (Passenger, cPanel
// « Setup Node.js App » : indiquer « app.cjs » comme fichier de démarrage). Le vrai serveur est server.mjs.
import('./server.mjs').catch((e) => { console.error(e); process.exit(1); });
