import { byId } from './state';
export let berechnung_erfolgreich = false;
export let berechnung_erforderlich = true;
let txt_berechnung = "Neue Berechnung erforderlich"

export function berechnungErfolgreich(wert: boolean) {
    berechnung_erfolgreich = wert;
    byId<HTMLButtonElement>("resize").disabled = true
    byId("rechnen").style.color = "#000000"
}
export function berechnungErforderlich(wert = true) {
    berechnung_erforderlich = wert;
    byId<HTMLButtonElement>("resize").disabled = true
    byId("rechnen").style.color = "#dd0000"
    byId<HTMLButtonElement>("rechnen").disabled = false
    byId("info_berechnung").innerText = txt_berechnung
}

export function set_text_berechnung_erforderlich(txt: string) {
    txt_berechnung = txt
    byId("info_berechnung").innerText = txt_berechnung
}


window.berechnungErforderlich = berechnungErforderlich;   // jetzt auch in html sichtbar
