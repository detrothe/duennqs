import { sichtbar } from "./utility.js";

//------------------------------------------------------------------------------------------------

export function duenn3D() {
    console.log("in duenn3D");
    sichtbar('duenn3D')
}


// @ts-ignore
window.duenn3D = duenn3D;   // jetzt auch in html sichtbar

console.log("exit duenn3D.js");
//------------------------------------------------------------------------------------------------

export function duennQuer() {
    console.log("in duennQ");
    sichtbar('duennQ')
}

// @ts-ignore
window.duennQuer = duennQuer;   // jetzt auch in html sichtbar

//------------------------------------------------------------------------------------------------

export function mypdf() {
    console.log("in mypdf");
    sichtbar('mypdf')
}

// @ts-ignore
window.mypdf = mypdf;   // jetzt auch in html sichtbar

console.log("exit duenn3D")