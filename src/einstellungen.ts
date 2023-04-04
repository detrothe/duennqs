
document.getElementById("unitLength").addEventListener('change', einstellungen);
document.getElementById("id_cb_unitLength").addEventListener('change', saveLocalStorage);

export let current_unit_length = 'cm'
export let unit_length_factor = 1               // Multiplikator von cm nach neuer Einheit
export let unit_stress_factor = 1               // Multiplikator von kN/cm² nach neuer Einheit

let old_unit_length = 'cm'

readLocalStorage();

//----------------------------------------------------------------------------------------------
export function set_current_unit_length(unitLength: string) {
    //------------------------------------------------------------------------------------------
    // wird nur beim Einlesen einer Datei verwendet

    current_unit_length = unitLength;
    old_unit_length = unitLength;


    const auswahl = document.getElementById("unitLength") as HTMLInputElement
    auswahl.value = unitLength

    set_unit_factors(unitLength)
    setNewUnits()

}

//----------------------------------------------------------------------------------------------
export function einstellungen() {
    //------------------------------------------------------------------------------------------
    setNewUnits()

    // vorhandene Tabellen neu ausgeben

    let factor_length: number = 1.0    // Multiplikatoren
    let factor_stress: number = 1.0    // Multiplikatoren

    if (old_unit_length === 'cm' && current_unit_length === 'mm') {
        factor_length = 10.0
        factor_stress = 10.0
    } else if (old_unit_length === 'cm' && current_unit_length === 'm') {
        factor_length = 0.01
        factor_stress = 10.0
    } else if (old_unit_length === 'mm' && current_unit_length === 'cm') {
        factor_length = 0.1
        factor_stress = 0.1
    } else if (old_unit_length === 'mm' && current_unit_length === 'm') {
        factor_length = 0.001
        factor_stress = 1.0
    } else if (old_unit_length === 'm' && current_unit_length === 'mm') {
        factor_length = 1000.0
        factor_stress = 1.0
    } else if (old_unit_length === 'm' && current_unit_length === 'cm') {
        factor_length = 100.0
        factor_stress = 0.1
    }

    let child: HTMLInputElement
    const ntabelle = document.getElementById("nodeTable") as HTMLTableElement;
    let nSpalten = ntabelle.rows[0].cells.length;
    for (let i = 1; i < ntabelle.rows.length; i++) {
        for (let j = 1; j < nSpalten; j++) {
            child = ntabelle.rows[i].cells[j].firstElementChild as HTMLInputElement
            let zahl = Number((parseFloat(child.value) * factor_length).toPrecision(12)) * 1  // Rundungsfehler beseitigen
            child.value = zahl.toString()
        }
    }

    const etabelle = document.getElementById("elemTable") as HTMLTableElement;
    nSpalten = etabelle.rows[0].cells.length;
    for (let i = 1; i < etabelle.rows.length; i++) {
        child = etabelle.rows[i].cells[1].firstElementChild as HTMLInputElement  // Emodul
        //child.value = (parseFloat(child.value) * factor_stress).toString()
        let zahl = Number((parseFloat(child.value) * factor_stress).toPrecision(12)) * 1  // Rundungsfehler beseitigen
        child.value = zahl.toString()

        child = etabelle.rows[i].cells[3].firstElementChild as HTMLInputElement   // Dicke
        //child.value = (parseFloat(child.value) * factor_length).toString()
        zahl = Number((parseFloat(child.value) * factor_length).toPrecision(12)) * 1  // Rundungsfehler beseitigen
        child.value = zahl.toString()
    }

    let el = document.getElementById("EMod_ref") as HTMLInputElement;
    el.value = (parseFloat(el.value) * factor_stress).toString()

    el = document.getElementById("fyRd") as HTMLInputElement;
    el.value = (parseFloat(el.value) * factor_stress).toString()


    old_unit_length = current_unit_length

    set_unit_factors(current_unit_length)

    setNewUnits()

}

//----------------------------------------------------------------------------------------------
export function setNewUnits() {
    //------------------------------------------------------------------------------------------
    const auswahl = document.getElementById("unitLength") as HTMLInputElement
    const unit = auswahl.value
    console.log("in setNewUnits : ", unit)

    const nTabelle = document.getElementById("nodeTable") as HTMLTableElement;
    let objCells: any
    objCells = nTabelle.rows.item(0).cells;  // Überschrift Punkt zentrieren

    if (unit === 'mm') {
        objCells.item(1).innerHTML = 'y&#772; [mm]'
        objCells.item(2).innerHTML = 'z&#772; [mm]'
    }
    else if (unit === 'cm') {
        objCells.item(1).innerHTML = 'y&#772; [cm]'
        objCells.item(2).innerHTML = 'z&#772; [cm]'
    }
    if (unit === 'm') {
        objCells.item(1).innerHTML = 'y&#772; [m]'
        objCells.item(2).innerHTML = 'z&#772; [m]'
    }

    const eTabelle = document.getElementById("elemTable") as HTMLTableElement;
    objCells = eTabelle.rows.item(0).cells;  // Überschrift Punkt zentrieren

    if (unit === 'mm') {
        objCells.item(1).innerHTML = 'E-Modul [N/mm²]'
        objCells.item(3).innerHTML = 'Dicke t [mm]'
    }
    else if (unit === 'cm') {
        objCells.item(1).innerHTML = 'E-Modul [kN/cm²]'
        objCells.item(3).innerHTML = 'Dicke t [cm]'
    }
    if (unit === 'm') {
        objCells.item(1).innerHTML = 'E-Modul [MN/m²]'
        objCells.item(3).innerHTML = 'Dicke t [m]'
    }

    const el = document.getElementsByClassName("unit_stress")
    console.log("el stress", el)
    for (let i = 0; i < el.length; i++) {
        console.log("innerhtml", el[i].innerHTML, el[i].textContent);
        if (unit === 'mm') {
            el[i].innerHTML = 'N/mm²'
        } else if (unit === 'cm') {
            el[i].innerHTML = 'kN/cm²'
        } else if (unit === 'm') {
            el[i].innerHTML = 'MN/m²'
        }
    }

    current_unit_length = unit

}


//----------------------------------------------------------------------------------------------
function saveLocalStorage() {
    //------------------------------------------------------------------------------------------

    const input = document.getElementById('id_cb_unitLength') as HTMLInputElement | null;
    console.log("in saveLocalStorage : ", input.checked)

    if (input.checked) {
        window.localStorage.setItem('current_unit_length', current_unit_length);
    }
}


//----------------------------------------------------------------------------------------------
export function readLocalStorage() {
    //------------------------------------------------------------------------------------------

    let unitLength = window.localStorage.getItem('current_unit_length');
    console.log("unit of length found in local storage", unitLength)

    if (unitLength) {
        current_unit_length = unitLength
        old_unit_length = unitLength

        const auswahl = document.getElementById("unitLength") as HTMLInputElement
        auswahl.value = unitLength

        set_unit_factors(unitLength)
    } else {
        console.log("nix gemacht")
    }
}

//----------------------------------------------------------------------------------------------
function set_unit_factors(unitLength: string) {
    //------------------------------------------------------------------------------------------

    if (unitLength === 'mm') {
        unit_length_factor = 10.0
        unit_stress_factor = 10.0   // N/mm²
    } else if (unitLength === 'cm') {
        unit_length_factor = 1.0
        unit_stress_factor = 1.0    // kN/cm²
    } else if (unitLength === 'm') {
        unit_length_factor = 0.01
        unit_stress_factor = 10.0  // MN/m²
    }

}
