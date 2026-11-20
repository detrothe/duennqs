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
            // vorerst automatische Aktualisierung; Rückfrage wie d2beam-gui folgt später (sw_update.ts)
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.ico', 'icon/duennQs.png'],
            manifest: {
                name: 'Querschnittswerte und Spannungen dünnwandiger Querschnitte',
                short_name: 'duennQs',
                description: 'Querschnittswerte und Spannungen dünnwandiger Querschnitte',
                lang: 'de',
                start_url: './',
                scope: './',
                display: 'fullscreen',
                display_override: ['fullscreen', 'window-controls-overlay'],
                orientation: 'any',
                background_color: '#00008a',
                theme_color: '#000000',
                categories: ['education', 'productivity'],
                icons: [
                    {src: 'icon/duennQs.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
                ],
            },
            workbox: {
                // Doku-Seiten und Bilder offline verfügbar
                globPatterns: ['**/*.{js,css,html,png,ico,woff2}'],
                // das Haupt-Bundle ist derzeit gut 2 MB groß (jspdf mit eingebetteter Schrift)
                maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
            },
        }),
    ],
});
