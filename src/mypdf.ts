import { jsPDF, jsPDFAPI } from "jspdf";
//import autoTable from "jspdf-autotable";
import { Canvg } from "canvg";
//import { app, infoBox } from "./index.js";

import { font } from "./FreeSans-normal.js";
import { fontBold } from "./FreeSans-bold.js"

import htmlToPdfmake from "html-to-pdfmake"
import { tabQWerte, schnittgroesse, bezugswerte } from "./duennQ"

import { nnodes, nelem } from "./duennQ_tabelle.js"
import { truss, node } from "./duennQ"
import { myFormat } from './utility.js';
import { app } from './index.js';
import { current_unit_stress, unit_stress_factor, unit_length_factor, current_unit_length } from "./einstellungen"

const zeilenAbstand = 1.15
let Seite = 'Seite'

let doc: jsPDF;

let Seite_No: number

//----------------------------------------------------------------------------------------------
function htmlText(text: string, x: number, y: number) {
  //--------------------------------------------------------------------------------------------

  const html = htmlToPdfmake(text);
  //console.log("html", text, "|" + html.text + "|", html.length)

  const fs = doc.getFontSize();

  let xx = x
  let yy = y

  if (typeof html.length === 'undefined') {
    doc.text(html.text, xx, yy)
    return
  }

  for (let i = 0; i < html.length; i++) {
    //console.log("i,nodeName", i, html[i].text, html[i].nodeName)
    if (typeof html[i].nodeName === 'undefined') { // einfacher Text
      doc.text(html[i].text, xx, yy)
      xx += doc.getTextWidth(html[i].text)
    }
    else if (html[i].nodeName === 'SUB') {
      doc.setFontSize(fs - 3);
      doc.text(html[i].text, xx, yy + 1)
      xx += doc.getTextWidth(html[i].text)
      doc.setFontSize(fs);
    }
    else if (html[i].nodeName === 'SUP') {
      doc.setFontSize(fs - 3);
      doc.text(html[i].text, xx, yy - 1)
      xx += doc.getTextWidth(html[i].text)
      doc.setFontSize(fs);
    }

  }

}

//----------------------------------------------------------------------------------------------
function neueZeile(yy: number, fs: number, anzahl = 1): number {
  //--------------------------------------------------------------------------------------------
  let y = yy + anzahl * zeilenAbstand * (fs * 0.352778)
  if (y > 270) {
    Seite_No++
    doc.text(Seite + Seite_No, 100, 290);

    doc.addPage();
    y = 20
  }
  return y
}

//----------------------------------------------------------------------------------------------
function testSeite(yy: number, fs: number, anzahl: number, nzeilen: number): number {
  //--------------------------------------------------------------------------------------------
  const laenge = nzeilen * zeilenAbstand * (fs * 0.352778)
  if (laenge > 270) {  // ganze Tabelle passt nicht auf eine Seite

    if (yy + (anzahl + 3) * zeilenAbstand * (fs * 0.352778) > 270) {  // 3 Zeilen sollten mindestens unter Überschrift passen
      Seite_No++
      doc.text(Seite + Seite_No, 100, 290);

      doc.addPage();
      return 20;

    } else {
      return yy + anzahl * zeilenAbstand * (fs * 0.352778);
    }
  }

  let y = yy + Math.min(laenge, 50)   // wenn 5cm Platz auf Seite, sonst neue Seite anfangen
  console.log("y", y, nzeilen, laenge)
  if (y > 270) {
    Seite_No++
    doc.text(Seite + Seite_No, 100, 290);

    doc.addPage();
    return 20;
  } else {
    return yy + anzahl * zeilenAbstand * (fs * 0.352778);
  }
}
//----------------------------------------------------------------------------------------------
function neueSeite(): number {
  //--------------------------------------------------------------------------------------------
  Seite_No++
  doc.text(Seite + Seite_No, 100, 290);

  doc.addPage();
  return 20;
}

//----------------------------------------------------------------------------------------------
function letzteSeite() {
  //--------------------------------------------------------------------------------------------
  Seite_No++
  doc.text(Seite + Seite_No, 100, 290);
}

//----------------------------------------------------------------------------------------------
export async function my_jspdf() {
  //--------------------------------------------------------------------------------------------

  let str: string, texWid: number

  let fs1 = 15, fs = 11
  const links = 20;

  const newLine = "\n";
  Seite_No = 0
  if (app.browserLanguage != 'de') Seite = 'page'

  // Default export is a4 paper, portrait, using millimeters for units
  doc = new jsPDF();

  doc.addFileToVFS("freesans.ttf", font);
  doc.addFont("freesans.ttf", "freesans_normal", "normal");

  doc.addFileToVFS("freesansbold.ttf", fontBold);
  doc.addFont("freesansbold.ttf", "freesans_bold", "normal");

  doc.setFont("freesans_normal");
  doc.setFontSize(fs)
  let yy = 20;

  //doc.line(links, 1, 200, 1, "S");
  //doc.line(links, 295, 200, 295, "S");

  const txtarea = document.getElementById("freetext") as HTMLTextAreaElement
  console.log("textarea", txtarea.value)
  const txt = txtarea.value
  if (txt.length > 0) {
    let bold = false
    const myArray = txt.split(newLine);
    for (let i = 0; i < myArray.length; i++) {
      console.log("txt", i, myArray[i])

      let indexA = myArray[i].indexOf('<b>')
      let indexE = myArray[i].indexOf('</b>')
      let txtL = '', txtM = '', txtR = ''

      if (indexA > 0) txtL = myArray[i].slice(0, indexA)
      if (indexA >= 0 && indexE > 0) txtM = myArray[i].slice(indexA + 3, indexE)

      if (indexA >= 0 && indexE === -1) {                      // Fett nur zeilenweise
        txtM = myArray[i].slice(indexA + 3, myArray[i].length)
        bold = true
      } else if (indexA === -1 && indexE > 0) {
        txtM = myArray[i].slice(0, indexE)
        bold = false
      }
      if (indexE >= 0) {
        txtR = myArray[i].slice(indexE + 4, myArray[i].length)
      }
      console.log("txtLMR", txtL + '|' + txtM + '|' + txtR + '|')
      console.log("IndexAE", indexA, indexE)
      let col = links
      if (txtL.length > 0) {
        doc.setFont("freesans_normal");
        doc.text(txtL, col, yy);
        texWid = doc.getTextWidth(txtL)
        col += texWid
      }
      if (txtM.length > 0) {
        doc.setFont("freesans_bold");
        doc.text(txtM, col, yy);
        texWid = doc.getTextWidth(txtM)
        col += texWid
      }
      if (txtR.length > 0) {
        doc.setFont("freesans_normal");
        doc.text(txtR, col, yy);
      }
      if (indexA === -1 && indexE === -1) {
        if (bold) doc.setFont("freesans_bold");
        else doc.setFont("freesans_normal");
        doc.text(myArray[i], links, yy);
      }

      yy = neueZeile(yy, fs, 1)
    }
  }
  yy = neueZeile(yy, fs, 1)

  doc.setFont("freesans_bold");
  doc.setFontSize(fs1)

  if (app.browserLanguage == 'de') {
    doc.text("Dünnwandiger Querschnitt", links, yy);
  } else {
    doc.text("Properties and stresses of thin-walled cross sections", links, yy);
  }

  doc.setFontSize(fs); // in points
  doc.setFont("freesans_normal");

  // Schnittgrößen drucken

  yy = neueZeile(yy, fs, 2)

  if (app.browserLanguage == 'de') {
    doc.text("Schnittgrößen", links, yy)
  } else {
    doc.text("Internal forces", links, yy)
  }
  yy = neueZeile(yy, fs, 2)

  htmlText("V<sub>y</sub> = " + myFormat(schnittgroesse.Vy, 2, 2) + " kN", links, yy)
  htmlText("M<sub>xp</sub> = " + myFormat(schnittgroesse.Mxp, 2, 2) + " kNm", links + 40, yy)
  htmlText("N = " + myFormat(schnittgroesse.N, 2, 2) + " kN", links + 90, yy)

  yy = neueZeile(yy, fs1, 1)

  htmlText("V<sub>z</sub> = " + myFormat(schnittgroesse.Vz, 2, 2) + " kN", links, yy)
  htmlText("M<sub>xs</sub> = " + myFormat(schnittgroesse.Mxs, 2, 2) + " kNm", links + 40, yy)
  htmlText("M<sub>y</sub> = " + myFormat(schnittgroesse.My, 2, 2) + " kNm", links + 90, yy)

  yy = neueZeile(yy, fs1, 1)

  htmlText("M<sub>ω</sub> = " + myFormat(schnittgroesse.M_omega, 2, 2) + " kNm²", links + 40, yy)
  htmlText("M<sub>z</sub> = " + myFormat(schnittgroesse.Mz, 2, 2) + " kNm", links + 90, yy)

  yy = neueZeile(yy, fs, 2)

  if (app.browserLanguage == 'de') {
    doc.text("Bezugswerte", links, yy)
  } else {
    doc.text("Reference values", links, yy)
  }
  yy = neueZeile(yy, fs, 2)

  doc.text("E-Modul = " + myFormat(bezugswerte.emodul * unit_stress_factor, 1, 1) + " " + current_unit_stress, links, yy)

  if (app.browserLanguage == 'de') {
    doc.text("Querdehnung ν = " + myFormat(bezugswerte.mue, 1, 2), links + 70, yy)
  } else {
    doc.text("Poisson's ratio ν = " + myFormat(bezugswerte.mue, 1, 2), links + 70, yy)
  }
  yy = neueZeile(yy, fs, 1)

  /*
    autoTable(doc, {
      html: "#nodeTable",
      startY: yy,
      //theme: "plain",
      tableWidth: 100,
      //useCss: true,
      margin: { left: links },
      styles: {
        font: "freesans_normal",
        fontSize: fs
      }
    });
  */

  {
    const nspalten = 3, nzeilen = nnodes

    yy = testSeite(yy, fs1, 1, 4 + nzeilen)
    if (app.browserLanguage == 'de') {
      doc.text("Knotenkoordinaten", links, yy)
    } else {
      doc.text("Node coordinates", links, yy)
    }

    doc.setFontSize(fs)
    doc.setFont("freesans_bold");
    yy = neueZeile(yy, fs1, 2)

    const spalte: number[] = Array(nspalten);
    spalte[0] = links
    spalte[1] = spalte[0] + 15
    spalte[2] = spalte[1] + 20

    htmlText("Node No", spalte[0], yy)
    htmlText("y [" + current_unit_length + "]", spalte[1] + 10, yy)
    doc.text("‾", spalte[1] + 10, yy)
    htmlText("z [" + current_unit_length + "]", spalte[2] + 10, yy)
    doc.text("‾", spalte[2] + 10, yy)

    doc.setFontSize(fs)
    doc.setFont("freesans_normal");
    yy = neueZeile(yy, fs1, 1)

    for (let i = 0; i < nzeilen; i++) {
      doc.text(String(i + 1), spalte[0], yy);

      str = myFormat(node[i].y * unit_length_factor, 2, 2)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[1] + 20 - texWid, yy);

      str = myFormat(node[i].z * unit_length_factor, 2, 2)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[2] + 20 - texWid, yy);

      yy = neueZeile(yy, fs1, 1)
    }
  }


  {
    const nspalten = 3, nzeilen = nelem

    yy = testSeite(yy, fs1, 1, 4 + nzeilen)
    if (app.browserLanguage == 'de') {
      doc.text("Elementdaten", links, yy)
    } else {
      doc.text("Element data", links, yy)
    }
    let str: string, texWid: number

    doc.setFontSize(fs)
    doc.setFont("freesans_bold");
    yy = neueZeile(yy, fs1, 2)

    const spalte: number[] = Array(nspalten);
    spalte[0] = links
    spalte[1] = spalte[0] + 15
    spalte[2] = spalte[1] + 20
    spalte[3] = spalte[2] + 20
    spalte[4] = spalte[3] + 20
    spalte[5] = spalte[4] + 20

    htmlText("El No", spalte[0], yy)
    htmlText("E-Modul", spalte[1] + 5, yy)
    htmlText("ν", spalte[2] + 15, yy)
    if (app.browserLanguage == 'de') {
      htmlText("Dicke", spalte[3] + 10, yy)
    } else {
      htmlText("Width", spalte[3] + 10, yy)
    }
    htmlText("nod1", spalte[4] + 10, yy)
    htmlText("nod2", spalte[5] + 10, yy)

    doc.setFontSize(fs)
    doc.setFont("freesans_normal");
    yy = neueZeile(yy, fs, 1)

    doc.text("[" + current_unit_stress + "]", spalte[1] + 5, yy);
    doc.text("[" + current_unit_length + "]", spalte[3] + 12, yy);
    yy = neueZeile(yy, fs1, 1)

    for (let i = 0; i < nzeilen; i++) {
      doc.text(String(i + 1), spalte[0], yy);

      str = myFormat(truss[i].EModul * unit_stress_factor, 1, 2)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[1] + 20 - texWid, yy);

      str = myFormat(truss[i].mue, 1, 2)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[2] + 20 - texWid, yy);

      str = myFormat(truss[i].dicke * unit_length_factor, 1, 2)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[3] + 20 - texWid, yy);

      str = myFormat(truss[i].nod[0] + 1, 0, 0)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[4] + 20 - texWid, yy);

      str = myFormat(truss[i].nod[1] + 1, 0, 0)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[5] + 20 - texWid, yy);

      yy = neueZeile(yy, fs1, 1)
    }
  }


  doc.line(links, yy, 200, yy, "S");
  //  yy = neueZeile(yy, fs1, 2)
  yy = testSeite(yy, fs1, 2, 13)

  doc.setFontSize(fs1)
  doc.setFont("freesans_bold");
  if (app.browserLanguage == 'de') {
    doc.text("ideelle Querschnittswerte", links, yy);
  } else {
    doc.text("Ideal cross section properties", links, yy);
  }
  doc.setFontSize(fs)
  doc.setFont("freesans_normal");


  let xsp = 60
  let xsp1 = 15

  yy = neueZeile(yy, fs, 2)

  htmlText("y<sub>s</sub> = ", links, yy)
  doc.text("‾", links, yy)
  doc.text(tabQWerte.ys + ' ' + current_unit_length, links + xsp1, yy)
  htmlText("y<sub>M</sub> = ", links + xsp, yy)
  doc.text(tabQWerte.yM + ' ' + current_unit_length, links + xsp + xsp1, yy)

  yy = neueZeile(yy, fs1)

  htmlText("z<sub>s</sub> = ", links, yy)
  doc.text("‾", links, yy)
  doc.text(tabQWerte.zs + ' ' + current_unit_length, links + xsp1, yy)
  htmlText("z<sub>M</sub> = ", links + xsp, yy)
  doc.text(tabQWerte.zM + ' ' + current_unit_length, links + xsp + xsp1, yy)

  yy = neueZeile(yy, fs1)

  htmlText("A = ", links, yy)
  doc.text(tabQWerte.area + ' cm²', links + xsp1, yy)
  htmlText("I<sub>t</sub> = ", links + xsp, yy)
  doc.text(tabQWerte.It + ' cm⁴', links + xsp + xsp1, yy)

  yy = neueZeile(yy, fs1)

  htmlText("I<sub>yy,s</sub> = ", links, yy)
  doc.text(tabQWerte.Iyy + ' cm⁴', links + xsp1, yy)
  htmlText("I<sub>ω</sub> = ", links + xsp, yy)
  doc.text(tabQWerte.Iomega + ' cm⁶', links + xsp + xsp1, yy)

  yy = neueZeile(yy, fs1)

  htmlText("I<sub>zz,s</sub> = ", links, yy)
  doc.text(tabQWerte.Izz + ' cm⁴', links + xsp1, yy)
  htmlText("r<sub>1</sub> = ", links + xsp, yy)
  doc.text(tabQWerte.r1 + ' cm', links + xsp + xsp1, yy)

  yy = neueZeile(yy, fs1)

  htmlText("I<sub>yz,s</sub> = ", links, yy)
  doc.text(tabQWerte.Iyz + ' cm⁴', links + xsp1, yy)
  htmlText("r<sub>2</sub> = ", links + xsp, yy)
  doc.text(tabQWerte.r2 + ' cm', links + xsp + xsp1, yy)

  yy = neueZeile(yy, fs1)

  htmlText("I<sub>11</sub> = ", links, yy)
  doc.text(tabQWerte.I11 + ' cm⁴', links + xsp1, yy)
  htmlText("r<sub>ω</sub> = ", links + xsp, yy)
  doc.text(tabQWerte.r_omega + ' -', links + xsp + xsp1, yy)

  yy = neueZeile(yy, fs1)

  htmlText("I<sub>22</sub> = ", links, yy)
  doc.text(tabQWerte.I22 + ' cm⁴', links + xsp1, yy)
  htmlText("i<sub>M</sub><sup>2</sup> = ", links + xsp, yy)
  doc.text(tabQWerte.i_M2 + ' cm²', links + xsp + xsp1, yy)

  yy = neueZeile(yy, fs1)

  htmlText("φ<sub>h</sub> = ", links, yy)
  doc.text(tabQWerte.phi_h + ' °', links + xsp1, yy)
  htmlText("i<sub>p</sub><sup>2</sup> = ", links + xsp, yy)
  doc.text(tabQWerte.i_p2 + ' cm²', links + xsp + xsp1, yy)

  yy = neueZeile(yy, fs1)

  htmlText("A<sub>geom</sub> = ", links, yy)
  doc.text(tabQWerte.area_geom + ' cm²', links + xsp1, yy)

  //-----------------
  yy = neueZeile(yy, fs, 2)
  if (app.browserLanguage == 'de') {
    doc.text("Alle Spannungen in " + current_unit_stress, links, yy);
  } else {
    doc.text("All stresses in " + current_unit_stress, links, yy);
  }
  yy = neueZeile(yy, fs, 1)


  {
    let str: string, texWid: number

    const nspalten = 4, nzeilen = nelem

    yy = testSeite(yy, fs1, 1, 4 + nzeilen)
    if (app.browserLanguage == 'de') {
      str ="Schubspannungen aus primärer Torsion ";
    } else {
      str="Shear stresses from primary torsion ";
    }
    texWid = doc.getTextWidth(str)
    doc.text(str, links, yy);
    htmlText("M<sub>xp</sub>" , links + texWid, yy)


    doc.setFontSize(fs)
    doc.setFont("freesans_bold");
    yy = neueZeile(yy, fs1, 2)

    const spalte: number[] = Array(nspalten);
    spalte[0] = links
    spalte[1] = spalte[0] + 15
    spalte[2] = spalte[1] + 20
    spalte[3] = spalte[2] + 20

    htmlText("El No", spalte[0], yy)
    htmlText("τ<sub>xs0,L</sub>", spalte[1] + 10, yy)
    htmlText("τ<sub>xs0,R</sub>", spalte[2] + 10, yy)
    htmlText("τ<sub>xs1</sub>", spalte[3] + 10, yy)

    doc.setFontSize(fs)
    doc.setFont("freesans_normal");
    yy = neueZeile(yy, fs1, 1)

    for (let i = 0; i < nzeilen; i++) {
      doc.text(String(i + 1), spalte[0], yy);

      str = myFormat(truss[i].tau_p0L[0] * unit_stress_factor, 2, 2)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[1] + 20 - texWid, yy);

      str = myFormat(truss[i].tau_p0R[0] * unit_stress_factor, 2, 2)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[2] + 20 - texWid, yy);

      str = myFormat(truss[i].tau_p1[0] * unit_stress_factor, 2, 2)
      texWid = doc.getTextWidth(str)
      doc.text(str, spalte[3] + 20 - texWid, yy);

      yy = neueZeile(yy, fs1, 1)
    }
  }


  {
    let str: string, texWid: number

    const nspalten = 4, nzeilen = nelem

    yy = testSeite(yy, fs1, 1, 4 + nzeilen)
    if (app.browserLanguage == 'de') {
      str="Schubspannungen aus Querkräften und sekundärer Torsion ";
    } else {
      str="Shear stresses from shear forces and secondary torsion ";
    }
    texWid = doc.getTextWidth(str)
    doc.text(str, links, yy);
    htmlText("M<sub>xs</sub>" , links + texWid, yy)

    doc.setFontSize(fs)
    doc.setFont("freesans_bold");
    yy = neueZeile(yy, fs1, 2)

    const spalte: number[] = Array(nspalten);
    spalte[0] = links
    spalte[1] = spalte[0] + 15
    spalte[2] = spalte[1] + 20
    spalte[3] = spalte[2] + 20

    htmlText("El No", spalte[0], yy)
    htmlText("τ<sub>xsa</sub>", spalte[1] + 10, yy)
    htmlText("τ<sub>xsm</sub>", spalte[2] + 10, yy)
    htmlText("τ<sub>xse</sub>", spalte[3] + 10, yy)

    doc.setFontSize(fs)
    doc.setFont("freesans_normal");
    yy = neueZeile(yy, fs1, 1)

    for (let i = 0; i < nzeilen; i++) {
      doc.text(String(i + 1), spalte[0], yy);
      for (let j = 1; j < nspalten; j++) {
        str = myFormat(truss[i].tau_s[j - 1] * unit_stress_factor, 2, 2)
        texWid = doc.getTextWidth(str)
        doc.text(str, spalte[j] + 20 - texWid, yy);
      }
      yy = neueZeile(yy, fs1, 1)
    }
  }

  /*
    autoTable(doc, {
      html: "#id_table_spannung_mxs",
      startY: yy,
      theme: "plain",
      tableWidth: 100,
      useCss: true,
      margin: { left: links },
      styles: {
        font: "freesans_normal",
        fontSize: fs
      },
    });
  */


  {
    const nspalten = 7, nzeilen = nelem

    yy = testSeite(yy, fs1, 1, 5 + nzeilen)

    if (app.browserLanguage == 'de') {
      doc.text("Schubspannungen aus allen Anteilen", links, yy);
    } else {
      doc.text("Shear stresses from shear forces, primary and secondary torsional moment", links, yy);
    }

    let str: string, texWid: number
    doc.setFontSize(fs)
    doc.setFont("freesans_bold");
    yy = neueZeile(yy, fs1, 2)

    const spalte: number[] = Array(nspalten);
    spalte[0] = links
    spalte[1] = spalte[0] + 15
    spalte[2] = spalte[1] + 20
    spalte[3] = spalte[2] + 20
    spalte[4] = spalte[3] + 20
    spalte[5] = spalte[4] + 20
    spalte[6] = spalte[5] + 20

    htmlText("El No", spalte[0], yy)
    htmlText("τ<sub>a,L</sub>", spalte[1] + 10, yy)
    htmlText("τ<sub>m,L</sub>", spalte[2] + 10, yy)
    htmlText("τ<sub>e,L</sub>", spalte[3] + 10, yy)
    htmlText("τ<sub>a,R</sub>", spalte[4] + 10, yy)
    htmlText("τ<sub>m,R</sub>", spalte[5] + 10, yy)
    htmlText("τ<sub>e,R</sub>", spalte[6] + 10, yy)

    doc.setFontSize(fs)
    doc.setFont("freesans_normal");
    yy = neueZeile(yy, fs1, 1)

    if (app.browserLanguage == 'de') {
      texWid = doc.getTextWidth("linke Seite")
      doc.text("linke Seite", spalte[1] + (60 - texWid) / 2, yy)
    } else {
      texWid = doc.getTextWidth("left side")
      doc.text("left side", spalte[1] + (60 - texWid) / 2, yy)
    }
    if (app.browserLanguage == 'de') {
      texWid = doc.getTextWidth("rechte Seite")
      doc.text("rechte Seite", spalte[4] + (60 - texWid) / 2, yy)
    } else {
      texWid = doc.getTextWidth("right side")
      doc.text("right side", spalte[4] + (60 - texWid) / 2, yy)
    }

    yy = neueZeile(yy, fs1, 1)

    for (let i = 0; i < nzeilen; i++) {
      doc.text(String(i + 1), spalte[0], yy);
      for (let j = 1; j < 4; j++) {
        str = myFormat(truss[i].stress_L[j - 1] * unit_stress_factor, 2, 2)
        texWid = doc.getTextWidth(str)
        doc.text(str, spalte[j] + 20 - texWid, yy);
      }
      for (let j = 4; j < nspalten; j++) {
        str = myFormat(truss[i].stress_R[j - 4] * unit_stress_factor, 2, 2)
        texWid = doc.getTextWidth(str)
        doc.text(str, spalte[j] + 20 - texWid, yy);
        //doc.text(myFormat(truss[i].stress_R[j - 4], 2, 2), spalte[j], yy);
      }
      yy = neueZeile(yy, fs1, 1)
    }
  }


  {
    const nspalten = 4, nzeilen = nelem

    yy = testSeite(yy, fs1, 1, 4 + nzeilen)


    if (app.browserLanguage == 'de') {
      doc.text("Normalspannungen aus Normalkraft, Biegemomenten und Wölbbimoment", links, yy);
    } else {
      doc.text("Normal stresses from normal force, bending moments and warping bimoment", links, yy);
    }

    let str: string, texWid: number

    doc.setFontSize(fs)
    doc.setFont("freesans_bold");
    yy = neueZeile(yy, fs1, 2)

    const spalte: number[] = Array(nspalten);
    spalte[0] = links
    spalte[1] = spalte[0] + 15
    spalte[2] = spalte[1] + 20
    spalte[3] = spalte[2] + 20

    htmlText("El No", spalte[0], yy)
    htmlText("σ<sub>xa</sub>", spalte[1] + 10, yy)
    htmlText("σ<sub>xm</sub>", spalte[2] + 10, yy)
    htmlText("σ<sub>xe</sub>", spalte[3] + 10, yy)

    doc.setFontSize(fs)
    doc.setFont("freesans_normal");
    yy = neueZeile(yy, fs1, 1)

    for (let i = 0; i < nzeilen; i++) {
      doc.text(String(i + 1), spalte[0], yy);
      for (let j = 1; j < nspalten; j++) {
        str = myFormat(truss[i].sigma_x[j - 1] * unit_stress_factor, 3, 3)
        texWid = doc.getTextWidth(str)
        doc.text(str, spalte[j] + 20 - texWid, yy);
      }
      yy = neueZeile(yy, fs1, 1)
    }
  }


  /*
    autoTable(doc, {
      html: "#id_table_vergleichsspannung",
      //theme: "plain",
      tableWidth: 100,
      useCss: true,
      margin: { left: links },
      styles: {
        font: "freesans_normal",
        fontSize: 10,
        fillColor: '#ffffff'
      },
    });
  */

  {
    const nspalten = 4, nzeilen = nelem

    yy = testSeite(yy, fs1, 1, 4 + nzeilen)
    if (app.browserLanguage == 'de') {
      doc.text("von Mises Vergleichsspannungen", links, yy);
    } else {
      doc.text("von Mises equivalent stresses", links, yy);
    }

    let str: string, texWid: number

    doc.setFontSize(fs)
    doc.setFont("freesans_bold");
    yy = neueZeile(yy, fs1, 2)

    const spalte: number[] = Array(nspalten);
    spalte[0] = links
    spalte[1] = spalte[0] + 15
    spalte[2] = spalte[1] + 20
    spalte[3] = spalte[2] + 20

    htmlText("El No", spalte[0], yy)
    htmlText("σ<sub>va</sub>", spalte[1] + 10, yy)
    htmlText("σ<sub>vm</sub>", spalte[2] + 10, yy)
    htmlText("σ<sub>ve</sub>", spalte[3] + 10, yy)

    doc.setFontSize(fs)
    doc.setFont("freesans_normal");
    yy = neueZeile(yy, fs1, 1)

    for (let i = 0; i < nzeilen; i++) {
      doc.text(String(i + 1), spalte[0], yy);
      for (let j = 1; j < nspalten; j++) {
        str = myFormat(truss[i].sigma_v[j - 1] * unit_stress_factor, 3, 3)
        texWid = doc.getTextWidth(str)
        doc.text(str, spalte[j] + 20 - texWid, yy);
      }
      yy = neueZeile(yy, fs1, 1)
    }
  }

  // -------------------------------------  S  V  G  --------------------------------------

  //Get svg markup as string
  let svg = document.getElementById("my-svg").innerHTML;

  if (svg) {
    svg = svg.replace(/\r?\n|\r/g, "").trim();
    svg = svg.substring(0, svg.indexOf("</svg>")) + "</svg>";
    // @ts-ignore
    svg = svg.replaceAll("  ", "");
    // console.log("svg", svg);

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    console.log("canvas", canvas.width, canvas.height);

    context.clearRect(0, 0, canvas.width, canvas.height);
    const v = Canvg.fromString(context, svg);

    v.render();

    var imgData = canvas.toDataURL("image/png", 1);

    if ((yy + 200) > 275) {
      yy = neueSeite();
    } else {
      yy = neueZeile(yy, fs)
    }
    if (app.browserLanguage == 'de') {
      doc.text('Querschnitt', links, yy)
    } else {
      doc.text('Cross section', links, yy)
    }

    doc.addImage(imgData, "PNG", 0, yy, 200, 200); // * myScreen.clientHeight / myScreen.svgWidth);

    letzteSeite();

    let filename: string = 'duennqs.pdf'

    if (app.hasFSAccess && app.isMac) {

      filename = window.prompt(
        "Name der Datei mit Extension, z.B. duennqs.pdf\nDie Datei wird im Default Download Ordner gespeichert", 'duennqs.pdf'
      );

    } else if (app.hasFSAccess) {
      filename = window.prompt(
        "Name der Datei mit Extension, z.B. duennqs.pdf\nDie Datei wird im Default Download Ordner gespeichert", 'duennqs.pdf'
      );
    }

    try {
      doc.save(filename);
    } catch (error) {
      alert(error.message);
    }

    document.getElementById("id_pdf_info").innerText = "pdf-file saved in your Download folder";

  }
}
