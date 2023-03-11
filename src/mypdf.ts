import { jsPDF, jsPDFAPI } from "jspdf";
import autoTable from "jspdf-autotable";
import { Canvg } from "canvg";
import { infoBox } from "./index.js";

import { app } from "./index";
//import {svg} from "./systemlinien"
import { font } from "./FreeSans-normal.js";

import htmlToPdfmake from "html-to-pdfmake"
import { tabQWerte } from "./duennQ"

//----------------------------------------------------------------------------------------------
function htmlText(doc: jsPDF, text: string, x: number, y: number) {
  //--------------------------------------------------------------------------------------------

  const html = htmlToPdfmake(text);
  //console.log("html", html)

  const fs = doc.getFontSize();

  let xx = x
  let yy = y

  for (let i = 0; i < html.length; i++) {
    console.log("i,nodeName", i, html[i].nodeName)
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
export async function my_jspdf() {
  //----------------------------------------------------------------------------------------------

  //window.URL.revokeObjectURL();
  //const res = await navigator.storage.getDirectory()
  //console.log("res",res)
  /*
    var html = htmlToPdfmake(`
        formular <sup>abc</sup>
  `);
  */
  /*
    <div>
      <p>
      formular < sub > abc < /sub>
      < /p>
      < /div>
  */
  /*
  console.log("html", html.length, html[0].text, html[1].text, html[2].text)
  console.log("html0", html[0].text, html[0].style, html[0].nodeName)
  //console.log("html1", html[1].text, html[1].style[0], html[1].nodeName, html[1].sub.offset, html[1].sub.fontSize)
  console.log("html2", html[2].text, html[2].style, html[2].nodeName)

  console.log("html", html)
  */
  // Default export is a4 paper, portrait, using millimeters for units
  const doc = new jsPDF();

  doc.addFileToVFS("freesans.ttf", font);
  doc.addFont("freesans.ttf", "freesans_normal", "normal");
  doc.setFont("freesans_normal");

  doc.text("Dünnwandiger Querschnitt", 10, 10);
  let xx = doc.getTextWidth("Dünnwandiger Querschnitt")
  console.log("xx", xx)
  xx += 10
  doc.text("xsa", xx, 11)
  xx += doc.getTextWidth("xsa")
  doc.text(" und weiter gehts", xx, 10)

  doc.setFontSize(14); // in points

  /*
      autoTable(doc, {
          head: [['Name', 'Email', 'Country']],
          body: [
              ['David', 'david@example.com', 'Sweden'],
              ['Castille', 'castille@example.com', 'Spain'],
              // ...
          ],
      })
  */
  autoTable(doc, {
    html: "#nodeTable",
    theme: "plain",
    tableWidth: 100,
    //useCss: true,
    styles: {
      font: "freesans_normal",
    }
  });

  // @ts-ignore
  let yy = doc.lastAutoTable.finalY;
  console.log("lastAutoTable", yy);
  doc.line(0, yy, 200, yy, "S");

  autoTable(doc, {
    html: "#elemTable",
    theme: "plain",
    tableWidth: 100,
    //useCss: true,
    styles: {
      font: "freesans_normal",
    }
  });

  // @ts-ignore
  yy = doc.lastAutoTable.finalY;
  doc.line(0, yy, 200, yy, "S");
  yy += 14 * 0.352778; // Umrechnung pt in mm
  doc.text("ideelle Querschnittswerte", 10, yy);

  autoTable(doc, {
    html: "#querschnittwerte_table",
    theme: "plain",
    tableWidth: 100,
    useCss: true,
    styles: {
      font: "freesans_normal",
    },
  });

  // @ts-ignore
  yy = doc.lastAutoTable.finalY + 1.15 * (14 * 0.352778); // Umrechnung pt in mm
  doc.text("Alle Spannungen in kN/cm²", 10, yy);

  // @ts-ignore
  yy = doc.lastAutoTable.finalY + 2 * 1.15 * (14 * 0.352778); // Umrechnung pt in mm
  doc.text("Schubspannungen aus primärer Torsion", 10, yy);

  // @ts-ignore
  yy = doc.lastAutoTable.finalY + 3 * 1.15 * (14 * 0.352778); // Umrechnung pt in mm

  autoTable(doc, {
    html: "#id_table_spannung_mxp",
    startY: yy,
    theme: "plain",
    tableWidth: 100,
    useCss: true,
    styles: {
      font: "freesans_normal",
    },
  });

  // @ts-ignore
  yy = doc.lastAutoTable.finalY + 14 * 0.352778; // Umrechnung pt in mm
  doc.text("Schubspannungen aus Querkraft und sekundärer Torsion", 10, yy);

  autoTable(doc, {
    html: "#id_table_spannung_mxs",
    theme: "plain",
    tableWidth: 100,
    useCss: true,
    styles: {
      font: "freesans_normal",
    },
  });

  // @ts-ignore
  yy = doc.lastAutoTable.finalY + 14 * 0.352778; // Umrechnung pt in mm
  doc.text("Schubspannungen aus allen Anteilen", 10, yy);

  autoTable(doc, {
    html: "#id_table_schubspannung",
    theme: "plain",
    tableWidth: 150,
    useCss: true,
    styles: {
      font: "freesans_normal",
    },
  });

  // @ts-ignore
  yy = doc.lastAutoTable.finalY + 14 * 0.352778; // Umrechnung pt in mm
  doc.text("Normalspannungen aus Normalkraft, Biegemoment und Wölbbimoment", 10, yy);

  autoTable(doc, {
    html: "#id_table_normalspannung",
    theme: "plain",
    tableWidth: 100,
    useCss: true,
    styles: {
      font: "freesans_normal",
    },
  });


  // @ts-ignore
  yy = doc.lastAutoTable.finalY + 14 * 0.352778; // Umrechnung pt in mm
  doc.text("Vergleichsspannungen", 10, yy);

  autoTable(doc, {
    html: "#id_table_vergleichsspannung",
    //theme: "plain",
    tableWidth: 100,
    useCss: true,
    styles: {
      font: "freesans_normal",
      fontSize: 10,
      fillColor: '#ffffff'
    },
  });

  // @ts-ignore
  yy = doc.lastAutoTable.finalY;
  console.log("lastAutoTable", yy);
  doc.line(0, yy, 200, yy, "S");

  doc.text("lastAutoTable.finalY=" + yy, 10, yy + 14 * 0.352778);
  const fs = doc.getFontSize();
  doc.text("fontsize=" + fs, 10, yy + 2 * (14 * 0.352778));

  yy += 3 * (14 * 0.352778)
  htmlText(doc, "Trägheitsmoment I<sub>yy,s</sub> und i<sub>M</sub><sup>2</sup> und", 10, yy)

  //Get svg markup as string
  let svg = document.getElementById("my-svg").innerHTML; // dataviz_area

  infoBox.innerHTML += "<br>mypdf: " + yy;
  /*
    let nameDiv = document.createElement("div");
    //nameDiv.className = "emotionLabel";
    nameDiv.textContent = 'Hallo Welt';
    nameDiv.id = "divtest"
 */
  /*
  let nameDiv = document.getElementById("divtest") as HTMLInputElement | null;
  console.log("namediv", nameDiv);
  doc.html(nameDiv, {
    x: 10,
    y: 10,
  });
*/

  if (svg) {
    svg = svg.replace(/\r?\n|\r/g, "").trim();
    svg = svg.substring(0, svg.indexOf("</svg>")) + "</svg>";
    // @ts-ignore
    svg = svg.replaceAll("  ", "");
    console.log("svg", svg);

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    console.log("canvas", canvas.width, canvas.height);

    context.clearRect(0, 0, canvas.width, canvas.height);
    const v = Canvg.fromString(context, svg);
    // '<svg id="dataviz_area" width="1500px" height="1271px"><defs><!-- arrowhead marker definition --><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" style="fill: black"></path></marker><marker id="arrow_blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" style="fill: blue"></path></marker><marker id="arrow_darkslategrey" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" style="fill: darkslategrey"></path></marker><!-- simple dot marker definition --><marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5"></marker><marker id="arrow1" markerUnits="strokeWidth" markerWidth="12" markerHeight="12" viewBox="0 0 12 12" refX="6" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 L6,6 L2,2" style="fill: #000;"></path></marker></defs><polygon points="1102,97 397,97 397,115 1102,115 " stroke="dimgrey" fill="lightgrey"></polygon><polygon points="388,106 388,1164 406,1164 406,106 " stroke="dimgrey" fill="lightgrey"></polygon><polygon points="397,1173 1102,1173 1102,1155 397,1155 " stroke="dimgrey" fill="lightgrey"></polygon><polygon points="1111,1164 1111,106 1093,106 1093,1164 " stroke="dimgrey" fill="lightgrey"></polygon><line x1="1102" x2="985" y1="106" y2="106" stroke="darkslategrey" stroke-width="2" marker-end="url(#arrow_darkslategrey)"></line><text x="990" y="99" style="font-size: 15px; fill: darkslategrey;">ȳ</text><line x1="1102" x2="1102" y1="106" y2="223" stroke="darkslategrey" stroke-width="2" marker-end="url(#arrow_darkslategrey)"></line><text x="1107" y="217" style="font-size: 15px; fill: darkslategrey;">z̄</text><line x1="750" x2="632" y1="635" y2="635" stroke="blue" stroke-width="1.5" marker-end="url(#arrow_blue)"></line><text x="637" y="630" style="font-size: 15px; fill: blue;">y</text><line x1="750" x2="750" y1="635" y2="753" stroke="blue" stroke-width="1.5" marker-end="url(#arrow_blue)"></line><text x="755" y="748" style="font-size: 15px; fill: blue;">z</text><line x1="985" x2="514" y1="635" y2="635" stroke="black" stroke-width="2" marker-end="url(#arrow)"></line><text x="519" y="630" style="font-size: 15px;"> 1</text><line x1="750" x2="750" y1="400" y2="870" stroke="black" stroke-width="2" marker-end="url(#arrow)"></line><text x="755" y="865" style="font-size: 15px;"> 2</text><circle cx="750" cy="635" r="5" id="circleBasicTooltip" style="fill: blue;"></circle><circle cx="750" cy="635" r="5" id="circleTooltip_SM" style="fill: red;"></circle></svg>'

    //'<svg width="600" height="600"><text x="50" y="50">Hello World!</text></svg>');

    v.render();

    var imgData = canvas.toDataURL("image/png", 1);

    doc.addPage();

    // Generate PDF
    //var doc = new jsPDF('p', 'pt', 'a4');
    doc.addImage(imgData, "PNG", 0, 0, 200, 200); // * myScreen.clientHeight / myScreen.svgWidth);

    const filename = window.prompt(
      "Name der Datei mit Extension, z.B. test.pdf\nDie Datei wird im Default Download Ordner gespeichert"
    );

    try {
      doc.save(filename);
    } catch (error) {
      alert(error.message);
    }
    document.getElementById("id_pdf_info").innerText =
      "pdf-file saved with name " + "a4.pdf" + " in your Download folder";
  }
}
