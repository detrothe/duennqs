import { app, Detect } from './index';
import { selectedCellPoly } from './base_tabelle.js';
import { remove_selected_Tabelle } from "./duennQ_tabelle.js";
//(function () {

"use strict";

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//
// H E L P E R    F U N C T I O N S
//
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/**
 * Function to check if we clicked inside an element with a particular class
 * name.
 *
 * @param {Object} e The event
 * @param {String} className The class name to check against
 * @return {Boolean}
 */
function clickInsideElement(e, className) {

    let el = e.srcElement || e.target;
    //console.log("click Inside Element:", className, e.target, "-el-", el);

    if (el.classList.contains(className)) {
        console.log("el.classList.contains: ", className)
        return el;
    } else if (el.classList.contains('input_select')) {
        console.log("el.classList.contains: input_select")
        return el;
    }
    else {
        while (el = el.parentNode) {
            if (el.classList && el.classList.contains(className)) {
                console.log("parent", el)
                return el;
            }
        }
    }

    return false;
}

/**
 * Get's exact position of event.
 *
 * @param {Object} e The event passed in
 * @return {Object} Returns the x and y position
 */
function getPosition(e) {
    let posx = 0;
    let posy = 0;

    //if (!e) var e = window.event;

    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    } else if (e.clientX || e.clientY) {
        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    console.log("getPosition", posx, posy)

    return {
        x: posx,
        y: posy
    }
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//
// C O R E    F U N C T I O N S
//
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/**
 * Variables.
 */
//var contextMenuClassName = "context-menu";
//var contextMenuItemClassName = "context-menu__item";
const contextMenuLinkClassName = "context-menu__link";
const contextMenuActive = "context-menu--active";

const taskItemClassName = "tabellen";   // tasks  tabelle
let taskItemInContext;

let clickCoords;
let clickCoordsX;
let clickCoordsY;

const menu = document.querySelector("#context-menu");
//var menuItems = menu.querySelectorAll(".context-menu__item");
let menuState = 0;
let menuWidth;
let menuHeight;
//var menuPosition;
//var menuPositionX;
//var menuPositionY;

let windowWidth;
let windowHeight;

/**
 * Initialise our application's code.
 */
export function init_contextmenu() {
    //console.log("init_contextmenu", menu);
    contextListener();
    clickListener();
    keyupListener();
    resizeListener();
    //touchListener();
}

/**
 * Listens for contextmenu events.
 */
function contextListener() {
    document.addEventListener("contextmenu", function (e) {
        /*
                if (e.button === 2) {
                    console.log("//// contextListener")
                    e.preventDefault();
                    return;
                }
        */
        taskItemInContext = clickInsideElement(e, taskItemClassName);

        console.log("//// contextListener  taskItem In Context", e.button, taskItemInContext);

        if (taskItemInContext) {
            e.preventDefault();
            if (e.button === 2) return
            toggleMenuOn();
            positionMenu(e);
        } else {
            taskItemInContext = null;
            toggleMenuOff();
        }
    });
}

/**
 * Listens for click events.
 */
export function clickListener() {
    document.addEventListener("click", function (e) {

        const clickeElIsLink = clickInsideElement(e, contextMenuLinkClassName);
        console.log("+++ clickListener  clickeElIsLink", clickeElIsLink, e.button);

        if (clickeElIsLink) {
            e.preventDefault();
            if (e.button === 2) return
            menuItemListener(clickeElIsLink);
        } else {
            //console.log("clickListener", e.button, e.which);
            //let button = e.which || e.button;  // e.which ||
            if (e.button === 0) {   // linke Maustaste
                //toggleMenuOff();
            }
        }
    });
}
/*
function touchListener() {
    document.addEventListener("pointerup", function (e) {
        const clickeElIsLink = clickInsideElement(e, contextMenuLinkClassName);
        console.log("+++ in touchListener_clickeElIsLink", clickeElIsLink);

        if (clickeElIsLink) {
            e.preventDefault();
            menuItemListener(clickeElIsLink);
        } else {
            //console.log("clickListener", e.button, e.which);
            //let button = e.which || e.button;  // e.which ||
            if (e.button === 0) {   // linke Maustaste
                toggleMenuOff();
            }
        }
    });
}
*/

//-------------------------------------------------------------------------
export function show_contextMemu(ev) {
    //-------------------------------------------------------------------------
    taskItemInContext = clickInsideElement(ev, taskItemClassName);

    console.log("//// show_contextMemu  taskItem In Context", taskItemInContext);

    if (taskItemInContext) {
        ev.preventDefault();
        toggleMenuOn();
        positionMenu(ev);
    } else {
        taskItemInContext = null;
        toggleMenuOff();
    }
}


/**
 * Listens for keyup events.
 */
function keyupListener() {
    console.log("--- keyupListener");

    window.onkeyup = function (e) {
        //console.log("keyupListener", e.code, e.key, e);   // geht auch
        if (e.keyCode === 27) {   // ESC Taste
            toggleMenuOff();
        }
    }
}

/**
 * Window resize event listener
 */
function resizeListener() {
    window.onresize = function (e) {
        toggleMenuOff();
    };
}

/**
 * Turns the custom context menu on.
 */
function toggleMenuOn() {
    console.log("toggleMenuOn", menuState);
    if (menuState !== 1) {
        menuState = 1;
        menu.classList.add(contextMenuActive);
        menu.focus();
    }
}

/**
 * Turns the custom context menu off.
 */
function toggleMenuOff() {
    if (menuState !== 0) {
        menuState = 0;
        menu.classList.remove(contextMenuActive);
    }
}

/**
 * Positions the menu properly.
 *
 * @param {Object} e The event
 */
function positionMenu(e) {

    console.log("positionMenu", e.pageX, e.pageY);

    clickCoords = getPosition(e);
    clickCoordsX = clickCoords.x;
    clickCoordsY = clickCoords.y;

    menuWidth = menu.offsetWidth + 4;
    menuHeight = menu.offsetHeight + 4;

    windowWidth = document.documentElement.clientWidth;   //window.innerWidth;
    windowHeight = document.documentElement.clientHeight; //window.innerHeight;
    /*
        if ( (windowWidth - clickCoordsX) < menuWidth ) {
          menu.style.left = windowWidth - menuWidth + "px";
        } else {
          //menu.style.left = clickCoordsX + "px";
          menu.style.left = e.pageX + "px";
        }
    */
    if ((e.pageX + menuWidth) > windowWidth) {
        menu.style.left = e.pageX - menuWidth + "px";
    } else {
        //menu.style.left = clickCoordsX + "px";
        menu.style.left = e.pageX + "px";
    }
    /*
        if ( (windowHeight - clickCoordsY) < menuHeight ) {
          menu.style.top = windowHeight - menuHeight + "px";
        } else {
          //menu.style.top = clickCoordsY + "px";
          menu.style.top = e.pageY + "px";
        }
     */
    //console.log("positionmenu", e.pageY, menuHeight, windowHeight);
    //let str = `${e.pageY}, ${menuHeight}, ${windowHeight}`;
    //infoBox.innerHTML += "<br>positionmenu, " + str;

    if ((e.pageY + menuHeight) > windowHeight) {
        menu.style.top = e.pageY - menuHeight + "px";
    } else {
        //menu.style.top = clickCoordsY + "px";
        menu.style.top = e.pageY + "px";
    }
}

/**
 * Dummy action function that logs an action when a menu item link is clicked
 *
 * @param {HTMLElement} link The link that was clicked
 */
function menuItemListener(link) {
    console.log("LINK", link.getAttribute("data-action"))
    //console.log("Task ID - " + taskItemInContext.getAttribute("data-id") + ", Task action - " + link.getAttribute("data-action"));
    toggleMenuOff();

    //const tableId = selectedCellPoly.tableId;
    //console.log("menuItemListener, tableId=", selectedCellPoly.tableId);

    if (link.getAttribute("data-action") === "copyFirst") {
        // Zellwert in zuletzt geklickter Zelle
        let row = selectedCellPoly.row;
        let col = selectedCellPoly.col;

        const wert = selectedCellPoly.wert;
        //console.log("copyFirst, wert=", wert);

        const tabelle = document.getElementById(selectedCellPoly.tableId);
        const nZeilen = tabelle.rows.length;  // header abziehen
        const nSpalten = tabelle.rows[0].cells.length;
        //console.log("Tabelle", tabelle, nZeilen, nSpalten)

        let i, j;
        for (i = 1; i < nZeilen; i++) {
            for (j = 1; j < nSpalten; j++) {
                let child = tabelle.rows[i].cells[j].firstElementChild   // input
                if (child.className === 'input_select') {
                    child.value = wert.toString();
                }
            }
        }
    } else if (link.getAttribute("data-action") === "copyFirstRow") {

        let i, j;
        console.log("copyFirstRow")
        // Zellwert in zuletzt geklickter Zelle
        let row = selectedCellPoly.row;
        let col = selectedCellPoly.col;

        const wert = selectedCellPoly.wert;
        console.log("copyFirst, wert=", wert, row, col);

        const tabelle = document.getElementById(selectedCellPoly.tableId);
        const nZeilen = tabelle.rows.length;  // header abziehen
        const nSpalten = tabelle.rows[0].cells.length;

        const value = [];
        let nCols = 0;
        for (j = 1; j < nSpalten; j++) {
            value.push(tabelle.rows[row].cells[j].firstElementChild.value)
            nCols++;
        }
        console.log("value", value);

        for (i = 1; i < nZeilen; i++) {
            for (j = 1; j < nSpalten; j++) {
                let child = tabelle.rows[i].cells[j].firstElementChild   // input
                if (child.className === 'input_select') {
                    tabelle.rows[i].cells[j].firstElementChild.value = value[j - 1].toString();
                }
            }
        }

    } else if (link.getAttribute("data-action") === "increment_1") {

        let i, j;

        // Zellwert in zuletzt geklickter Zelle
        let row = selectedCellPoly.row;
        let col = selectedCellPoly.col;

        let wert = Number(selectedCellPoly.wert);
        //console.log("increment_1, wert=", wert);

        const tabelle = document.getElementById(selectedCellPoly.tableId);
        const nZeilen = tabelle.rows.length;
        const nSpalten = tabelle.rows[0].cells.length;

        const value = [];

        for (j = 1; j < nSpalten; j++) {
            value.push(tabelle.rows[row].cells[j].firstElementChild.value)
        }
        console.log("value", value);


        for (i = 1; i < nZeilen; i++) {
            for (j = 1; j < nSpalten; j++) {
                let child = tabelle.rows[i].cells[j].firstElementChild   // input
                if (child.className === 'input_select') {
                    tabelle.rows[i].cells[j].firstElementChild.value = (value[j - 1]++).toString();
                }
            }
        }

    } else if (link.getAttribute("data-action") === "increment_delta") {

        let i, j;

        const tabelle = document.getElementById(selectedCellPoly.tableId);
        const nZeilen = tabelle.rows.length;
        const nSpalten = tabelle.rows[0].cells.length;

        // Zellwert in zuletzt geklickter Zelle
        let row = Number(selectedCellPoly.row);
        console.log("test increment_delta", row, nZeilen)
        if (Number(row) + 2 >= nZeilen) return;    // das geht nicht, da gibt es nichts zu tun
        console.log("alive")
        //let col = selectedCellPoly.col;

        //let wert = Number(selectedCellPoly.wert);
        //console.log("increment_1, wert=", wert);

        const value = [];
        const delta = [];
        let del;

        for (j = 1; j < nSpalten; j++) {

            //del = Number(tabelle.rows[row + 1].cells[j].firstElementChild.value.replace(/,/g, '.'))
            //    - Number(tabelle.rows[row].cells[j].firstElementChild.value.replace(/,/g, '.'))
            //value.push(Number(tabelle.rows[row].cells[j].firstElementChild.value.replace(/,/g, '.')))
            del = tabelle.rows[row + 1].cells[j].firstElementChild.value
                - tabelle.rows[row].cells[j].firstElementChild.value
            value.push(Number(tabelle.rows[row].cells[j].firstElementChild.value))
            delta.push(Number(del))
        }
        console.log("value", value);
        console.log("delta", delta);

        for (i = 1; i < nZeilen; i++) {
            for (j = 1; j < nSpalten; j++) {
                let child = tabelle.rows[i].cells[j].firstElementChild   // input
                if (child.className === 'input_select') {
                    let zahl = Number(value[j - 1]).toPrecision(12) * 1;
                    tabelle.rows[i].cells[j].firstElementChild.value = zahl.toString();
                    value[j - 1] += delta[j - 1];
                }
            }
        }
    } else if (link.getAttribute("data-action") === "copy") {

        let newClip = "";
        let wertInSpalte1 = false;

        let newLine = null;
        if (Detect.OS === 'Windows') {
            newLine = "\r\n";
        } else {
            newLine = "\n";
        }
        const tabelle = document.getElementById(selectedCellPoly.tableId);
        const nZeilen = tabelle.rows.length;
        const nSpalten = tabelle.rows[0].cells.length;

        let i, j;
        for (i = 1; i < nZeilen; i++) {
            wertInSpalte1 = false;
            for (j = 1; j < nSpalten - 1; j++) {
                let child = tabelle.rows[i].cells[j].firstElementChild   // input
                if (child.className === 'input_select') {
                    if (wertInSpalte1) newClip += "\t";
                    let wert = tabelle.rows[i].cells[j].firstElementChild.value;
                    newClip += wert;
                    wertInSpalte1 = true;
                }
            }
            let child = tabelle.rows[i].cells[nSpalten - 1].firstElementChild   // input
            if (child.className === 'input_select') {
                if (wertInSpalte1) newClip += "\t";
                let wert = tabelle.rows[i].cells[nSpalten - 1].firstElementChild.value;
                newClip += wert + newLine;
            } else {
                if (wertInSpalte1) newClip += newLine;
            }
        }


        navigator.clipboard.writeText(newClip).then(function () {
            console.log("clipboard successfully set");
        }, function () {
            console.log("clipboard write failed");
        });

    } else if (link.getAttribute("data-action") === "insert") {

        let newLine = null;
        if (Detect.OS === 'Windows') {
            newLine = "\r\n";
        } else {
            newLine = "\n";
        }

        // Zellwert in zuletzt geklickter Zelle
        let row = Number(selectedCellPoly.row);
        let col = Number(selectedCellPoly.col);

        //console.log("insert", row, col)

        const tabelle = document.getElementById(selectedCellPoly.tableId);
        const nZeilen = tabelle.rows.length;
        const nSpalten = tabelle.rows[0].cells.length;

        //console.log("nZeilen,nSpalten", nZeilen, nSpalten)

        navigator.clipboard.readText().then(function (clipText) {
            //console.log("clipText", clipText);

            let zeilen = clipText.split(newLine);
            //console.log("zeilen", zeilen, zeilen.length);

            let i, j;
            for (i = 0; i < zeilen.length - 1; i++) {
                let zeile = zeilen[i].split("\t");
                //console.log("zeile", i, zeile, zeile.length);
                for (j = 0; j < zeile.length; j++) {
                    //console.log("z", i, j, zeile[j], (row + i), nZeilen, (col + j), nSpalten);
                    if ((row + i) < nZeilen && (col + j) < nSpalten) {
                        //console.log("z", i, j, zeile[j], (row + i), nZeilen, (col + j), nSpalten);
                        let zahl = zeile[j].replace(/,/g, '.')
                        tabelle.rows[row + i].cells[col + j].firstElementChild.value = zahl;
                    }
                }
            }

        });
    } else if (link.getAttribute("data-action") === "close") {

    }

    remove_selected_Tabelle();
}

/**
 * Run the app.
 */
// init();

//})();