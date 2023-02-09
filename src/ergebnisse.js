import {testeZahl, sichtbar} from './utility.js';

export function ergebnisse() {
    console.log("in ergebnisse");
    sichtbar('ergebnisse')
  
}


export function eingabe1() {
    console.log("in eingabe");
    sichtbar('eingabe')

    let element = document.getElementById("id_eingabe") ;
    element.focus({focusVisible: false});
}

console.log("vor eingabe1");
window.eingabe1 = eingabe1;   // jetzt auch in html sichtbar

window.ergebnisse = ergebnisse;   // jetzt auch in html sichtbar
