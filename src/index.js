import './styles/main.css';
import './styles/contextMenu.css';

import "./duenn3D.js";
import './ergebnisse.js'
import './base_tabelle.js'

import {testeZahl, SDuennTruss, sichtbar} from "./utility.js";

import DetectOS from './detectos.js'
import {init_contextmenu} from './contextMenu.js';


import {logo_3D, main_3D, ttf_logo_3D} from "./grafik_3D";

export const myScreen = {
    clientWidth: 0,
    clientHeight: 0,
    svgWidth: 0
}

// myScreen.clientWidth = document.documentElement.clientWidth;
// myScreen.clientHeight = document.documentElement.clientHeight;


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


//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

set_myScreen();

export const Detect = new DetectOS();

init_contextmenu();

main_3D();

eingabe1();  // Tabellenblatt eingabe sichtbar schalten

logo_3D();

ttf_logo_3D();




