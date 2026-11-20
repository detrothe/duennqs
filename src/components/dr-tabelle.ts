import styles from './dr-tabelle.css?raw';

// quer_2: Abhängigkeiten aus d2beam-gui über tabelle_umgebung.ts (sonst unverändert aus d2beam-gui)
import {
   nQuerschnittSets, get_querschnittRechteck_name, Detect,
   berechnungErforderlich, touch_support_table, write, msg, str, ConfirmDialog,
} from './tabelle_umgebung';

// Zeile oberhalb einfügen (allow_insert_row, ergänzt in quer_2)
const INSERT_SVG =
   '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" ' +
   'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
   '<path d="M12 5v14M5 12h14"/></svg>';

const TRASH_SVG =
   '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" ' +
   'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
   '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>';

// const contextMenuLinkClassName = "context-menu__link";
// const contextMenuActive = "context-menu--active";

// const taskItemClassName = "tabellen";   // tasks  tabelle
// let taskItemInContext;

// let clickCoords;
// let clickCoordsX;
// let clickCoordsY;

// const menu = document.querySelector("#context-menu") as any;

// let menuState = 0;
// let menuWidth;
// let menuHeight;

// let windowWidth;
// let windowHeight;


// //----------------------------------------------------------------------------------------------
// function toggleMenuOn() {
//    //------------------------------------------------------------------------------------------
//    //console.log("toggleMenuOn", menuState);
//    if (menuState !== 1) {
//       menuState = 1;
//       menu?.classList.add(contextMenuActive);
//       menu?.focus();
//    }
// }

// //----------------------------------------------------------------------------------------------
// export function toggleMenuOff() {
//    //------------------------------------------------------------------------------------------
//    if (menuState !== 0) {
//       menuState = 0;
//       menu?.classList.remove(contextMenuActive);
//    }
// }



// //----------------------------------------------------------------------------------------------
// function getPosition(e: any) {
//    //------------------------------------------------------------------------------------------
//    let posx = 0;
//    let posy = 0;

//    //if (!e) var e = window.event;

//    if (e.pageX || e.pageY) {
//       posx = e.pageX;
//       posy = e.pageY;
//    } else if (e.clientX || e.clientY) {
//       posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
//       posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
//    }

//    //console.log("getPosition", posx, posy)

//    return {
//       x: posx,
//       y: posy
//    }
// }

// //----------------------------------------------------------------------------------------------
// function positionMenu(e: any) {
//    //------------------------------------------------------------------------------------------

//    //console.log("positionMenu", e.pageX, e.pageY);

//    clickCoords = getPosition(e);
//    clickCoordsX = clickCoords.x;
//    clickCoordsY = clickCoords.y;

//    menuWidth = menu.offsetWidth + 4;
//    menuHeight = menu.offsetHeight + 4;

//    windowWidth = document.documentElement.clientWidth;   //window.innerWidth;
//    windowHeight = document.documentElement.clientHeight; //window.innerHeight;

//    if ((e.pageX + menuWidth) > windowWidth) {
//       menu.style.left = e.pageX - menuWidth + "px";
//    } else {
//       //menu.style.left = clickCoordsX + "px";
//       menu.style.left = e.pageX + "px";
//    }


//    if ((e.pageY + menuHeight) > windowHeight) {
//       menu.style.top = e.pageY - menuHeight + "px";
//    } else {
//       //menu.style.top = clickCoordsY + "px";
//       menu.style.top = e.pageY + "px";
//    }
// }


let current_table_id = ''

//______________________________________________________________________________________________________
//______________________________________________________________________________________________________ DrTabelle
//______________________________________________________________________________________________________

// <hello-world> Web Component
class DrTabelle extends HTMLElement {
   shadow: any = null;

   ref_listener: any = null;

   nZeilen = 2;
   nSpalten = 2;

   columns: any = [];
   typs: any = [];
   colWidth: any = [];
   colText = '';

   nTabRow = 3; // immert 1 mehr, da Zeile, Spalte mit 0 beginnt
   nTabCol = 3;

   cellWidth = 0;
   cellHeight = 0;
   cellRow = 0;
   cellCol = 0;
   cellTop = 0;
   cellLeft = 0;
   //cellRight = 0;
   //cellBottom = 0;
   cellId: string = '';
   offsetX: number = 0;
   offsetY: number = 0;
   selected: boolean = false;

   tableRoot: any;

   tableId = '';
   isSelected = false;
   selectedCellRow = -1;
   selectedCellCol = -1;
   col = -1;
   row = -1;
   wert = 0;
   activatedElement = null;
   //selColY= []
   //selColZ= []
   startRowIndex = 0;
   startColIndex = 0;

   firstRowIndex = 0;
   firstColIndex = 0;
   firtstWert = ''

   pointerIsDown = false;
   startx = 0;
   starty = 0;
   zelle = null;
   //nZeilen = 0
   //nSpalten = 0
   selectionMode = false;
   selection_ended = false;

   cellsLeft: number[] = [];
   cellsWidth: number[] = [];
   col_visible: boolean[] = [];   // gibt an, ob Spalte sichtbar ist
   /*
   connectedCallback() {
      this.textContent = 'Hello, World!';
   }
  */

   contextMenuLinkClassName = "context-menu__link";
   contextMenuActive = "context-menu--active";

   taskItemClassName = "tabellen";   // tasks  tabelle
   taskItemInContext: any;

   clickCoords: any;
   clickCoordsX: any;
   clickCoordsY: any;

   menu = document.querySelector("#context-menu") as any;

   menuState = 0;
   menuWidth: any;
   menuHeight: any;

   windowWidth: any;
   windowHeight: any;

   private onMouseMove = (ev: any) => this.MOUSE_MOVE(ev);
   private onTouchMove = (ev: any) => this.TOUCH_MOVE(ev);
   private onKeyDown = (ev: Event) => this.KEYDOWN(ev as KeyboardEvent);

   // manuelle Eingabe macht die Lösch-Schnappschüsse ungültig
   private onValueChanged = () => { this.clear_undo(); berechnungErforderlich(true); };

   lastClientX = 0;
   lastClientY = 0;

   // Attribut allow_delete_row: Löschen-Button in der No-Spalte jeder Zeile, mit lokalem Undo/Redo.
   // Muss beim Erstellen der Tabelle gesetzt sein.
   allowDeleteRow = false;
   // Attribut allow_insert_row (ergänzt in quer_2): Button „+“ in der No-Spalte fügt oberhalb eine leere
   // Zeile ein; gleiches Undo/Redo wie beim Löschen. Muss ebenfalls beim Erstellen der Tabelle gesetzt sein.
   allowInsertRow = false;
   undoStack: string[][][] = [];   // Schnappschüsse aller Zellwerte (Zeile, Spalte) vor einer Änderung
   redoStack: string[][][] = [];
   undoBar: HTMLDivElement | null = null;
   btnUndo: HTMLButtonElement | null = null;
   btnRedo: HTMLButtonElement | null = null;

   //---------------------------------------------------------------------------------------------------------------
   connectedCallback() {
      //------------------------------------------------------------------------------------------------------------

      //console.log('connectedCallback  Custom square element added to page.');

      // Bei erneutem Einhängen (Verschieben im DOM, Lit-Rerender) nichts neu aufbauen
      if (this.shadow.getElementById('mytable')) return;

      if (this.allowDeleteRow || this.allowInsertRow) this.create_undo_bar();

      const table = document.createElement('table');
      this.shadow.appendChild(table);
      table.id = 'mytable';
      const table1 = this.shadow.getElementById('mytable') as HTMLTableElement;
      table1.addEventListener('touchstart', this.TOUCH_START.bind(this));    // , {capture:true}
      table1.addEventListener('pointerup', this.POINTER_UP.bind(this), true);
      // dauerhaft registrieren, damit iOS preventDefault schon beim 1. touchstart berücksichtigt
      table1.addEventListener('touchmove', this.onTouchMove, { capture: true, passive: false });
      // iOS feuert pointercancel, wenn es doch zu scrollen beginnt
      table1.addEventListener('pointercancel', this.POINTER_UP.bind(this), true);

      table1.addEventListener("contextmenu", e => e.preventDefault());
      table.onclick = function (e) {
         // Some code here...
         console.log("Table clicked!", e);
      };

      let thead = table.createTHead();
      //console.log('thead', thead);
      let row = thead.insertRow();
      for (let i = 0; i < this.nTabCol; i++) {
         if (table.tHead) {
            const th0 = table.tHead.appendChild(document.createElement('th'));
            th0.innerHTML = this.columns[i];
            //th0.title = "Elementnummer"
            th0.style.padding = '5px';
            th0.style.margin = '0px';
            th0.style.textAlign = 'center';
            //th0.setAttribute('title', 'Hilfe')
            row.appendChild(th0);
         }
      }

      let id_table = 'idtable';

      let tbody = table.createTBody();
      //      tbody.addEventListener('mousemove', this.POINTER_MOVE);
      // tbody.addEventListener('mousemove', this.MOUSE_MOVE.bind(this));    // , {capture:true}
      // tbody.addEventListener('pointerleave', this.POINTER_LEAVE.bind(this));
      // tbody.addEventListener('pointerup', this.POINTER_UP.bind(this));

      for (let iZeile = 1; iZeile < this.nTabRow; iZeile++) {
         let newRow = tbody.insertRow(-1);

         for (let iSpalte = 0; iSpalte < this.nTabCol; iSpalte++) {
            //this.columns.length
            // columns.length

            let newCell;
            if (iSpalte === 0) {
               newCell = newRow.insertCell(iSpalte); // Insert a cell in the row at index 0
               newCell.style.textAlign = 'center';
               //   >>> newCell.style.backgroundColor = color_table_in   //'#b3ae00'   //'rgb(150,180, 180)';
               newCell.style.padding = '0px';
               newCell.style.margin = '0px';
               this.fill_no_cell(newCell, iZeile);
               //newCell.setAttribute('title', 'Knotennummer')
            } else {
               //console.log('this.typs', '|' + this.typs[iSpalte] + '|');
               let el;
               if (this.typs[iSpalte] === 'select') {
                  el = document.createElement('select');
                  el.style.width = '100%';   // 100px
                  el.style.backgroundColor = 'rgb(255,255,255)';
                  console.log('CREATED SELECT');
                  for (let i = 0; i < nQuerschnittSets; i++) {
                     let option = document.createElement('option');

                     option.value = option.textContent = 'Querschnitt lang ' + (i + 1);

                     el.appendChild(option);
                  }
               } else {
                  el = document.createElement('input');
                  if (this.typs[iSpalte] === "text") {
                     el.setAttribute('type', 'text');
                  } else {
                     el.setAttribute('type', 'number');
                  }
                  el.style.width = 'inherit'; //'6em';   // 100px
               }

               //el.style.backgroundColor = 'rgb(200,200,200)';
               el.style.border = 'none';
               el.style.borderWidth = '0px';
               el.style.padding = '0.3125rem';   // 5px
               el.style.margin = '0px';
               el.style.borderRadius = '0px';
               el.style.fontSize = '1rem';
               el.style.color = 'rgb(0,0,0)';

               const str = id_table + '-' + iZeile + '-' + iSpalte;
               el.id = str;
               //el.value = str;
               //el.className = 'input_normal';
               el.addEventListener('keydown', this.onKeyDown);
               el.addEventListener('input', this.onValueChanged);
               el.addEventListener('change', this.onValueChanged);   // für select / Browser-Autofill
               //el.addEventListener("change", function () { berechnungErforderlich(true); });

               newCell = newRow.insertCell();
               if (this.colWidth.length === 0) newCell.style.width = '6rem';
               else newCell.style.width = this.colWidth[Math.min(iSpalte, this.colWidth.length - 1)] + 'rem';

               newCell.style.border = 'solid';
               newCell.style.borderWidth = '1px';
               newCell.style.padding = '0px';
               newCell.style.margin = '0px';
               newCell.style.backgroundColor = 'rgb(255,255,255)';
               newCell.style.touchAction = 'auto';
               const str1 = id_table + 'Cell-' + iZeile + '-' + iSpalte;
               newCell.id = str1;
               newCell.className = 'input_normal';
               newCell.style.fontSize = '1rem';

               newCell.appendChild(el);

               //if (this.typs[iSpalte] === 'select') el.addEventListener('click', this.SELECT.bind(this));
               //else
               el.addEventListener('pointerdown', this.POINTER_DOWN.bind(this));
               //el.addEventListener('click', this.CLICK.bind(this));


               //el.addEventListener('mousemove', this.POINTER_MOVE);
               //console.log("el.addEventlistener", el)
               //TODO el.addEventListener('pointermove', this.POINTER_MOVE);
               //console.log("rect", iZeile, iSpalte, el.getBoundingClientRect().x, newCell.getBoundingClientRect().y, newCell.getBoundingClientRect().width, newCell.getBoundingClientRect().height)
            }
         }
      }

      this.cellsLeft = Array(this.nTabCol);
      this.cellsWidth = Array(this.nTabCol);
      this.col_visible = Array(this.nTabCol).fill(true);
   }

   //---------------------------------------------------------------------------------------------------------------
   disconnectedCallback() {
      //------------------------------------------------------------------------------------------------------------
      //console.log('Custom square element removed from page.');
   }

   //---------------------------------------------------------------------------------------------------------------
   adoptedCallback() {
      //------------------------------------------------------------------------------------------------------------
      //console.log('Custom square element moved to new page.');
   }

   //---------------------------------------------------------------------------------------------------------------
   attributeChangedCallback(name: string, oldValue: any, newValue: any) {
      //------------------------------------------------------------------------------------------------------------
      //console.log('attributeChangedCallback', name, oldValue, newValue);

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
         //this.update_select_options_name(Number(newValue));
         console.log("in attributeChangedCallback, lf_languageChanged", newValue, oldValue);
         this.lf_languageChanged(newValue);

      } else if (name === 'columns_languagechanged') {
         //this.update_select_options_name(Number(newValue));
         console.log("in attributeChangedCallback, columns_languagechanged", newValue, oldValue);
         this.columns_languageChanged(newValue);

      } else if (name === 'clear') {
         this.clear_Tabelle('mytable');
         this.clear_undo();
         berechnungErforderlich(true);

      } else if (name === 'option_deleted') {
         this.del_select_options(newValue);

      } else if (name === 'hide_column') {
         this.hide_column(newValue);
      }
      else if (name === 'show_column') {
         this.show_column(newValue);
      }
      else if (oldValue === null) {                         // Initialisierungsphase
         //console.log('1', newValue.length);
         if (name === 'columns') {
            let myValue = newValue.replace('[', '');
            const lastIndex = myValue.lastIndexOf(']');
            myValue = myValue.slice(0, lastIndex);
            //console.log('myValue', myValue);
            const myArray = myValue.split(',');
            //console.log('myArray', myArray[0], myArray[1], myArray[2]);
            for (let i = 0; i < myArray.length; i++) {
               this.columns[i] = myArray[i].replace(/"/g, '').trim();
            }

            //console.log('-- columns', this.columns[0], this.columns[1], this.columns[2], this.columns[3], this.columns[4], this.columns[5]);

         } else if (name === 'typs') {
            let myValue = newValue.replace('[', '');
            const lastIndex = myValue.lastIndexOf(']');
            myValue = myValue.slice(0, lastIndex);
            //console.log('myValue', myValue);
            const myArray = myValue.split(',');
            //console.log('myArray', myArray[0], myArray[1], myArray[2]);
            let str = ''
            for (let i = 0; i < myArray.length; i++) {
               this.typs[i] = myArray[i].replace(/"/g, '').trim();
               str = str + this.typs[i]
            }
            console.log("str", str)

         } else if (name === 'colwidth') {
            let myValue = newValue.replace('[', '');
            const lastIndex = myValue.lastIndexOf(']');
            myValue = myValue.slice(0, lastIndex);
            const myArray = myValue.split(',');
            console.log("°°°°°°°°°°°°°°°° colwidth", myValue, myArray.length, myArray)
            for (let i = 0; i < myArray.length; i++) {
               this.colWidth[i] = myArray[i].replace(/"/g, '').trim();
            }
         } else if (name === 'coltext') {
            this.colText = newValue;

         } else if (name === 'nzeilen') {
            this.nZeilen = newValue;
            //console.log('typeof', typeof (this.nZeilen | 0));
            this.nTabRow = Number(this.nZeilen) + 1; // immert 1 mehr, da Zeile, Spalte mit 0 beginnt
            //console.log('#### name=', name, this.nTabRow);
         } else if (name === 'nspalten') {
            this.nSpalten = newValue;
            this.nTabCol = Number(this.nSpalten) + 1; // immert 1 mehr, da Zeile, Spalte mit 0 beginnt
            //console.log('#### name=', name, this.nTabCol);
         } else if (name === 'id') {
            this.tableId = newValue;
         }
      } else {
         //console.log("bin hier", name, newValue)
         if (name === 'nzeilen') {
            this.nZeilen = newValue;
            this.nTabRow = Number(this.nZeilen) + 1; // immert 1 mehr, da Zeile, Spalte mit 0 beginnt
            this.resize_Tabelle('mytable', newValue, this.nSpalten);
         } else if (name === 'nspalten') {
            this.nSpalten = newValue;
            this.nTabCol = Number(this.nSpalten) + 1; // immert 1 mehr, da Zeile, Spalte mit 0 beginnt
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
   set neueZeilen(n: any) {
      //------------------------------------------------------------------------------------------------------------
      console.log('in neueZeilen', n);
      this.nZeilen = n;
   }
   /*
      test() {  // kann nicht aufgerufen werden, leider
         console.log("IN T E S T #######################################")
      }
   */

   //---------------------------------------------------------------------------------------------------------------
   lf_languageChanged(lf: string) {
      //------------------------------------------------------------------------------------------------------------
      this.colText = lf;
      this.update_delete_texts();
   }

   //---------------------------------------------------------------------------------------------------------------
   // Zeilen löschen mit Undo/Redo (nur bei allow_delete_row)
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
      console.log("columns_languageChanged", newValue)
      let myValue = newValue.replace('[', '');
      const lastIndex = myValue.lastIndexOf(']');
      myValue = myValue.slice(0, lastIndex);
      //console.log('myValue', myValue);
      const myArray = myValue.split(',');
      //console.log('myArray', myArray[0], myArray[1], myArray[2]);
      for (let i = 0; i < myArray.length; i++) {
         this.columns[i] = myArray[i].replace(/"/g, '').trim();
      }

      const table = this.shadow.getElementById('mytable') as HTMLTableElement;
      console.log('table', table);
      let nZeilen = table.rows.length - 1; // header abziehen
      let nSpalten = table.rows[0].cells.length - 1;
      let iZeile = 0
      let row = table.rows.item(iZeile);
      //console.log("row",row?.children)
      if (row) {
         for (let iSpalte = 0; iSpalte <= nSpalten; iSpalte++) {
            let child = table.rows[iZeile].cells[iSpalte];
            console.log("child", iZeile, iSpalte, nSpalten, table.rows[iZeile].cells[iSpalte].innerHTML)
            child.innerHTML = this.columns[iSpalte];
         }
      }
   }

   //---------------------------------------------------------------------------------------------------------------
   hide_column(iSpalte: number) {
      //------------------------------------------------------------------------------------------------------------

      console.info('in hide_column');

      const tabelle = this.shadow.getElementById('mytable') as any;
      const nZeilen = this.nZeilen;
      const nSpalten = this.nSpalten;

      for (let i = 0; i <= nZeilen; i++) {
         tabelle.rows[i].cells[iSpalte].style.display = 'none'
      }
      this.col_visible[iSpalte] = false;

   }

   //---------------------------------------------------------------------------------------------------------------
   show_column(iSpalte: number) {
      //------------------------------------------------------------------------------------------------------------

      //console.info('in show_column');

      const tabelle = this.shadow.getElementById('mytable') as any;
      const nZeilen = this.nZeilen;
      const nSpalten = this.nSpalten;

      for (let i = 0; i <= nZeilen; i++) {
         tabelle.rows[i].cells[iSpalte].style.display = 'table-cell'
      }
      this.col_visible[iSpalte] = true;

   }

   //---------------------------------------------------------------------------------------------------------------
   add_new_select_option() {
      //------------------------------------------------------------------------------------------------------------
      console.log('in add_new_select_option');

      const table = this.shadow.getElementById('mytable') as HTMLTableElement;

      console.log(" TEST this.nZeilen", this.nZeilen)
      for (let iZeile = 1; iZeile <= this.nZeilen; iZeile++) {
         // Spalten addieren
         let row = table.rows.item(iZeile);
         if (row) {
            //console.log("row", row);
            for (let iSpalte = 1; iSpalte <= this.nSpalten; iSpalte++) {

               if (this.typs[iSpalte] === 'select') {
                  const idstr = 'idtable-' + iZeile + '-' + iSpalte;
                  const el = this.shadow.getElementById(idstr)
                  //console.log("idstr", el)
                  const index = nQuerschnittSets - 1;
                  let option = document.createElement('option');

                  option.value = option.textContent = get_querschnittRechteck_name(index);

                  el.appendChild(option);
               }
            }
         }
      }
   }


   //---------------------------------------------------------------------------------------------------------------
   update_select_options_name(index: number) {
      //------------------------------------------------------------------------------------------------------------
      //console.log('in update_select_options_name', get_querschnittRechteck_name(index));

      const table = this.shadow.getElementById('mytable') as HTMLTableElement;

      for (let iZeile = 1; iZeile <= this.nZeilen; iZeile++) {
         // Spalten addieren
         let row = table.rows.item(iZeile);
         if (row) {
            //console.log("row", row);
            for (let iSpalte = 1; iSpalte <= this.nSpalten; iSpalte++) {

               if (this.typs[iSpalte] === 'select') {
                  const idstr = 'idtable-' + iZeile + '-' + iSpalte;
                  const el = this.shadow.getElementById(idstr)
                  //console.log("idstr", el.children)
                  for (let i = 0; i < el.children.length; i++) {
                     console.log("i", i, el.children.item(i))
                     if (i === index) {
                        el.children.item(i).innerHTML = get_querschnittRechteck_name(index);
                        el.children.item(i).value = get_querschnittRechteck_name(index);
                     }
                  }

               }
            }
         }
      }
   }


   //---------------------------------------------------------------------------------------------------------------
   del_select_options(qname: string) {
      //------------------------------------------------------------------------------------------------------------

      const table = this.shadow.getElementById('mytable') as HTMLTableElement;

      for (let iZeile = 1; iZeile <= this.nZeilen; iZeile++) {
         // Spalten addieren
         let row = table.rows.item(iZeile);
         if (row) {
            //console.log("row", row);
            for (let iSpalte = 1; iSpalte <= this.nSpalten; iSpalte++) {

               if (this.typs[iSpalte] === 'select') {
                  const idstr = 'idtable-' + iZeile + '-' + iSpalte;
                  const el = this.shadow.getElementById(idstr)
                  console.log("el.children.length", el.children.length)
                  let n = el.children.length
                  for (let i = 0; i < n; i++) {
                     if (qname === String(el.children.item(i).value)) {
                        console.log("i", i, el.children.item(i).value)
                        el.removeChild(el.children.item(i));
                        break;
                     }
                  }

               }
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

   // alte eigene Version, oben steht version von claude
   // //---------------------------------------------------------------------------------------------------------------
   // clear_Tabelle(idTable: any) {
   //    //------------------------------------------------------------------------------------------------------------
   //    //console.info('in clear_Tabelle');

   //    const table = this.shadow.getElementById(idTable) as HTMLTableElement;
   //    //console.log('spalten', table);
   //    let nZeilen = table.rows.length
   //    let nSpalten = table.rows[0].cells.length

   //    for (let iZeile = 1; iZeile < nZeilen; iZeile++) {

   //       for (let iSpalte = 1; iSpalte < nSpalten; iSpalte++) {
   //          let child = table.rows[iZeile].cells[iSpalte].firstElementChild as HTMLInputElement;
   //          child.value = "";
   //          if (this.typs[iSpalte] === 'select') {
   //             const idstr = 'idtable-' + iZeile + '-' + iSpalte;
   //             const el = this.shadow.getElementById(idstr)
   //             //console.log("idstr", el)
   //             //const index = nQuerschnittSets - 1;
   //             //let option = document.createElement('option');

   //             //option.value = option.textContent = get_querschnittRechteck_name(index);
   //             for (let i = 0; i < nQuerschnittSets; i++) el.removeChild(el.lastChild);
   //          }
   //       }
   //    }

   // }

   //---------------------------------------------------------------------------------------------------------------
   unselect_Tabelle() {
      //------------------------------------------------------------------------------------------------------------
      console.info('in unselect_Tabelle');

      const tabelle = this.shadow.getElementById('mytable') as any;
      if (tabelle === null) return;

      const nZeilen = this.nZeilen;
      const nSpalten = this.nSpalten;

      for (let i = 1; i <= nZeilen; i++) {
         for (let j = 1; j <= nSpalten; j++) {
            if (this.typs[j] === 'select') {
               tabelle.rows[i].cells[j].firstElementChild.style.backgroundColor = 'rgb(255,255,255)';
            }
            tabelle.rows[i].cells[j].firstElementChild.className = 'input_normal';

         }
      }

   }

   //---------------------------------------------------------------------------------------------------------------
   resize_Tabelle(idTable: any, nRowNew: number, nColNew: number) {
      //------------------------------------------------------------------------------------------------------------
      let id_table = 'idtable';

      //console.info('in resize', idTable);

      const table = this.shadow.getElementById(idTable) as HTMLTableElement;
      //console.log('spalten', table);
      let nZeilen = table.rows.length - 1; // header abziehen
      let nSpalten = table.rows[0].cells.length - 1;

      //TODO const tableIndex = table_index(idTable);
      //tableInfo[tableIndex].nZeilen = nRowNew;
      //tableInfo[tableIndex].nSpalten = nColNew + 1;

      //console.log('nRowNew', nRowNew, nColNew, nZeilen, nSpalten);

      if (nSpalten > nColNew) {
         for (let i = 1; i <= nSpalten - nColNew; i++) {
            // Spalten löschen  nZeilen - nRowNew
            for (let j = 0; j <= nZeilen; j++) {
               let row = table.rows.item(j);
               if (row) row.deleteCell(-1);
            }
         }
      }
      if (nZeilen > nRowNew) {
         for (let i = 1; i <= nZeilen - nRowNew; i++) {
            table.deleteRow(-1);
            //console.log("selRow",selectedCellPoly.selRow);
            //selectedCellPoly.selColY.length -= 1;
            //selectedCellPoly.selColZ.length -= 1;
         }
      }

      if (nColNew > nSpalten) {
         // nicht getestet, da hier nicht gebraucht

         for (let iZeile = 0; iZeile <= nZeilen; iZeile++) {
            // Spalten addieren
            let row = table.rows.item(iZeile);
            if (row) {
               //console.log("row",row);
               for (let iSpalte = nSpalten + 1; iSpalte <= nColNew; iSpalte++) {
                  // nZeilen + 1; j <= nRowNew

                  const newCell = row.insertCell(-1);
                  let newText;
                  if (iSpalte === 0) {
                     //newCell = newRow.insertCell(iSpalte);  // Insert a cell in the row at index 0
                     newText = document.createTextNode(String(iZeile)); // Append a text node to the cell
                     newCell.style.textAlign = 'center';
                     //TODO newCell.style.backgroundColor = color_table_in; //'#b3ae00'  //'rgb(150,180, 180)';
                     newCell.style.padding = '0px';
                     newCell.style.margin = '0px';
                     newCell.style.fontSize = '1rem';
                     newCell.appendChild(newText);
                  } else {
                     if (iZeile === 0) {
                        // console.log("THEAD", table.rows.item(0)?.childElementCount)
                        /*
                                                const th0 = table.tHead?.appendChild(document.createElement('th')) as any;
                                                th0.innerHTML = "Test";
                                                th0.style.padding = '5px';
                                                th0.style.margin = '0px';
                                                th0.style.textAlign = 'center';
                                                row.appendChild(th0);
                                                */
                        // newCell.innerHTML = '<b>' + this.colText + ' ' + (iSpalte - 1) + '</b>';
                        newCell.innerHTML = this.colText + ' ' + (iSpalte - 1);
                        //th0.title = "Elementnummer"
                        newCell.style.padding = '5px';
                        newCell.style.margin = '0px';
                        newCell.style.textAlign = 'center';
                        newCell.style.fontSize = '1rem';
                        newCell.style.fontWeight = 'bold';
                        //th0.setAttribute('title', 'Hilfe')
                        //row.appendChild(newCell);

                     }
                     else {


                        let el = document.createElement('input');
                        el.setAttribute('type', 'number');
                        el.style.width = 'inherit'; //'6em';
                        //el.style.backgroundColor = 'rgb(200,200,200)';
                        el.style.border = 'none';
                        el.style.borderWidth = '0px';
                        el.style.padding = '5px';
                        el.style.margin = '0px';
                        el.style.borderRadius = '0px';
                        el.style.fontSize = '1rem';
                        const str = id_table + '-' + iZeile + '-' + iSpalte;
                        el.id = str;
                        el.className = 'input_normal';
                        el.addEventListener('keydown', this.onKeyDown);
                        el.addEventListener('input', this.onValueChanged);
                        el.addEventListener('change', this.onValueChanged);   // für select / Browser-Autofill

                        //newCell.style.width = '6em';
                        //console.log("§§§§§§§§§ colwidth",this.colWidth.length,this.colWidth[this.colWidth.length-1])
                        if (this.colWidth.length === 0) newCell.style.width = '6em';
                        else newCell.style.width = this.colWidth[this.colWidth.length - 1] + 'em';

                        newCell.style.border = 'solid';
                        newCell.style.borderWidth = '1px';
                        newCell.style.padding = '0px';
                        newCell.style.margin = '0px';
                        newCell.style.backgroundColor = 'rgb(255,255,255)';
                        newCell.style.touchAction = 'auto';
                        const str1 = id_table + 'Cell-' + iZeile + '-' + iSpalte;
                        newCell.id = str1;
                        newCell.className = 'input_normal';
                        newCell.style.fontSize = '1rem';

                        newCell.appendChild(el);
                        // el.addEventListener("pointermove", POINTERMOVE);
                        el.addEventListener('pointerdown', this.POINTER_DOWN.bind(this));
                        if (iSpalte === this.col_visible.length) {
                           this.col_visible.push(true);
                           console.log('addiere NEUE Spalte visible', iSpalte, this.col_visible[iSpalte], this.col_visible.length)
                        }

                     }
                  }
               }
            }
         }
      }

      if (nRowNew > nZeilen) {
         //const material_equal = document.getElementById(
         //  'material_equal'
         //) as HTMLInputElement | null;
         //console.log("in setMaterialEqual, nRowNew > nZeilen", nColNew, material_equal.checked);

         for (let iZeile = nZeilen + 1; iZeile <= nRowNew; iZeile++) {
            //selectedCellPoly.selColY.push(false);
            //selectedCellPoly.selColZ.push(false);

            // Insert a row at the end of the table
            let newRow = table.insertRow(-1);

            for (let iSpalte = 0; iSpalte <= nColNew; iSpalte++) {
               let newCell;
               if (iSpalte === 0) {
                  newCell = newRow.insertCell(iSpalte); // Insert a cell in the row at index 0
                  newCell.style.textAlign = 'center';
                  //TODO newCell.style.backgroundColor = color_table_in; //'#b3ae00'  //'rgb(150,180, 180)';
                  newCell.style.padding = '0px';
                  newCell.style.margin = '0px';
                  newCell.style.fontSize = '1rem';
                  this.fill_no_cell(newCell, iZeile);
               } else {
                  let el;
                  if (this.typs[iSpalte] === 'select') {
                     el = document.createElement('select');
                     el.style.width = '100%';   // 100px
                     el.style.backgroundColor = 'rgb(255,255,255)';
                     //console.log('CREATED SELECT');
                     for (let i = 0; i < nQuerschnittSets; i++) {
                        let option = document.createElement('option');

                        option.value = option.textContent = get_querschnittRechteck_name(i);;

                        el.appendChild(option);
                     }
                     //el.style.width = 'inherit'; //'6em';
                  } else {
                     el = document.createElement('input');
                     if (this.typs[iSpalte] === "text") {
                        el.setAttribute('type', 'text');
                     } else {
                        el.setAttribute('type', 'number');
                     }
                     el.style.width = 'inherit'; //'6em';
                  }

                  el.style.border = 'none';
                  el.style.borderWidth = '0px';
                  el.style.padding = '5px';
                  el.style.margin = '0px';
                  el.style.borderRadius = '0px';
                  el.style.fontSize = '1rem';
                  el.style.color = 'rgb(0,0,0)';
                  const str = id_table + '-' + iZeile + '-' + iSpalte;
                  el.id = str;
                  //el.className = 'input_normal';
                  el.addEventListener('keydown', this.onKeyDown);
                  el.addEventListener('input', this.onValueChanged);
                  el.addEventListener('change', this.onValueChanged);   // für select / Browser-Autofill

                  newCell = newRow.insertCell();
                  //newCell.style.width = '6em';
                  // if (this.colWidth.length === 0) newCell.style.width = '6em';
                  // else newCell.style.width = this.colWidth[iSpalte] + 'em';
                  // if (this.colWidth.length === 0) newCell.style.width = '6em';
                  // else newCell.style.width = this.colWidth[this.colWidth.length - 1] + 'em';
                  if (this.colWidth.length === 0) newCell.style.width = '6em';
                  else if (iSpalte < this.colWidth.length) {
                     newCell.style.width = this.colWidth[iSpalte] + 'em';
                  } else {
                     newCell.style.width = this.colWidth[this.colWidth.length - 1] + 'em';
                  }
                  newCell.style.border = 'solid';
                  newCell.style.borderWidth = '1px';
                  newCell.style.padding = '0px';
                  newCell.style.margin = '0px';
                  newCell.style.backgroundColor = 'rgb(255,255,255)';
                  newCell.style.touchAction = 'auto';
                  const str1 = id_table + 'Cell-' + iZeile + '-' + iSpalte;
                  newCell.id = str1;
                  newCell.className = 'input_normal';
                  newCell.style.fontSize = '1rem';

                  newCell.appendChild(el);
                  el.addEventListener('pointerdown', this.POINTER_DOWN.bind(this));
                  //el.addEventListener('mousemove', this.POINTER_MOVE);


                  if (iSpalte === this.col_visible.length) {
                     this.col_visible.push(true);
                     console.log('addiere NEUE ZEILE visible', iSpalte, this.col_visible[iSpalte], this.col_visible.length)
                  }
                  // if (this.col_visible[iSpalte]) el.style.display = 'table-cell';
                  // else el.style.display = 'none';
                  if (this.col_visible[iSpalte]) newCell.style.display = 'table-cell';
                  else newCell.style.display = 'none';
               }
            }
         }
      }

      this.nSpalten = nColNew
      this.nZeilen = nRowNew
      this.nTabRow = +this.nZeilen + 1
      this.nTabCol = +this.nSpalten + 1
   }

   //----------------------------------------------------------------------------------------
   constructor() {
      //----------------------------------------------------------------------------------------
      super();

      // defaults
      //console.log('shadowroot ', this.shadowRoot);

      // attach shadow DOM
      this.shadow = this.attachShadow({ mode: 'open' });
      //console.log('shadow ', this.shadow);

      const stylesheet = new CSSStyleSheet();
      stylesheet.replace(styles);
      this.shadow.adoptedStyleSheets = [stylesheet];


      //console.log('im constructor -------------------------------------------------');

      //console.log('FINAL shadowroot ', this.shadowRoot);
   }

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

   // //------------------------------------------------------------------------------------------------
   // KEYDOWN(ev: any) {
   //    //--------------------------------------------------------------------------------------------

   //    //write('KEYDOWN ' + ev.target.type + ' | ' + ev)

   //    console.log(
   //       'KEYDOWN, keycode, id_input, id_tabelle: ',
   //       ev.keyCode,
   //       ev.key,
   //       ev.code,
   //    );

   //    if (ev.keyCode === 13) {  // return-Taste
   //       ev.preventDefault();
   //       const inputId = ev.target.id;
   //       const myArray = inputId.split('-');
   //       console.log('RETURN Taste in Zelle', myArray.length, myArray[0], myArray[1], myArray[2], this.nTabRow);
   //       let zeile = +myArray[1] + 1;
   //       console.log("zeile", zeile, this.nTabRow)
   //       if (zeile < this.nTabRow) {
   //          console.log("springe jetzt in Zeile ", zeile)
   //          let spalte: number;
   //          if (this.typs[1] === 'select') {
   //             spalte = 2;                        // select option bisher nur in Spalte 1
   //          } else spalte = 1;
   //          let str = 'idtable-' + zeile + '-' + spalte;
   //          const elemNeu = this.shadow.getElementById(str) as HTMLInputElement;
   //          console.log("elemNeu", str, elemNeu)
   //          //elemNeu.innerText = "";
   //          elemNeu.focus();
   //          const evt = new Event("mousedown", { "bubbles": true, "cancelable": false }) as any;
   //          evt.button = 0;     // linke Maustaste
   //          elemNeu.dispatchEvent(evt);
   //       }

   //    } else if (ev.key === 'ArrowDown' || ev.key === 'PageDown') {
   //       console.log("ArrowDown")
   //       ev.preventDefault();
   //       const inputId = ev.target.id;
   //       const myArray = inputId.split('-');
   //       console.log('ArrowDown Taste in Zelle', myArray.length, myArray[0], myArray[1], myArray[2], ev.target.selectionStart); //Cursorposition: selectionStart nur bei Text
   //       let zeile = +myArray[1] + 1;
   //       //console.log("zeile", zeile, this.nTabRow)
   //       if (zeile < this.nTabRow) {
   //          console.log("springe jetzt in Zeile ", zeile)
   //          let spalte = myArray[2];
   //          let str = 'idtable-' + zeile + '-' + spalte;
   //          const elemNeu = this.shadow.getElementById(str) as HTMLInputElement;
   //          console.log("elemNeu", str, elemNeu)
   //          elemNeu.focus();
   //          const evt = new Event("mousedown", { "bubbles": true, "cancelable": false }) as any;
   //          evt.button = 0;     // linke Maustaste
   //          elemNeu.dispatchEvent(evt);
   //       }

   //    } else if (ev.key === 'ArrowUp' || ev.key === 'PageUp') {
   //       console.log("ArrowUp")
   //       ev.preventDefault();
   //       const inputId = ev.target.id;
   //       const myArray = inputId.split('-');
   //       //console.log('RETURN Taste in Zelle', myArray.length, myArray[0], myArray[1], myArray[2], this.nTabRow);
   //       let zeile = +myArray[1] - 1;
   //       //console.log("zeile", zeile, this.nTabRow)
   //       if (zeile > 0) {
   //          console.log("springe jetzt in Zeile ", zeile)
   //          let spalte = myArray[2];
   //          let str = 'idtable-' + zeile + '-' + spalte;
   //          const elemNeu = this.shadow.getElementById(str) as HTMLInputElement;
   //          console.log("elemNeu", str, elemNeu)
   //          elemNeu.focus();
   //          const evt = new Event("mousedown", { "bubbles": true, "cancelable": false }) as any;
   //          evt.button = 0;     // linke Maustaste
   //          elemNeu.dispatchEvent(evt);
   //       }

   //    }
   //    else if (ev.target.type === 'text') {
   //       console.log("in text eingabe")
   //       berechnungErforderlich(true);
   //       return;
   //    }
   //    else if (ev.target.type === 'number') {
   //       console.log("in number", ev.key, ev.keyCode)
   //       if (ev.key === '0' || ev.key === '1' || ev.key === '2' || ev.key === '3' || ev.key === '4' || ev.key === '5' || ev.key === '6' || ev.key === '7' || ev.key === '8' || ev.key === '9') { berechnungErforderlich(true); return; }                            // Ziffern 0-9
   //       if (ev.key === 'e' || ev.key === 'E' || ev.key === '.' || ev.key === ',') { berechnungErforderlich(true); return; } // e .  ,
   //       if (ev.key === 'Backspace' || ev.key === 'Delete') { berechnungErforderlich(true); return; }                         //  del, entfernen

   //       if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { berechnungErforderlich(true); return; }  // rechts links -
   //       if (ev.key === 'Tab' || ev.key === 'Escape') { berechnungErforderlich(true); return; }                         // Tab, ESC

   //       if (ev.key === '-' || ev.key === '+') { berechnungErforderlich(true); return; }                                            // + und - Zeichen

   //       ev.preventDefault();
   //    }
   //    else {
   //       console.log("in sonst", ev.keyCode)

   //       ev.preventDefault();
   //       return;
   //    }
   // }


   //------------------------------------------------------------------------------------------------
   SELECT() {
      //---------------------------------------------------------------------------------------------
      console.log("---- SELECT ----")
   }
   //------------------------------------------------------------------------------------------------
   CLICK(ev: any) {
      //---------------------------------------------------------------------------------------------
      console.log("---- C  L I C K ----", ev)
      //write('C L I C K ' + ev.button)
   }

   //------------------------------------------------------------------------------------------------
   POINTER_UP(ev: any) {
      //---------------------------------------------------------------------------------------------
      console.log("---- POINTER_UP ----", ev.pointerType, ev.cancelable)

      if (ev.cancelable) ev.preventDefault();

      const table = this.shadow.getElementById('mytable') as HTMLTableElement;
      if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
         if (touch_support_table) {
            // console.log("vor removeEventListener")
            //table.removeEventListener('touchmove', this.onTouchMove, true);
         }
      } else {
         console.log("vor removeEventListener mouse_move")
         //table.removeEventListener('mousemove', this.MOUSE_MOVE.bind(this), false);
         table.removeEventListener('mousemove', this.onMouseMove, false);
      }

      if (this.selectionMode) this.show_contextMenu(ev);

      this.selectionMode = false;

   }

   //------------------------------------------------------------------------------------------------
   MOUSE_UP(ev: any) {
      //---------------------------------------------------------------------------------------------
      console.log("---- Mouse_UP ----", ev.pointerType)

      if (this.selectionMode) this.show_contextMenu(ev);

      this.selectionMode = false;

      console.log("vor removeEventListener mouse_move")
      this.removeEventListener('mousemove', this.MOUSE_MOVE.bind(this), true);

   }

   //------------------------------------------------------------------------------------------------
   MOUSE_LEAVE(ev: any) {
      //---------------------------------------------------------------------------------------------
      console.log("---- MOUSE_LEAVE ----", ev.pointerType)
      // if (!this.selectionMode) {
      //    ev.preventDefault();
      //    return;
      // }

      // this.selectionMode = false;
      // this.unselect_Tabelle();
      // if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
      //    console.log("vor removeEventListener")
      //    this.removeEventListener('pointermove', this.TOUCH_MOVE.bind(this), true);
      // }
   }


   //------------------------------------------------------------------------------------------------
   TOUCH_END(ev: any) {
      //---------------------------------------------------------------------------------------------
      console.log("---- TOUCH_END ---- selectionMode= ", this.selectionMode, ev.cancelable)

      /*   if (this.selectionMode) this.show_contextMenu(ev);

        this.selectionMode = false;

        //if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
           console.log("vor removeEventListener")
           //this.removeEventListener('touchend', this.TOUCH_MOVE.bind(this), true);
        //} */

   }

   //------------------------------------------------------------------------------------------------
   TOUCH_START(ev: any) {
      //---------------------------------------------------------------------------------------------
      console.log("---- TOUCH_START ---- = ev.touches.length", ev.touches.length)
   }

   //------------------------------------------------------------------------------------------------
   TOUCH_MOVE(ev: any) {
      //---------------------------------------------------------------------------------------------

      // if (ev.target.hasPointerCapture(ev.pointerId)) {
      //    ev.target.releasePointerCapture(ev.pointerId);
      // }
      if (!this.selectionMode || this.selection_ended) return;
      if (this.selection_ended) return

      console.log('touches.length', ev.touches.length, ev.cancelable)
      if (ev.touches.length !== 1) {
         this.selectionMode = false;
         this.selection_ended = true;
         this.unselect_Tabelle();
         return
      }
      this.lastClientX = ev.changedTouches[0].clientX;
      this.lastClientY = ev.changedTouches[0].clientY;

      if (ev.cancelable) ev.preventDefault();

      //console.log('TOUCH MOVE', ev);   // ev.target
      //console.log('TOUCH MOVE 2', ev.changedTouches, ev.target.id, this.selectionMode);

      const text = ev.target?.id;
      if (text.length > 0) {
         let rowIndex: number, colIndex: number;

         let tabelle = ev.target.offsetParent.offsetParent;
         //console.log("TABELLE TOUCH MOVE",tabelle)

         const touch = ev.changedTouches[0];
         //const actualTarget = document.elementFromPoint(touch.clientX, touch.clientY);
         //console.log("TOUCH MOVE", touch.clientX, touch.clientY)
         //console.log("actualTarget", actualTarget)


         let dy = touch.pageY - this.cellTop; // + document.documentElement.scrollTop;
         let zeile: number, spalte: number = 1
         let nx: number, ny: number, vorz: number, div: number

         div = dy / this.cellHeight
         vorz = Math.abs(div) / div
         ny = Math.trunc(Math.abs(div)) * vorz
         if (vorz < 0.0) ny = ny - 1
         //ny = Number(Math.trunc(dy / cellHeight))
         zeile = Number(this.startRowIndex) + 1 * ny
         //console.log("Zeile=", zeile, div, dy, vorz, ny, touch.pageY, this.cellTop, this.cellHeight, this.startRowIndex)
         //console.log("::::", tableIndex, zeile, spalte)
         if (zeile > this.nZeilen) return;    //zeile = tableInfo[tableIndex].nZeilen
         if (zeile < 1) return;   // zeile = 1



         let left = touch.clientX;
         spalte = 1
         for (let ispalte = 1; ispalte < this.nTabCol; ispalte++) {
            if (this.col_visible[ispalte]) {
               if (left > this.cellsLeft[ispalte]) {
                  // let input_id = 'idtable' + '-' + zeile + '-' + ispalte;
                  // const el = this.shadow.getElementById(input_id) as HTMLInputElement;
                  // el.className = 'input_select'
                  // console.log("TOUCH MOVE left", ispalte, this.cellLeft, left, this.cellsLeft[ispalte])
                  spalte = ispalte
               }
            }
         }
         //console.log("außerhalb", left, this.nTabCol, this.cellsLeft[this.nTabCol - 1], this.cellsWidth[this.nTabCol - 1])
         // if (left > this.cellsLeft[this.nTabCol - 1] + this.cellsWidth[this.nTabCol - 1]) {
         //    console.log("außerhalb rechts")
         //    this.selectionMode = false;
         //    this.unselect_Tabelle();
         //    //if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
         //    this.removeEventListener('touchmove', this.TOUCH_MOVE.bind(this), true);
         //    return
         //    //}

         // }
         {
            rowIndex = zeile;
            colIndex = spalte;
            // console.log("TOUCH MOVE rowIndex",rowIndex,colIndex,this.firstRowIndex,this.firstColIndex);
            if (rowIndex === this.firstRowIndex && colIndex === this.firstColIndex) { // Bewegung innerhalb erstgepickter Zelle
               return;
            }
            this.firstRowIndex = -1;

            let tabelle = this.shadow.getElementById('mytable') as any  //HTMLTableElement;  //ev.target.offsetParent.offsetParent;
            tabelle.rows[rowIndex].cells[colIndex].firstElementChild!.className = 'input_select';




            let rowStart: number, rowEnd: number, colStart: number, colEnd: number;

            if (rowIndex < this.startRowIndex) {
               rowStart = rowIndex;
               rowEnd = this.startRowIndex;
            } else {
               rowStart = this.startRowIndex;
               rowEnd = rowIndex;
            }

            if (colIndex < this.startColIndex) {
               colStart = colIndex;
               colEnd = this.startColIndex;
            } else {
               colStart = this.startColIndex;
               colEnd = colIndex;
            }

            //console.log("selected Block", rowStart, colStart, rowEnd, colEnd)

            //const tabelle = ev.target.offsetParent.offsetParent; //document.getElementById(tableId) as HTMLTableElement;
            const nZeilen = this.nZeilen;
            const nSpalten = this.nSpalten;

            for (let i = 1; i <= nZeilen; i++) {
               for (let j = 1; j <= nSpalten; j++) {
                  //console.log("i,j", tabelle.rows[i].cells[j].firstElementChild)
                  if (this.typs[j] === 'select') {
                     tabelle.rows[i].cells[j].firstElementChild!.style.backgroundColor = 'rgb(255,255,255)';
                  }
                  tabelle.rows[i].cells[j].firstElementChild!.className = 'input_normal';

               }
            }

            for (let i = rowStart; i <= rowEnd; i++) {
               for (let j = colStart; j <= colEnd; j++) {
                  if (this.typs[j] === 'select') {
                     tabelle.rows[i].cells[j].firstElementChild.style.backgroundColor = 'rgb(255,165,0)';
                  }
                  tabelle.rows[i].cells[j].firstElementChild!.className = 'input_select';

               }
            }
         }


      }
   }

   //------------------------------------------------------------------------------------------------
   POINTER_DOWN(ev: any) {
      //---------------------------------------------------------------------------------------------

      //write('pointertype ' + ev.pointerType + ' | ' + ev.button + ' | ' + ev.which + ' | ' + ev.target.type);
      console.log('pointertype ', ev.pointerType, ev.button, ev.which, ev.target.type);

      this.lastClientX = ev.clientX;
      this.lastClientY = ev.clientY;

      if (ev.pointerType === 'mouse' && ev.button === 0) return;

      //if ( ev.pointerType === 'mouse' && ev.which === 3) ev.preventDefault();

      //const tableId = ev.target.offsetParent.offsetParent.id;
      const inputId = ev.target.id;

      console.log("INFO POINTER DOWN", inputId)
      //console.log('tableID', ev.target, ev.target.id, ev.currentTarget);
      //const tableIndex = table_index(tableId)

      //TODO selectedCellPoly.tableId = tableId;

      //TODO const selectMode = this.selectionMode
      //const selectMode = true;
      //TODO toggleMenuOff()
      //console.log("this.selectionMode", this.selectionMode)

      this.toggleMenuOff();
      this.selection_ended = false

      if (this.cellsLeft.length !== this.nTabCol) {
         this.cellsLeft = Array(this.nTabCol);
         this.cellsWidth = Array(this.nTabCol);
      }

      for (let ispalte = 1; ispalte < this.nTabCol; ispalte++) {
         let input_id = 'idtable' + '-1' + '-' + ispalte;
         const el = this.shadow.getElementById(input_id) as HTMLInputElement;
         //console.log("getBoundingClientRect", ispalte, this.cellsLeft.length,this.nTabCol, el)
         let cellLeft = this.cellsLeft[ispalte] = el.getBoundingClientRect().x;
         let cellWidth = this.cellsWidth[ispalte] = el.getBoundingClientRect().width;

         //console.log("Zell Info", input_id, cellLeft, cellWidth)
      }

      if (this.selectionMode || ev.pointerType === 'mouse') {
         // bei Mouse immer select mode
         //      console.log('select Mode = true', this.id, this.shadow, this.shadowRoot);
         //const el=this.shadow.getElementById(this.id) as any
         //console.log("el",el)
      }

      const myArray = inputId.split('-');
      console.log('Array', myArray.length, myArray[0], myArray[1], myArray[2]);
      //console.log("WERT=", ev.target.value)
      this.firtstWert = ev.target.value;

      this.firstRowIndex = Number(myArray[1]);
      this.firstColIndex = Number(myArray[2]);

      //this.offsetX = ev.pageX - ev.clientX;
      //this.offsetY = ev.pageY - ev.clientY;

      // this.cellLeft = el.getBoundingClientRect().x + this.offsetX;
      // this.cellTop = el.getBoundingClientRect().y + this.offsetY;
      // this.cellWidth = el.getBoundingClientRect().width;

      // this.cellId = myArray[0];
      // this.cellRow = myArray[1];
      // this.cellCol = myArray[2];
      // console.log('MEMORY', this.cellRow, this.cellCol, this.cellLeft, this.cellTop, this.cellWidth, this.cellHeight, this.offsetX, this.offsetY);
      if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
         if (touch_support_table) {
            //const table = this.shadow.getElementById('mytable') as HTMLTableElement;
            //table.addEventListener('touchmove', this.onTouchMove, true);

            this.selectionMode = true;

            this.offsetX = ev.pageX - ev.clientX
            this.offsetY = ev.pageY - ev.clientY

            const el = this.shadow.getElementById(inputId) as HTMLInputElement;
            this.cellLeft = el.getBoundingClientRect().x + this.offsetX
            this.cellTop = el.getBoundingClientRect().y + this.offsetY
            this.cellHeight = el.getBoundingClientRect().height;

            console.log("ADDED EVENT LISTENER FOR TOUCHMOVE ", ev)
         }
      } else {
         const table = this.shadow.getElementById('mytable') as HTMLTableElement;
         //table.addEventListener('mousemove', this.MOUSE_MOVE.bind(this), false); // , { passive: false }  , { capture: true }
         table.addEventListener('mousemove', this.onMouseMove, false);

         const browser = Detect.browser
         if (browser === 'Firefox') {

            this.offsetX = ev.pageX - ev.clientX
            this.offsetY = ev.pageY - ev.clientY

            const el = this.shadow.getElementById(inputId) as HTMLInputElement;
            this.cellLeft = el.getBoundingClientRect().x + this.offsetX
            this.cellTop = el.getBoundingClientRect().y + this.offsetY
            this.cellHeight = el.getBoundingClientRect().height;
         }
      }
      console.log('Maustaste', ev.button, ev.which, myArray);

      if (ev.which === 3) {                 // rechte Maustaste
         //console.log('rechte Maustaste');
         // ev.preventDefault();
      }
      if (ev.button === 0 || ev.which === 3) {         // linke Maustaste

         this.selectionMode = true;

         //console.log('linke Maustaste', ev.button, ev.which, myArray);

         this.startRowIndex = Number(myArray[1]);
         this.startColIndex = Number(myArray[2]);

      }

   }

   //------------------------------------------------------------------------------------------------
   MOUSE_MOVE(ev: any) {
      //--------------------------------------------------------------------------------------------
      //console.log('MOUSE MOVE', ev.target.id, this.selectionMode, ev.target.tagName);
      ev.preventDefault();
      this.lastClientX = ev.clientX;
      this.lastClientY = ev.clientY;

      if (!this.selectionMode) return;

      //console.log('POINTER MOVE ev', this);  // zeigt auf dr-table
      //console.log('tagname', ev.target.tagName);
      //console.log("POINTER MOVE vor prevent")

      //ev.preventDefault();

      if (!(ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT')) return;

      let rowIndex = -1, colIndex = -1;

      const tableId = ev.target.offsetParent.offsetParent.id;
      //console.log("tableId", tableId, ev.target.id)
      if (tableId === '') return; // cursor steht auf irgendwas, aber nicht auf tag <input>

      const text = ev.target.id;
      if (text.length > 0) {

         const browser = Detect.browser
         if (browser === 'Firefox') {

            let dy = ev.pageY - this.cellTop; // + document.documentElement.scrollTop;
            let zeile: number, spalte: number = 1
            let nx: number, ny: number, vorz: number, div: number

            div = dy / this.cellHeight
            vorz = Math.abs(div) / div
            ny = Math.trunc(Math.abs(div)) * vorz
            if (vorz < 0.0) ny = ny - 1
            //ny = Number(Math.trunc(dy / cellHeight))
            zeile = Number(this.startRowIndex) + 1 * ny
            //console.log("Zeile=", zeile, div, dy, vorz, ny, this.cellTop, this.cellHeight, this.startRowIndex)
            //console.log("::::", tableIndex, zeile, spalte)
            if (zeile > this.nZeilen) return;    //zeile = tableInfo[tableIndex].nZeilen
            if (zeile < 1) return;   // zeile = 1



            let left = ev.clientX;
            spalte = 1
            for (let ispalte = 1; ispalte < this.nTabCol; ispalte++) {
               if (this.cellsLeft[ispalte] > 0) {  // unsichtbare Spalte
                  if (left > this.cellsLeft[ispalte]) {
                     // let input_id = 'idtable' + '-' + zeile + '-' + ispalte;
                     // const el = this.shadow.getElementById(input_id) as HTMLInputElement;
                     // el.className = 'input_select'
                     //console.log("MOUSE MOVE left FIREFOX", ispalte, this.nTabCol, this.cellLeft, left, this.cellsLeft[ispalte])
                     spalte = ispalte
                  }
               }
            }
            rowIndex = zeile;
            colIndex = spalte;
         } else {
            const myArray = text.split("-");
            //console.log("Array", tableId, myArray.length, myArray[0], myArray[1], myArray[2])
            rowIndex = Number(myArray[1]);
            colIndex = Number(myArray[2]);
         }

         if (rowIndex === this.firstRowIndex && colIndex === this.firstColIndex) { // Bewegung innerhalb erstgepickter Zelle
            return;
         }
         this.firstRowIndex = -1;

         let tabelle = ev.target.offsetParent.offsetParent;
         tabelle.rows[rowIndex].cells[colIndex].firstElementChild.className = 'input_select';


         // if (rowIndex > this.cellRight) this.cellRight = rowIndex;
         // else if (rowIndex < this.cellLeft) this.cellLeft = rowIndex;

         // if (colIndex > this.cellBottom) this.cellBottom = colIndex;
         // else if (colIndex < this.cellTop) this.cellTop = colIndex;

         let rowStart: number, rowEnd: number, colStart: number, colEnd: number;

         if (rowIndex < this.startRowIndex) {
            rowStart = rowIndex;
            rowEnd = this.startRowIndex;
         } else {
            rowStart = this.startRowIndex;
            rowEnd = rowIndex;
         }

         if (colIndex < this.startColIndex) {
            colStart = colIndex;
            colEnd = this.startColIndex;
         } else {
            colStart = this.startColIndex;
            colEnd = colIndex;
         }

         //console.log("selected Block", rowStart, colStart, rowEnd, colEnd)

         //const tabelle = ev.target.offsetParent.offsetParent; //document.getElementById(tableId) as HTMLTableElement;
         const nZeilen = this.nZeilen;
         const nSpalten = this.nSpalten;

         for (let i = 1; i <= nZeilen; i++) {
            for (let j = 1; j <= nSpalten; j++) {
               //console.log("i,j", tabelle.rows[i].cells[j].firstElementChild)
               if (this.typs[j] === 'select') {
                  tabelle.rows[i].cells[j].firstElementChild.style.backgroundColor = 'rgb(255,255,255)';
               }
               tabelle.rows[i].cells[j].firstElementChild.className = 'input_normal';

            }
         }

         for (let i = rowStart; i <= rowEnd; i++) {
            for (let j = colStart; j <= colEnd; j++) {
               //console.log('this.typs', j, this.typs[j])
               if (this.typs[j] === 'select') {
                  tabelle.rows[i].cells[j].firstElementChild.style.backgroundColor = 'rgb(255,165,0)';
               }
               tabelle.rows[i].cells[j].firstElementChild.className = 'input_select';

            }
         }

      }
      //    ev.preventDefault();

      // TODO const inputId = ev.target.id;

      //TODO selectedCellPoly.tableId = tableId;
      //const tableIndex = table_index(tableId);

      //console.log("POINTERMOVE", ev.buttons, ev.target.id, tableId)
      //console.log("MOVE ids", tableId, ev.target.id, ev.pointerId)
      //console.log("POINTER_MOVE pos", ev.pageX, ev.pageY, ev.clientX, ev.clientY, ev.pointerId, ev.target.id)

      // TODO const el = document.getElementById(inputId);
      //console.log("getBoundingClientRect", el.getBoundingClientRect().x, el.getBoundingClientRect().y);
      /*
      if (el.className !== 'input_select') {
          el.className = 'input_select';
          selected = true
      }
      */
      //console.log("rect", ev.pointerType, ev.clientX - el.getBoundingClientRect().x, ev.clientY - el.getBoundingClientRect().y, el.getBoundingClientRect().width, el.getBoundingClientRect().height)

      //infoBox.innerHTML += "<br>POINTER Move" + ' | ' + ev.pointerType + ' | ' + tableId + ' | ' + inputId

      // TODO Nconst browser = "Chrome"; //Detect.browser;

      //if (ev.pointerType === 'touch' || ev.pointerType === 'pen' || browser === 'Firefox') {
      /*
       {
         //console.log("scrollLeft", document.body.scrollLeft, document.documentElement.scrollLeft, window.pageXOffset)
         let dx = ev.pageX - this.cellLeft; // + document.documentElement.scrollLeft;
         let dy = ev.pageY - this.cellTop; // + document.documentElement.scrollTop;
         let zeile: number, spalte: number;
         let nx: number, ny: number, vorz: number, div: number;
         div = dx / this.cellWidth;
         vorz = Math.abs(div) / div;
         nx = Math.trunc(Math.abs(div)) * vorz;
         if (vorz < 0.0) nx = nx - 1;
         //console.log("div", dx, div, vorz, nx)
         div = dy / this.cellHeight;
         vorz = Math.abs(div) / div;
         ny = Math.trunc(Math.abs(div)) * vorz;
         if (vorz < 0.0) ny = ny - 1;
         //ny = Number(Math.trunc(dy / cellHeight))
         spalte = Number(this.cellCol) + 1 * nx; //if (dx > cellWidth)
         zeile = Number(this.cellRow) + 1 * ny;
         //console.log("::::", tableIndex, zeile, spalte)
         if (spalte > this.nSpalten - 1) return; //spalte = this.nSpalten
         if (zeile > this.nZeilen) return; //zeile = this.nZeilen
         if (spalte < 1) return; // spalte = 1
         if (zeile < 1) return; // zeile = 1
         console.log('nx', nx, this.cellCol, spalte);
         //if (dy > cellHeight) zeile++

         const str = this.cellId + '-' + zeile + '-' + spalte;
         //console.log("dx, dy", dx, dy, str)
         const el = document.getElementById(str);
         if (el) {
            el.className = 'input_select';
            //if (browser !== 'Firefox') {
            if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
               el.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'center',
               }); // { behavior: "smooth", block: "end", inline: "nearest" }
            }
            //}
         }
         if (nx !== 0 || ny !== 0) this.selected = true;
         rowIndex = zeile;
         colIndex = spalte;
      }
      */

      /* else {
      const text = ev.target.id;
      const myArray = text.split("-");
      console.log("Array", tableId, tableIndex, myArray.length, myArray[0], myArray[1], myArray[2])
      rowIndex = myArray[1];
      colIndex = myArray[2];
      if (el.className !== 'input_select') {
          el.className = 'input_select';
          if ((selectedCellPoly.row !== rowIndex) || (selectedCellPoly.col !== colIndex)) selected = true
      }
  }*/


      //console.log("startend", rowStart, rowEnd, colStart, colEnd);

      const tabelle = ev.target.offsetParent.offsetParent; //document.getElementById(tableId) as HTMLTableElement;
      //console.log("tabelle", tabelle)
      //const nSpalten = tabelle.rows[0].cells.length - 1;
      const nZeilen = this.nZeilen;
      const nSpalten = this.nSpalten;

      // for (let i = 1; i <= nZeilen; i++) {
      //    for (let j = 1; j < nSpalten; j++) {
      //       //console.log("i,j", tabelle.rows[i].cells[j].firstElementChild)
      //       tabelle.rows[i].cells[j].firstElementChild.className = 'input_normal';
      //    }
      // }

      //console.log("rowStart...", rowStart, rowEnd, colStart, colEnd)
      // for (let i = rowStart; i <= rowEnd; i++) {
      //    for (let j = colStart; j <= colEnd; j++) {

      //       if (!tabelle.rows[i].cells[j].firstElementChild.hidden)
      //          tabelle.rows[i].cells[j].firstElementChild.className = 'input_select';
      //    }
      // }
   }


   //----------------------------------------------------------------------------------------------
   _menuItemListener(link: any) {
      //-------------------------------------------------------------------------------------------
      //console.log("LINK", link.getAttribute("data-action"))
      //console.log(" in menuItemListener, , this.tableId =", this.tableId, current_table_id)
      //console.log("Task ID - " + taskItemInContext.getAttribute("data-id") + ", Task action - " + link.getAttribute("data-action"));
      this.toggleMenuOff();

      if (this.tableId === current_table_id) {
         if (link.getAttribute("data-action") === "copyFirst") {
            // Zellwert in zuletzt geklickter Zelle
            let row = this.startRowIndex;
            let col = this.startColIndex;

            const wert = this.firtstWert;
            console.log("copyFirst, wert=", wert, row, col);

            const tabelle = this.shadow.getElementById('mytable') as HTMLTableElement;
            console.log("tabelle 1=", tabelle)
            const nZeilen = tabelle.rows.length;  // header abziehen
            const nSpalten = tabelle.rows[0].cells.length;
            //console.log("Tabelle", tabelle, nZeilen, nSpalten)

            let i, j;
            for (i = 1; i < nZeilen; i++) {
               for (j = 1; j < nSpalten; j++) {
                  if (this.col_visible[j]) {
                     let child = tabelle.rows[i].cells[j].firstElementChild as any // input
                     if (child.className === 'input_select') {
                        child.value = wert.toString();
                     }
                  }
               }
            }
            berechnungErforderlich(true);
         }
         else if (link.getAttribute("data-action") === "copyFirstRow") {

            let i, j;
            console.log("copyFirstRow")
            // Zellwert in zuletzt geklickter Zelle
            let row = this.startRowIndex;
            let col = this.startColIndex;

            const wert = this.firtstWert;
            console.log("copyFirst, wert=", wert, row, col);

            const tabelle = this.shadow.getElementById('mytable') as HTMLTableElement;
            const nZeilen = tabelle.rows.length;  // header abziehen
            const nSpalten = tabelle.rows[0].cells.length;

            const value = [];
            let nCols = 0;
            for (j = 1; j < nSpalten; j++) {
               value.push((tabelle.rows[row].cells[j].firstElementChild as any).value)
               nCols++;
            }
            console.log("value", value, tabelle);

            for (i = 1; i < nZeilen; i++) {
               for (j = 1; j < nSpalten; j++) {
                  if (this.col_visible[j]) {
                     let child = tabelle.rows[i].cells[j].firstElementChild as any // input
                     if (child.className === 'input_select') {
                        child.value = value[j - 1].toString();
                     }
                  }
               }
            }
            berechnungErforderlich(true);
         }
         else if (link.getAttribute("data-action") === "increment_1") {

            let i, j;

            // Zellwert in zuletzt geklickter Zelle
            let row = this.startRowIndex;
            let col = this.startColIndex;

            let wert = this.firtstWert;
            //console.log("increment_1, wert=", wert);

            const tabelle = this.shadow.getElementById('mytable') as HTMLTableElement;
            const nZeilen = tabelle.rows.length;
            const nSpalten = tabelle.rows[0].cells.length;

            const value = [];

            for (j = 1; j < nSpalten; j++) {
               value.push((tabelle.rows[row].cells[j].firstElementChild as any).value)
            }
            console.log("value", value);


            for (i = 1; i < nZeilen; i++) {
               for (j = 1; j < nSpalten; j++) {
                  if (this.col_visible[j] && this.typs[j] !== 'select') {
                     let child = tabelle.rows[i].cells[j].firstElementChild as any  // input
                     if (child.className === 'input_select') {
                        child.value = (value[j - 1]++).toString();
                     }
                  }
               }
            }
            berechnungErforderlich(true);
         }
         else if (link.getAttribute("data-action") === "increment_delta") {

            let i, j;

            const tabelle = this.shadow.getElementById('mytable') as HTMLTableElement;
            const nZeilen = tabelle.rows.length;
            const nSpalten = tabelle.rows[0].cells.length;

            // Zellwert in zuletzt geklickter Zelle
            let row = Number(this.startRowIndex);
            console.log("test increment_delta", row, nZeilen)
            if (Number(row) + 2 >= nZeilen) return;    // das geht nicht, da gibt es nichts zu tun
            console.log("alive")
            //let col = selectedCellPoly.col;

            //let wert = Number(selectedCellPoly.wert);
            //console.log("increment_1, wert=", wert);

            const value = [];
            const delta = [];
            let del;

            for (j = 1; j < nSpalten; j++) {

               //del = Number(tabelle.rows[row + 1].cells[j].firstElementChild.value.replace(/,/g, '.'))
               //    - Number(tabelle.rows[row].cells[j].firstElementChild.value.replace(/,/g, '.'))
               //value.push(Number(tabelle.rows[row].cells[j].firstElementChild.value.replace(/,/g, '.')))
               del = (tabelle.rows[row + 1].cells[j].firstElementChild as any).value
                  - (tabelle.rows[row].cells[j].firstElementChild as any).value
               value.push(Number((tabelle.rows[row].cells[j].firstElementChild as any).value))
               delta.push(Number(del))
            }
            console.log("value", value);
            console.log("delta", delta);

            for (i = 1; i < nZeilen; i++) {
               for (j = 1; j < nSpalten; j++) {
                  if (this.col_visible[j] && this.typs[j] !== 'select') {
                     let child = tabelle.rows[i].cells[j].firstElementChild as any
                     if (child.className === 'input_select') {
                        let zahl = (Number(value[j - 1]) as any).toPrecision(12) * 1;
                        (tabelle.rows[i].cells[j].firstElementChild as any).value = zahl.toString();
                        value[j - 1] += delta[j - 1];
                     }
                  }
               }
            }
            berechnungErforderlich(true);
         }
         else if (link.getAttribute("data-action") === "copy") {

            let newClip = "";
            let wertInSpalte1 = false;

            let numberFormat_OS = Intl.NumberFormat().resolvedOptions().locale.split("-")

            let newLine = null;
            if (Detect.OS === 'Windows') {
               newLine = "\r\n";
            } else {
               newLine = "\n";
            }
            const tabelle = this.shadow.getElementById('mytable') as HTMLTableElement;
            const nZeilen = tabelle.rows.length;
            const nSpalten = tabelle.rows[0].cells.length;

            let i, j;
            for (i = 1; i < nZeilen; i++) {
               wertInSpalte1 = false;
               for (j = 1; j < nSpalten - 1; j++) {
                  let child = tabelle.rows[i].cells[j].firstElementChild as any // input
                  if (child.className === 'input_select') {
                     if (wertInSpalte1) newClip += "\t";
                     let wert = (tabelle.rows[i].cells[j].firstElementChild as any).value;
                     if (numberFormat_OS[0] === 'de') {
                        wert = wert.replace('.', ',')
                     }
                     newClip += wert;
                     wertInSpalte1 = true;
                  }
               }
               let child = tabelle.rows[i].cells[nSpalten - 1].firstElementChild as any // input
               if (child.className === 'input_select') {
                  if (wertInSpalte1) newClip += "\t";
                  let wert = (tabelle.rows[i].cells[nSpalten - 1].firstElementChild as any).value;
                  if (numberFormat_OS[0] === 'de') {
                     wert = wert.replace('.', ',')
                  }
                  newClip += wert + newLine;
               } else {
                  if (wertInSpalte1) newClip += newLine;
               }
            }


            navigator.clipboard.writeText(newClip).then(function () {
               console.log("clipboard successfully set");
            }, function () {
               console.log("clipboard write failed");
            });

         }
         else if (link.getAttribute("data-action") === "insert") {

            let newLine = '';
            if (Detect.OS === 'Windows') {
               newLine = "\r\n";
            } else {
               newLine = "\n";
            }

            // Zellwert in zuletzt geklickter Zelle
            let row = Number(this.startRowIndex);
            let col = Number(this.startColIndex);

            //console.log("insert", row, col)
            console.log("!!!!!!! ----- this.shadow", this.shadow)

            const tabelle = this.shadow.getElementById('mytable') as HTMLTableElement;
            const nZeilen = tabelle.rows.length;
            const nSpalten = tabelle.rows[0].cells.length;

            //console.log("nZeilen,nSpalten", nZeilen, nSpalten)

            navigator.clipboard.readText().then(function (clipText) {
               //console.log("clipText", clipText);

               let zeilen = clipText.split(newLine);
               //console.log("zeilen", zeilen, zeilen.length);

               let i, j;
               for (i = 0; i < zeilen.length - 1; i++) {
                  let zeile = zeilen[i].split("\t");
                  //console.log("zeile", i, zeile, zeile.length);
                  for (j = 0; j < zeile.length; j++) {
                     //console.log("z", i, j, zeile[j], (row + i), nZeilen, (col + j), nSpalten);
                     if ((row + i) < nZeilen && (col + j) < nSpalten) {
                        //console.log("z", i, j, zeile[j], (row + i), nZeilen, (col + j), nSpalten);
                        let zahl: any = (zeile[j] as any).replace(/,/g, '.');
                        (tabelle.rows[row + i].cells[col + j].firstElementChild as any).value = zahl;
                     }
                  }
               }
               berechnungErforderlich(true);

            });
         }
         else if (link.getAttribute("data-action") === "close") {
         }

      }

      document.getElementById("context-menu")?.removeEventListener('click', this.ref_listener)
      this.ref_listener = null;

      this.unselect_Tabelle();

   }


   //-------------------------------------------------------------------------
   show_contextMenu(ev: any) {
      //---------------------------------------------------------------------
      //console.log('this.ref_listener', this.ref_listener)
      if (this.ref_listener === null) {
         document.getElementById("context-menu")?.addEventListener('click', this.ref_listener = this.contextMenuClicked.bind(this));
      }

      this.taskItemInContext = this.clickInsideElement(ev, this.taskItemClassName);

      //console.log("//// show_contextMemu  taskItem In Context", this.taskItemInContext);
      //console.log("this.nSpalten", this.nSpalten)

      if (this.taskItemInContext) {
         if (ev.cancelable) ev.preventDefault();
         this.toggleMenuOn();
         this.positionMenu(ev);
         current_table_id = this.tableId
      } else {
         this.taskItemInContext = null;
         this.toggleMenuOff();
      }
   }


   clickInsideElement(e: any, className: any) {
      //------------------------------------------------------------------------------------------

      let el = e.srcElement || e.target;
      //console.log("click Inside Element:", className, e.target, "-el-", el);

      if (el.classList.contains(className)) {
         //console.log("el.classList.contains: ", className)
         return el;
      } else if (el.classList.contains('input_select')) {
         //console.log("el.classList.contains: input_select")
         return el;
      }
      else {
         while (el = el.parentNode) {
            if (el.classList && el.classList.contains(className)) {
               //console.log("parent", el)
               return el;
            }
         }
      }

      return false;
   }

   //----------------------------------------------------------------------------------------------
   contextMenuClicked(ev: any) {
      //------------------------------------------------------------------------------------------

      //console.log("in contextMenuClicked", ev)
      const clickeElIsLink = this.clickInsideElement(ev, this.contextMenuLinkClassName);
      //console.log("+++ clickListener  clickeElIsLink", clickeElIsLink, ev.button);

      if (clickeElIsLink) {
         ev.preventDefault();
         if (ev.button === 2) return
         this._menuItemListener(clickeElIsLink);
      }
   }





   //----------------------------------------------------------------------------------------------
   toggleMenuOn() {
      //------------------------------------------------------------------------------------------
      this.menu = this.menu ?? document.querySelector('#context-menu');

      //console.log("toggleMenuOn", menuState);
      if (this.menuState !== 1) {
         this.menuState = 1;
         this.menu?.classList.add(this.contextMenuActive);
         this.menu?.focus();
      }
   }

   //----------------------------------------------------------------------------------------------
   toggleMenuOff() {
      //------------------------------------------------------------------------------------------
      if (this.menuState !== 0) {
         this.menuState = 0;
         this.menu?.classList.remove(this.contextMenuActive);
      }
   }



   //----------------------------------------------------------------------------------------------
   getPosition(e: any) {
      //------------------------------------------------------------------------------------------
      let posx = 0;
      let posy = 0;

      //if (!e) var e = window.event;

      if (e.pageX || e.pageY) {
         posx = e.pageX;
         posy = e.pageY;
      } else if (e.clientX || e.clientY) {
         posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
         posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }

      //console.log('e position',e.touches)
      console.log("getPosition", posx, posy)

      return {
         x: posx,
         y: posy
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

      this.menu = this.menu ?? document.querySelector('#context-menu')  // zur sicherheit
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

// register <hello-world> with the HelloWorld class
customElements.define('dr-tabelle', DrTabelle);


