import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
    // relative Pfade, damit die App auch in einem Unterverzeichnis läuft
    base: './',
    // jspdf mit eingebetteter Schrift macht das Haupt-Bundle groß; three.js ist ein eigener, nachgeladener Chunk
    build: {chunkSizeWarningLimit: 2500},
    // Versionsnummer und Build-Datum für den Tab Info
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
        __BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin',
        })),
    },
    plugins: [
        VitePWA({
            // wie d2beam-gui: neue Version im Hintergrund laden, übernehmen erst nach Rückfrage
            // (Registrierung und Prüfung in src/sw_update.ts)
            registerType: 'prompt',
            injectRegister: false,
            includeAssets: ['favicon-48.png', 'apple-touch-icon.png'],
            // Manifest-Icons nicht zusätzlich vorab cachen (die 512er braucht nur die Installation)
            includeManifestIcons: false,
            manifest: {
                name: 'duennQs – dünnwandige Querschnitte',
                short_name: 'duennQs',
                description: 'Querschnittswerte und Spannungen dünnwandiger Querschnitte',
                lang: 'de',
                // Identität der App wie bei der früheren Fassung (deren start_url), damit bereits
                // installierte Apps das neue Manifest (Icons, Darstellung) übernehmen
                id: '/?utm_source=homescreen',
                start_url: './',
                scope: './',
                display: 'standalone',
                orientation: 'any',
                // wie d2beam-gui (helles Grau der Oberfläche); im Browser wählen die theme-color-Meta-Tags
                // in index.html hell/dunkel passend zur Systemeinstellung
                background_color: '#f3f3f3',
                theme_color: '#f3f3f3',
                categories: ['education', 'productivity'],
                // Icons wie bei d2beam-gui; Vorlage: icon-quelle/duennqs.svg (mit Inkscape gerendert)
                icons: [
                    {src: '192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
                    {src: '512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
                    {src: 'maskable_512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
                ],
            },
            workbox: {
                // Doku-Seiten und Bilder offline verfügbar
                globPatterns: ['**/*.{js,css,html,png,woff2}'],
                // große Icons braucht nur die Installation, nicht der Offline-Betrieb
                globIgnores: ['**/512x512.png', '**/maskable_512.png'],
                // das Haupt-Bundle ist derzeit gut 2 MB groß (jspdf mit eingebetteter Schrift)
                maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
            },
        }),
    ],
});
