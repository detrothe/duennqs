export let berechnung_erfolgreich = false;
export let berechnung_erforderlich = true;
let txt_berechnung = "Neue Berechnung erforderlich"

export function berechnungErfolgreich(wert) {
    berechnung_erfolgreich = wert;
    document.getElementById("resize").setAttribute('disabled', true)
    document.getElementById("rechnen").style.color = "#000000"
}
export function berechnungErforderlich(wert = true) {
    berechnung_erforderlich = wert;
    document.getElementById("resize").setAttribute('disabled', true)
    document.getElementById("rechnen").style.color = "#dd0000"
    document.getElementById("rechnen").disabled = false
    document.getElementById("info_berechnung").innerText = txt_berechnung
}

export function set_text_berechnung_erforderlich(txt) {
    txt_berechnung = txt
    document.getElementById("info_berechnung").innerText = txt_berechnung
}


window.berechnungErforderlich = berechnungErforderlich;   // jetzt auch in html sichtbar
