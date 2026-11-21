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

/** Sprache aus dem URL-Parameter ?lang=de|en|es|fr|it (Sprachversionen für Suchmaschinen, hreflang) */
function urlSprache(): string | null {
    const lang = new URLSearchParams(window.location.search).get('lang')?.toLowerCase().split('-')[0];
    return allLocales.find(l => l.toLowerCase().split('-')[0] === lang) ?? null;
}

/**
 * Sprache beim Start: ?lang= in der URL, sonst gespeicherte Auswahl, sonst auf fea-apps.de Englisch und auf
 * statikverstehen.de Deutsch, sonst Browsersprache (falls übersetzt), sonst Englisch.
 */
export function startSprache(): string {
    const ausUrl = urlSprache();
    if (ausUrl) return ausUrl;

    let gespeichert: string | null = null;
    try {
        gespeichert = window.localStorage.getItem(KEY_LOCALE);
    } catch { /* kein localStorage */ }
    if (gespeichert && (allLocales as readonly string[]).includes(gespeichert)) return gespeichert;

    // Die englischsprachige Ausgabe auf fea-apps.de startet immer auf Englisch, die deutsche auf
    // statikverstehen.de immer auf Deutsch (auch für Suchmaschinen, die mit englischer Browsersprache rendern)
    if (/(^|\.)fea-apps\.de$/.test(window.location.hostname)) return 'en-GB';
    if (/(^|\.)statikverstehen\.de$/.test(window.location.hostname)) return 'de';

    const sprache = navigator.language.split('-')[0];
    if (sprache === 'de') return 'de';
    const zuordnung: Record<string, string> = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', it: 'it-IT' };
    return zuordnung[sprache] ?? 'en-GB';
}

/** Adressen der veröffentlichten Ausgaben (Deutsch auf statikverstehen.de, die anderen Sprachen auf fea-apps.de) */
const URL_DE = 'https://duennqs.statikverstehen.de/';
const URL_INTL = 'https://duennqs.fea-apps.de/';

/** kanonische Adresse je Sprache, passend zu den hreflang-Links in index.html */
function kanonischeUrl(locale: string): string {
    if (locale === 'de') return URL_DE;
    if (locale === 'en-GB') return URL_INTL;
    return `${URL_INTL}?lang=${locale.split('-')[0]}`;
}

/** Seitentitel und Beschreibung je Sprache (für Suchmaschinen und den Browser-Tab) */
const SEITEN_META: Record<(typeof allLocales)[number], { titel: string; beschreibung: string }> = {
    'de': {
        titel: 'duennQs – Querschnittswerte und Spannungen dünnwandiger Querschnitte | Schubmittelpunkt, Wölbwiderstand',
        beschreibung: 'Kostenlose Web-App: Schubmittelpunkt, Torsions- und Wölbwiderstand, Wölbordinate, Hauptachsen ' +
            'sowie Normal-, Schub- und Vergleichsspannungen dünnwandiger offener und geschlossener Querschnitte ' +
            '(FEM), auch mit mehreren Materialien. 3D-Grafik, pdf, offline als App.',
    },
    'en-GB': {
        titel: 'duennQs – Thin-walled section properties and stresses | Shear centre & warping constant calculator',
        beschreibung: 'Free web app: shear centre, torsion constant, warping constant, warping ordinate, principal axes ' +
            'and normal, shear and von Mises stresses of open and closed thin-walled cross sections (FEM), also with ' +
            'several materials. 3D plots, pdf report, works offline.',
    },
    'es-ES': {
        titel: 'duennQs – Propiedades y tensiones de secciones de pared delgada | Centro de cortante, módulo de alabeo',
        beschreibung: 'Aplicación web gratuita: centro de cortante, módulo de torsión, módulo de alabeo, ejes principales ' +
            'y tensiones normales, tangenciales y de von Mises en secciones de pared delgada abiertas y cerradas (MEF), ' +
            'también con varios materiales. Gráficos 3D, pdf, funciona sin conexión.',
    },
    'fr-FR': {
        titel: 'duennQs – Caractéristiques et contraintes de sections à parois minces | Centre de cisaillement, gauchissement',
        beschreibung: 'Application web gratuite : centre de cisaillement, inertie de torsion, inertie de gauchissement, ' +
            'axes principaux et contraintes normales, de cisaillement et de von Mises des sections à parois minces ' +
            'ouvertes et fermées (MEF), aussi multi-matériaux. Graphiques 3D, pdf, fonctionne hors ligne.',
    },
    'it-IT': {
        titel: 'duennQs – Caratteristiche e tensioni di sezioni in parete sottile | Centro di taglio, ingobbamento',
        beschreibung: 'App web gratuita: centro di taglio, rigidezza torsionale, costante di ingobbamento, assi principali ' +
            'e tensioni normali, tangenziali e di von Mises di sezioni in parete sottile aperte e chiuse (FEM), anche ' +
            'con più materiali. Grafica 3D, pdf, funziona offline.',
    },
};

/** Sprache des Dokuments, Titel, Beschreibung und kanonische Adresse an die aktuelle Sprache anpassen */
export function seitenMetaAktualisieren(locale: string = getLocale()): void {
    const meta = SEITEN_META[locale as (typeof allLocales)[number]] ?? SEITEN_META['en-GB'];
    document.documentElement.lang = locale.split('-')[0];
    document.title = meta.titel;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.beschreibung);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
    }
    canonical.href = kanonischeUrl(locale);
}
