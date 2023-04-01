import * as d3 from "d3";
import { set_nelem, set_nnodes, table_index, remove_selected_Tabelle } from "./duennQ_tabelle.js";
import { berechnungErforderlich } from "./globals.js"
import { show_contextMemu, clickListener } from './contextMenu.js';

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

    document.getElementById("resize").style.color = "#aaaaaa"
    document.getElementById("resize").setAttribute('disabled', 'true')
    berechnungErforderlich(true)

}
/*
//----------------------------------------------------------------------------------------------
export function tabulate(theDiv, i_d, data, columns) {
    //----------------------------------------------------------------------------------------------

    console.log("thediv, i_d", theDiv, i_d);
    console.log('columns', columns);
    console.log("data", data)


    let table = d3.select(theDiv).append('table').style('border', 'solid').style('border-spacing', '0px').style('padding', "10px").attr("id", i_d).attr("class", "tabelle")
    const thead = table.append('thead')
    const tbody = table.append('tbody');
    let zeile = 1

    // append the header row
    thead.append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .style('padding', '5px')
        .text(function (column) {
            return column;
        });

    // create a row for each object in the data
    const rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr')
        .style('margin', '10px');

    // create a cell in each row for each column
    const cells = rows.selectAll('td')
        .data(function (row) {
            return columns.map(function (column, spalte) {
                //console.log("function (column)", spalte, column, row[column]);
                if (spalte === 0) {
                    return { column: column, value: zeile++ };
                } else {
                    return { column: column, value: "" };  // row[column]
                }
            });
        })
        .enter()
        .append('td')
        .attr('contenteditable', true)
        .style('border', 'solid 1px')
        .style('padding', '5px')
        .text(function (d) {
            //console.log("d.value", d.value);
            return d.value;
        })
        .on('keydown', KEYDOWN)
        .on('mousedown', MOUSEDOWN)
        .on('mousemove', MOUSEMOVE)



    return table;
}


export function MOUSEMOVE(ev) { // mousemove

    //console.log("pointerType MOVE",ev.pointerType, ev.buttons,ev.target.id,ev.pageX, ev.pageY);

    const tableId = ev.target.offsetParent.id;
    //console.log("MMOVE mouseover", tableId, ev.buttons);  // ev.path[3].id
    const tableIndex = table_index(tableId)

    selectedCellPoly.tableId = tableId;
    tableInfo[tableIndex].tableId = tableId;
    let nZeilen = document.getElementById(tableId).rows.length - 1;
    //console.log("neq = ", neq)

    if (ev.buttons === 1) {
        ev.preventDefault();
        const row = Number($(this).parent().index()) + 1;
        const col = $(this).index();
        if (col >= 1) {
            const activatedMember = $(ev.target).closest("td");
            activatedMember.addClass("highlight");
            tableInfo[tableIndex].isSelected = true;
            //console.log("column", col, row);
            //if (col === 1) stableInfo[tableIndex].selColY[row - 1] = true;
            //else if (col === 2) tableInfo[tableIndex].selColZ[row - 1] = true;

            const cellIndex = col;
            const rowIndex = row;

            let rowStart, rowEnd, cellStart, cellEnd;

            if (rowIndex < tableInfo[tableIndex].startRowIndex) {
                rowStart = rowIndex;
                rowEnd = tableInfo[tableIndex].startRowIndex;
            } else {
                rowStart = tableInfo[tableIndex].startRowIndex;
                rowEnd = rowIndex;
            }

            if (cellIndex < tableInfo[tableIndex].startCellIndex) {
                cellStart = cellIndex;
                cellEnd = tableInfo[tableIndex].startCellIndex;
            } else {
                cellStart = tableInfo[tableIndex].startCellIndex;
                cellEnd = cellIndex;
            }
            // console.log("startend", rowStart, rowEnd, col, row, rowStart, rowEnd, cellStart, cellEnd);

            $("#" + tableId + " td").removeClass("highlight");
            //for (let i = 0; i < nZeilen; i++) {
            //    selectedCellPoly.selColY[i] = false;
            //    selectedCellPoly.selColZ[i] = false;
            //}
            const tabelle = document.getElementById(tableId);
            const nSpalten = tabelle.rows[0].cells.length - 1;

            //console.log("move", nZeilen, nSpalten)
            for (let i = 1; i < nZeilen; i++) {
                for (let j = 1; j <= nSpalten; j++) {
                    tabelle.rows.item(i).cells.item(j).selekt = false;
                }
            }

            for (let i = rowStart; i <= rowEnd; i++) {
                //const rowCells = table.find("tr").eq(i).find("td");
                for (let j = cellStart; j <= cellEnd; j++) {
                    //rowCells.eq(j).addClass("selected");
                    tabelle.rows.item(i).cells.item(j).classList.add("highlight");
                    //if (j === 1) selectedCellPoly.selColY[i - 1] = true;
                    //if (j === 2) selectedCellPoly.selColZ[i - 1] = true;
                    tabelle.rows.item(i).cells.item(j).selekt = true;

                }
            }
        }
    }
}

export function MOUSEDOWN(ev) {

    //console.log("pointerType DOWN",ev.pointerType,ev.target.id);

    const tableId = ev.target.offsetParent.id;
    const tableIndex = table_index(tableId)
    selectedCellPoly.tableId = tableId;
    tableInfo[tableIndex].tableId = tableId;
    const tabelle = document.getElementById(tableId);

    //console.log("mousedown", ev.pageX, ev.pageY, ev.which, ev.button);
    //document.getElementById("polyCanvas").style.display = "block";

    if (ev.which === 3) {               // rechte Maustaste
        console.log("rechte Maustaste");
        //ev.preventDefault();
    } else if (ev.button === 0) {      // linke Maustaste
        //ev.preventDefault();
        const row = Number($(this).parent().index()) + 1;
        const col = $(this).index();
        console.log("selekt", tableId, tabelle.rows[row].cells[col].selekt);

        if (tabelle.rows[row].cells[col].contentEditable === 'false') {

            const str = tableId + '-' + row + '-' + (col + 1);
            //console.log("contentEditable === false", row, col, str);
            selectedCellPoly.row = row;
            selectedCellPoly.col = col;
            tableInfo[tableIndex].row = row
            tableInfo[tableIndex].col = col
            const elemNeu = document.getElementById(str);
            //elemNeu.classList.add('highlight');
            //elemNeu.innerText = "";
            //elemNeu.focus();
            const evt = new Event("keydown", { "bubbles": true, "cancelable": false });
            evt.keyCode = 13;     // Return-Taste
            elemNeu.dispatchEvent(evt);

        } else {

            if (tableInfo[tableIndex].isSelected) {  // selectedCellPoly.isSelected
                //selectedCellPoly.activatedMember.removeClass("highlight");
                console.log("is selected", $(this).parent());
                //const el = document.getElementById("input_neq");
                //if (el) {
                //const nSpalten = document.getElementById(tableId).rows.length - 1;   //= el.value;
                const nSpalten = tabelle.rows[0].cells.length - 1;

                $("#" + tableId + " td").removeClass("highlight");
                //for (let i = 0; i < nSpalten; i++) {
                //    selectedCellPoly.selColY[i] = false;
                //    selectedCellPoly.selColZ[i] = false;
                //}

                for (let i = 1; i < tabelle.rows.length; i++) {
                    //console.log("i",i,tabelle.rows.length)
                    const objCells = tabelle.rows.item(i).cells;
                    for (let j = 1; j <= nSpalten; j++) {
                        //console.log("j",j,nSpalten)
                        objCells.item(j).selekt = false;
                    }
                }

                //}

            }
            console.log("cell", $(this), $(this).parent().index());
            if (col >= 1) {
                const activatedMember = $(ev.target).closest("td");
                activatedMember.addClass("highlight");
                let wert = activatedMember.text();

                //console.log("event", row, col, wert);
                selectedCellPoly.row = row;
                selectedCellPoly.col = col;
                selectedCellPoly.wert = wert;
                selectedCellPoly.activatedMember = activatedMember;
                selectedCellPoly.isSelected = true;
                //if (col === 1) selectedCellPoly.selColY[row - 1] = true;
                //else if (col === 2) selectedCellPoly.selColZ[row - 1] = true;
                selectedCellPoly.startRowIndex = row;
                selectedCellPoly.startCellIndex = col;

                tableInfo[tableIndex].row = row;
                tableInfo[tableIndex].col = col;
                tableInfo[tableIndex].wert = wert;
                tableInfo[tableIndex].activatedMember = activatedMember;
                tableInfo[tableIndex].isSelected = true;
                tableInfo[tableIndex].startRowIndex = row;
                tableInfo[tableIndex].startCellIndex = col;
            }
        }
    }
}


export function KEYDOWN(ev) {

    //console.log("pointerType KEYDOWN",ev.pointerType, ev.keyCode);

    const tableId = ev.target.offsetParent.id;
    const tableIndex = table_index(tableId)
    tableInfo[tableIndex].tableId = tableId;

    selectedCellPoly.tableId = tableId;
    //console.log("in KEYDOWN", tableId, tableIndex, ev.keyCode, tableId);
    // trap the return and space keys being pressed
    if (ev.keyCode === 32) {    // Leertaste
        ev.preventDefault();
    } else if (ev.keyCode === 13) {    // return
        ev.preventDefault();

        //const el = document.getElementById("input_neq");
        //if (el) {
        const nZeilen = document.getElementById(tableId).rows.length - 1;  //= el.value;

        const tabelle = document.getElementById(tableId);
        const nSpalten = tabelle.rows[0].cells.length - 1;
        //console.log("Taste Tab gedrückt",tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col]);
        //console.log("Taste Tab gedrückt",tabelle.rows[selectedCellPoly.row].cells.item(selectedCellPoly.col));
        //console.log("tabelle", tabelle.classList);
        //tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].removeClass("highlight");
        const row = tableInfo[tableIndex].row;
        const col = tableInfo[tableIndex].col;
        // if ( col === 0 ) return;
        //console.log("KEYDOWN,nSpalten,row,col", nSpalten, row, col)
        let str = tableId + '-' + row + '-' + col;
        const elem = document.getElementById(str);
        // console.log("elem", elem);
        if (elem === null) return;   // Zelle kann nicht bearbeitet werden
        //console.log("<RETURN> ID", str, elem.id, elem.classList);
        elem.classList.remove('highlight');  // alle selektierte Zellen löschen
        //for (let i = 0; i < nZeilen; i++) {
        //    selectedCellPoly.selColY[i] = false;
        //    selectedCellPoly.selColZ[i] = false;
        //}

        for (let i = 1; i < tabelle.rows.length; i++) {
            const objCells = tabelle.rows.item(i).cells;
            for (let j = 1; j <= nSpalten; j++) {
                objCells.item(j).selekt = false;
            }
        }

        //$("#polygonTable td").removeClass("highlight");
        if (col < nSpalten) {
            str = tableId + '-' + row + '-' + (col + 1);
        } else if (col === nSpalten) {
            if (row < nZeilen) {
                str = tableId + '-' + Number(row + 1) + '-1';
            } else {
                str = tableId + '-1-1';
            }
        }
        //console.log("col,nSpalten", col, nSpalten, str)

        //console.log("idTable", str);
        const elemNeu = document.getElementById(str);
        if (elemNeu.contentEditable === 'true') {
            elemNeu.classList.add('highlight');
            elemNeu.innerText = "";
        }
        elemNeu.focus();
        const evt = new Event("mousedown", { "bubbles": true, "cancelable": false });
        evt.button = 0;     // linke Maustaste
        elemNeu.dispatchEvent(evt);

        //}

    }
}

*/
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
                    newCell.style.backgroundColor = 'rgb(150,180, 180)';
                    newCell.style.padding = '0px';
                    newCell.style.margin = '0px';
                    newCell.appendChild(newText);
                } else {

                    let el = document.createElement("input");
                    el.setAttribute("type", "number");
                    el.style.width = '100px';
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
                    //el.addEventListener("mousemove", newMOUSEMOVE);



                    //console.log("el", el)
                    //newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
                    //newCell = newRow.insertCell()
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

                    /*
                    const newCell = row.insertCell(-1);
                    //newCell.selekt = false;
                    //newCell.setAttribute("selekt", "false");
                    if (i === 0) {
                        const newText = document.createTextNode(String(j));
                        newCell.appendChild(newText);
                        newCell.style.textAlign = "center";
                        newCell.style.border = 'none';
                        newCell.style.backgroundColor = 'rgb(150,180, 180)';
                    } else {
                        const str = idTable + "-" + i + "-" + j;
                        const newText = document.createTextNode("");
                        newCell.appendChild(newText);
                        newCell.style.border = 'solid 1px';
                        newCell.style.padding = '5px';
                        newCell.contentEditable = 'true';
                        newCell.addEventListener("mousemove", POINTER_MOVE);
                        newCell.addEventListener("mousedown", POINTER_DOWN);
                        newCell.addEventListener("keydown", newKEYDOWN);
                        newCell.id = str;
                        //newCell.wrap = false;
                    }
                    */
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
                    newCell.style.backgroundColor = 'rgb(150,180, 180)';
                    newCell.style.padding = '0px';
                    newCell.style.margin = '0px';
                    newCell.appendChild(newText);
                } else {

                    let el = document.createElement("input");
                    el.setAttribute("type", "number");
                    el.style.width = '100px';
                    el.style.border = 'none';
                    el.style.borderWidth = '0px';
                    el.style.padding = '5px';
                    el.style.margin = '0px';
                    el.style.borderRadius = '0px';
                    const str = idTable + "-" + iZeile + "-" + iSpalte;
                    el.id = str;
                    //el.className = 'input_normal';
                    el.addEventListener("keydown", KEYDOWN);
                    //el.addEventListener("mousemove", newMOUSEMOVE);

                    newCell = newRow.insertCell()
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



                /*
                // Append a text node to the cell
                let newText;
                if (iSpalte === 0) {
                    newText = document.createTextNode(String(iZeile));
                } else {
                    const str = idTable + "-" + iZeile + "-" + iSpalte;
                    newCell.id = str;
                    newText = document.createTextNode("");
                }
                newCell.appendChild(newText);
                newCell.style.border = 'solid 1px';
                newCell.style.padding = '5px';
                //newCell.setAttribute("selekt", "false");
                //newCell.selekt = false;
                if (iSpalte === 0) {
                    newCell.style.textAlign = "center";
                    newCell.style.border = 'none';
                    newCell.style.width = '50px';
                    newCell.style.backgroundColor = 'rgb(150,180, 180)';
 
                } else {
                    //newCell.style.backgroundColor = "#FFFFFF";
                    if (material_equal.checked && iSpalte < 3) {
                        //newCell.contentEditable = 'false';
                        newCell.classList.add('unsichtbar');
                    } else {
                        //newCell.contentEditable = 'true';
                    }
 
                    let el = document.createElement("input");
                    el.setAttribute("type", "number");
                    el.style.width = '100px';
                    //el.style.backgroundColor = 'rgb(200,200,200)';
                    el.style.border = 'none';
                    el.style.borderWidth = '0px';
                    el.style.padding = '5px';
                    el.style.margin = '0px';
                    el.style.borderRadius = '0px';
                    const str = idTable + "-" + iZeile + "-" + iSpalte;
                    el.id = str;
                    //el.className = 'input_normal';
                    el.addEventListener("keydown", newKEYDOWN);
 
 
                }
                */
            }
        }


    }

}


//------------------------------------------------------------------------------------------------
export function meinetabelle(theDiv, id_table, nZeilen, columns) {
    //------------------------------------------------------------------------------------------------

    const myTableDiv = document.getElementById(theDiv);  //in div
    //console.log("myTableDiv testtable1", myTableDiv)


    // const tag = document.createElement("p"); // <p></p>
    // tag.setAttribute("id", "id_spannung_mxs");
    // const text = document.createTextNode("xxx");
    // tag.appendChild(text);
    // tag.innerHTML = "Schubspannungen aus Querkraft und sekundärer Torsion M<sub>xs</sub>"
    // myTableDiv.appendChild(tag);

    const table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
    table.setAttribute("id", id_table);
    table.className = 'tabelle'  // wichtig für Context menue
    table.border = '0';
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
                newCell.style.backgroundColor = 'rgb(150,180, 180)';
                newCell.style.padding = '0px';
                newCell.style.margin = '0px';
                newCell.appendChild(newText);
            } else {

                let el = document.createElement("input");
                el.setAttribute("type", "number");
                el.style.width = '100px';
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
                //el.addEventListener("mousemove", newMOUSEMOVE);



                //console.log("el", el)
                //newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
                newCell = newRow.insertCell()
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
                // el.addEventListener("pointermove", POINTERMOVE);
                el.addEventListener("pointerdown", POINTER_DOWN);
                // el.addEventListener("pointerup", POINTERUP);
                // el.addEventListener("pointerout", POINTER_OUT);
                //newCell.setAttribute("class", "table_spannung_cell_center");

                //console.log("id-name", str)
                //const w = document.getElementById(str)
                //w.setAttribute("value", "12")

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

    //console.log("KEYDOWN, keycode, id_input, id_tabelle", ev.keyCode, ev.target.id, ev.target.offsetParent.offsetParent.id);
    //const tableCellId = ev.target.offsetParent.id;
    console.log("KEYDOWN", ev.keyCode, ev.shiftKey, ev.key, ev)
    //const tableIndex = table_index(tableId)

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

    ev.preventDefault();
}

//------------------------------------------------------------------------------------------------
export function POINTER_MOVE(ev) { // pointer move
    //--------------------------------------------------------------------------------------------
    console.log("tagname", ev.target.tagName)
    if (ev.target.tagName !== 'INPUT') return

    let rowIndex: number, colIndex: number

    const tableId = ev.target.offsetParent.offsetParent.id;
    //console.log("tableId", tableId)
    if (tableId === '') return;           // cursor steht auf irgendwas, aber nicht auf tag <input>

    ev.preventDefault();

    const inputId = ev.target.id

    selectedCellPoly.tableId = tableId;
    const tableIndex = table_index(tableId)

    //console.log("POINTERMOVE", ev.buttons, ev.target.id, tableId)
    //console.log("MOVE ids", tableId, ev.target.id, ev.pointerId)
    //console.log("POINTER_MOVE pos", ev.pageX, ev.pageY, ev.clientX, ev.clientY, ev.pointerId, ev.target.id)


    const el = document.getElementById(inputId);
    //console.log("getBoundingClientRect", el.getBoundingClientRect().x, el.getBoundingClientRect().y);

    if (el.className !== 'input_select') {
        el.className = 'input_select';
        selected = true
    }
    //console.log("rect", ev.pointerType, ev.clientX - el.getBoundingClientRect().x, ev.clientY - el.getBoundingClientRect().y, el.getBoundingClientRect().width, el.getBoundingClientRect().height)

    if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
        //console.log("scrollLeft", document.body.scrollLeft, document.documentElement.scrollLeft, window.pageXOffset)
        let dx = ev.pageX - cellLeft;// + document.documentElement.scrollLeft;
        let dy = ev.pageY - cellTop; // + document.documentElement.scrollTop;
        let zeile: number, spalte: number
        let nx: number, ny: number, vorz: number, div: number
        div = dx / cellWidth
        vorz = Math.abs(div) / div
        nx = Math.trunc(Math.abs(div)) * vorz
        if (vorz < 0.0) nx = nx - 1
        console.log("div", dx, div, vorz, nx)
        div = dy / cellHeight
        vorz = Math.abs(div) / div
        ny = Math.trunc(Math.abs(div)) * vorz
        if (vorz < 0.0) ny = ny - 1
        //ny = Number(Math.trunc(dy / cellHeight))
        spalte = Number(cellCol) + 1 * nx   //if (dx > cellWidth)
        zeile = Number(cellRow) + 1 * ny
        console.log("::::", tableIndex, zeile, spalte)
        if (spalte > tableInfo[tableIndex].nSpalten - 1) return;  //spalte = tableInfo[tableIndex].nSpalten
        if (zeile > tableInfo[tableIndex].nZeilen) return;    //zeile = tableInfo[tableIndex].nZeilen
        if (spalte < 1) return;  // spalte = 1
        if (zeile < 1) return;   // zeile = 1
        console.log("nx", nx, cellCol, spalte)
        //if (dy > cellHeight) zeile++

        const str = cellId + "-" + zeile + "-" + spalte;
        console.log("dx, dy", dx, dy, str)
        const el = document.getElementById(str);
        el.className = 'input_select';
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });  // { behavior: "smooth", block: "end", inline: "nearest" }
        if (nx !== 0 || ny !== 0) selected = true
        rowIndex = zeile;
        colIndex = spalte;

    } else {
        const text = ev.target.id;
        const myArray = text.split("-");
        //console.log("Array", tableId, tableIndex, myArray.length, myArray[0], myArray[1], myArray[2])
        rowIndex = myArray[1];
        colIndex = myArray[2];
    }


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
    console.log("startend", rowStart, rowEnd, colStart, colEnd);

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

    //console.log("POINTERDOWN", ev)
    console.log("POINTERDOWN", selectMode, ev.button, tableId, inputId, ev.pageX, ev.pageY, ev.which, ev.pointerType)

    const myTable = document.getElementById(tableId);
    if (selectMode || ev.pointerType === 'mouse') {   // bei Mouse immer select mode
        //console.log("selectMode = true")
        myTable.addEventListener("pointermove", POINTER_MOVE);
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

    //console.log("POINTERDOWN", ev)
    console.log("POINTERUP", ev.buttons, tableId, inputId, ev.pageX, ev.pageY, ev.which, ev.pointerType, selected)

    const myTable = document.getElementById(tableId);
    //myTable.releasePointerCapture(ev.pointerId);

    myTable.removeEventListener("pointermove", POINTER_MOVE);
    myTable.removeEventListener("pointerup", POINTER_UP);

    if (ev.button === 2) {
        ev.preventDefault();
        return;
    }
    //    if (selected && (ev.pointerType === 'touch' || ev.pointerType === 'pen')) show_contextMemu(ev);
    if (selected) show_contextMemu(ev);

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

    const myTable = document.getElementById(tableId);
    myTable.releasePointerCapture(ev.pointerId);
}
