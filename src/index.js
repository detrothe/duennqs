import './styles/main.css';
import './styles/contextMenu.css';

//import "./globals.js";
import './einstellungen'

import "./duenn3D.js";
import './ergebnisse.js'
import './base_tabelle.js'
import './mypdf'


import { sichtbar, currentTab } from "./utility.js";

import DetectOS from './detectos.js'
import { init_contextmenu } from './contextMenu.js';


import { logo_3D, main_3D, ttf_logo_3D } from "./grafik_3D";
import { duennQ } from "./duennQ"
import { setNewUnits } from './einstellungen';

export const myScreen = {
    clientWidth: 0,
    clientHeight: 0,
    svgWidth: 0
}

// myScreen.clientWidth = document.documentElement.clientWidth;
// myScreen.clientHeight = document.documentElement.clientHeight;

export const infoBox = document.getElementById("infoBox");

export function set_myScreen() {

    myScreen.clientWidth = document.documentElement.clientWidth;
    myScreen.clientHeight = document.documentElement.clientHeight;

    console.log("myScreen", myScreen.clientWidth, myScreen.clientHeight, myScreen.svgWidth)
    console.log("devicePixelRatio", window.devicePixelRatio, screen.width, screen.height, screen.orientation)

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
    appName: 'duennQs',
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

const portrait = window.matchMedia("(orientation: portrait)");

portrait.addEventListener("change", function (e) {
    if (e.matches) {
        // Portrait mode
        //console.log("portrait mode")
        sichtbar(currentTab)
    } else {
        // Landscape
        //console.log("landscape mode")
        sichtbar(currentTab)
    }
})

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------


set_myScreen();

export const Detect = new DetectOS();

init_contextmenu();

setNewUnits();

{
    let myInfoDiv = document.getElementById("id_hilfe");  //in div

    let tag = document.createElement("p"); // <p></p>
    tag.setAttribute("id", "id_infoDiv");
    let text = document.createTextNode("xxx");
    tag.appendChild(text);
    tag.innerHTML = "devicePixelRatio " + window.devicePixelRatio;
    myInfoDiv.appendChild(tag);

    console.log("my locale", navigator.language)
}

main_3D();

eingabe1();  // Tabellenblatt eingabe sichtbar schalten

logo_3D();

ttf_logo_3D();

{
    infoBox.innerHTML = "clientwidth=" + myScreen.clientWidth + "&nbsp;,&nbsp;&nbsp;    clientheight=" + myScreen.clientHeight;
    infoBox.innerHTML += "<br>Browser: " + Detect.browser + " Version " + Detect.version;
    infoBox.innerHTML += "<br>OS: " + Detect.OS + " , isMac: " + app.isMac;
    if (app.hasFSAccess) {
        infoBox.innerHTML += "<br>showSaveFilePicker wird unterstützt";
    } else {
        infoBox.innerHTML += "<br>showSaveFilePicker wird NICHT unterstützt";
    }

}

//duennQ();


