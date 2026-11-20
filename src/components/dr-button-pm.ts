import { LitElement, css, html } from 'lit';
import { property, customElement, query } from 'lit/decorators.js';

/**
 * Numeric input mit +/- Spinner-Buttons.
 *
 * Feuert ein `change`-Event (bubbles + composed), sobald sich der Wert
 * über einen der Buttons oder direkte Eingabe ändert. `event.detail.value`
 * enthält den neuen Wert.
 *
 * Wichtig: Das interne <input> wird bei jeder Wertänderung SOFORT
 * geschrieben (nicht erst beim nächsten Lit-Render), damit Code, der
 * direkt danach das DOM-Feld liest (z.B. resizeTables), den neuen Wert sieht.
 */
@customElement('dr-button-pm')
export class drButtonPM extends LitElement {
   /** Sichtbares Label vor dem Spinner. */
   @property({ type: String }) txt = '';

   /** id des internen <input>, z.B. für ein externes <label for="..."> */
   @property({ type: String }) inputID = '';

   @property({ type: Number }) nel = 0;
   @property({ type: Number }) minValue = 0;

   /** Optionales Maximum. `undefined` = keine Obergrenze. */
   @property({ type: Number }) maxValue?: number;

   /** Komplett gesperrt (z.B. Tab Tabellen, nur zur Info): beide Buttons und Eingabefeld. */
   @property({ type: Boolean, reflect: true }) disabled = false;

   @query('input') private _input!: HTMLInputElement;

   static override styles = css`
      :host {
         --dr-pad: 0;
         --dr-border-color-light: #d4d4d8;
         --dr-border-color-dark: #43434a;
         --dr-text-color-light: #444;
         --dr-text-color-dark: #b6b6be;
         --dr-bg-color-dark: #1a1a1e;

         --dr-border-color: var(--dr-border-color-light);
         --dr-text-color: var(--dr-text-color-light);
         --dr-bg-color: transparent;

         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Helvetica, Arial, sans-serif, 'Apple Color Emoji',
            'Segoe UI Emoji', 'Segoe UI Symbol';
      }

      @media (prefers-color-scheme: dark) {
         :host {
            --dr-border-color: var(--dr-border-color-dark);
            --dr-text-color: var(--dr-text-color-dark);
            --dr-bg-color: var(--dr-bg-color-dark);
         }
      }

      .spinner {
         border: solid 1px var(--dr-border-color);
         margin: 0;
         padding: var(--dr-pad);
         width: 1.25rem;
         line-height: calc(var(--sl-input-height-medium) - 2px);
         vertical-align: middle;
      }

      /* nur bei echter Maus: auf Touch-Geräten bleibt :hover nach dem Tippen sonst hängen */
      @media (hover: hover) {
         .spinner:not(:disabled):hover {
            background: lightgrey;
         }
      }

      /* Nur das Zeichen abblassen, nicht den ganzen Button: mit opacity würde im dunklen
         Modus durch den Hintergrund das Grau der Seite scheinen (z.B. "-" bei 0 Zeilen) */
      .spinner:disabled {
         cursor: not-allowed;
         color: color-mix(in srgb, var(--dr-text-color) 40%, transparent);
         background-color: var(--dr-bg-color);
      }

      .input_int {
         width: 3.125em;
         margin: 0;
         padding: 0;
         border-top: 1px solid var(--dr-border-color);
         border-bottom: 1px solid var(--dr-border-color);
         border-left: 0;
         border-right: 0;
         border-radius: 0;
         text-align: center;
         line-height: calc(var(--sl-input-height-medium) - 2px);
         vertical-align: middle;
         color: var(--dr-text-color);
      }

      /* gesperrt (Eigenschaft disabled): Zahl bleibt normal lesbar, iOS blasst sonst ab */
      .input_int:disabled {
         opacity: 1;
         color: var(--dr-text-color);
         -webkit-text-fill-color: var(--dr-text-color);
         background-color: transparent;
      }

      input,
      label {
         font-size: 0.875rem;
      }

      button {
         font-size: 1em;
         border-radius: 3px;
         border-width: 1px;
         border-color: var(--dr-border-color);
         color: var(--dr-text-color);
         background-color: var(--dr-bg-color);
         padding: 0;
      }

      button:active {
         background-color: darkorange;
      }

      input[type='number']::-webkit-inner-spin-button,
      input[type='number']::-webkit-outer-spin-button {
         -webkit-appearance: none;
         margin: 0;
      }

      input[type='number'] {
         -moz-appearance: textfield;
      }

      .decrement {
         border-radius: 4px 0px 0px 4px;
      }

      .increment {
         border-radius: 0px 4px 4px 0px;
      }
   `;

   /**
    * Setzt nel UND das Eingabefeld sofort.
    * Ohne das Schreiben des Feldes würden Leser des DOM-Feldes bis zum
    * nächsten Lit-Update den alten Wert sehen.
    */
   private _setNel(v: number) {
      this.nel = v;
      if (this._input) this._input.value = String(v);
   }

   /**
    * Setzt den Wert programmatisch von außen (z.B. durch read_daten).
    * Akzeptiert auch Zahlen-Strings, weil ältere Sicherungen z.B. "1" statt 1
    * enthalten können.
    */
   setValue(wert: number | string) {
      const n = Number(wert);
      const ok = wert !== '' && wert !== null && wert !== undefined && Number.isFinite(n);
      this._setNel(ok ? n : 0);
   }

   /** Liest den aktuellen Wert (z.B. durch den Parent).
    Anwendung:
    const el = this.shadowRoot?.querySelector('dr-button-pm') as drButtonPM;
    const currentValue = el.getValue(); */
   getValue(): number {
      return this.nel;
   }

   private _clamp(value: number): number {
      let v = value;
      if (Number.isNaN(v)) v = this.minValue;
      if (v < this.minValue) v = this.minValue;
      if (this.maxValue !== undefined && v > this.maxValue) v = this.maxValue;
      return v;
   }

   private _notifyChange() {
      this.dispatchEvent(
         new CustomEvent('change', {
            detail: { value: this.nel },
            bubbles: true,
            composed: true,
         }),
      );
   }

   private _increment() {
      const next = this._clamp(this.nel + 1);
      if (next === this.nel) return;
      this._setNel(next);
      this._notifyChange();
   }

   private _decrement() {
      const next = this._clamp(this.nel - 1);
      if (next === this.nel) return;
      this._setNel(next);
      this._notifyChange();
   }

   private _onInputChange() {
      // Falls geclampt wurde, bleibt das Feld synchron zum internen Wert.
      this._setNel(this._clamp(Number(this._input.value)));
      this._notifyChange();
   }

   private get _atMin() {
      return this.nel <= this.minValue;
   }

   private get _atMax() {
      return this.maxValue !== undefined && this.nel >= this.maxValue;
   }

   override render() {
      return html`
         <label id="lab_nnodes" for="${this.inputID}">${this.txt}</label>

         <button
            class="spinner decrement"
            aria-label="Wert verringern"
            ?disabled="${this.disabled || this._atMin}"
            @click="${this._decrement}"
         >
            -
         </button
         ><input
            type="number"
            step="1"
            id="${this.inputID}"
            name="nnodes"
            class="input_int"
            .value="${String(this.nel)}"
            ?disabled="${this.disabled}"
            @change="${this._onInputChange}"
         /><button
            class="spinner increment"
            aria-label="Wert erhöhen"
            ?disabled="${this.disabled || this._atMax}"
            @click="${this._increment}"
         >
            +
         </button>
      `;
   }
}

declare global {
   interface HTMLElementTagNameMap {
      'dr-button-pm': drButtonPM;
   }
}
