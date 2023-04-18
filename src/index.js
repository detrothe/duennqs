
import './styles/main.css';
import './styles/contextMenu.css';

import { myScreen } from './first.js'
//import "./globals.js";
import './einstellungen'

import "./duenn3D.js";
import './ergebnisse.js'
import './base_tabelle.js'
import './mypdf'

import { createTables } from './duennQ'

import { sichtbar, currentTab } from "./utility.js";

import DetectOS from './detectos.js'
import { init_contextmenu } from './contextMenu.js';


import { logo_3D, main_3D, ttf_logo_3D } from "./grafik_3D";
//import { duennQ } from "./duennQ"
import { setNewUnits, body_width, current_body_width } from './einstellungen';
import { berechnungErforderlich } from "./globals.js"


// myScreen.clientWidth = document.documentElement.clientWidth;
// myScreen.clientHeight = document.documentElement.clientHeight;

export const infoBox = document.getElementById("infoBox");

addEventListener("resize", (event) => {
    //console.log("in resize")
    set_myScreen()
});

//-------------------------------------------------------------------------------
export function set_myScreen() {
    //---------------------------------------------------------------------------

    console.log("body_width", body_width)

    //const currentBodyWidth = document.body.style.width

    if (body_width < document.documentElement.clientWidth) {
        document.body.style.width = body_width + 'px'
        document.body.style.position = 'relative'
        document.body.style.left = (document.documentElement.clientWidth - body_width) / 2 + 'px'
    } else {
        document.body.style.width = '100%'   //document.documentElement.clientWidth
        document.body.style.position = 'relative'
        document.body.style.left = '0px'
        document.body.style.right = '0px'
    }

    myScreen.clientWidth = document.documentElement.clientWidth;
    myScreen.clientHeight = document.documentElement.clientHeight;

    console.log("myScreen", myScreen.clientWidth, myScreen.clientHeight, myScreen.svgWidth)
    console.log("devicePixelRatio", window.devicePixelRatio, screen.width, screen.height, screen.orientation)

    if (myScreen.clientWidth > body_width) {
        myScreen.svgWidth = body_width;  //myScreen.clientWidth - 900;
        //    } else if (myScreen.clientWidth < 600) {
        //        myScreen.svgWidth = myScreen.clientWidth
    } else {
        myScreen.svgWidth = myScreen.clientWidth;
    }
    //document.getElementById("my-svg").style.width = myScreen.svgWidth + 'px';
    //document.getElementById("my-svg").style.height = myScreen.clientHeight + 'px';

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

createTables();

setNewUnits();

document.body.style.display = 'block'

{
    let myInfoDiv = document.getElementById("id_hilfe");  //in div

    let tag = document.createElement("p"); // <p></p>
    tag.setAttribute("id", "id_infoDiv");
    let text = document.createTextNode("xxx");
    tag.appendChild(text);
    tag.innerHTML = "devicePixelRatio " + window.devicePixelRatio;
    myInfoDiv.appendChild(tag);

    console.log("my locale", navigator.language)

    if (window.devicePixelRatio >= 1.5) {
        const el = document.getElementById("id_body_width").setAttribute('disabled', true)
    }
}

main_3D();

eingabe1();  // Tabellenblatt eingabe sichtbar schalten
berechnungErforderlich(true);

logo_3D();

ttf_logo_3D();

{
    infoBox.innerHTML = '<br><b>Einige System-Informationen</b><br>';
    infoBox.innerHTML += 'ScreenWidth≈' + Math.round(screen.width * window.devicePixelRatio)
        + " px &nbsp;,&nbsp;&nbsp;    ScreenHeight≈ " + Math.round(screen.height * window.devicePixelRatio) + ' px';
    infoBox.innerHTML += "<br>Browser: clientwidth=" + myScreen.clientWidth + "&nbsp;,&nbsp;&nbsp;    clientheight=" + myScreen.clientHeight;
    infoBox.innerHTML += "<br>Browser: " + Detect.browser + " Version " + Detect.version;
    infoBox.innerHTML += "<br>OS: " + Detect.OS + " , isMac: " + app.isMac;
    infoBox.innerHTML += "<br>Browser Language: " + navigator.language;
    if (app.hasFSAccess) {
        infoBox.innerHTML += "<br>showSaveFilePicker wird unterstützt";
    } else {
        infoBox.innerHTML += "<br>showSaveFilePicker wird NICHT unterstützt";
    }
    const div = document.querySelector('body') //document.getElementById('eingabe_duennQ_top');

    infoBox.innerHTML += "<br>used font-size: " + css(div, 'font-size')
    //let txt = Intl.DateTimeFormat().resolvedOptions().locale
    let txt = Intl.NumberFormat().resolvedOptions().locale
    let txtArray = txt.split("-")
    infoBox.innerHTML += "<br>OS Language by NumberFormat: " + txtArray[0]
    infoBox.innerHTML += "<br>URL: " + window.location
    infoBox.innerHTML += "<br>Hostname: " + window.location.hostname
    //geht nicht infoBox.innerHTML += "<br>width of body: " + document.body.style.width
    //geht nicht infoBox.innerHTML += "<br>width of grid-container: " + document.createElement("grid-container").style.width
    //infoBox.innerHTML += "<br>getComputedStyle: " + getComputedStyle(div).font
    //infoBox.innerHTML += "<br>getRenderedFontFamilyName: " + getRenderedFontFamilyName(document.querySelector('body'));
}




function css(element, property) {
    return window.getComputedStyle(element, null).getPropertyValue(property);
}
/*
function getRenderedFontFamilyName(element) {
    // Font families set in CSS for the element
    const fontFamilies = window.getComputedStyle(element, null).getPropertyValue("font-family");
    // const hardcodedFamilies = '-apple-system, BlinkMacSystemFont, "Segoe UI Adjusted", "Segoe UI", "Liberation Sans", sans-serif';

    // Remove the " sign from names (font families with spaces in their names) and split names to the array
    const fontFamiliesArr = fontFamilies.replaceAll('"', "").split(", ");

    // Find the first loaded font from the array
    return fontFamiliesArr.find(e => document.fonts.check(`12px ${e}`));
}
*/