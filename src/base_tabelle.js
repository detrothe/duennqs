import * as d3 from "d3";
import {set_nelem, set_nnodes, table_index} from "./duennQ_tabelle.js";
import {berechnungErforderlich} from "./globals.js"

export const selectedCellPoly = {   // export const
    isSelected: false,
    selectedCellRow: -1,
    selectedCellCol: -1,
    col: -1,
    row: -1,
    wert: 0,
    activatedMember: null,
    //selColY: [],
    //selColZ: [],
    startRowIndex: null,
    startCellIndex: null,
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
    activatedMember = null
    //selColY= []
    //selColZ= []
    startRowIndex = null
    startCellIndex = null
    pointerIsDown = false
    startx = 0
    starty = 0
    zelle = null
    nZeilen = 0
    nSpalten = 0
}

const tableInfo = []
tableInfo.push(new selectedtable)  // nodeTable
tableInfo.push(new selectedtable)  // elemTable

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

    //neq = document.getElementById("input_neq").value;
    //nlf = document.getElementById("input_nLF").value;

    let nnodes = Number(document.getElementById("input_nodes").value);

    let nelem = Number(document.getElementById("input_nelem").value);

    console.log("nnodes,nelem", nnodes, nelem)

    set_nnodes(nnodes)
    set_nelem(nelem)

    resize_Tabelle("nodeTable", nnodes, 2);
    resize_Tabelle("elemTable", nelem, 5);

    document.getElementById("resize").style.color="#aaaaaa"
    document.getElementById("resize").setAttribute('disabled',true)
    berechnungErforderlich(true)

}

//----------------------------------------------------------------------------------------------
export function tabulate(theDiv, i_d, data, columns) {
//----------------------------------------------------------------------------------------------

    console.log("thediv, i_d", theDiv, i_d);
    console.log('columns', columns);
    console.log ("data",data)


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
                    return {column: column, value: zeile++};
                } else {
                    return {column: column, value: ""};  // row[column]
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
        .on('pointerdown', MOUSEDOWN)
        .on('pointermove', MOUSEMOVE)
        .on('pointerover',POINTEROVER)
        .on('pointerleave',POINTERLEAVE)
        .on('pointerenter',POINTERENTER)
        .on('pointerup',POINTERUP)
/*
        .on("touchstart", function (ev) {
            const tableId = ev.target.offsetParent.id;
            const tableIndex = table_index(tableId)
            selectedCellPoly.tableId = tableId;
            tableInfo[tableIndex].tableId = tableId;

            let touchobj = ev.changedTouches[0]; // erster Finger
            selectedCellPoly.startx = parseInt(touchobj.clientX); // X/Y-Koordinaten relativ zum Viewport
            selectedCellPoly.starty = parseInt(touchobj.clientY);
            //console.log("touchstart bei ClientX: " + selectedCellPoly.startx + "px ClientY: " + selectedCellPoly.starty + "px");
            tableInfo[tableIndex].startx = parseInt(touchobj.clientX); // X/Y-Koordinaten relativ zum Viewport
            tableInfo[tableIndex].starty = parseInt(touchobj.clientY);
            //console.log("touchstart bei ClientX: " + tableInfo[tableIndex].startx + "px ClientY: " + tableInfo[tableIndex].starty + "px");

            //ev.preventDefault();

            //ev.preventDefault();
            if (selectedCellPoly.isSelected) {
                //selectedCellPoly.activatedMember.removeClass("highlight");
                console.log("is selected", $(this).parent());
                const el = document.getElementById("input_neq");
                if (el) {
                    //const npkte = el.value;
                    $("#" + tableId + " td").removeClass("highlight");
                    //for (let i = 0; i < npkte; i++) {
                    //    selectedCellPoly.selColY[i] = false;
                    //    selectedCellPoly.selColZ[i] = false;
                    //}
                }
            }
            //console.log("cell", $(this), $(this).parent().index());
            const row = Number($(this).parent().index()) + 1;
            const col = $(this).index();
            if (col === 1 || col === 2) {
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

                const str = tableId + "-" + row + "-" + col;
                selectedCellPoly.zelle = document.getElementById(str);

                //console.log("str", str, cellLeft, cellTop);
                //*
                                const elemNeu = document.getElementById(str);
                                elemNeu.focus();
                                const evt = new Event("mousedown", {"bubbles": true, "cancelable": false});
                                evt.button = 0;     // linke Maustaste
                                elemNeu.dispatchEvent(evt);
                * //
                // *
                cellLeft = (col - 1) * cellWidth;
                cellTop = (row - 1) * cellHeight;
                document.getElementById("polyCanvas").style.display = "block";
                rechteck.attr("x", cellLeft + 'px');
                rechteck.attr("y", cellTop + 'px');
                rechteck.attr("width", cellWidth + 'px');
                rechteck.attr("height", cellHeight + 'px');

                 * /
            }


        }
        
        )
*/

    return table;
}


export function POINTEROVER(ev) { 
    console.log("pointerType POINTEROVER",ev.pointerType, ev.buttons,ev.target.id);
}

export function POINTERLEAVE(ev) { 
    console.log("pointerType POINTERLEAVE",ev.pointerType, ev.buttons,ev.target.id, ev.pageX, ev.pageY)
}

export function POINTERENTER(ev) { 
    console.log("pointerType POINTERENTER",ev.pointerType, ev.buttons,ev.target.id);
}

export function POINTERUP(ev) { 
    console.log("pointerType POINTERUP",ev.pointerType, ev.buttons,ev.target.id);
}

export function MOUSEMOVE(ev) { // mousemove

    console.log("pointerType MOVE",ev.pointerType, ev.buttons,ev.target.id,ev.pageX, ev.pageY);

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

            console.log("move", nZeilen, nSpalten)
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

    console.log("pointerType DOWN",ev.pointerType,ev.target.id);

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
            const evt = new Event("keydown", {"bubbles": true, "cancelable": false});
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
    
    console.log("pointerType KEYDOWN",ev.pointerType, ev.keyCode);

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
        if ( elem === null ) return;   // Zelle kann nicht bearbeitet werden
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
        const evt = new Event("pointerdown", {"bubbles": true, "cancelable": false});
        evt.button = 0;     // linke Maustaste
        elemNeu.dispatchEvent(evt);

        //}

    }
}


//----------------------------------------------------------------------------------------------
export function resize_Tabelle(idTable, nRowNew, nColNew) {
//----------------------------------------------------------------------------------------------

    console.info("in resize", idTable);

    const table = document.getElementById(idTable) // as HTMLTableElement;
    //console.log("spalten",table);
    let nZeilen = table.rows.length - 1;  // header abziehen
    let nSpalten = table.rows[0].cells.length - 1;

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

    if (nColNew > nSpalten) {

        for (let i = 0; i <= nZeilen; i++) {  // Spalten addieren
            let row = table.rows.item(i);
            //console.log("row",row);
            for (let j = nSpalten + 1; j <= nColNew; j++) {   // nZeilen + 1; j <= nRowNew
                const newCell = row.insertCell(-1);
                newCell.selekt = false;
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
                    newCell.addEventListener("pointermove", MOUSEMOVE);
                    newCell.addEventListener("pointerdown", MOUSEDOWN);
                    newCell.addEventListener("keydown", KEYDOWN);
                    newCell.id = str;
                    newCell.wrap = false;
                }
            }
        }
    }

    if (nRowNew > nZeilen) {

        const material_equal = document.getElementById('material_equal') //as HTMLInputElement | null;
        //console.log("in setMaterialEqual, nRowNew > nZeilen", nColNew, material_equal.checked);
        for (let i = nZeilen + 1; i <= nRowNew; i++) {
            //selectedCellPoly.selColY.push(false);
            //selectedCellPoly.selColZ.push(false);

            // Insert a row at the end of the table
            let newRow = table.insertRow(-1);

            for (let j = 0; j <= nColNew; j++) {     
                // Insert a cell in the row at index 0
                let newCell = newRow.insertCell(j);

                // Append a text node to the cell
                let newText;
                if (j === 0) {
                    newText = document.createTextNode(String(i));
                } else {
                    const str = idTable + "-" + i + "-" + j;
                    newCell.id = str;
                    newText = document.createTextNode("");
                }
                newCell.appendChild(newText);
                newCell.style.border = 'solid 1px';
                newCell.style.padding = '5px';
                //newCell.setAttribute("selekt", "false");
                newCell.selekt = false;
                if (j === 0) {
                    newCell.style.textAlign = "center";
                    newCell.style.border = 'none';
                    newCell.style.width = '50px';
                    newCell.style.backgroundColor = 'rgb(150,180, 180)';

                } else {
                    //newCell.style.backgroundColor = "#FFFFFF";
                    if (material_equal.checked && j < 3) {
                        newCell.contentEditable = 'false';
                        newCell.classList.add('unsichtbar');
                    } else {
                        newCell.contentEditable = 'true';
                    }
                    newCell.addEventListener("pointermove", MOUSEMOVE);
                    newCell.addEventListener("pointerdown", MOUSEDOWN);
                    newCell.addEventListener("keydown", KEYDOWN);
                    newCell.wrap = false;
                }
            }
        }


    }

}


