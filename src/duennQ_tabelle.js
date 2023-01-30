



const input = document.getElementById('input_nodes');
export let nnodes = Number(input.value);    // können nur gelesen werden in anderen Modulen
// @ts-ignore
export let nelem = Number(document.getElementById("input_nelem").value);

// @ts-ignore
window.nelem = nelem; // globale Variablen,die auch in anderen Modulen geändert werden können
// @ts-ignore
window.nnodes = nnodes;

console.log("nnodes=", nnodes)
console.log("nelem=", nelem)


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

console.log("exit duennQ-tabelle.js");