import './main.css';
import './contextMenu.css';

import "./duenn3D.js";
import './ergebnisse.js'
import './base_tabelle.js'

//import {kdtab} from './kdtab.js';
import {testeZahl, SDuennTruss, sichtbar} from "./utility.js";

import DetectOS from './detectos.js'
import {init_contextmenu} from './contextMenu.js';

//import {C_3D} from './trans'

import {add_element, main_3D} from "./grafik_3D";



//import {TFVector} from "./TFArray";


export const myScreen = {
    clientWidth: 0,
    clientHeight: 0,
    svgWidth: 0
}

// myScreen.clientWidth = document.documentElement.clientWidth;
// myScreen.clientHeight = document.documentElement.clientHeight;

set_myScreen();

export function set_myScreen() {

    myScreen.clientWidth = document.documentElement.clientWidth;
    myScreen.clientHeight = document.documentElement.clientHeight;

    console.log("myScreen", myScreen.clientWidth, myScreen.clientHeight, myScreen.svgWidth)

    if (myScreen.clientWidth > 1500) {
        myScreen.svgWidth = 1500;  //myScreen.clientWidth - 900;
//    } else if (myScreen.clientWidth < 600) {
//        myScreen.svgWidth = myScreen.clientWidth
    } else {
        myScreen.svgWidth = myScreen.clientWidth;
    }
    document.getElementById("my-svg").style.width = myScreen.svgWidth + 'px';
    document.getElementById("my-svg").style.height = myScreen.clientHeight + 'px';
}



/*
function tan_2() {
    let x, y, alpha;

    y = testeZahl(window.document.tangens_2.y.value);
    x = testeZahl(window.document.tangens_2.x.value);

    if (y === 0.0 && x === 0.0) {
        alpha = 0.0;
    } else {
        alpha = Math.atan2(y, x);
        alpha = alpha * 180.0 / Math.PI;
    }

    document.getElementById("alpha").innerText = alpha + "°";

}

window.tan_2 = tan_2;

*/
//-------------------------------------------------------------------------------

export const app = {
    appName: 'duennwqs',
    file: {
        handle: null,
        name: null,
        isModified: false,
    },
    options: {
        captureTabs: true,
        fontSize: 16,
        monoSpace: false,
        wordWrap: true,
    },
    hasFSAccess: 'chooseFileSystemEntries' in window ||
        'showOpenFilePicker' in window ||
        'showSaveFilePicker' in window,
    isMac: navigator.userAgent.includes('Mac OS X'),

};

export const Detect = new DetectOS();

init_contextmenu();

main_3D();

eingabe1();

add_element();

//let obj = new C_3D()

/*
window.addEventListener('resize', reportWindowSize);

function reportWindowSize() {
    console.log("resize", window.innerWidth, window.innerHeight);

    if ( window.innerWidth < 1000) {
        document.getElementById("rand").style.display = "none";
        document.getElementById("rand1").style.display = "none";
    }
    else {
        document.getElementById("rand").style.display = "block";
        document.getElementById("rand1").style.display = "block";
    }


}

     */

/*
const d2d_ = [0.07, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.24];
const d2d = new TFVector(1, 10);
d2d.initV(d2d_);
console.log("d2",d2d._(1),d2d._(2));
*/
/*
const moment = 50.0, normalkraft = 0.0, d_o = 5, d_u = 5, breite = 1.00, pldicke = 0.20, bn = 2;


let as = kdtab(moment, normalkraft, d_o, d_u, breite, pldicke, bn,1);

console.log("as",as[0],as[1],as[2]);
*/


//let stab = new SDuennTruss();

//stab.Iy = 10.0
//stab.r[0] = 2.2
//console.log("stab", stab.Iy, stab.r[0], stab.r[1]);

//console.log("add2", add2Numbers(2,3));

//duennQ();
