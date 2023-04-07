

import * as d3 from "d3";

import { CTrans } from './trans.js';
import { truss, node, Gesamt_ys, Gesamt_zs, yM, zM, phi0 } from "./duennQ"
import { ymin, ymax, zmin, zmax, slmax } from "./duennQ";

import { myScreen } from "./index.js";
import { nnodes, nelem } from "./duennQ_tabelle.js"
import { saveAs } from 'file-saver';

export let svg = null;
let tr = null;
let label_visible = false;


//--------------------------------------------------------------------------------------------------------
export function systemlinien(clientWidth?: number, clientHeight?: number, faktor = 1.0) {
    //--------------------------------------------------------------------------------------------------------

    let i: number, j: number;
    //let slmax;
    let str = "";
    let y1: number, y2: number, z1: number, z2: number, h: number, si: number, co: number

    if (Gesamt_ys === undefined || isNaN(yM)) return;

    console.log("WIDTH HEIGHT", clientWidth, clientHeight, faktor);

    if (typeof clientWidth === 'undefined') {
        clientWidth = myScreen.svgWidth
    }

    if (typeof clientHeight === 'undefined') {
        clientHeight = myScreen.clientHeight
        const el = document.getElementById("input-container")
        let height = el.getBoundingClientRect().height
        //console.log("systemlinien", height, document.getElementById("myTopnav").getBoundingClientRect().height)
        clientHeight -= height
    }
    console.log("WIDTH HEIGHT", clientWidth, clientHeight);

    const y_s = Gesamt_ys;
    const z_s = Gesamt_zs;

    const pts_y: number[] = Array(4);
    const pts_z: number[] = Array(4);

    if (svg !== null) {
        svg = null;
        console.log("svg=", svg)
    }
    /*
        for (i = 0; i < nelem; i++) {
            y1 = node[truss[i].nod[0]].y
            z1 = node[truss[i].nod[0]].z
            y2 = node[truss[i].nod[1]].y
            z2 = node[truss[i].nod[1]].z
            h = truss[i].dicke / 2.0
            si = truss[i].sinus
            co = truss[i].cosinus

            pts_y[0] = y1 + si * h
            pts_z[0] = z1 - co * h
            pts_y[1] = y2 + si * h
            pts_z[1] = z2 - co * h
            pts_y[2] = y2 - si * h
            pts_z[2] = z2 + co * h
            pts_y[3] = y1 - si * h
            pts_z[3] = z1 + co * h
        }
    */

    console.log("MAX", slmax, ymin, ymax, zmin, zmax)

    if (tr === null) {
        tr = new CTrans(ymin, zmin, ymax, zmax, clientWidth, clientHeight)
    } else {
        tr.init(ymin, zmin, ymax, zmax, clientWidth, clientHeight);
    }

    for (let i = 0; i < nnodes; i++) {
        //str += y[i] + ',' + z[i] + ' ';
        str += Math.round(tr.yPix(node[i].y)) + ',' + Math.round(tr.zPix(node[i].z)) + ' ';
    }

    console.log("str", str)

    const sl = Math.min(ymax - ymin, zmax - zmin) / 3;

    si = Math.sin(phi0) * sl;
    co = Math.cos(phi0) * sl;
    const hauptachse1y = Math.round(tr.yPix(y_s - co));
    const hauptachse1z = Math.round(tr.zPix(z_s - si));
    const hauptachse2y = Math.round(tr.yPix(y_s + co));
    const hauptachse2z = Math.round(tr.zPix(z_s + si));

    si = Math.sin(phi0 + Math.PI / 2) * sl;
    co = Math.cos(phi0 + Math.PI / 2) * sl;
    const hauptachse3y = Math.round(tr.yPix(y_s - co));
    const hauptachse3z = Math.round(tr.zPix(z_s - si));
    const hauptachse4y = Math.round(tr.yPix(y_s + co));
    const hauptachse4z = Math.round(tr.zPix(z_s + si));


    document.getElementById("dataviz_area").setAttribute("width", clientWidth + "px");
    document.getElementById("dataviz_area").setAttribute("height", clientHeight + "px");

    svg = d3.select("#dataviz_area")

        .on("mousemove", function (event) {
            const vec = d3.pointer(event);
            const coordy = document.getElementById("cursor_coordy");
            const coordz = document.getElementById("cursor_coordz");
            //let yp = Number(vec[0]) + 10 + svgBox.getBoundingClientRect().left;
            //let zp = Number(vec[1]) - 20 + svgBox.getBoundingClientRect().top;
            const yp = event.pageX + 10;
            const zp = event.pageY - 20;
            const y = (tr.yWorld(vec[0])).toFixed(1);
            const z = (tr.zWorld(vec[1])).toFixed(1);
            //console.log("mouse move1", y );
            coordy.innerHTML = "y&#772;:" + y;
            coordz.innerHTML = "z&#772;:" + z;
            //console.log("vec", vec, vec[0], vec[1], yp, zp, event.pageX, event.pageY,"|",svgBox.getBoundingClientRect().left);
            //return tooltip.style("top", zp + "px").style("left", yp + "px");
        });


    svg.selectAll("circle").remove(); // Kreise entfernen aus früheren Berechnungen damit Tooltip funktioniert
    svg.selectAll("line").remove();
    svg.selectAll("polygon").remove();
    svg.selectAll("text").remove();
    /*
        svg.append('polygon')
            .attr('points', str)
            .attr('stroke', "dimgrey")
            .attr('fill', "lightgrey");
    */
    for (i = 0; i < nelem; i++) {

        str = ""
        for (j = 0; j < 4; j++) {
            str += Math.round(tr.yPix(truss[i].pts_y[j])) + ',' + Math.round(tr.zPix(truss[i].pts_z[j])) + ' ';
        }
        svg.append('polygon')
            .attr('points', str)
            .attr('stroke', "dimgrey")
            .attr('fill', "lightgrey");

    }


    let ys = Math.round(tr.yPix(y_s));
    let zs = Math.round(tr.zPix(z_s));
    let y_M = Math.round(tr.yPix(yM + y_s));
    let z_M = Math.round(tr.zPix(zM + z_s));

    console.log("ys,zs", ys, zs);
    console.log("sl", sl, Math.round(tr.yPix(sl / 2)));

    svg.append("line")   // Koordinatenkreuz im Ursprung, y-Richtung
        .attr("x1", Math.round(tr.yPix(0.0)))
        .attr("x2", Math.round(tr.yPix(sl / 2)))
        .attr("y1", Math.round(tr.zPix(0.0)))
        .attr("y2", Math.round(tr.zPix(0.0)))
        .attr("stroke", "darkslategrey")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow_darkslategrey)");

    svg.append("text").attr("x", Number(Math.round(tr.yPix(sl / 2))) + 5).attr("y", Number(Math.round(tr.zPix(0.0))) - 7).html("y&#772;").style("font-size", 15 * faktor).style("fill", 'darkslategrey');

    svg.append("line")   // Koordinatenkreuz im Ursprung, z-Richtung
        .attr("x1", Math.round(tr.yPix(0.0)))
        .attr("x2", Math.round(tr.yPix(0.0)))
        .attr("y1", Math.round(tr.zPix(0.0)))
        .attr("y2", Math.round(tr.zPix(sl / 2)))
        .attr("stroke", "darkslategrey")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow_darkslategrey)");

    svg.append("text").attr("x", Number(Math.round(tr.yPix(0.0))) + 5).attr("y", Number(Math.round(tr.zPix(sl / 2))) - 6).html("z&#772;").style("font-size", 15 * faktor).style("fill", 'darkslategrey');

    // y-z Koordinatensystem

    svg.append("line")
        .attr("x1", ys)
        .attr("x2", Math.round(tr.yPix(y_s + sl / 2)))
        .attr("y1", zs)
        .attr("y2", zs)
        .attr("stroke", "blue")
        .attr("stroke-width", 1.5)
        .attr("marker-end", "url(#arrow_blue)");

    svg.append("text").attr("x", Number(Math.round(tr.yPix(y_s + sl / 2))) + 5).attr("y", zs - 5).text("y").style("font-size", 15 * faktor).style("fill", 'blue');

    svg.append("line")
        .attr("x1", ys)
        .attr("x2", ys)
        .attr("y1", zs)
        .attr("y2", Math.round(tr.zPix(z_s + sl / 2)))
        .attr("stroke", "blue")
        .attr("stroke-width", 1.5)
        .attr("marker-end", "url(#arrow_blue)");

    svg.append("text").attr("x", ys + 5).attr("y", Number(Math.round(tr.zPix(z_s + sl / 2))) - 5).text("z").style("font-size", 15 * faktor).style("fill", 'blue');

    // Hauptachsenkoordinatensystem

    svg.append("line")
        .attr("x1", hauptachse1y)
        .attr("x2", hauptachse2y)
        .attr("y1", hauptachse1z)
        .attr("y2", hauptachse2z)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

    svg.append("text").attr("x", Number(hauptachse2y) + 5).attr("y", Number(hauptachse2z) - 5).text(" 1").style("font-size", 15 * faktor);

    svg.append("line")
        .attr("x1", hauptachse3y)
        .attr("x2", hauptachse4y)
        .attr("y1", hauptachse3z)
        .attr("y2", hauptachse4z)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

    svg.append("text").attr("x", Number(hauptachse4y) + 5).attr("y", Number(hauptachse4z) - 5).text(" 2").style("font-size", 15 * faktor);

    svg.append("circle")       // Schwerpunkt
        .attr("cx", ys).attr("cy", zs).attr("r", 5).style("fill", "blue")
        .attr("id", "circleBasicTooltip")

    console.log("yM", y_M, z_M, yM, zM)
    svg.append("circle")       // Schubmittelpunkt
        .attr("cx", y_M).attr("cy", z_M).attr("r", 5).style("fill", "red")
        .attr("id", "circleTooltip_SM")

    // Hauptachsen


    // create a tooltip
    const tooltip = d3.select("#my-svg")    // #my_dataviz   my-svg
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("z-index", "120")
        .style("width", 20)
        .text("Schwerpunkt");

    //console.log("--tooltip--", tooltip.text);

    d3.select("#circleBasicTooltip")
        .on("mouseover", function () {
            //console.log("in mouseover");
            d3.select(this)
                .style("fill", "orange");

            //console.log("tooltip",tooltip.value);
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event) {
            const vec = d3.pointer(event);
            const svgBox = document.getElementById("my-svg");
            //let yp = Number(vec[0]) + 10 + svgBox.getBoundingClientRect().left;
            //let zp = Number(vec[1]) - 20 + svgBox.getBoundingClientRect().top;
            const yp = ys + 10;
            const zp = zs - 25;
            //console.log("vec", vec, vec[0], vec[1], yp, zp, event.pageX, event.pageY,"|",svgBox.getBoundingClientRect().left);
            return tooltip.style("top", zp + "px").style("left", yp + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .style("fill", "blue");
            return tooltip.style("visibility", "hidden");
        });


    // create a tooltip
    const tooltip_SM = d3.select("#my-svg")    // #my_dataviz   my-svg
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("z-index", "120")
        .style("width", 20)
        .text("Schubmittelpunkt");

    //console.log("tooltip", tooltip);

    d3.select("#circleTooltip_SM")
        .on("mouseover", function () {
            //console.log("in mouseover");
            d3.select(this)
                .style("fill", "orange");

            //console.log("tooltip_SM",tooltip_SM);
            return tooltip_SM.style("visibility", "visible");
        })
        .on("mousemove", function (event) {
            const vec = d3.pointer(event);
            const svgBox = document.getElementById("my-svg");
            //let yp = Number(vec[0]) + 10 + svgBox.getBoundingClientRect().left;
            //let zp = Number(vec[1]) - 20 + svgBox.getBoundingClientRect().top;
            const yp = y_M + 10; //event.pageX + 10;
            const zp = z_M - 25; //event.pageY - 20;
            //console.log("vec", vec, vec[0], vec[1], yp, zp, event.pageX, event.pageY,"|",svgBox.getBoundingClientRect().left);
            return tooltip_SM.style("top", zp + "px").style("left", yp + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .style("fill", "red");
            return tooltip_SM.style("visibility", "hidden");
        });

    //svg.selectAll("circle").remove(); // alles entfernen aus früheren Berechnungen

    if (faktor > 1.0) {    // Ausdruck für pdf

        let nod1: number, nod2: number, ym: number, zm: number;

        for (let i = 0; i < nnodes; i++) {

            svg.append("text")
                .attr("x", tr.yPix(node[i].y) + 5)
                .attr("y", tr.zPix(node[i].z) - 10)
                .html(String(i + 1))
                .style("font-size", 15 * faktor)
                .style("fill", 'darkslategrey')
                .attr("class", "label_node");

        }

        for (let i = 0; i < nelem; i++) {
            nod1 = truss[i].nod[0];
            nod2 = truss[i].nod[1];
            ym = (node[nod1].y + node[nod2].y) / 2;
            zm = (node[nod1].z + node[nod2].z) / 2;

            svg.append("text")
                .attr("x", tr.yPix(ym) + 5)
                .attr("y", tr.zPix(zm) - 10)
                .html(String(i + 1))
                .style("font-size", 15 * faktor)
                .style("fill", 'darkblue')
                .attr("class", "label_elem");

        }
    }

}

//---------------------------------------------------------------------------------------------------
export function label_svg() {
    //-----------------------------------------------------------------------------------------------

    let nod1: number, nod2: number, ym: number, zm: number;

    //console.log("in label_svg")
    if (svg !== null) {
        //console.log("svg not null")
        /*
                svg.append("text")
                    .attr("x", 100)
                    .attr("y", 100)
                    .html("test").style("font-size", 15)
                    .style("fill", 'darkslategrey');
        */
        if (label_visible === false) {

            label_visible = true

            for (let i = 0; i < nnodes; i++) {

                svg.append("text")
                    .attr("x", tr.yPix(node[i].y) + 5)
                    .attr("y", tr.zPix(node[i].z) - 10)
                    .html(String(i + 1))
                    .style("font-size", 15)
                    .style("fill", 'darkslategrey')
                    .attr("class", "label_node");

            }

            for (let i = 0; i < nelem; i++) {
                nod1 = truss[i].nod[0];
                nod2 = truss[i].nod[1];
                ym = (node[nod1].y + node[nod2].y) / 2;
                zm = (node[nod1].z + node[nod2].z) / 2;

                svg.append("text")
                    .attr("x", tr.yPix(ym) + 5)
                    .attr("y", tr.zPix(zm) - 10)
                    .html(String(i + 1))
                    .style("font-size", 15)
                    .style("fill", 'darkblue')
                    .attr("class", "label_elem");

            }
        } else {
            label_visible = false
            svg.selectAll(".label_node").remove();
            svg.selectAll(".label_elem").remove();
        }

    }
}

//---------------------------------------------------------------------------------------------------
export async function copy_svg() {
    //-----------------------------------------------------------------------------------------------

    let svg = document.getElementById("my-svg").innerHTML;

    if (svg) {
        svg = svg.replace(/\r?\n|\r/g, "").trim();
        svg = svg.substring(0, svg.indexOf("</svg>")) + "</svg>";
        // @ts-ignore
        svg = svg.replaceAll("  ", "");

        const preface = '<?xml version="1.0" standalone="no"?>\r\n';
        const svgBlob = new Blob([preface, svg], { type: "image/svg+xml;charset=utf-8" });
        saveAs(svgBlob, "graph.svg");
    }

}