"use strict";



const input_nodes = document.getElementById('input_nodes');
const input_nelem = document.getElementById("input_nelem");

export let nnodes = Number(input_nodes.value);    // können nur gelesen werden in anderen Modulen

export let nelem = Number(input_nelem.value);


window.nelem = nelem; // globale Variablen,die auch in anderen Modulen geändert werden können

window.nnodes = nnodes;

console.log("nnodes=", nnodes)
console.log("nelem=", nelem)

//----------------------------------------------------------------------------------------------
input_nodes.onchange = function () {
    nnodes = Number(this.value);
    console.log("neues nnodes", nnodes)
    //console.log("this", this)
}

//----------------------------------------------------------------------------------------------
input_nelem.onchange = function () {
    nelem = Number(this.value);
    console.log("neues nelem", nelem)
    //console.log("this", this)
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
            tabelle.rows[i].cells[j].innerText = "";
        }
    }

    const eTabelle = document.getElementById("elemTable");
    nSpalten = eTabelle.rows[0].cells.length;
    for (let i = 1; i < eTabelle.rows.length; i++) {
        for (let j = 1; j < nSpalten; j++) {
            eTabelle.rows[i].cells[j].innerText = "";
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
            const el = tabelle.rows[i].cells[j]
            if (el.classList && el.classList.contains("selected")) {
                el.classList.remove("selected")
            }

        }
    }

    const eTabelle = document.getElementById("elemTable");
    nSpalten = eTabelle.rows[0].cells.length;
    for (let i = 1; i < eTabelle.rows.length; i++) {
        for (let j = 1; j < nSpalten; j++) {
            const el = eTabelle.rows[i].cells[j]
            if (el.classList && el.classList.contains("selected")) {
                el.classList.remove("selected")
            }

        }
    }

}

console.log("exit duennQ-tabelle.js");