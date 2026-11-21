import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { msg, updateWhenLocaleChanges } from '@lit/localize';
import { allLocales, getLocale, sprachNamen } from '../localization';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import type SlTabGroup from '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';

import './dr-tabelle';
import './dr-button-pm';
import {
    KNOTEN_TABELLE, ELEMENT_TABELLE, KNOTEN_ZAEHLER, ELEMENT_ZAEHLER, MIN_KNOTEN, MIN_ELEMENTE,
    START_ANZAHL_KNOTEN, START_ANZAHL_ELEMENTE, knotenSpalten, elementSpalten,
} from '../eingabe';

/*
 * Oberfläche von duennqs im Stil von d2beam-gui und quer_2:
 * Tabs Eingabe | Ergebnisse | System | 3D | Info | ꔷꔷꔷ.
 *
 * Die Komponente rendert OHNE Shadow DOM (createRenderRoot), damit der übrige Code die Elemente
 * wie gewohnt mit document.getElementById findet und das normale CSS greift. Nur dr-tabelle und
 * dr-button-pm haben ihr eigenes Shadow DOM.
 */

export type TabName = 'eingabe' | 'ergebnisse' | 'system' | 'drei_d' | 'info' | 'einstellungen';

const ICON_NEU = html`<svg width="1.4rem" height="1.4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14h6"/></svg>`;
const ICON_EINLESEN = html`<svg width="1.4rem" height="1.4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>`;
const ICON_SPEICHERN = html`<svg width="1.4rem" height="1.4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v5h8V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>`;
const ICON_PDF = html`<svg width="1.4rem" height="1.4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/></svg>`;

/** Querschnittswerte im Tab Ergebnisse: id, Formelzeichen, Einheit (Längen in der gewählten Einheit). */
const WERTE: [string, unknown, unknown][] = [
    ['ys', html`y&#772;<sub>s</sub>`, html`<span class="unit_laenge">cm</span>`],
    ['zs', html`z&#772;<sub>s</sub>`, html`<span class="unit_laenge">cm</span>`],
    ['area', 'A', 'cm²'],
    ['area_geom', html`A<sub>geom</sub>`, 'cm²'],
    ['Iys', html`I<sub>y,s</sub>`, 'cm⁴'],
    ['Izs', html`I<sub>z,s</sub>`, 'cm⁴'],
    ['Iyzs', html`I<sub>yz,s</sub>`, 'cm⁴'],
    ['I11', html`I<sub>11</sub>`, 'cm⁴'],
    ['I22', html`I<sub>22</sub>`, 'cm⁴'],
    ['phi_h', html`&phi;<sub>h</sub>`, '°'],
    ['yM', html`y<sub>M</sub>`, html`<span class="unit_laenge">cm</span>`],
    ['zM', html`z<sub>M</sub>`, html`<span class="unit_laenge">cm</span>`],
    ['I_t', html`I<sub>t</sub>`, 'cm⁴'],
    ['I_omega', html`I<sub>&omega;</sub>`, 'cm⁶'],
    ['r_1', html`r<sub>1</sub>`, 'cm'],
    ['r_2', html`r<sub>2</sub>`, 'cm'],
    ['r_omega', html`r<sub>&omega;</sub>`, '-'],
    ['i_M2', html`i<sub>M</sub><sup>2</sup>`, 'cm²'],
    ['i_p2', html`i<sub>p</sub><sup>2</sup>`, 'cm²'],
];

const FARBEN = '#cfd915;#b3ae00;#ffffff;#f5f5f5;#d8d8d8;#828282;#404040;#000000;#0284c7;#2e7d32;#c62828;#ef6c00';

@customElement('dr-haupt')
export class DrHaupt extends LitElement {

    constructor() {
        super();
        // bei Sprachwechsel neu zeichnen (statt @localized: <dr-haupt> steht schon in index.html und wird
        // beim Registrieren aufgewertet, bevor ein Klassen-Decorator nach @customElement wirken könnte)
        updateWhenLocaleChanges(this);
    }

    // kein Shadow DOM (siehe oben)
    protected override createRenderRoot() {
        return this;
    }

    /** Tab programmgesteuert anzeigen (z.B. nach dem Rechnen). */
    zeigeTab(name: TabName): void {
        this.querySelector<SlTabGroup>('#id_tabs')?.show(name);
    }

    /** Eingabefeld für eine Schnittgröße bzw. einen Bezugswert (Zahlenfeld wie in d2beam-gui). */
    private feld(id: string, name: unknown, einheit: unknown, titel: string, wert = '') {
        return html`
          <td class="name" title="${titel}">${name} =</td>
          <td><input type="number" step="any" id="${id}" class="input_tab" pattern="[0-9.,eE+-]*" value="${wert}" title="${titel}"></td>
          <td class="einheit">${einheit}</td>`;
    }

    override render() {
        return html`
      <!-- Kontextmenü der Knoten- und Elementtabelle (gesteuert in dr-tabelle.ts, wie in d2beam-gui) -->
      <nav id="context-menu" class="context-menu">
          <ul class="context-menu__items">
              <li class="context-menu__item">
                  <a href="#" class="context-menu__link" data-action="copyFirst">
                      <svg class="context-menu__icon" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="9" y="9" width="11" height="11" rx="2" />
                          <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                      </svg>
                      ${msg('Wert der ersten Zelle kopieren')}
                  </a>
              </li>
              <li class="context-menu__item">
                  <a href="#" class="context-menu__link" data-action="copyFirstRow">
                      <svg class="context-menu__icon" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="9" y="9" width="11" height="11" rx="2" />
                          <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                      </svg>
                      ${msg('Werte der ersten Zeile kopieren')}
                  </a>
              </li>
              <li class="context-menu__item">
                  <a href="#" class="context-menu__link" data-action="increment_1">
                      <svg class="context-menu__icon" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                          <path d="M12 8v8M8 12h8" />
                      </svg>
                      ${msg('um 1 hochzählen')}
                  </a>
              </li>
              <li class="context-menu__item">
                  <a href="#" class="context-menu__link" data-action="increment_delta">
                      <svg class="context-menu__icon" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                          <path d="M12 8v8M8 12h8" />
                      </svg>
                      ${msg('um Delta hochzählen')}
                  </a>
              </li>
              <li class="context-menu__item">
                  <a href="#" class="context-menu__link" data-action="copy">
                      <svg class="context-menu__icon" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="5" y="4" width="14" height="17" rx="2" />
                          <rect x="9" y="2" width="6" height="4" rx="1" />
                      </svg>
                      ${msg('in Zwischenablage kopieren')}
                  </a>
              </li>
              <li class="context-menu__item">
                  <a href="#" class="context-menu__link" data-action="insert">
                      <svg class="context-menu__icon" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="5" y="4" width="14" height="17" rx="2" />
                          <rect x="9" y="2" width="6" height="4" rx="1" />
                          <path d="M12 10v7M9 14l3 3 3-3" />
                      </svg>
                      ${msg('aus Zwischenablage einfügen')}
                  </a>
              </li>
              <li class="context-menu__item">
                  <a href="#" class="context-menu__link" data-action="close">
                      <svg class="context-menu__icon" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                      ${msg('schließen')}
                  </a>
              </li>
          </ul>
      </nav>

      <sl-tab-group id="id_tabs">
        <sl-tab slot="nav" panel="eingabe">${msg('Eingabe')}</sl-tab>
        <sl-tab slot="nav" panel="ergebnisse">${msg('Ergebnisse')}</sl-tab>
        <sl-tab slot="nav" panel="system">${msg('System')}</sl-tab>
        <sl-tab slot="nav" panel="drei_d">3D</sl-tab>
        <sl-tab slot="nav" panel="info">Info</sl-tab>
        <sl-tab slot="nav" panel="einstellungen" title="${msg('Einstellungen')}">ꔷꔷꔷ</sl-tab>

        <!------------------------------------------------------------------------------------- Eingabe -->
        <sl-tab-panel name="eingabe">
          <p class="dateiname">${msg('aktueller Dateiname:')} <span id="id_dateiname"></span></p>
          <div class="file_toolbar" id="id_file_toolbar">
            <button type="button" id="neueEingabe" class="btn_file" title="${msg('neue Eingabe beginnen')}" aria-label="${msg('neue Eingabe beginnen')}">${ICON_NEU}</button>
            <button type="button" id="readFile" class="btn_file" title="${msg('Eingabe einlesen')}" aria-label="${msg('Eingabe einlesen')}">${ICON_EINLESEN}</button>
            <button type="button" id="saveFile" class="btn_file" title="${msg('Eingabe speichern')}" aria-label="${msg('Eingabe speichern')}">${ICON_SPEICHERN}</button>
            <button type="button" id="rechnen" class="btn_rechnen"
              title="${msg('Querschnittswerte und Spannungen berechnen (farbig hinterlegt, wenn die Eingabe geändert wurde)')}">${msg('Rechnen')}</button>
          </div>
          <p class="hinweis warnung" id="info_berechnung" hidden></p>

          <h3>${msg('Querschnittswerte und Spannungen dünnwandiger Querschnitte')}</h3>
          <p>
            <label for="freetext">${msg('freier Text mit HTML-Formatierung (für die pdf-Ausgabe):')}</label><br>
            <textarea id="freetext" rows="3" cols="50" placeholder="<b>${msg('Hausübung A1, SS 2025')}</b>
${msg('Bearbeitet von: Melis Muster')}"></textarea>
          </p>

          <h3>${msg('Schnittgrößen')}</h3>
          <table class="schnittgroessen">
            <tr>
              ${this.feld('Vy', html`V<sub>y</sub>`, 'kN', msg('Querkraft in y-Richtung'))}
              ${this.feld('Mxp', html`M<sub>xp</sub>`, 'kNm', msg('primäres Torsionsmoment (St. Venant)'))}
              ${this.feld('Nx', 'N', 'kN', msg('Normalkraft'))}
            </tr>
            <tr>
              ${this.feld('Vz', html`V<sub>z</sub>`, 'kN', msg('Querkraft in z-Richtung'))}
              ${this.feld('Mxs', html`M<sub>xs</sub>`, 'kNm', msg('sekundäres Torsionsmoment'))}
              ${this.feld('My', html`M<sub>y</sub>`, 'kNm', msg('Biegemoment um die y-Achse'))}
            </tr>
            <tr>
              <td></td><td></td><td></td>
              ${this.feld('Momega', html`M<sub>&omega;</sub>`, 'kNm²', msg('Wölbbimoment'))}
              ${this.feld('Mz', html`M<sub>z</sub>`, 'kNm', msg('Biegemoment um die z-Achse'))}
            </tr>
          </table>

          <h3>${msg('Bezugswerte')}</h3>
          <p>
            <input type="checkbox" id="material_equal">
            <label for="material_equal">${msg('alle Elemente haben gleiche Materialdaten')}</label>
          </p>
          <table class="schnittgroessen">
            <tr>
              ${this.feld('EMod_ref', msg('E-Modul'), html`<span class="unit_stress">kN/cm²</span>`, msg('E-Modul (Bezugswert)'))}
              ${this.feld('mue_ref', html`&nu;`, '', msg('Querdehnzahl (Bezugswert)'))}
            </tr>
            <tr>
              ${this.feld('fyRd', html`f<sub>y,Rd</sub>`, html`<span class="unit_stress">kN/cm²</span>`, msg('Bemessungswert der Streckgrenze (für die Vergleichsspannung)'))}
            </tr>
          </table>

          <h3>${msg('Knoten')}</h3>
          <div class="zeile">
            <dr-button-pm id="${KNOTEN_ZAEHLER}" txt="${msg('Anzahl Knoten: ')}" inputid="nknoten"
              .nel="${START_ANZAHL_KNOTEN}" .minValue="${MIN_KNOTEN}"></dr-button-pm>
          </div>
          <dr-tabelle
            id="${KNOTEN_TABELLE}"
            allow_delete_row
            allow_insert_row
            nzeilen="${START_ANZAHL_KNOTEN}"
            nspalten="2"
            columns='${knotenSpalten()}'
            colwidth='["3","6","6"]'
          ></dr-tabelle>

          <h3>${msg('Elemente')}</h3>
          <p class="hinweis">${msg('nod1 und nod2 sind die Nummern des Anfangs- und Endknotens. Die rechte Seite eines Elements liegt in Richtung von nod1 nach nod2 gesehen rechts (siehe 3D-Ansicht, „rechts/links anzeigen“).')}</p>
          <div class="zeile">
            <dr-button-pm id="${ELEMENT_ZAEHLER}" txt="${msg('Anzahl Elemente: ')}" inputid="nelem"
              .nel="${START_ANZAHL_ELEMENTE}" .minValue="${MIN_ELEMENTE}"></dr-button-pm>
          </div>
          <dr-tabelle
            id="${ELEMENT_TABELLE}"
            allow_delete_row
            allow_insert_row
            nzeilen="${START_ANZAHL_ELEMENTE}"
            nspalten="5"
            columns='${elementSpalten()}'
            colwidth='["3","7","4","6","4","4"]'
          ></dr-tabelle>
          <p class="hinweis">${msg('Rechte Maustaste bzw. langes Drücken auf markierte Zellen öffnet das Kontextmenü. In der Spalte No fügt + oberhalb eine Zeile ein, der Papierkorb löscht die Zeile (beides mit Rückgängig/Wiederherstellen).')}</p>
        </sl-tab-panel>

        <!---------------------------------------------------------------------------------- Ergebnisse -->
        <sl-tab-panel name="ergebnisse">
          <div class="file_toolbar" id="id_ergebnis_toolbar">
            <button type="button" id="id_pdf" class="btn_file" title="${msg('Ergebnisse als pdf-Datei speichern')}" aria-label="${msg('Ergebnisse als pdf-Datei speichern')}">${ICON_PDF}</button>
            <span id="id_pdf_info" class="hinweis"></span>
          </div>
          <p class="hinweis" id="id_hinweis_rechnen">${msg('Noch nicht gerechnet – im Tab Eingabe auf Rechnen drücken.')}</p>

          <div id="ergebnisse">
            <h3>${msg('ideelle Querschnittswerte')}</h3>
            <table id="querschnittwerte_table" class="werte">
              ${WERTE.map(([id, name, einheit]) => html`
                <tr><td>${name} =</td><td class="zahl" id="${id}"></td><td>${einheit}</td></tr>`)}
            </table>

            <div id="schubkorrektur"></div>
            <div id="spannung_mxp"></div>
            <div id="spannung_mxs"></div>
            <div id="schubspannung"></div>
            <div id="normalspannung"></div>
            <div id="vergleichsspannung"></div>
          </div>
        </sl-tab-panel>

        <!-------------------------------------------------------------------------------------- System -->
        <sl-tab-panel name="system">
          <div id="my-svg">
            <div id="cursor_coord"><span id="cursor_coordy">y&#772;:</span> <span id="cursor_coordz">z&#772;:</span></div>
            <div class="grafik_buttons" id="id_grafik_buttons">
              <button type="button" id="button_label_svg" title="${msg('Knoten- und Elementnummern ein-/ausblenden')}">${msg('Nummern')}</button>
              <button type="button" id="button_copy_svg" title="${msg('Grafik als SVG-Datei speichern')}">SVG</button>
            </div>
            <svg id="dataviz_area"></svg>
          </div>
        </sl-tab-panel>

        <!-------------------------------------------------------------------------------------- 3D -->
        <sl-tab-panel name="drei_d">
          <div id="view3d">
            <div id="view3d-canvas"></div>
            <div id="view3d-gui"></div>
            <div id="view3d-info">
              <div id="v3d-einheit"></div>
              <div id="v3d-minmax"></div>
            </div>
            <div id="view3d-hinweis">${msg('3D-Ansicht: bitte zuerst Rechnen drücken')}</div>
          </div>
        </sl-tab-panel>

        <!------------------------------------------------------------------------------------ Info -->
        <sl-tab-panel name="info">
          <iframe id="id_doc" src="${msg('Kurzdokumentation zu Duenne Querschnitte.html')}"></iframe>
          <h4>${msg('Gerät')}</h4>
          <p id="infoBox"></p>
          <p class="footer">
            Version ${__APP_VERSION__} &middot; ${__BUILD_DATE__} &middot;
            ${getLocale() === 'de'
                ? html`<a href="https://statikverstehen.de">&#169; statikverstehen.de</a>`
                : html`<a href="https://fea-apps.de">&#169; FEA-apps.de</a>`}
          </p>
        </sl-tab-panel>

        <!---------------------------------------------------------------------------- Einstellungen -->
        <sl-tab-panel name="einstellungen" id="id_panel_einstellungen">
          <h3>${msg('Einstellungen')}</h3>
          <table class="einstellungen">
            <tr>
              <td><label for="unitLength">${msg('Längeneinheit:')}</label></td>
              <td>
                <select id="unitLength" title="${msg('Einheit für Eingabe und Ergebnisse; vorhandene Werte werden umgerechnet')}">
                  <option value="mm">mm (N/mm²)</option>
                  <option value="cm" selected>cm (kN/cm²)</option>
                  <option value="m">m (MN/m²)</option>
                </select>
              </td>
            </tr>
            <tr>
              <td><label for="id_locale">${msg('Sprache:')}</label></td>
              <td>
                <select id="id_locale">
                  ${allLocales.map(l => html`<option value="${l}" ?selected=${l === getLocale()}>${sprachNamen[l]}</option>`)}
                </select>
              </td>
            </tr>
            <tr>
              <td>${msg('Hintergrundfarbe Tabellen:')}</td>
              <td><sl-color-picker id="id_color_table_out" value="#cfd915" format="hex" hoist
                swatches="${FARBEN}" label="${msg('Hintergrundfarbe Tabellen')}"></sl-color-picker></td>
            </tr>
            <tr>
              <td>${msg('Textfarbe Tabellen:')}</td>
              <td><sl-color-picker id="id_color_table_text" value="#000000" format="hex" hoist
                swatches="${FARBEN}" label="${msg('Textfarbe Tabellen')}"
                title="${msg('Wird beim Ändern der Hintergrundfarbe automatisch hell oder dunkel gesetzt')}"></sl-color-picker></td>
            </tr>
            <tr>
              <td>${msg('Akzentfarbe:')}</td>
              <td>
                <div class="accent_row">
                  <sl-color-picker id="id_accent_color" value="#0284c7" format="hex" hoist
                    swatches="${FARBEN}" label="${msg('Akzentfarbe')}"
                    title="${msg('Farbe für den aktiven Tab und den Rechnen-Button, wenn neu gerechnet werden muss')}"></sl-color-picker>
                  <button type="button" id="id_accent_color_reset" title="${msg('Akzentfarbe auf das Standard-Blau zurücksetzen')}">${msg('Standard')}</button>
                </div>
              </td>
            </tr>
          </table>
          <p class="hinweis">${msg('Die Tabellenfarbe gilt auch für die Titelleiste des Bedienfelds in der 3D-Ansicht.')}</p>
          <p>
            <button type="button" id="id_cb_saveLocalStorage"
              title="${msg('Die gewählten Einstellungen bleiben auch nach einem Neustart der App erhalten')}">${msg('Auswahl als Standardwerte im Browser speichern')}</button>
            <br /><span class="speichern_hinweis_text" id="id_speichern_hinweis" hidden>${msg('Es gibt Änderungen, die noch nicht gespeichert sind.')}</span>
          </p>
          <p>
            <button type="button" id="id_cb_deleteLocalStorage"
              title="${msg('Gespeicherte Einstellungen löschen und die Standardwerte wiederherstellen')}">${msg('Standardwerte im Speicher des Browsers löschen')}</button>
          </p>
        </sl-tab-panel>
      </sl-tab-group>
    `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'dr-haupt': DrHaupt;
    }
}
