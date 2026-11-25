/*
 * Dialog „Querschnitt als Text“: Knoten, Elemente und weitere Angaben als Text einfügen, z.B. die Antwort
 * einer KI auf eine Zeichnung (Format in textformat.ts). Der Prompt für die KI lässt sich hier kopieren.
 * Gestaltung wie der Dialog „neue Eingabe“ (profil_dialog.ts, Styles .pd-… und .td-… in styles/main.css).
 */

import { msg, str } from '@lit/localize';
import { leseText, eingabeAlsText, beispielText, kiPrompt } from '../textformat';
import type { EingabeDaten } from '../eingabe';

const SCHLUESSEL = 'DUENNQS_text_dialog';   // zuletzt eingefügter Text

/** Text in die Zwischenablage; das Ersatz-Textfeld muss im (modalen) Dialog liegen, außerhalb ist alles inert. */
async function kopieren(text: string, dialog: HTMLDialogElement): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // ältere Browser bzw. ohne Berechtigung: über ein unsichtbares Textfeld
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed; opacity:0;';
        dialog.appendChild(ta);
        ta.select();
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch { /* nicht möglich */ }
        ta.remove();
        return ok;
    }
}

/** Dialog anzeigen; liefert die Daten für eingabeEinlesen oder null bei Abbrechen. */
export function textDialog(): Promise<EingabeDaten | null> {
    const dialog = document.createElement('dialog');
    dialog.classList.add('pd');
    dialog.setAttribute('aria-labelledby', 'td-titel');
    dialog.innerHTML = `
        <section class="pd-karte">
            <button type="button" class="pd-schliessen" title="${msg('Abbrechen')}" aria-label="${msg('Abbrechen')}">×</button>
            <div>
                <h2 id="td-titel">${msg('Querschnitt als Text')}</h2>
                <p class="pd-unterzeile">${msg('Knoten und Elemente als Text einfügen, zum Beispiel von einer KI, die den Querschnitt aus einer Zeichnung abgelesen hat.')}</p>
            </div>
            <ol class="td-schritte">
                <li>${msg('Prompt kopieren und zusammen mit der Zeichnung (Bild oder PDF) an eine KI wie Claude oder ChatGPT schicken.')}
                    <button type="button" class="pd-knopf td-klein" data-aktion="prompt">${msg('KI-Prompt kopieren')}</button>
                    <span class="td-meldung" aria-live="polite"></span></li>
                <li>${msg('Den Codeblock aus der Antwort hier einfügen. Die Annahmen der KI bitte prüfen.')}</li>
            </ol>
            <textarea class="td-text" spellcheck="false" autocapitalize="off" autocomplete="off"
                aria-label="${msg('Eingabe als Text')}" placeholder="${msg('Text hier einfügen …')}"></textarea>
            <div class="td-leiste">
                <button type="button" class="pd-knopf td-klein" data-aktion="beispiel">${msg('Beispiel')}</button>
                <button type="button" class="pd-knopf td-klein" data-aktion="aktuell"
                    title="${msg('Die aktuelle Eingabe im Textformat anzeigen, z. B. als Vorlage oder um sie einer KI zu geben')}">${msg('aktuelle Eingabe als Text')}</button>
                <button type="button" class="pd-knopf td-klein" data-aktion="leeren">${msg('leeren')}</button>
                <span class="td-status" aria-live="polite"></span>
            </div>
            <ul class="pd-fehler td-fehler" hidden></ul>
            <p class="pd-hinweis">${msg('Format: Zeilen „einheit mm“, „E 210000“, „nu 0.3“, dann „knoten“ mit je einer Zeile „nr y z“ und „elemente“ mit „nr nod1 nod2 t“. Mehr dazu im Tab Info unter „Eingabe als Text und mit KI“.')}</p>
            <div class="pd-fuss">
                <button type="button" class="pd-knopf" value="abbrechen">${msg('Abbrechen')}</button>
                <button type="button" class="pd-knopf pd-primaer" value="ok">${msg('Übernehmen')}</button>
            </div>
        </section>`;

    const q = <T extends Element>(sel: string) => dialog.querySelector(sel) as T;
    const feld = q<HTMLTextAreaElement>('.td-text');
    const status = q<HTMLElement>('.td-status');
    const fehlerListe = q<HTMLUListElement>('.td-fehler');

    try {
        feld.value = window.localStorage.getItem(SCHLUESSEL) ?? '';
    } catch { /* localStorage nicht verfügbar */ }

    const zeigeFehler = (fehler: string[]) => {
        fehlerListe.replaceChildren(...fehler.slice(0, 12).map(f => {
            const li = document.createElement('li');
            li.textContent = f;
            return li;
        }));
        if (fehler.length > 12) {
            const li = document.createElement('li');
            li.textContent = msg(str`… und ${fehler.length - 12} weitere`);
            fehlerListe.appendChild(li);
        }
        fehlerListe.hidden = fehler.length === 0;
    };

    /** Laufende Prüfung beim Tippen: Anzahl erkannter Knoten und Elemente oder Anzahl der Fehler. */
    const pruefen = () => {
        zeigeFehler([]);
        if (feld.value.trim() === '') {
            status.textContent = '';
            return;
        }
        const e = leseText(feld.value);
        status.textContent = e.ok
            ? msg(str`erkannt: ${e.knoten} Knoten, ${e.elemente} Elemente`)
            : msg(str`${e.fehler.length} Fehler`);
        status.classList.toggle('td-schlecht', !e.ok);
    };
    feld.addEventListener('input', pruefen);
    pruefen();

    const setze = (text: string) => {
        feld.value = text;
        pruefen();
        feld.focus();
    };

    for (const b of dialog.querySelectorAll<HTMLButtonElement>('button[data-aktion]')) {
        b.addEventListener('click', async () => {
            switch (b.dataset.aktion) {
                case 'prompt': {
                    const prompt = kiPrompt();
                    const ok = await kopieren(prompt, dialog);
                    const m = q<HTMLElement>('.td-meldung');
                    if (ok) {
                        m.textContent = msg('kopiert ✓');
                        setTimeout(() => { m.textContent = ''; }, 4000);
                    } else {
                        // dann wenigstens zum Kopieren von Hand anzeigen
                        m.textContent = msg('Kopieren nicht möglich – der Prompt steht im Textfeld, bitte von dort kopieren.');
                        setze(prompt);
                        feld.select();
                    }
                    break;
                }
                case 'beispiel': setze(beispielText()); break;
                case 'aktuell': setze(eingabeAlsText()); break;
                case 'leeren': setze(''); break;
            }
        });
    }

    return new Promise(resolve => {
        let ergebnis: EingabeDaten | null = null;

        const ok = () => {
            const e = leseText(feld.value);
            if (!e.ok) {
                zeigeFehler(e.fehler);
                return;
            }
            ergebnis = e.daten;
            dialog.close();
        };

        q<HTMLButtonElement>('button[value="ok"]').addEventListener('click', ok);
        q<HTMLButtonElement>('button[value="abbrechen"]').addEventListener('click', () => dialog.close());
        q<HTMLButtonElement>('.pd-schliessen').addEventListener('click', () => dialog.close());
        // jedes Schließen landet hier, auch Escape; der Text bleibt für das nächste Öffnen erhalten
        dialog.addEventListener('close', () => {
            try {
                window.localStorage.setItem(SCHLUESSEL, feld.value);
            } catch { /* localStorage nicht verfügbar */ }
            dialog.remove();
            resolve(ergebnis);
        }, { once: true });

        document.body.appendChild(dialog);
        dialog.showModal();
        feld.focus();
    });
}
