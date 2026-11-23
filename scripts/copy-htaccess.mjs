// Après le build : copie les règles Apache dans dist/ (hébergement mutualisé classique, voir hosting/apache/.htaccess).
import { copyFileSync } from 'node:fs';

copyFileSync('hosting/apache/.htaccess', 'dist/.htaccess');
console.log('[apache] dist/.htaccess copié');
