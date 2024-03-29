//import * as d3 from "d3";
import { set_nelem, set_nnodes, table_index, remove_selected_Tabelle } from "./duennQ_tabelle.js";
import { berechnungErforderlich } from "./globals.js"
import { show_contextMenu, toggleMenuOff } from './contextMenu.js';
import { Detect } from './index.js';
import { color_table_in, color_table_out } from './einstellungen.js'


export const selectedCellPoly = {   // export const
    isSelected: false,
    selectedCellRow: -1,
    selectedCellCol: -1,
    col: -1,
    row: -1,
    wert: 0,
    activatedElement: null,
    //selColY: [],
    //selColZ: [],
    startRowIndex: 0,
    startColIndex: 0,
    pointerIsDown: false,
    startx: 0,
    starty: 0,
    zelle: null,
    tableId: null,
    nZeilen: 0,
    nSpalten: 0
};

class selectedtable {
    tableId = null
    isSelected = false
    selectedCellRow = -1
    selectedCellCol = -1
    col = -1
    row = -1
    wert = 0
    activatedElement = null
    //selColY= []
    //selColZ= []
    startRowIndex = 0
    startColIndex = 0
    pointerIsDown = false
    startx = 0
    starty = 0
    zelle = null
    nZeilen = 0
    nSpalten = 0
    selectionMode = false
}

export const tableInfo = []
tableInfo.push(new selectedtable)  // nodeTable
tableInfo.push(new selectedtable)  // elemTable
tableInfo.push(new selectedtable)  // id_testTable

console.log("in base_tabelle.js");
/*
class test {
    index;
    feld=[]
}

const dd = []

dd.push(new test);
dd[0].index = 11
dd[0].feld = new Array(4)
dd[0].feld[1]=1
dd.push(new test)

//console.log("dd",dd)

 */

//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
export function resizeTable() {
    //----------------------------------------------------------------------------------------------

    // @ts-ignore
    let nnodes = Number(document.getElementById("input_nodes").value);
    // @ts-ignore
    let nelem = Number(document.getElementById("input_nelem").value);

    console.log("nnodes,nelem", nnodes, nelem)

    set_nnodes(nnodes)
    set_nelem(nelem)

    resize_Tabelle("nodeTable", nnodes, 2);
    resize_Tabelle("elemTable", nelem, 5);

    const input = document.getElementById('material_equal') as HTMLInputElement | null;
    console.log("in setMaterialEqual", input.checked);
    const material_equal = input.checked

    if (material_equal) {

        const etabelle = document.getElementById("elemTable") as HTMLTableElement | null;

        for (let i = 0; i < etabelle.rows.length; i++) {
            for (let j = 1; j < 3; j++) {
                etabelle.rows[i].cells[j].hidden = true
            }
        }
    }

    document.getElementById("resize").style.color = "#aaaaaa"
    document.getElementById("resize").setAttribute('disabled', 'true')
    berechnungErforderlich(true)

}

//----------------------------------------------------------------------------------------------
export function resize_Tabelle(idTable, nRowNew, nColNew) {
    //----------------------------------------------------------------------------------------------

    console.info("in resize", idTable);


    const table = document.getElementById(idTable) as HTMLTableElement;
    //console.log("spalten",table);
    let nZeilen = table.rows.length - 1;  // header abziehen
    let nSpalten = table.rows[0].cells.length - 1;

    const tableIndex = table_index(idTable)
    tableInfo[tableIndex].nZeilen = nRowNew
    tableInfo[tableIndex].nSpalten = nColNew + 1

    console.log("nRowNew", nRowNew, nColNew, nZeilen, nSpalten);

    if (nSpalten > nColNew) {

        for (let i = 1; i <= nSpalten - nColNew; i++) {   // Spalten löschen  nZeilen - nRowNew
            for (let j = 0; j <= nZeilen; j++) {
                let row = table.rows.item(j);
                row.deleteCell(-1);
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

    if (nColNew > nSpalten) {                // nicht getestet, da hier nicht gebraucht

        for (let iZeile = 0; iZeile <= nZeilen; iZeile++) {  // Spalten addieren
            let row = table.rows.item(iZeile);
            //console.log("row",row);
            for (let iSpalte = nSpalten + 1; iSpalte <= nColNew; iSpalte++) {   // nZeilen + 1; j <= nRowNew

                const newCell = row.insertCell(-1);
                let newText
                if (iSpalte === 0) {
                    //newCell = newRow.insertCell(iSpalte);  // Insert a cell in the row at index 0
                    newText = document.createTextNode(String(iZeile));  // Append a text node to the cell
                    newCell.style.textAlign = 'center'
                    newCell.style.backgroundColor = color_table_in  //'#b3ae00'  //'rgb(150,180, 180)';
                    newCell.style.padding = '0px';
                    newCell.style.margin = '0px';
                    newCell.appendChild(newText);
                } else {

                    let el = document.createElement("input");
                    el.setAttribute("type", "number");
                    el.style.width = 'inherit'   //'6em';
                    //el.style.backgroundColor = 'rgb(200,200,200)';
                    el.style.border = 'none';
                    el.style.borderWidth = '0px';
                    el.style.padding = '5px';
                    el.style.margin = '0px';
                    el.style.borderRadius = '0px';
                    const str = idTable + "-" + iZeile + "-" + iSpalte;
                    el.id = str;
                    //el.className = 'input_normal';
                    el.addEventListener("keydown", KEYDOWN);
                    el.addEventListener("change", function () { berechnungErforderlich(true); });
                    //el.addEventListener("mousemove", newMOUSEMOVE);



                    //console.log("el", el)
                    //newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
                    //newCell = newRow.insertCell()
                    newCell.style.width = '6em'
                    newCell.style.border = 'solid';
                    newCell.style.borderWidth = '1px';
                    newCell.style.padding = '0px';
                    newCell.style.margin = '0px';
                    newCell.style.backgroundColor = 'rgb(200,200,200)';
                    newCell.style.touchAction = 'auto'
                    const str1 = idTable + "Cell-" + iZeile + "-" + iSpalte;
                    newCell.id = str1;
                    newCell.className = 'input_normal';

                    newCell.appendChild(el);
                    // el.addEventListener("pointermove", POINTERMOVE);
                    el.addEventListener("pointerdown", POINTER_DOWN);

                }
            }
        }
    }

    if (nRowNew > nZeilen) {

        const material_equal = document.getElementById('material_equal') as HTMLInputElement | null;
        //console.log("in setMaterialEqual, nRowNew > nZeilen", nColNew, material_equal.checked);

        for (let iZeile = nZeilen + 1; iZeile <= nRowNew; iZeile++) {
            //selectedCellPoly.selColY.push(false);
            //selectedCellPoly.selColZ.push(false);

            // Insert a row at the end of the table
            let newRow = table.insertRow(-1);

            for (let iSpalte = 0; iSpalte <= nColNew; iSpalte++) {


                let newCell, newText
                if (iSpalte === 0) {
                    newCell = newRow.insertCell(iSpalte);  // Insert a cell in the row at index 0
                    newText = document.createTextNode(String(iZeile));  // Append a text node to the cell
                    newCell.style.textAlign = 'center'
                    newCell.style.backgroundColor = color_table_in  //'#b3ae00'  //'rgb(150,180, 180)';
                    newCell.style.padding = '0px';
                    newCell.style.margin = '0px';
                    newCell.appendChild(newText);
                } else {

                    let el = document.createElement("input");
                    el.setAttribute("type", "number");
                    el.style.width = 'inherit'  //'6em';
                    el.style.border = 'none';
                    el.style.borderWidth = '0px';
                    el.style.padding = '5px';
                    el.style.margin = '0px';
                    el.style.borderRadius = '0px';
                    const str = idTable + "-" + iZeile + "-" + iSpalte;
                    el.id = str;
                    //el.className = 'input_normal';
                    el.addEventListener("keydown", KEYDOWN);
                    el.addEventListener("change", function () { berechnungErforderlich(true); });
                    //el.addEventListener("mousemove", newMOUSEMOVE);

                    newCell = newRow.insertCell()
                    newCell.style.width = '6em'
                    newCell.style.border = 'solid';
                    newCell.style.borderWidth = '1px';
                    newCell.style.padding = '0px';
                    newCell.style.margin = '0px';
                    newCell.style.backgroundColor = 'rgb(200,200,200)';
                    newCell.style.touchAction = 'auto'
                    const str1 = idTable + "Cell-" + iZeile + "-" + iSpalte;
                    newCell.id = str1;
                    newCell.className = 'input_normal';

                    newCell.appendChild(el);
                    el.addEventListener("pointerdown", POINTER_DOWN);

                }


            }
        }


    }

}


//------------------------------------------------------------------------------------------------
export function meinetabelle(theDiv, id_table, nZeilen, columns) {
    //------------------------------------------------------------------------------------------------

    const myTableDiv = document.getElementById(theDiv);  //in div
    //console.log("myTableDiv testtable1", myTableDiv)


    const table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
    table.setAttribute("id", id_table);
    table.className = 'tabelle'  // wichtig für Context menue
    table.style.border = 'none';
    table.style.backgroundColor = color_table_out
    myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)


    let thead = table.createTHead();
    let row = thead.insertRow();

    for (let i = 0; i < columns.length; i++) {
        const th0 = table.tHead.appendChild(document.createElement("th"));
        th0.innerHTML = columns[i];
        //th0.title = "Elementnummer"
        th0.style.padding = '5px';
        th0.style.margin = '0px'
        th0.style.textAlign = 'center'
        //th0.setAttribute('title', 'Hilfe')
        row.appendChild(th0);

    }

    let tbody = table.createTBody();

    for (let iZeile = 1; iZeile <= nZeilen; iZeile++) {

        let newRow = tbody.insertRow(-1);

        for (let iSpalte = 0; iSpalte < columns.length; iSpalte++) {

            let newCell, newText
            if (iSpalte === 0) {
                newCell = newRow.insertCell(iSpalte);  // Insert a cell in the row at index 0
                newText = document.createTextNode(String(iZeile));  // Append a text node to the cell
                newCell.style.textAlign = 'center'
                newCell.style.backgroundColor = color_table_in   //'#b3ae00'   //'rgb(150,180, 180)';
                newCell.style.padding = '0px';
                newCell.style.margin = '0px';
                newCell.appendChild(newText);
                //newCell.setAttribute('title', 'Knotennummer')
            } else {

                let el = document.createElement("input");
                el.setAttribute("type", "number");
                el.style.width = 'inherit' //'6em';   // 100px
                //el.style.backgroundColor = 'rgb(200,200,200)';
                el.style.border = 'none';
                el.style.borderWidth = '0px';
                el.style.padding = '5px';
                el.style.margin = '0px';
                el.style.borderRadius = '0px';
                const str = id_table + "-" + iZeile + "-" + iSpalte;
                el.id = str;
                //el.className = 'input_normal';
                el.addEventListener("keydown", KEYDOWN);
                el.addEventListener("change", function () { berechnungErforderlich(true); });

                newCell = newRow.insertCell()
                newCell.style.width = '6em'
                newCell.style.border = 'solid';
                newCell.style.borderWidth = '1px';
                newCell.style.padding = '0px';
                newCell.style.margin = '0px';
                newCell.style.backgroundColor = 'rgb(200,200,200)';
                newCell.style.touchAction = 'auto'
                const str1 = id_table + "Cell-" + iZeile + "-" + iSpalte;
                newCell.id = str1;
                newCell.className = 'input_normal';

                newCell.appendChild(el);

                el.addEventListener("pointerdown", POINTER_DOWN);
                //console.log("rect", iZeile, iSpalte, el.getBoundingClientRect().x, newCell.getBoundingClientRect().y, newCell.getBoundingClientRect().width, newCell.getBoundingClientRect().height)

            }
        }
    }

    const tableIndex = table_index(id_table)
    tableInfo[tableIndex].nZeilen = nZeilen
    tableInfo[tableIndex].nSpalten = columns.length
    console.log("meine Table", tableIndex, tableInfo[tableIndex].nZeilen, tableInfo[tableIndex].nSpalten, columns.length)

}
//------------------------------------------------------------------------------------------------
export function KEYDOWN(ev) {
    //--------------------------------------------------------------------------------------------

    console.log("KEYDOWN, keycode, id_input, id_tabelle", ev.keyCode, ev.target.id, ev.target.offsetParent.offsetParent.id);
    //const tableCellId = ev.target.offsetParent.id;

    //console.log("KEYDOWN", ev.keyCode, ev.shiftKey, ev.key, ev)
    //infoBox.innerHTML += "<br>key= " + ev.key + "  | keyCode= " + ev.keyCode

    if (ev.shiftKey) {
        ev.preventDefault();
        return
    }
    if (ev.keyCode > 47 && ev.keyCode < 58) return  // Ziffern 0-9
    if (ev.keyCode > 95 && ev.keyCode < 111) return  // Ziffern 0-9, +, - vom numpad
    if (ev.keyCode === 69 || ev.keyCode === 190 || ev.keyCode === 188) return // e .  ,
    if (ev.keyCode === 13 || ev.keyCode === 8 || ev.keyCode === 46) return // return, del, entfernen
    if (ev.keyCode === 37 || ev.keyCode === 39 || ev.keyCode === 189) return  // rechts links -
    if (ev.keyCode === 9 || ev.keyCode === 27) return   // Tab, ESC
    if (ev.keyCode === 173) return   // - Zeichen bei Firefox
    if (ev.keyCode === 0) return   // - Zeichen bei Android Firefox

    ev.preventDefault();
}

//------------------------------------------------------------------------------------------------
export function POINTER_MOVE(ev) { // pointer move
    //--------------------------------------------------------------------------------------------
    //console.log("tagname", ev.target.tagName)
    ev.preventDefault();

    if (ev.target.tagName !== 'INPUT') return

    let rowIndex: number, colIndex: number

    const tableId = ev.target.offsetParent.offsetParent.id;
    //console.log("tableId", tableId)
    if (tableId === '') return;           // cursor steht auf irgendwas, aber nicht auf tag <input>

    //    ev.preventDefault();

    const inputId = ev.target.id

    selectedCellPoly.tableId = tableId;
    const tableIndex = table_index(tableId)

    //console.log("POINTERMOVE", ev.buttons, ev.target.id, tableId)
    //console.log("MOVE ids", tableId, ev.target.id, ev.pointerId)
    //console.log("POINTER_MOVE pos", ev.pageX, ev.pageY, ev.clientX, ev.clientY, ev.pointerId, ev.target.id)


    const el = document.getElementById(inputId);
    //console.log("getBoundingClientRect", el.getBoundingClientRect().x, el.getBoundingClientRect().y);
    /*
        if (el.className !== 'input_select') {
            el.className = 'input_select';
            selected = true
        }
        */
    //console.log("rect", ev.pointerType, ev.clientX - el.getBoundingClientRect().x, ev.clientY - el.getBoundingClientRect().y, el.getBoundingClientRect().width, el.getBoundingClientRect().height)

    //infoBox.innerHTML += "<br>POINTER Move" + ' | ' + ev.pointerType + ' | ' + tableId + ' | ' + inputId

    const browser = Detect.browser

    //if (ev.pointerType === 'touch' || ev.pointerType === 'pen' || browser === 'Firefox') {
    {
        //console.log("scrollLeft", document.body.scrollLeft, document.documentElement.scrollLeft, window.pageXOffset)
        let dx = ev.pageX - cellLeft;// + document.documentElement.scrollLeft;
        let dy = ev.pageY - cellTop; // + document.documentElement.scrollTop;
        let zeile: number, spalte: number
        let nx: number, ny: number, vorz: number, div: number
        div = dx / cellWidth
        vorz = Math.abs(div) / div
        nx = Math.trunc(Math.abs(div)) * vorz
        if (vorz < 0.0) nx = nx - 1
        //console.log("div", dx, div, vorz, nx)
        div = dy / cellHeight
        vorz = Math.abs(div) / div
        ny = Math.trunc(Math.abs(div)) * vorz
        if (vorz < 0.0) ny = ny - 1
        //ny = Number(Math.trunc(dy / cellHeight))
        spalte = Number(cellCol) + 1 * nx   //if (dx > cellWidth)
        zeile = Number(cellRow) + 1 * ny
        //console.log("::::", tableIndex, zeile, spalte)
        if (spalte > tableInfo[tableIndex].nSpalten - 1) return;  //spalte = tableInfo[tableIndex].nSpalten
        if (zeile > tableInfo[tableIndex].nZeilen) return;    //zeile = tableInfo[tableIndex].nZeilen
        if (spalte < 1) return;  // spalte = 1
        if (zeile < 1) return;   // zeile = 1
        console.log("nx", nx, cellCol, spalte)
        //if (dy > cellHeight) zeile++

        const str = cellId + "-" + zeile + "-" + spalte;
        //console.log("dx, dy", dx, dy, str)
        const el = document.getElementById(str);
        el.className = 'input_select';
        if (browser !== 'Firefox') {
            if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
                el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });  // { behavior: "smooth", block: "end", inline: "nearest" }
            }
        }
        if (nx !== 0 || ny !== 0) selected = true
        rowIndex = zeile;
        colIndex = spalte;

    }
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


    let rowStart: number, rowEnd: number, colStart: number, colEnd: number;

    if (rowIndex < tableInfo[tableIndex].startRowIndex) {
        rowStart = rowIndex;
        rowEnd = tableInfo[tableIndex].startRowIndex;
    } else {
        rowStart = tableInfo[tableIndex].startRowIndex;
        rowEnd = rowIndex;
    }

    if (colIndex < tableInfo[tableIndex].startColIndex) {
        colStart = colIndex;
        colEnd = tableInfo[tableIndex].startColIndex;
    } else {
        colStart = tableInfo[tableIndex].startColIndex;
        colEnd = colIndex;
    }
    //console.log("startend", rowStart, rowEnd, colStart, colEnd);

    const tabelle = document.getElementById(tableId) as HTMLTableElement;
    //console.log("tabelle", tabelle)
    //const nSpalten = tabelle.rows[0].cells.length - 1;
    const nZeilen = tableInfo[tableIndex].nZeilen
    const nSpalten = tableInfo[tableIndex].nSpalten

    for (let i = 1; i <= nZeilen; i++) {
        for (let j = 1; j < nSpalten; j++) {
            //console.log("i,j", tabelle.rows[i].cells[j].firstElementChild)
            tabelle.rows[i].cells[j].firstElementChild.className = "input_normal";
        }
    }


    for (let i = rowStart; i <= rowEnd; i++) {
        for (let j = colStart; j <= colEnd; j++) {
            // @ts-ignore
            if (!tabelle.rows[i].cells[j].firstElementChild.hidden) tabelle.rows[i].cells[j].firstElementChild.className = "input_select";
        }
    }


}

let cellWidth, cellHeight, cellRow, cellCol, cellTop, cellLeft, cellId: string, offsetX: number, offsetY: number
let selected: boolean = false

//------------------------------------------------------------------------------------------------
export function POINTER_DOWN(ev) { // pointer move
    //--------------------------------------------------------------------------------------------

    const tableId = ev.target.offsetParent.offsetParent.id;
    const inputId = ev.target.id
    const tableIndex = table_index(tableId)

    selectedCellPoly.tableId = tableId;

    const selectMode = tableInfo[tableIndex].selectionMode
    toggleMenuOff()

    //console.log("POINTERDOWN", ev)
    console.log("POINTERDOWN", selectMode, ev.button, tableId, inputId, ev.pageX, ev.pageY, ev.which, ev.pointerType)

    //infoBox.innerHTML += "<br>POINTERDOWN" + ' | ' + selectMode + ' | ' + ev.button + ' | ' + tableId + ' | ' + inputId + ' | ' + ev.pageX + ' | ' + ev.pageY + ' | ' + ev.which + ' | ' + ev.pointerType

    const myTable = document.getElementById(tableId);
    if (selectMode || ev.pointerType === 'mouse') {   // bei Mouse immer select mode
        //console.log("selectMode = true")
        myTable.addEventListener("pointermove", POINTER_MOVE);  // , { passive: false }
        myTable.addEventListener("pointerup", POINTER_UP);
    }

    const myArray = inputId.split("-");
    //console.log("Array", myArray.length, myArray[0], myArray[1], myArray[2])
    const el = document.getElementById(inputId) as HTMLInputElement;

    offsetX = ev.pageX - ev.clientX
    offsetY = ev.pageY - ev.clientY

    //ev.pointerType, 
    cellLeft = el.getBoundingClientRect().x + offsetX
    cellTop = el.getBoundingClientRect().y + offsetY
    cellWidth = el.getBoundingClientRect().width
    cellHeight = el.getBoundingClientRect().height
    cellId = myArray[0]
    cellRow = myArray[1]
    cellCol = myArray[2]
    //console.log("MEMORY", cellRow, cellCol, cellLeft, cellTop, cellWidth, cellHeight, offsetX, offsetY)

    if (ev.which === 3) {               // rechte Maustaste
        console.log("rechte Maustaste");
        ev.preventDefault();
    } else if (ev.button === 0) {      // linke Maustaste

        remove_selected_Tabelle();
        selected = false;

        console.log("linke Maustaste");
        //ev.preventDefault();
        const row = myArray[1]
        const col = myArray[2];

        selectedCellPoly.row = row;
        selectedCellPoly.col = col;
        selectedCellPoly.wert = Number(el.value);
        selectedCellPoly.activatedElement = el;
        selectedCellPoly.isSelected = true;
        selectedCellPoly.startRowIndex = row;
        selectedCellPoly.startColIndex = col;

        tableInfo[tableIndex].row = row;
        tableInfo[tableIndex].col = col;
        tableInfo[tableIndex].wert = Number(el.value);
        tableInfo[tableIndex].activatedElement = el;
        tableInfo[tableIndex].isSelected = true;
        tableInfo[tableIndex].startRowIndex = row;
        tableInfo[tableIndex].startColIndex = col;

        if (selectMode && ev.pointerType !== 'mouse') {
            ev.preventDefault();
        }
        //console.log("selectedCellPoly", selectedCellPoly.row, selectedCellPoly.col, selectedCellPoly.wert, selectedCellPoly.activatedElement)
    }
}
//------------------------------------------------------------------------------------------------
export function POINTER_UP(ev) { // pointer move
    //--------------------------------------------------------------------------------------------

    const tableId = ev.target.offsetParent.offsetParent.id;
    const inputId = ev.target.id

    selectedCellPoly.tableId = tableId;

    //console.log("POINTER_UP", ev)
    console.log("POINTERUP", ev.buttons, tableId, inputId, ev.pageX, ev.pageY, ev.which, ev.pointerType, selected)

    const myTable = document.getElementById(tableId);

    if (myTable) {
        myTable.removeEventListener("pointermove", POINTER_MOVE);
        myTable.removeEventListener("pointerup", POINTER_UP);
    }

    if (ev.button === 2) {
        ev.preventDefault();
        return;
    }
    //    if (selected && (ev.pointerType === 'touch' || ev.pointerType === 'pen')) show_contextMemu(ev);
    if (selected) show_contextMenu(ev);

    console.log("fertig contextMenu")

    ev.preventDefault();
}


//------------------------------------------------------------------------------------------------
export function POINTER_OUT(ev) { // pointer move
    //--------------------------------------------------------------------------------------------

    const tableId = ev.target.offsetParent.offsetParent.id;
    const inputId = ev.target.id

    selectedCellPoly.tableId = tableId;

    //console.log("POINTERDOWN", ev)
    console.log("POINTER_OUT", ev.buttons, tableId, inputId, ev.pageX, ev.pageY, ev.which, ev.pointerType)
    //infoBox.innerHTML += "<br>POINTER OUT"

    const myTable = document.getElementById(tableId);
    myTable.releasePointerCapture(ev.pointerId);
}

console.log("exit base_tabelle")