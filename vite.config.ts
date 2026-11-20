import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    // relative Pfade, damit die App auch in einem Unterverzeichnis läuft
    base: './',
    // jspdf, three.js und d3 machen das Bundle bewusst groß (wird in späteren Schritten aufgeteilt)
    build: {chunkSizeWarningLimit: 4000},
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
                // Doku-Seiten, Bilder und die Schrift für die 3D-Beschriftung offline verfügbar
                globPatterns: ['**/*.{js,css,html,png,ico,woff2,ttf,json}'],
                // nicht benutzte Schriften nicht vorab laden
                globIgnores: ['**/FreeSerif.ttf', '**/NotoMono-Regular.ttf', '**/fontawesome-webfont-*.ttf'],
                // das Haupt-Bundle ist derzeit gut 3 MB groß
                maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
            },
        }),
    ],
});
