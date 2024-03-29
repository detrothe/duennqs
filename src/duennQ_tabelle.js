"use strict";

import { berechnungErforderlich } from "./globals.js"
import { tableInfo } from "./base_tabelle"

const input_nodes = document.getElementById('input_nodes');
const input_nelem = document.getElementById("input_nelem");

export let nnodes = Number(input_nodes.value);    // können nur gelesen werden in anderen Modulen

export let nelem = Number(input_nelem.value);


window.nelem = nelem; // globale Variablen,die auch in anderen Modulen geändert werden können

window.nnodes = nnodes;

console.log("nnodes=", nnodes)
console.log("nelem=", nelem)


document.getElementById('id_input_node_incr').addEventListener('click', increment_nnodes, false);
document.getElementById('id_input_node_dec').addEventListener('click', decrement_nnodes, false);
document.getElementById('id_input_elem_incr').addEventListener('click', increment_nelem, false);
document.getElementById('id_input_elem_dec').addEventListener('click', decrement_nelem, false);


//----------------------------------------------------------------------------------------------
function increment_nnodes() {
    nnodes++
    input_nodes.value = nnodes
    set_InfosNeueBerechnungErforderlich()
}
//----------------------------------------------------------------------------------------------
function decrement_nnodes() {
    nnodes--
    input_nodes.value = nnodes
    set_InfosNeueBerechnungErforderlich()
}
//----------------------------------------------------------------------------------------------
function increment_nelem() {
    nelem++
    input_nelem.value = nelem
    set_InfosNeueBerechnungErforderlich()
}
//----------------------------------------------------------------------------------------------
function decrement_nelem() {
    nelem--
    input_nelem.value = nelem
    set_InfosNeueBerechnungErforderlich()
}

//----------------------------------------------------------------------------------------------
input_nodes.onchange = function () {

    nnodes = Number(this.value);
    console.log("neues nnodes", nnodes)
    set_InfosNeueBerechnungErforderlich()
}

//----------------------------------------------------------------------------------------------
input_nelem.onchange = function () {

    nelem = Number(this.value);
    console.log("neues nelem", nelem)
    set_InfosNeueBerechnungErforderlich()
}

//----------------------------------------------------------------------------------------------
function set_InfosNeueBerechnungErforderlich() {
    berechnungErforderlich(true);
    document.getElementById("resize").disabled = false
    document.getElementById("resize").style.color = "#dd0000"
    document.getElementById("rechnen").setAttribute('disabled', true)
}

//----------------------------------------------------------------------------------------------
export function set_nnodes(n) {
    //----------------------------------------------------------------------------------------------
    nnodes = n
}

//----------------------------------------------------------------------------------------------
export function set_nelem(n) {
    //----------------------------------------------------------------------------------------------
    nelem = n
}



//----------------------------------------------------------------------------------------------
export function table_index(idTable) {
    //----------------------------------------------------------------------------------------------
    if (idTable === 'nodeTable') {
        return 0;
    } else if (idTable === 'elemTable') {
        return 1;
    } else if (idTable === 'id_testTable') {
        return 2;
    }
    return undefined;
}


//----------------------------------------------------------------------------------------------
export function clear_Tabelle() {
    //----------------------------------------------------------------------------------------------

    const tabelle = document.getElementById("nodeTable");
    let nSpalten = tabelle.rows[0].cells.length;
    for (let i = 1; i < tabelle.rows.length; i++) {
        for (let j = 1; j < nSpalten; j++) {
            tabelle.rows[i].cells[j].firstElementChild.value = ""
            //console.log("NODE i", i, child.value)
            //            tabelle.rows[i].cells[j].innerText = "";
        }
    }

    const eTabelle = document.getElementById("elemTable");
    nSpalten = eTabelle.rows[0].cells.length;
    for (let i = 1; i < eTabelle.rows.length; i++) {
        for (let j = 1; j < nSpalten; j++) {
            eTabelle.rows[i].cells[j].firstElementChild.value = "";
        }
    }

}

//----------------------------------------------------------------------------------------------
export function remove_selected_Tabelle() {
    //----------------------------------------------------------------------------------------------

    const tabelle = document.getElementById("nodeTable");
    let nSpalten = tabelle.rows[0].cells.length;
    for (let i = 1; i < tabelle.rows.length; i++) {
        for (let j = 1; j < nSpalten; j++) {
            const el = tabelle.rows[i].cells[j].firstElementChild
            if (el) el.className = 'input_normal';
        }
    }

    const eTabelle = document.getElementById("elemTable");
    nSpalten = eTabelle.rows[0].cells.length;
    for (let i = 1; i < eTabelle.rows.length; i++) {
        for (let j = 1; j < nSpalten; j++) {
            const el = eTabelle.rows[i].cells[j].firstElementChild
            if (el) el.className = 'input_normal';
        }
    }

}


//----------------------------------------------------------------------------------------------
export function setSelectionMode_node() {
    //------------------------------------------------------------------------------------------

    const input = document.getElementById('select_mode_node') //as HTMLInputElement | null;
    console.log("in setSelectionMode_node", input.checked);


    const tableIndex = table_index('nodeTable')
    tableInfo[tableIndex].selectionMode = input.checked

    let str
    if (input.checked) { str = 'none'; } else { str = 'auto'; }

    const tabelle = document.getElementById("nodeTable") //as HTMLTableElement;
    const nSpalten = tabelle.rows[0].cells.length;
    for (let i = 1; i < tabelle.rows.length; i++) {
        for (let j = 1; j < nSpalten; j++) {
            tabelle.rows[i].cells[j].style.touchAction = str
            //if (el) el.className = 'input_normal';
        }
    }

}
//----------------------------------------------------------------------------------------------
export function setSelectionMode_element() {
    //------------------------------------------------------------------------------------------

    const input = document.getElementById('select_mode_element') // as HTMLInputElement | null;
    console.log("in setSelectionMode_element", input.checked);

    const tableIndex = table_index('elemTable')
    tableInfo[tableIndex].selectionMode = input.checked

    let str
    if (input.checked) { str = 'none'; } else { str = 'auto'; }

    const eTabelle = document.getElementById("elemTable") //as HTMLTableElement;
    const nSpalten = eTabelle.rows[0].cells.length;
    for (let i = 1; i < eTabelle.rows.length; i++) {
        for (let j = 1; j < nSpalten; j++) {
            eTabelle.rows[i].cells[j].style.touchAction = str
            //if (el) el.className = 'input_normal';
        }
    }

    //eTabelle.style.touchAction = str
}

console.log("exit duennQ-tabelle.js");