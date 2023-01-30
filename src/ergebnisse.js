import {testeZahl, sichtbar} from './utility.js';

export function ergebnisse() {
    console.log("in ergebnisse");
    sichtbar('ergebnisse')
    /*
    const tab1 = document.getElementById("tangens");
    tab1.style.display = "none";
    const tab = document.getElementById("gleichungssystem");
    tab.style.display = "none";
    const tab2 = document.getElementById("rechteSeite");
    tab2.style.display = "none";
    const tab3 = document.getElementById("Loesungsvektor");
    tab3.style.display = "none";
    const tab4 = document.getElementById("gleichungssystem_top");
    tab4.style.display = "none";
    const tab5 = document.getElementById("gleichungssystem_daten");
    tab5.style.display = "none";

    document.getElementById("spannungen").style.display = "none";
    document.getElementById("img_stress").style.display = "none";
    document.getElementById("kdTabelle").style.display = "block";
    document.getElementById("my_dataviz").style.display = "none";
*/
}

function calc_kdtab() {
    /*
    let MEd, NEd, breite, hoehe, d1, d2, beton, ksi;

    NEd = Number(testeZahl(window.document.form_kdTab.NEd.value));
    MEd = Number(testeZahl(window.document.form_kdTab.MEd.value));
    breite = Number(testeZahl(window.document.form_kdTab.Breite.value)) / 100.0;  // in Meter
    hoehe = Number(testeZahl(window.document.form_kdTab.Hoehe.value)) / 100.0;    // in Meter
    d1 = Number(testeZahl(window.document.form_kdTab.d1.value));
    d2 = Number(testeZahl(window.document.form_kdTab.d2.value));
    beton = Number(testeZahl(window.document.form_kdTab.beton.value));
    ksi = Number(testeZahl(window.document.form_kdTab.ksi.value));

    let as = kdtab(MEd, NEd, d2, d1, breite, hoehe, beton, ksi);

    document.getElementById("ks_value").innerText = "";
    document.getElementById("As1_value").innerText = "";
    document.getElementById("As2_value").innerText = "";
    document.getElementById("xx_value").innerText = "";
    document.getElementById("zz_value").innerText = "";
    document.getElementById("ks1_value").innerText = "";
    document.getElementById("ks2_value").innerText = "";
    document.getElementById("eps_c2_value").innerText = "";
    document.getElementById("eps_s1_value").innerText = "";


    document.getElementById("kd_value").innerText = as[3].toFixed(2);
    if (as[2] === 0) {
        document.getElementById("xx_value").innerText = as[7].toFixed(2) + ' cm';
        document.getElementById("As1_value").innerText = as[0].toFixed(2) + ' cm²';
        document.getElementById("eps_c2_value").innerHTML = as[9].toFixed(2) + ' &permil;';
        document.getElementById("eps_s1_value").innerHTML = as[10].toFixed(2) + ' &permil;';
        if (as[1] === 0.0) {                             // ohne Druckbewehrung
            document.getElementById("ks_value").innerText = as[4].toFixed(2);
            document.getElementById("zz_value").innerText = as[8].toFixed(2) + ' cm';
        } else {
            document.getElementById("ks1_value").innerText = as[5].toFixed(2);
            document.getElementById("ks2_value").innerText = as[6].toFixed(2);
            document.getElementById("As2_value").innerText = as[1].toFixed(2) + ' cm²';
        }
    }
*/
}

export function eingabe1() {
    console.log("in eingabe");
    sichtbar('eingabe')
    /*
    const tab1 = document.getElementById("gleichungssystem");
    tab1.style.display = "none";
    const tab = document.getElementById("tangens");
    tab.style.display = "block";
    const tab2 = document.getElementById("rechteSeite");
    tab2.style.display = "none";
    const tab3 = document.getElementById("Loesungsvektor");
    tab3.style.display = "none";
    const tab4 = document.getElementById("gleichungssystem_top");
    tab4.style.display = "none";
    const tab5 = document.getElementById("gleichungssystem_daten");
    tab5.style.display = "none";

    document.getElementById("spannungen").style.display = "none";
    document.getElementById("img_stress").style.display = "none";
    document.getElementById("kdTabelle").style.display = "none";
    document.getElementById("my_dataviz").style.display = "none";

     */
}

console.log("vor eingabe1");
window.eingabe1 = eingabe1;   // jetzt auch in html sichtbar

window.ergebnisse = ergebnisse;   // jetzt auch in html sichtbar
window.calc_kdtab = calc_kdtab;