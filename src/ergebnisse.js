import { testeZahl, sichtbar } from './utility.js';

export function ergebnisse() {
    console.log("in ergebnisse");
    sichtbar('ergebnisse')

}

export function eingabe1() {
    console.log("in eingabe");
    sichtbar('eingabe')

    let element = document.getElementById("id_eingabe");  // id_eingabe
    /*
        const evt = new Event("click");  // { "bubbles": true, "cancelable": false }
        evt.button = 0;     // linke Maustaste
        element.dispatchEvent(evt);
    */
    element.focus({ focusVisible: false });
}

export function hilfe() {
    console.log("in hilfe");
    sichtbar('hilfe')

}

export function display_einstellungen() {
    console.log("in display_einstellungen");
    sichtbar('einstellungen')

}

console.log("vor eingabe1");
window.eingabe1 = eingabe1;   // jetzt auch in html sichtbar
window.hilfe = hilfe;         // jetzt auch in html sichtbar

window.ergebnisse = ergebnisse;   // jetzt auch in html sichtbar
window.display_einstellungen = display_einstellungen;   // jetzt auch in html sichtbar

console.log("exit ergebnisse")
