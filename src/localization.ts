/*
 * Mehrsprachigkeit mit lit-localize wie in d2beam-gui (runtime mode).
 *
 * Quelltexte sind deutsch (msg('…') im Code). Übersetzungen stehen in xliff/*.xlf und werden mit
 *   npm run localize:extract   (neue Texte in die xlf-Dateien übernehmen)
 *   npm run localize:build     (src/generated/locales/*.ts erzeugen)
 * aktualisiert.
 */

import { configureLocalization } from '@lit/localize';
import { sourceLocale, targetLocales, allLocales } from './generated/locale-codes';

export { allLocales };

export const KEY_LOCALE = 'DUENNQS_locale';

export const sprachNamen: Record<(typeof allLocales)[number], string> = {
    'de': 'Deutsch',
    'en-GB': 'English',
    'es-ES': 'Español',
    'fr-FR': 'Français',
    'it-IT': 'Italiano',
};

// lit-localize schreibt <, > und & in reinen Text-Übersetzungen als &lt; &gt; &amp; in die generierten
// Dateien. Für msg('…') wird das nirgends zurückgewandelt; in Tooltips und Texten stünde sonst wörtlich
// „&amp;“ (aus d2beam-gui übernommen). html`…`-Übersetzungen bleiben unverändert.
const decodeEntities = (s: string) =>
    s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

async function loadLocaleDecoded(locale: string) {
    const mod = await import(`./generated/locales/${locale}.ts`);
    const templates: { [id: string]: unknown } = {};
    for (const [id, t] of Object.entries(mod.templates as { [id: string]: unknown })) {
        if (typeof t === 'string') {
            templates[id] = decodeEntities(t);
        } else if (t && typeof t === 'object' && 'strTag' in t) {
            const st = t as unknown as { strings: string[] };
            templates[id] = { ...st, strings: st.strings.map(decodeEntities) };
        } else {
            templates[id] = t;
        }
    }
    return { templates } as never;
}

export const { getLocale, setLocale } = configureLocalization({
    sourceLocale,
    targetLocales,
    loadLocale: loadLocaleDecoded,
});

/**
 * Sprache beim Start: gespeicherte Auswahl, sonst auf fea-apps.de Englisch, sonst Browsersprache
 * (falls übersetzt), sonst Englisch.
 */
export function startSprache(): string {
    let gespeichert: string | null = null;
    try {
        gespeichert = window.localStorage.getItem(KEY_LOCALE);
    } catch { /* kein localStorage */ }
    if (gespeichert && (allLocales as readonly string[]).includes(gespeichert)) return gespeichert;

    // Die englischsprachige Ausgabe auf fea-apps.de startet immer auf Englisch
    if (/(^|\.)fea-apps\.de$/.test(window.location.hostname)) return 'en-GB';

    const sprache = navigator.language.split('-')[0];
    if (sprache === 'de') return 'de';
    const zuordnung: Record<string, string> = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', it: 'it-IT' };
    return zuordnung[sprache] ?? 'en-GB';
}
