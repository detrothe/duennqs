import styles from './dr-tabelle.css?raw';

// Quelle: ~/git-code/dr-tabelle, verteilt mit dr-tabelle-verteilen.sh – nicht im Projekt ändern.
// Alles Projektspezifische kommt aus tabelle_umgebung.ts.
import {
   nQuerschnittSets, get_querschnittRechteck_name, Detect,
   berechnungErforderlich, touch_support_table, msg, str, ConfirmDialog,
} from './tabelle_umgebung';

// Zeile oberhalb einfügen (allow_insert_row)
const INSERT_SVG =
   '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" ' +
   'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
   '<path d="M12 5v14M5 12h14"/></svg>';

const TRASH_SVG =
   '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" ' +
   'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
   '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>';

// Tabelle, zu der das gerade offene Kontextmenü gehört (das Menü liegt im index.html des Projekts
// und wird von allen Tabellen gemeinsam benutzt)
let current_table_id = '';

/** Attributwert wie '["No", "x [m]", "z [m]"]' in seine Einträge zerlegen. */
function parse_liste(wert: string): string[] {
   let s = wert.replace('[', '');
   s = s.slice(0, s.lastIndexOf(']'));
   return s.split(',').map((t) => t.replace(/"/g, '').trim());
}

//______________________________________________________________________________________________________
//______________________________________________________________________________________________________ DrTabelle
//______________________________________________________________________________________________________

// Web Component <dr-tabelle>
// Aufbau im Shadow DOM: <table id="mytable">, Zeile 0 = Überschriften, Spalte 0 = Zeilennummer.
// Datenzelle: <td id="idtableCell-<zeile>-<spalte>"> mit <input>/<select id="idtable-<zeile>-<spalte>">.
// Die Projekte lesen und schreiben die Werte direkt über diese Struktur.
class DrTabelle extends HTMLElement {
   shadow: any = null;

   ref_listener: any = null;

   nZeilen = 2;
   nSpalten = 2;

   columns: any = [];
   typs: any = [];
   colWidth: any = [];
   colText = '';

   nTabRow = 3; // immer 1 mehr, da Zeile, Spalte mit 0 beginnt
   nTabCol = 3;

   // Geometrie für die Auswahl per Finger (und Maus in Firefox), gesetzt in POINTER_DOWN
   cellHeight = 0;
   cellTop = 0;
   cellsLeft: number[] = [];

   tableId = '';

   startRowIndex = 0;
   startColIndex = 0;

   firstRowIndex = 0;
   firstColIndex = 0;
   firtstWert = '';

   selectionMode = false;
   selection_ended = false;

   col_visible: boolean[] = [];   // gibt an, ob Spalte sichtbar ist

   contextMenuLinkClassName = "context-menu__link";
   contextMenuActive = "context-menu--active";

   taskItemClassName = "tabellen";
   taskItemInContext: any;

   menu = document.querySelector("#context-menu") as any;
   menuState = 0;

   private onMouseMove = (ev: any) => this.MOUSE_MOVE(ev);
   private onTouchMove = (ev: any) => this.TOUCH_MOVE(ev);
   private onPointerDown = (ev: any) => this.POINTER_DOWN(ev);
   private onKeyDown = (ev: Event) => this.KEYDOWN(ev as KeyboardEvent);

   // manuelle Eingabe macht die Lösch-Schnappschüsse ungültig
   private onValueChanged = () => { this.clear_undo(); berechnungErforderlich(true); };

   lastClientX = 0;
   lastClientY = 0;

   // Attribut allow_delete_row: Löschen-Button in der No-Spalte jeder Zeile, mit lokalem Undo/Redo.
   // Muss beim Erstellen der Tabelle gesetzt sein.
   allowDeleteRow = false;
   // Attribut allow_insert_row: Button „+“ in der No-Spalte fügt oberhalb eine leere
   // Zeile ein; gleiches Undo/Redo wie beim Löschen. Muss ebenfalls beim Erstellen der Tabelle gesetzt sein.
   allowInsertRow = false;
   undoStack: string[][][] = [];   // Schnappschüsse aller Zellwerte (Zeile, Spalte) vor einer Änderung
   redoStack: string[][][] = [];
   undoBar: HTMLDivElement | null = null;
   btnUndo: HTMLButtonElement | null = null;
   btnRedo: HTMLButtonElement | null = null;

   //----------------------------------------------------------------------------------------
   constructor() {
      //----------------------------------------------------------------------------------------
      super();

      this.shadow = this.attachShadow({ mode: 'open' });

      const stylesheet = new CSSStyleSheet();
      stylesheet.replace(styles);
      this.shadow.adoptedStyleSheets = [stylesheet];
   }

   //---------------------------------------------------------------------------------------------------------------
   connectedCallback() {
      //------------------------------------------------------------------------------------------------------------

      // Bei erneutem Einhängen (Verschieben im DOM, Lit-Rerender) nichts neu aufbauen
      if (this.shadow.getElementById('mytable')) return;

      if (this.allowDeleteRow || this.allowInsertRow) this.create_undo_bar();

      const table = document.createElement('table');
      table.id = 'mytable';
      this.shadow.appendChild(table);

      // Der touchstart-Listener tut nichts, bleibt aber registriert: ohne iOS-Test nicht entfernen.
      table.addEventListener('touchstart', () => { });
      table.addEventListener('pointerup', this.POINTER_UP.bind(this), true);
      // dauerhaft registrieren, damit iOS preventDefault schon beim 1. touchstart berücksichtigt
      table.addEventListener('touchmove', this.onTouchMove, { capture: true, passive: false });
      // iOS feuert pointercancel, wenn es doch zu scrollen beginnt
      table.addEventListener('pointercancel', this.POINTER_UP.bind(this), true);
      table.addEventListener("contextmenu", e => e.preventDefault());

      const kopf = table.createTHead().insertRow();
      for (let iSpalte = 0; iSpalte < this.nTabCol; iSpalte++) {
         this.create_header_cell(kopf, iSpalte, this.columns[iSpalte]);
      }

      const tbody = table.createTBody();
      for (let iZeile = 1; iZeile < this.nTabRow; iZeile++) {
         const newRow = tbody.insertRow(-1);
         this.create_no_cell(newRow, iZeile);
         for (let iSpalte = 1; iSpalte < this.nTabCol; iSpalte++) {
            this.create_data_cell(newRow, iZeile, iSpalte);
         }
      }

      this.cellsLeft = Array(this.nTabCol);
      this.col_visible = Array(this.nTabCol).fill(true);
   }

   //---------------------------------------------------------------------------------------------------------------
   // Zellen erzeugen (beim Aufbau und in resize_Tabelle)
   //---------------------------------------------------------------------------------------------------------------

   /** Breite einer Datenspalte aus dem Attribut colwidth; fehlende Spalten erben den letzten Wert. */
   private spaltenbreite(iSpalte: number): string {
      if (this.colWidth.length === 0) return '6rem';
      return this.colWidth[Math.min(iSpalte, this.colWidth.length - 1)] + 'rem';
   }

   private create_header_cell(row: HTMLTableRowElement, iSpalte: number, text: string) {
      const th = document.createElement('th');
      th.innerHTML = text;
      th.style.padding = '5px';
      th.style.margin = '0px';
      th.style.textAlign = 'center';
      if (this.col_visible[iSpalte] === false) th.style.display = 'none';
      row.appendChild(th);
   }

   private create_no_cell(row: HTMLTableRowElement, iZeile: number) {
      const cell = row.insertCell(-1);
      cell.style.textAlign = 'center';
      cell.style.padding = '0px';
      cell.style.margin = '0px';
      cell.style.fontSize = '1rem';
      this.fill_no_cell(cell, iZeile);
   }

   private create_data_cell(row: HTMLTableRowElement, iZeile: number, iSpalte: number) {
      let el: HTMLInputElement | HTMLSelectElement;
      if (this.typs[iSpalte] === 'select') {
         el = document.createElement('select');
         el.style.width = '100%';
         el.style.backgroundColor = 'rgb(255,255,255)';
         for (let i = 0; i < nQuerschnittSets; i++) {
            const option = document.createElement('option');
            option.value = option.textContent = get_querschnittRechteck_name(i);
            el.appendChild(option);
         }
      } else {
         el = document.createElement('input');
         el.setAttribute('type', this.typs[iSpalte] === 'text' ? 'text' : 'number');
         el.style.width = 'inherit';
      }

      el.style.border = 'none';
      el.style.borderWidth = '0px';
      el.style.padding = '5px';
      el.style.margin = '0px';
      el.style.borderRadius = '0px';
      el.style.fontSize = '1rem';
      el.style.color = 'rgb(0,0,0)';
      el.id = 'idtable-' + iZeile + '-' + iSpalte;
      el.className = 'input_normal';   // weiß wie nach dem Aufheben einer Markierung (sonst CSS-Grau #f5f5f5)
      el.addEventListener('keydown', this.onKeyDown);
      el.addEventListener('input', this.onValueChanged);
      el.addEventListener('change', this.onValueChanged);   // für select / Browser-Autofill
      el.addEventListener('pointerdown', this.onPointerDown);

      const cell = row.insertCell(-1);
      cell.style.width = this.spaltenbreite(iSpalte);
      cell.style.border = 'solid';
      cell.style.borderWidth = '1px';
      cell.style.padding = '0px';
      cell.style.margin = '0px';
      cell.style.backgroundColor = 'rgb(255,255,255)';
      cell.style.touchAction = 'auto';
      cell.id = 'idtableCell-' + iZeile + '-' + iSpalte;
      cell.className = 'input_normal';
      cell.style.fontSize = '1rem';
      cell.appendChild(el);

      if (iSpalte === this.col_visible.length) this.col_visible.push(true);
      if (this.col_visible[iSpalte] === false) cell.style.display = 'none';
   }

   //---------------------------------------------------------------------------------------------------------------
   attributeChangedCallback(name: string, oldValue: any, newValue: any) {
      //------------------------------------------------------------------------------------------------------------

      if (name === 'allow_delete_row') {
         this.allowDeleteRow = newValue !== null && newValue !== 'false';
         return;
      }
      if (name === 'allow_insert_row') {
         this.allowInsertRow = newValue !== null && newValue !== 'false';
         return;
      }

      // Farben dieser Tabelle (überschreiben die vererbten Werte aus dem Tab ꔷꔷꔷ)
      if (name === 'color_table' || name === 'color_text') {
         const variable = name === 'color_table' ? '--table_bg' : '--table_fg';
         if (newValue) this.style.setProperty(variable, newValue);
         else this.style.removeProperty(variable);
         return;
      }

      // Zeilen-/Spaltenzahl wird von außen geändert -> Lösch-Schnappschüsse passen nicht mehr.
      // resizeTables() setzt nzeilen auch mit unverändertem Wert, das darf Undo nicht löschen.
      if (oldValue !== null) {
         if (name === 'nzeilen' && Number(newValue) !== Number(this.nZeilen)) this.clear_undo();
         if (name === 'nspalten' && Number(newValue) !== Number(this.nSpalten)) this.clear_undo();
      }

      if (name === 'add_new_option') {
         this.add_new_select_option();

      } else if (name === 'namechanged') {
         this.update_select_options_name(Number(newValue));

      } else if (name === 'lf_languagechanged') {
         this.lf_languageChanged(newValue);

      } else if (name === 'columns_languagechanged') {
         this.columns_languageChanged(newValue);

      } else if (name === 'clear') {
         this.clear_Tabelle('mytable');
         this.clear_undo();
         berechnungErforderlich(true);

      } else if (name === 'option_deleted') {
         this.del_select_options(newValue);

      } else if (name === 'hide_column') {
         this.hide_column(newValue);

      } else if (name === 'show_column') {
         this.show_column(newValue);

      } else if (oldValue === null) {                         // Initialisierungsphase
         if (name === 'columns') {
            parse_liste(newValue).forEach((t, i) => this.columns[i] = t);
         } else if (name === 'typs') {
            parse_liste(newValue).forEach((t, i) => this.typs[i] = t);
         } else if (name === 'colwidth') {
            parse_liste(newValue).forEach((t, i) => this.colWidth[i] = t);
         } else if (name === 'coltext') {
            this.colText = newValue;
         } else if (name === 'nzeilen') {
            this.nZeilen = newValue;
            this.nTabRow = Number(this.nZeilen) + 1;
         } else if (name === 'nspalten') {
            this.nSpalten = newValue;
            this.nTabCol = Number(this.nSpalten) + 1;
         } else if (name === 'id') {
            this.tableId = newValue;
         }

      } else {
         if (name === 'nzeilen') {
            this.nZeilen = newValue;
            this.nTabRow = Number(this.nZeilen) + 1;
            this.resize_Tabelle('mytable', newValue, this.nSpalten);
         } else if (name === 'nspalten') {
            this.nSpalten = newValue;
            this.nTabCol = Number(this.nSpalten) + 1;
            this.resize_Tabelle('mytable', this.nZeilen, newValue);
         }
         berechnungErforderlich(true);
      }
   }

   //---------------------------------------------------------------------------------------------------------------
   static get observedAttributes() {
      //------------------------------------------------------------------------------------------------------------
      return ['nzeilen', 'nspalten', 'columns', 'typs', 'add_new_option', 'namechanged', 'clear', 'colwidth', 'coltext',
         'option_deleted', 'hide_column', 'show_column', 'id', 'lf_languagechanged', 'columns_languagechanged',
         'allow_delete_row', 'allow_insert_row', 'color_table', 'color_text'];
   }

   //---------------------------------------------------------------------------------------------------------------
   lf_languageChanged(lf: string) {
      //------------------------------------------------------------------------------------------------------------
      this.colText = lf;
      this.update_delete_texts();
   }

   //---------------------------------------------------------------------------------------------------------------
   // Zeilen löschen/einfügen mit Undo/Redo (nur bei allow_delete_row / allow_insert_row)
   //---------------------------------------------------------------------------------------------------------------

   private fill_no_cell(cell: HTMLTableCellElement, iZeile: number) {
      cell.appendChild(document.createTextNode(String(iZeile)));
      if (!this.allowDeleteRow && !this.allowInsertRow) return;

      cell.style.whiteSpace = 'nowrap';

      if (this.allowInsertRow) {
         const ins = document.createElement('button');
         ins.type = 'button';
         ins.className = 'ins_row';
         ins.title = msg('Zeile oberhalb einfügen');
         ins.innerHTML = INSERT_SVG;
         ins.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this.insert_row(iZeile);
         });
         cell.appendChild(ins);
      }
      if (!this.allowDeleteRow) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'del_row';
      btn.title = msg('Zeile löschen');
      btn.innerHTML = TRASH_SVG;
      // Zeilen behalten ihren Index (es werden nur Werte verschoben), daher bleibt iZeile gültig
      btn.addEventListener('click', async (ev) => {
         ev.stopPropagation();
         const dialog = new ConfirmDialog({
            trueButton_Text: "ja",
            falseButton_Text: "nein",
            question_Text: msg(str`Zeile ${iZeile} wirklich löschen?`),
         });
         if (await dialog.confirm()) this.delete_row(iZeile);
      });
      cell.appendChild(btn);
   }

   private create_undo_bar() {
      const bar = document.createElement('div');
      bar.className = 'undo_bar';
      bar.style.display = 'none';

      const make = (onClick: () => void) => {
         const b = document.createElement('button');
         b.type = 'button';
         b.className = 'undo_button';
         b.addEventListener('click', onClick);
         bar.appendChild(b);
         return b;
      };
      this.btnUndo = make(() => this.undo_delete());
      this.btnRedo = make(() => this.redo_delete());
      this.undoBar = bar;
      this.shadow.appendChild(bar);
      this.update_delete_texts();
   }

   private update_delete_texts() {
      if (!this.allowDeleteRow && !this.allowInsertRow) return;
      // nur Löschen: Texte wie bisher; mit Einfügen allgemein, da Undo/Redo dann beides umfasst
      const allgemein = this.allowInsertRow;
      if (this.btnUndo) this.btnUndo.textContent = '↶ ' + (allgemein ? msg('Rückgängig') : msg('Löschen rückgängig'));
      if (this.btnRedo) this.btnRedo.textContent = '↷ ' + (allgemein ? msg('Wiederherstellen') : msg('Löschen wiederherstellen'));
      this.shadow.querySelectorAll('.del_row').forEach((b: HTMLElement) => b.title = msg('Zeile löschen'));
      this.shadow.querySelectorAll('.ins_row').forEach((b: HTMLElement) => b.title = msg('Zeile oberhalb einfügen'));
   }

   private update_undo_bar() {
      if (!this.undoBar || !this.btnUndo || !this.btnRedo) return;
      this.btnUndo.disabled = this.undoStack.length === 0;
      this.btnRedo.disabled = this.redoStack.length === 0;
      // nur sichtbar, solange es etwas rückgängig zu machen gibt
      this.undoBar.style.display = (this.undoStack.length || this.redoStack.length) ? '' : 'none';
   }

   /** Undo/Redo verwerfen, z.B. nach manueller Eingabe oder beim Einlesen einer Datei */
   clear_undo() {
      if (this.undoStack.length === 0 && this.redoStack.length === 0) return;
      this.undoStack = [];
      this.redoStack = [];
      this.update_undo_bar();
   }

   private get_werte(): string[][] {
      const table = this.shadow.getElementById('mytable') as HTMLTableElement;
      const nSpalten = table.rows[0].cells.length;
      const werte: string[][] = [];
      for (let i = 1; i < table.rows.length; i++) {
         const zeile: string[] = [];
         for (let j = 1; j < nSpalten; j++) {
            const child = table.rows[i].cells[j].firstElementChild as HTMLInputElement | HTMLSelectElement | null;
            zeile.push(child ? child.value : '');
         }
         werte.push(zeile);
      }
      return werte;
   }

   private set_werte(werte: string[][]) {
      this.resize_Tabelle('mytable', werte.length, Number(this.nSpalten));
      const table = this.shadow.getElementById('mytable') as HTMLTableElement;
      for (let i = 1; i < table.rows.length; i++) {
         const zeile = werte[i - 1];
         for (let j = 1; j < table.rows[i].cells.length; j++) {
            const child = table.rows[i].cells[j].firstElementChild as HTMLInputElement | HTMLSelectElement | null;
            if (child) child.value = zeile[j - 1] ?? '';
         }
      }
   }

   private rows_changed() {
      this.toggleMenuOff();
      this.update_undo_bar();
      // Zähler (dr-button-pm) außerhalb der Tabelle nachziehen, sonst stellt resizeTables() die Zeile wieder her
      this.dispatchEvent(new CustomEvent('rows-changed', {
         detail: { value: Number(this.nZeilen) },
         bubbles: true,
         composed: true,
      }));
      berechnungErforderlich(true);
   }

   delete_row(iZeile: number) {
      const werte = this.get_werte();
      if (iZeile < 1 || iZeile > werte.length) return;
      this.undoStack.push(werte);
      this.redoStack = [];
      this.set_werte(werte.filter((_, i) => i !== iZeile - 1));
      this.rows_changed();
   }

   /**
    * Zeilenzahl ändern wie über das Attribut nzeilen, aber mit Undo/Redo: beim Verkleinern landen die
    * Werte der entfernten Zeilen im Rückgängig-Speicher wie beim Löschen (z.B. Zähler „−“ einer App).
    */
   set_nzeilen_undo(n: number) {
      const werte = this.get_werte();
      n = Math.max(0, Math.round(n));
      if (n === werte.length) return;
      this.undoStack.push(werte);
      this.redoStack = [];
      const nSpalten = werte[0]?.length ?? Number(this.nSpalten);
      const neu = werte.slice(0, n);
      while (neu.length < n) neu.push(Array(nSpalten).fill(''));
      this.set_werte(neu);   // resize_Tabelle setzt nZeilen/nTabRow
      this.rows_changed();
   }

   /** Leere Zeile oberhalb von iZeile einfügen (Werte darunter rutschen eine Zeile nach unten). */
   insert_row(iZeile: number) {
      const werte = this.get_werte();
      if (iZeile < 1 || iZeile > werte.length + 1) return;
      this.undoStack.push(werte);
      this.redoStack = [];
      const neu = werte.slice();
      neu.splice(iZeile - 1, 0, Array(werte[0]?.length ?? Number(this.nSpalten)).fill(''));
      this.set_werte(neu);   // resize_Tabelle setzt nZeilen/nTabRow
      this.rows_changed();
   }

   undo_delete() {
      const snap = this.undoStack.pop();
      if (!snap) return;
      this.redoStack.push(this.get_werte());
      this.set_werte(snap);
      this.rows_changed();
   }

   redo_delete() {
      const snap = this.redoStack.pop();
      if (!snap) return;
      this.undoStack.push(this.get_werte());
      this.set_werte(snap);
      this.rows_changed();
   }

   //---------------------------------------------------------------------------------------------------------------
   columns_languageChanged(newValue: string) {
      //------------------------------------------------------------------------------------------------------------
      parse_liste(newValue).forEach((t, i) => this.columns[i] = t);

      const table = this.shadow.getElementById('mytable') as HTMLTableElement;
      const kopf = table.rows.item(0);
      if (!kopf) return;
      for (let iSpalte = 0; iSpalte < kopf.cells.length; iSpalte++) {
         kopf.cells[iSpalte].innerHTML = this.columns[iSpalte];
      }
   }

   //---------------------------------------------------------------------------------------------------------------
   hide_column(iSpalte: number) {
      //------------------------------------------------------------------------------------------------------------
      const tabelle = this.shadow.getElementById('mytable') as any;
      for (let i = 0; i <= this.nZeilen; i++) {
         tabelle.rows[i].cells[iSpalte].style.display = 'none';
      }
      this.col_visible[iSpalte] = false;
   }

   //---------------------------------------------------------------------------------------------------------------
   show_column(iSpalte: number) {
      //------------------------------------------------------------------------------------------------------------
      const tabelle = this.shadow.getElementById('mytable') as any;
      for (let i = 0; i <= this.nZeilen; i++) {
         tabelle.rows[i].cells[iSpalte].style.display = 'table-cell';
      }
      this.col_visible[iSpalte] = true;
   }

   //---------------------------------------------------------------------------------------------------------------
   // Auswahlspalten (select) mit den Querschnittsnamen des Projekts
   //---------------------------------------------------------------------------------------------------------------

   /** alle select-Elemente der Tabelle mit Zeile und Spalte */
   private alle_selects(): HTMLSelectElement[] {
      const liste: HTMLSelectElement[] = [];
      for (let iZeile = 1; iZeile <= this.nZeilen; iZeile++) {
         for (let iSpalte = 1; iSpalte <= this.nSpalten; iSpalte++) {
            if (this.typs[iSpalte] !== 'select') continue;
            const el = this.shadow.getElementById('idtable-' + iZeile + '-' + iSpalte);
            if (el) liste.push(el);
         }
      }
      return liste;
   }

   add_new_select_option() {
      const name = get_querschnittRechteck_name(nQuerschnittSets - 1);
      for (const el of this.alle_selects()) {
         const option = document.createElement('option');
         option.value = option.textContent = name;
         el.appendChild(option);
      }
   }

   update_select_options_name(index: number) {
      const name = get_querschnittRechteck_name(index);
      for (const el of this.alle_selects()) {
         const option = el.children.item(index) as HTMLOptionElement | null;
         if (option) {
            option.innerHTML = name;
            option.value = name;
         }
      }
   }

   del_select_options(qname: string) {
      for (const el of this.alle_selects()) {
         for (let i = 0; i < el.children.length; i++) {
            const option = el.children.item(i) as HTMLOptionElement;
            if (qname === String(option.value)) {
               el.removeChild(option);
               break;
            }
         }
      }
   }

   //---------------------------------------------------------------------------------------------------------------
   clear_Tabelle(idTable: any) {
      //---------------------------------------------------------------------------------------------------------------
      const table = this.shadow.getElementById(idTable) as HTMLTableElement;
      const nZeilen = table.rows.length;
      const nSpalten = table.rows[0].cells.length;

      for (let iZeile = 1; iZeile < nZeilen; iZeile++) {
         for (let iSpalte = 1; iSpalte < nSpalten; iSpalte++) {
            const child = table.rows[iZeile].cells[iSpalte].firstElementChild as HTMLInputElement | HTMLSelectElement | null;
            if (!child) continue;

            if (child instanceof HTMLSelectElement) {
               child.replaceChildren();      // alle Options entfernen, unabhängig von nQuerschnittSets
            } else {
               child.value = '';
            }
         }
      }
   }

   //---------------------------------------------------------------------------------------------------------------
   /** Markierung aller Zellen aufheben */
   unselect_Tabelle() {
      //------------------------------------------------------------------------------------------------------------
      const tabelle = this.shadow.getElementById('mytable') as any;
      if (tabelle === null) return;

      for (let i = 1; i <= this.nZeilen; i++) {
         for (let j = 1; j <= this.nSpalten; j++) {
            const el = tabelle.rows[i].cells[j].firstElementChild;
            if (this.typs[j] === 'select') el.style.backgroundColor = 'rgb(255,255,255)';
            el.className = 'input_normal';
         }
      }
   }

   /** Rechteck von der Startzelle (startRowIndex, startColIndex) bis (rowIndex, colIndex) markieren */
   private markiere_block(rowIndex: number, colIndex: number) {
      const rowStart = Math.min(rowIndex, this.startRowIndex);
      const rowEnd = Math.max(rowIndex, this.startRowIndex);
      const colStart = Math.min(colIndex, this.startColIndex);
      const colEnd = Math.max(colIndex, this.startColIndex);

      this.unselect_Tabelle();

      const tabelle = this.shadow.getElementById('mytable') as any;
      for (let i = rowStart; i <= rowEnd; i++) {
         for (let j = colStart; j <= colEnd; j++) {
            const el = tabelle.rows[i].cells[j].firstElementChild;
            if (this.typs[j] === 'select') el.style.backgroundColor = 'rgb(255,165,0)';
            el.className = 'input_select';
         }
      }
   }

   /** Zeile unter der Seitenkoordinate pageY, gemessen ab der Startzelle */
   private zeile_bei(pageY: number): number {
      return Number(this.startRowIndex) + Math.floor((pageY - this.cellTop) / this.cellHeight);
   }

   //---------------------------------------------------------------------------------------------------------------
   resize_Tabelle(idTable: any, nRowNew: number, nColNew: number) {
      //------------------------------------------------------------------------------------------------------------
      const table = this.shadow.getElementById(idTable) as HTMLTableElement;
      const nZeilen = table.rows.length - 1; // header abziehen
      const nSpalten = table.rows[0].cells.length - 1;

      if (nSpalten > nColNew) {
         for (let i = 1; i <= nSpalten - nColNew; i++) {
            for (let j = 0; j <= nZeilen; j++) {
               table.rows.item(j)?.deleteCell(-1);
            }
         }
      }
      if (nZeilen > nRowNew) {
         for (let i = 1; i <= nZeilen - nRowNew; i++) table.deleteRow(-1);
      }

      if (nColNew > nSpalten) {
         // Spalten anhängen; neue Überschrift = coltext + Nummer (z.B. Lastfall-Spalten)
         for (let iZeile = 0; iZeile <= nZeilen; iZeile++) {
            const row = table.rows.item(iZeile);
            if (!row) continue;
            for (let iSpalte = nSpalten + 1; iSpalte <= nColNew; iSpalte++) {
               if (iZeile === 0) this.create_header_cell(row, iSpalte, this.colText + ' ' + (iSpalte - 1));
               else this.create_data_cell(row, iZeile, iSpalte);
            }
         }
      }

      if (nRowNew > nZeilen) {
         for (let iZeile = nZeilen + 1; iZeile <= nRowNew; iZeile++) {
            const newRow = table.insertRow(-1);
            this.create_no_cell(newRow, iZeile);
            for (let iSpalte = 1; iSpalte <= nColNew; iSpalte++) {
               this.create_data_cell(newRow, iZeile, iSpalte);
            }
         }
      }

      this.nSpalten = nColNew;
      this.nZeilen = nRowNew;
      this.nTabRow = +this.nZeilen + 1;
      this.nTabCol = +this.nSpalten + 1;
   }

   //---------------------------------------------------------------------------------------------------------------
   // Tastatur
   //---------------------------------------------------------------------------------------------------------------

   private focusCell(zeile: number, spalte: number) {
      const el = this.shadow.getElementById(`idtable-${zeile}-${spalte}`) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const evt = new Event('mousedown', { bubbles: true, cancelable: false }) as any;
      evt.button = 0;   // linke Maustaste
      el.dispatchEvent(evt);
   }

   KEYDOWN(ev: KeyboardEvent) {
      // Shortcuts (Strg+C/V/A/Z, Cmd auf Mac, Alt+...) nie blockieren
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;

      const target = ev.target as HTMLInputElement | HTMLSelectElement;
      const parts = target.id.split('-');          // idtable-<zeile>-<spalte>
      const zeile = Number(parts[1]);
      const spalte = Number(parts[2]);
      const isSelect = target instanceof HTMLSelectElement;

      switch (ev.key) {
         case 'Enter': {
            ev.preventDefault();
            if (zeile + 1 < this.nTabRow) {
               // select-Option bisher nur in Spalte 1
               this.focusCell(zeile + 1, this.typs[1] === 'select' ? 2 : 1);
            }
            return;
         }
         case 'ArrowDown':
         case 'PageDown': {
            // In einem Select ändern die Pfeiltasten nativ die Auswahl
            if (isSelect && ev.key === 'ArrowDown') return;
            ev.preventDefault();
            if (zeile + 1 < this.nTabRow) this.focusCell(zeile + 1, spalte);
            return;
         }
         case 'ArrowUp':
         case 'PageUp': {
            if (isSelect && ev.key === 'ArrowUp') return;
            ev.preventDefault();
            if (zeile - 1 > 0) this.focusCell(zeile - 1, spalte);
            return;
         }
      }

      // Zahlenfelder: nur druckbare Zeichen filtern. Tab, Home, End, F5, Backspace,
      // Delete, Pfeile links/rechts usw. haben key.length > 1 und gehen durch.
      if (target.type === 'number' && ev.key.length === 1 && !/[0-9eE.,+\-]/.test(ev.key)) {
         ev.preventDefault();
      }
      // text und select: nichts blockieren
   }

   //---------------------------------------------------------------------------------------------------------------
   // Zellen markieren: Finger/Stift (TOUCH_MOVE) oder rechte Maustaste (MOUSE_MOVE), danach Kontextmenü
   //---------------------------------------------------------------------------------------------------------------

   POINTER_UP(ev: any) {
      if (ev.cancelable) ev.preventDefault();

      if (ev.pointerType !== 'touch' && ev.pointerType !== 'pen') {
         const table = this.shadow.getElementById('mytable') as HTMLTableElement;
         table.removeEventListener('mousemove', this.onMouseMove, false);
      }

      if (this.selectionMode) this.show_contextMenu(ev);

      this.selectionMode = false;
   }

   TOUCH_MOVE(ev: any) {
      if (!this.selectionMode || this.selection_ended) return;

      if (ev.touches.length !== 1) {
         this.selectionMode = false;
         this.selection_ended = true;
         this.unselect_Tabelle();
         return;
      }
      this.lastClientX = ev.changedTouches[0].clientX;
      this.lastClientY = ev.changedTouches[0].clientY;

      if (ev.cancelable) ev.preventDefault();

      if (!(ev.target?.id?.length > 0)) return;

      const touch = ev.changedTouches[0];

      const zeile = this.zeile_bei(touch.pageY);
      if (zeile > this.nZeilen) return;
      if (zeile < 1) return;

      let spalte = 1;
      for (let ispalte = 1; ispalte < this.nTabCol; ispalte++) {
         if (this.col_visible[ispalte] && touch.clientX > this.cellsLeft[ispalte]) spalte = ispalte;
      }

      if (zeile === this.firstRowIndex && spalte === this.firstColIndex) return; // Bewegung innerhalb erstgepickter Zelle
      this.firstRowIndex = -1;

      this.markiere_block(zeile, spalte);
   }

   POINTER_DOWN(ev: any) {
      this.lastClientX = ev.clientX;
      this.lastClientY = ev.clientY;

      if (ev.pointerType === 'mouse' && ev.button === 0) return;

      const inputId = ev.target.id;

      this.toggleMenuOff();
      this.selection_ended = false;

      // linke Kante jeder Spalte (ausgeblendete Spalten liefern 0)
      if (this.cellsLeft.length !== this.nTabCol) this.cellsLeft = Array(this.nTabCol);
      for (let ispalte = 1; ispalte < this.nTabCol; ispalte++) {
         const el = this.shadow.getElementById('idtable-1-' + ispalte) as HTMLInputElement;
         this.cellsLeft[ispalte] = el.getBoundingClientRect().x;
      }

      const myArray = inputId.split('-');
      this.firtstWert = ev.target.value;

      this.firstRowIndex = Number(myArray[1]);
      this.firstColIndex = Number(myArray[2]);

      // Lage der Startzelle merken, wenn die Zeile später aus der Koordinate berechnet wird
      const merke_startzelle = () => {
         const offsetY = ev.pageY - ev.clientY;
         const rect = (this.shadow.getElementById(inputId) as HTMLInputElement).getBoundingClientRect();
         this.cellTop = rect.y + offsetY;
         this.cellHeight = rect.height;
      };

      if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
         if (touch_support_table) {
            this.selectionMode = true;
            merke_startzelle();
         }
      } else {
         const table = this.shadow.getElementById('mytable') as HTMLTableElement;
         table.addEventListener('mousemove', this.onMouseMove, false);
         if (Detect.browser === 'Firefox') merke_startzelle();
      }

      if (ev.button === 0 || ev.which === 3) {         // Finger/Stift oder rechte Maustaste
         this.selectionMode = true;
         this.startRowIndex = Number(myArray[1]);
         this.startColIndex = Number(myArray[2]);
      }
   }

   MOUSE_MOVE(ev: any) {
      ev.preventDefault();
      this.lastClientX = ev.clientX;
      this.lastClientY = ev.clientY;

      if (!this.selectionMode) return;

      if (!(ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT')) return;

      const tableId = ev.target.offsetParent.offsetParent.id;
      if (tableId === '') return; // cursor steht auf irgendwas, aber nicht auf tag <input>

      const text = ev.target.id;
      if (!(text.length > 0)) return;

      let rowIndex: number, colIndex: number;
      if (Detect.browser === 'Firefox') {
         // Firefox liefert als target weiter die Startzelle, daher aus der Koordinate rechnen
         rowIndex = this.zeile_bei(ev.pageY);
         if (rowIndex > this.nZeilen) return;
         if (rowIndex < 1) return;

         colIndex = 1;
         for (let ispalte = 1; ispalte < this.nTabCol; ispalte++) {
            if (this.cellsLeft[ispalte] > 0 && ev.clientX > this.cellsLeft[ispalte]) colIndex = ispalte;  // 0 = unsichtbare Spalte
         }
      } else {
         const myArray = text.split("-");
         rowIndex = Number(myArray[1]);
         colIndex = Number(myArray[2]);
      }

      if (rowIndex === this.firstRowIndex && colIndex === this.firstColIndex) return; // Bewegung innerhalb erstgepickter Zelle
      this.firstRowIndex = -1;

      this.markiere_block(rowIndex, colIndex);
   }

   //---------------------------------------------------------------------------------------------------------------
   // Kontextmenü (liegt als #context-menu im index.html des Projekts)
   //---------------------------------------------------------------------------------------------------------------

   _menuItemListener(link: any) {
      this.toggleMenuOff();

      if (this.tableId === current_table_id) {
         const action = link.getAttribute("data-action");
         const tabelle = this.shadow.getElementById('mytable') as HTMLTableElement;
         const nZeilen = tabelle.rows.length;
         const nSpalten = tabelle.rows[0].cells.length;
         const input = (i: number, j: number) => tabelle.rows[i].cells[j].firstElementChild as any;

         if (action === "copyFirst") {
            // Wert der zuerst angeklickten Zelle in alle markierten Zellen
            const wert = this.firtstWert;
            for (let i = 1; i < nZeilen; i++) {
               for (let j = 1; j < nSpalten; j++) {
                  if (this.col_visible[j] && input(i, j).className === 'input_select') input(i, j).value = wert.toString();
               }
            }
            berechnungErforderlich(true);
         }
         else if (action === "copyFirstRow") {
            // Werte der zuerst angeklickten Zeile in alle markierten Zeilen
            const row = this.startRowIndex;
            const value = [];
            for (let j = 1; j < nSpalten; j++) value.push(input(row, j).value);

            for (let i = 1; i < nZeilen; i++) {
               for (let j = 1; j < nSpalten; j++) {
                  if (this.col_visible[j] && input(i, j).className === 'input_select') input(i, j).value = value[j - 1].toString();
               }
            }
            berechnungErforderlich(true);
         }
         else if (action === "increment_1") {
            // ab der zuerst angeklickten Zeile hochzählen
            const row = this.startRowIndex;
            const value = [];
            for (let j = 1; j < nSpalten; j++) value.push(input(row, j).value);

            for (let i = 1; i < nZeilen; i++) {
               for (let j = 1; j < nSpalten; j++) {
                  if (this.col_visible[j] && this.typs[j] !== 'select' && input(i, j).className === 'input_select') {
                     input(i, j).value = (value[j - 1]++).toString();
                  }
               }
            }
            berechnungErforderlich(true);
         }
         else if (action === "increment_delta") {
            // Differenz der ersten beiden Zeilen fortschreiben
            const row = Number(this.startRowIndex);
            if (row + 2 >= nZeilen) return;    // das geht nicht, da gibt es nichts zu tun

            const value = [];
            const delta = [];
            for (let j = 1; j < nSpalten; j++) {
               const del = input(row + 1, j).value - input(row, j).value;
               value.push(Number(input(row, j).value));
               delta.push(Number(del));
            }

            for (let i = 1; i < nZeilen; i++) {
               for (let j = 1; j < nSpalten; j++) {
                  if (this.col_visible[j] && this.typs[j] !== 'select' && input(i, j).className === 'input_select') {
                     const zahl = (Number(value[j - 1]) as any).toPrecision(12) * 1;
                     input(i, j).value = zahl.toString();
                     value[j - 1] += delta[j - 1];
                  }
               }
            }
            berechnungErforderlich(true);
         }
         else if (action === "copy") {
            // markierte Zellen tabulatorgetrennt in die Zwischenablage (Dezimalkomma bei deutschem System)
            const deutsch = Intl.NumberFormat().resolvedOptions().locale.split("-")[0] === 'de';
            const newLine = Detect.OS === 'Windows' ? "\r\n" : "\n";
            const formatiert = (i: number, j: number) => {
               const wert = input(i, j).value;
               return deutsch ? wert.replace('.', ',') : wert;
            };

            let newClip = "";
            for (let i = 1; i < nZeilen; i++) {
               let wertInSpalte1 = false;
               for (let j = 1; j < nSpalten - 1; j++) {
                  if (input(i, j).className === 'input_select') {
                     if (wertInSpalte1) newClip += "\t";
                     newClip += formatiert(i, j);
                     wertInSpalte1 = true;
                  }
               }
               if (input(i, nSpalten - 1).className === 'input_select') {
                  if (wertInSpalte1) newClip += "\t";
                  newClip += formatiert(i, nSpalten - 1) + newLine;
               } else {
                  if (wertInSpalte1) newClip += newLine;
               }
            }

            navigator.clipboard.writeText(newClip).catch(() => console.error("Zwischenablage: Schreiben fehlgeschlagen"));
         }
         else if (action === "insert") {
            // Zwischenablage ab der zuerst angeklickten Zelle einfügen
            const newLine = Detect.OS === 'Windows' ? "\r\n" : "\n";
            const row = Number(this.startRowIndex);
            const col = Number(this.startColIndex);

            navigator.clipboard.readText().then(function (clipText) {
               const zeilen = clipText.split(newLine);
               for (let i = 0; i < zeilen.length - 1; i++) {
                  const zeile = zeilen[i].split("\t");
                  for (let j = 0; j < zeile.length; j++) {
                     if ((row + i) < nZeilen && (col + j) < nSpalten) {
                        input(row + i, col + j).value = zeile[j].replace(/,/g, '.');
                     }
                  }
               }
               berechnungErforderlich(true);
            });
         }
      }

      document.getElementById("context-menu")?.removeEventListener('click', this.ref_listener);
      this.ref_listener = null;

      this.unselect_Tabelle();
   }

   show_contextMenu(ev: any) {
      if (this.ref_listener === null) {
         document.getElementById("context-menu")?.addEventListener('click', this.ref_listener = this.contextMenuClicked.bind(this));
      }

      this.taskItemInContext = this.clickInsideElement(ev, this.taskItemClassName);

      if (this.taskItemInContext) {
         if (ev.cancelable) ev.preventDefault();
         this.toggleMenuOn();
         this.positionMenu(ev);
         current_table_id = this.tableId;
      } else {
         this.taskItemInContext = null;
         this.toggleMenuOff();
      }
   }

   clickInsideElement(e: any, className: any) {
      let el = e.srcElement || e.target;

      if (el.classList.contains(className)) {
         return el;
      } else if (el.classList.contains('input_select')) {
         return el;
      } else {
         while (el = el.parentNode) {
            if (el.classList && el.classList.contains(className)) return el;
         }
      }

      return false;
   }

   contextMenuClicked(ev: any) {
      const clickeElIsLink = this.clickInsideElement(ev, this.contextMenuLinkClassName);

      if (clickeElIsLink) {
         ev.preventDefault();
         if (ev.button === 2) return;
         this._menuItemListener(clickeElIsLink);
      }
   }

   toggleMenuOn() {
      this.menu = this.menu ?? document.querySelector('#context-menu');

      if (this.menuState !== 1) {
         this.menuState = 1;
         this.menu?.classList.add(this.contextMenuActive);
         this.menu?.focus();
      }
   }

   toggleMenuOff() {
      if (this.menuState !== 0) {
         this.menuState = 0;
         this.menu?.classList.remove(this.contextMenuActive);
      }
   }

   positionMenu(e: any) {
      const margin = 8;     // Mindestabstand zum Rand
      const gap = 12;       // Abstand zum Finger/Cursor

      // Koordinaten: bei pointercancel oder touchend ggf. 0 -> letzte bekannte Position
      let x = e.clientX;
      let y = e.clientY;
      if (!x && !y) { x = this.lastClientX; y = this.lastClientY; }

      // sichtbarer Bereich (berücksichtigt Pinch-Zoom und Tastatur auf Mobilgeräten)
      const vv = window.visualViewport;
      const vLeft = vv ? vv.offsetLeft : 0;
      const vTop = vv ? vv.offsetTop : 0;
      const vW = vv ? vv.width : document.documentElement.clientWidth;
      const vH = vv ? vv.height : document.documentElement.clientHeight;

      this.menu = this.menu ?? document.querySelector('#context-menu');  // zur sicherheit
      const m = this.menu as HTMLElement;
      m.style.position = 'fixed';
      m.style.right = 'auto';
      m.style.bottom = 'auto';

      // Menü höher als Bildschirm -> Höhe begrenzen und scrollbar machen
      m.style.maxHeight = (vH - 2 * margin) + 'px';
      m.style.overflowY = 'auto';

      const w = m.offsetWidth;
      const h = m.offsetHeight;      // nach maxHeight messen

      // horizontal: rechts vom Punkt, wenn Platz, sonst links davon
      let left = (x + gap + w + margin <= vLeft + vW) ? x + gap : x - gap - w;

      // vertikal: unterhalb, wenn Platz, sonst oberhalb (Finger verdeckt so nichts)
      let top = (y + gap + h + margin <= vTop + vH) ? y + gap : y - gap - h;

      // am Ende immer in den sichtbaren Bereich klemmen
      left = Math.max(vLeft + margin, Math.min(left, vLeft + vW - w - margin));
      top = Math.max(vTop + margin, Math.min(top, vTop + vH - h - margin));

      m.style.left = left + 'px';
      m.style.top = top + 'px';
   }
}

customElements.define('dr-tabelle', DrTabelle);
