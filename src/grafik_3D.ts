// Option 1: Import the entire three.js core library.
import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from './renderers/THREE_MeshLine.js';

import { myPanel, get_scale_factor, get_scale_factor_arrows } from "./mygui.js"

import { OrbitControls } from './OrbitControls.js';

import { node, truss, Gesamt_ys, Gesamt_zs, yM, zM, phi0 } from "./duennQ"
import { nnodes, nelem } from "./duennQ_tabelle.js"
import { ymin, ymax, zmin, zmax, slmax, Mxp } from "./duennQ";
import { myScreen } from "./index.js";
import { CSS2DObject, CSS2DRenderer } from "./renderers/CSS2DRenderer.js"

import { FontLoader, Font } from "./renderers/FontLoaders.js";
import { TTFLoader } from "./renderers/TTFLoader.js";
import { TextGeometry } from './renderers/TextGeometry.js';

import { berechnung_erfolgreich } from "./globals.js";
import { current_unit_length, current_unit_stress, unit_length_factor, unit_stress_factor } from "./einstellungen"

let show_webgl_label = false;
let show_webgl_tau = false;
let show_webgl_sigma = false;
let show_webgl_sigmaV = false;   // Vergleichspannung
let show_webgl_woelb_M = false;
let show_webgl_woelb_V = false;
let showSides = true;
let showArrows = true;
let showSigmaFrame = true;
let show_LR_sides = false;



export let maxWoelb_M: number;
export let maxWoelb_V: number;
export let maxSigma: number;
export let maxTau: number;
export let maxSigmaV: number

// modul variablen

let scene = null
let camera = null as THREE.OrthographicCamera;
let controls = null as OrbitControls;
let renderer = null as THREE.WebGLRenderer;
let labelRenderer = null as CSS2DRenderer

let scaleFactor: number = 1.0;
let scaleFactorArrows: number = 1.0;
class TPunkt {
    x: number;
    y: number;
    z: number;
}


//--------------------------------------------------------------------------------------------------------
export function main_3D() {
    //--------------------------------------------------------------------------------------------------------

    console.log("main_3D")

    const container = document.getElementById("my-webgl");
    const canvas = document.getElementById('c3') as HTMLCanvasElement  //.querySelector('#c3');
    //let leng = Math.min(myScreen.svgWidth, myScreen.clientHeight)
    canvas.height = myScreen.clientHeight //leng
    canvas.width = myScreen.svgWidth   //leng

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });  // canvas,
    renderer.setSize(myScreen.svgWidth, myScreen.clientHeight);  //leng, leng);
    container.appendChild(renderer.domElement);
    //console.log("renderer.domElement", renderer.domElement)

    labelRenderer = new CSS2DRenderer();  // {element:canvas}
    labelRenderer.setSize(myScreen.svgWidth, myScreen.clientHeight); //leng, leng);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    //console.log("labelRenderer.domElement", labelRenderer.domElement)
    container.appendChild(labelRenderer.domElement);

    //console.log("canvas", canvas.clientWidth, canvas.clientHeight)
    /*
        const fov = 50;
        const aspect = 2;  // the canvas default
        const near = 0.1;
        const far = 500;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    */
    const width = 100;
    const height = 100;
    //console.log("ortho", -ymax, -ymin, -zmax, -zmin)
    //    camera = new THREE.OrthographicCamera(-ymax, -ymin, -zmin, -zmax, -2000, 2000);
    camera = new THREE.OrthographicCamera(-1000, 1000, 1000, -1000, -2000, 2000);
    camera.layers.enableAll();
    camera.position.z = 500;

    controls = new OrbitControls(camera, labelRenderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.update();

    //camera.left = -2*ymax;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd)

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);


        const light1 = new THREE.AmbientLight(0x404040); // soft white light
        scene.add(light1);
    }

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    function makeInstance(geometry, color, x: number) {
        const material = new THREE.MeshPhongMaterial({ color });

        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        cube.position.x = x;

        return cube;
    }


    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    let renderRequested = false;

    function render() {
        renderRequested = undefined;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            //camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }

    render();

    function requestRenderIfNotRequested() {
        if (!renderRequested) {
            renderRequested = true;
            requestAnimationFrame(render);
        }
    }

    function forceRender() {
        //if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(render);
        //}
    }

    myPanel();

    controls.addEventListener('change', requestRenderIfNotRequested);
    window.addEventListener('resize', requestRenderIfNotRequested);
    window.addEventListener('forceRender', forceRender);
}

//--------------------------------------------------------------------------------------------------------
function removeObject3D(object: THREE.Mesh | THREE.Line) {
    //--------------------------------------------------------------------------------------------------------

    if (!(object instanceof THREE.Object3D)) return false;
    // for better memory management and performance
    if (object.geometry) {
        object.geometry.dispose();
    }
    if (object.material) {
        if (object.material instanceof Array) {
            // for better memory management and performance
            object.material.forEach(material => material.dispose());
        } else {
            // for better memory management and performance
            object.material.dispose();
        }
    }
    if (object.parent) {
        object.parent.remove(object);
    }
    // the parent might be the scene or another Object3D, but it is sure to be removed this way
    return true;
}

//--------------------------------------------------------------------------------------------------------
export function add_element() {
    //--------------------------------------------------------------------------------------------------------

    //create a blue LineBasicMaterial
    const material_line = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 10,
        linecap: 'round', //ignored by WebGLRenderer
        linejoin: 'round' //ignored by WebGLRenderer
    });

    const points = [];
    points.push(new THREE.Vector3(-2, 0, 0));
    points.push(new THREE.Vector3(0, 2, 0));
    points.push(new THREE.Vector3(2, 0, 0));

    const geometry_line = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry_line, material_line);
    scene.add(line);


    window.dispatchEvent(new Event("resize"));

}

//--------------------------------------------------------------------------------------------------------
export function ttf_logo_3D() {
    //--------------------------------------------------------------------------------------------------------

    const loader = new TTFLoader()
    //const FONT = new FontLoader()
    //loader.load('./hobby-of-night.ttf', fnt => font = fontLoader.parse(fnt))
    //let font: FontLoader = null;

    let text: string = 'dünnQs.js';

    // FreeSans.ttf
    // NotoMono-Regular.ttf

    loader.load('./fonts/ttf/FreeSans.ttf', function (json) {

        //console.log("json", json)
        const font = new Font(json);
        //console.log("font", font)
        createText(font, text);
        //const shapes = font   //.generateShapes("Hallo", 100);

    });

    //render();
    //window.dispatchEvent(new Event("resize"));

}

//--------------------------------------------------------------------------------------------------------
function createText(font: FontLoader, text) {
    //--------------------------------------------------------------------------------------------------------

    let textMesh1, textGeo, material;

    material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

    const height = 20,
        size = 70,
        hover = 30,
        curveSegments = 4,
        bevelThickness = 2,
        bevelSize = 1.5;

    textGeo = new TextGeometry(text, {

        font: font,

        size: size,
        height: height,
        curveSegments: curveSegments,

        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: true

    });

    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();

    const centerOffset = - 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x) + 100;

    textMesh1 = new THREE.Mesh(textGeo, material);

    textMesh1.position.x = centerOffset;
    textMesh1.position.y = 2 * hover;
    textMesh1.position.z = 10;

    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;

    scene.add(textMesh1);


}

//--------------------------------------------------------------------------------------------------------
export function logo_3D() {
    //--------------------------------------------------------------------------------------------------------

    const loader = new FontLoader();

    loader.load('./fonts/helvetiker_regular.typeface.json', function (font) {

        console.log("logo_3D font", font)

        const color = 0x006699;

        const matDark = new THREE.LineBasicMaterial({
            color: color,
            side: THREE.DoubleSide
        });

        const matLite = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });

        const message = '   duennQs\nDuennwandiger Querschnitt';

        const shapes = font.generateShapes(message, 100);

        const geometry = new THREE.ShapeGeometry(shapes);

        geometry.computeBoundingBox();

        console.log("boundingBox", geometry.boundingBox);

        const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

        geometry.translate(xMid, 0, 0);

        // make shape ( N.B. edge view not visible )

        const text = new THREE.Mesh(geometry, matLite);
        text.position.z = - 250;
        scene.add(text);

        // make line shape ( N.B. edge view remains visible )

        const holeShapes = [];

        for (let i = 0; i < shapes.length; i++) {

            const shape = shapes[i];

            if (shape.holes && shape.holes.length > 0) {

                for (let j = 0; j < shape.holes.length; j++) {

                    const hole = shape.holes[j];
                    holeShapes.push(hole);

                }

            }

        }

        shapes.push.apply(shapes, holeShapes);

        const lineText = new THREE.Object3D();

        for (let i = 0; i < shapes.length; i++) {

            const shape = shapes[i];

            const points = shape.getPoints();
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            geometry.translate(xMid, 0, 0);

            const lineMesh = new THREE.Line(geometry, matDark);
            lineText.add(lineMesh);

        }

        scene.add(lineText);

        //render();
        window.dispatchEvent(new Event("resize"));

    }); //end load function



}

//--------------------------------------------------------------------------------------------------------
export function draw_elements() {
    //--------------------------------------------------------------------------------------------------------

    let i: number, j: number
    let y1: number, y2: number, x1: number, x2: number, xm: number, ym: number
    let punkteL = [] as TPunkt[]
    let punkteR = [] as TPunkt[]


    const y_s = Gesamt_ys
    const z_s = Gesamt_zs
    const y_M = yM
    const z_M = zM
    const phi = phi0

    const teilung = 40

    let wert: string;

    while (scene.children.length > 2) {  // Licht soll bleiben
        removeObject3D(scene.children[scene.children.length - 1])
    }

    //const ele = document.getElementsByClassName('emotionLabel');
    //for (let i = 0; i < ele.length; ++i) {
    //    ele
    //}

    const elemente = document.querySelectorAll('.emotionLabel');  // entferne html Texte

    elemente.forEach(el => {
        el.remove();
    });

    if (!berechnung_erfolgreich) return;

    //console.log("SCALEFACTOR", scaleFactor)

    if (scene !== null) {

        const ele = document.getElementById("footer");
        const h = ele.clientHeight;
        //console.log("h", h)

        let width = myScreen.svgWidth;
        let height = myScreen.clientHeight

        if (height > width) {
            height -= h
        } else {
            width -= h
        }

        renderer.setSize(width, height);
        labelRenderer.setSize(width, height);

        //console.log("minMax", -ymax, -ymin, -zmin, -zmax);

        let dx = Gesamt_ys;
        let dy = Gesamt_zs;

        let dxm = ymax - ymin;
        let dym = zmax - zmin
        let delta: number, y_min: number, y_max: number, z_min: number, z_max: number

        if (dxm > dym) {
            delta = (dxm - dym) / 2;
            z_min = zmin - delta;
            z_max = zmax + delta;
            y_min = ymin;
            y_max = ymax;
        } else {
            delta = (dym - dxm) / 2;
            y_min = ymin - delta;
            y_max = ymax + delta;
            z_min = zmin;
            z_max = zmax;
        }

        let rand = slmax / 10.0

        camera.left = -y_max - rand + dx;
        camera.right = -y_min + rand + dx;
        camera.top = -z_min + rand + dy;
        camera.bottom = -z_max - rand + dy;
        //console.log("camera", camera)

        if (height > width) {
            let dh = camera.top - camera.bottom
            //console.log("dh", dh, height / width)
            dh = (height / width - 1) * dh / 2;
            camera.top += dh
            camera.bottom -= dh;
        } else {
            let dh = camera.right - camera.left
            dh = (width / height - 1) * dh / 2;
            //console.log("dh neu",dh)
            camera.right += dh
            camera.left -= dh;

        }

        controls.target.set(-dx, -dy, 0);


        const el_info = document.getElementById("unit_webgl")
        if (show_webgl_tau || show_webgl_sigma || show_webgl_sigmaV) {
            el_info.innerHTML = "Spannungen in " + current_unit_stress
        } else if (show_webgl_woelb_M) {
            el_info.innerHTML = "Wölbordinate ω in " + current_unit_length + '²'
        } else if (show_webgl_woelb_V) {
            el_info.innerHTML = "Verschiebung u in " + current_unit_length
        } else {
            el_info.innerHTML = ""
        }


        //___________________________________________________________________________

        maxWoelb_M = 0.0
        for (let i = 0; i < nnodes; i++) {
            maxWoelb_M = Math.max(Math.abs(node[i].omega), maxWoelb_M)
        }

        maxWoelb_V = 0.0
        for (let i = 0; i < nelem; i++) {
            for (j = 0; j < 4; j++) {
                maxWoelb_V = Math.max(Math.abs(truss[i].u[j]), maxWoelb_V)
            }
        }

        //create a blue LineBasicMaterial
        const material_line = new THREE.LineBasicMaterial({
            color: 0x0000dd,
            linewidth: 4
        });
        const material_line_blue = new THREE.LineBasicMaterial({
            color: 0x0000dd,
            linewidth: 4
        });
        const material_line_green = new THREE.LineBasicMaterial({
            color: 0x00aa55,
            linewidth: 4
        });

        maxSigma = 0.0
        maxSigmaV = 0.0
        for (let i = 0; i < nelem; i++) {
            maxSigma = Math.max(Math.abs(truss[i].sigma_x[0]), Math.abs(truss[i].sigma_x[2]), maxSigma)
            maxSigmaV = Math.max(Math.abs(truss[i].sigma_v[0]), Math.abs(truss[i].sigma_v[1]), Math.abs(truss[i].sigma_v[2]), maxSigmaV)
        }

        console.log("maxSigmaV", maxSigmaV)

        let tau_L: number, tau_R: number, depthBeam: number
        maxTau = 0.0

        for (i = 0; i < nelem; i++) {
            for (j = 0; j < 3; j++) {
                tau_R = truss[i].tau_p0R[j] + truss[i].tau_p1[j] + truss[i].tau_s[j]
                tau_L = truss[i].tau_p0L[j] + truss[i].tau_p1[j] + truss[i].tau_s[j]
                if (Math.abs(tau_R) > maxTau) maxTau = Math.abs(tau_R)
                if (Math.abs(tau_L) > maxTau) maxTau = Math.abs(tau_L)
            }
        }

        if (show_webgl_sigma || show_webgl_tau || show_webgl_woelb_M || show_webgl_woelb_V || show_webgl_sigmaV) {
            if (maxTau > 1e-12 || maxSigma > 1e-12 || maxWoelb_M > 1e-12) {
                depthBeam = slmax / 1500;
            } else {
                depthBeam = slmax / 30;    // war 5
            }
        } else {
            depthBeam = slmax / 30;
        }

        for (i = 0; i < teilung + 1; i++) {
            punkteL.push(new TPunkt())
            punkteR.push(new TPunkt())
        }

        // ┏━━━━━━━━━━━━━━━━━━━━━━━┓
        // ┃Querschnitt darstellen ┃
        // ┗━━━━━━━━━━━━━━━━━━━━━━━┛

        let nod1: number, nod2: number

        for (let i = 0; i < nelem; i++) {


            nod1 = truss[i].nod[0];
            nod2 = truss[i].nod[1];

            x1 = -node[nod1].y
            y1 = -node[nod1].z
            x2 = -node[nod2].y
            y2 = -node[nod2].z
            xm = (x1 + x2) / 2
            ym = (y1 + y2) / 2


            const elemShape = new THREE.Shape();
            elemShape.moveTo(-truss[i].pts_y[0], -truss[i].pts_z[0]);
            elemShape.lineTo(-truss[i].pts_y[1], -truss[i].pts_z[1]);
            elemShape.lineTo(-truss[i].pts_y[2], -truss[i].pts_z[2]);
            elemShape.lineTo(-truss[i].pts_y[3], -truss[i].pts_z[3]);
            elemShape.lineTo(-truss[i].pts_y[0], -truss[i].pts_z[0]);


            const extrudeSettings = {
                depth: depthBeam,
                bevelEnabled: true,
                bevelSegments: 3,
                steps: 1,
                bevelSize: 0.1,
                bevelThickness: 0.1
            };

            const geometry = new THREE.ExtrudeGeometry(elemShape, extrudeSettings);

            const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                color: 0x555566,
                opacity: 0.8,
                transparent: true,
            }));

            mesh.position.set(0, 0, -depthBeam);

            scene.add(mesh);

            if (show_webgl_label && !show_webgl_tau && !show_webgl_sigma && !show_webgl_sigmaV && !show_webgl_woelb_V && !show_webgl_woelb_M) {
                let nameDiv = document.createElement("div");
                nameDiv.className = "emotionLabel";
                nameDiv.textContent = String(i + 1);
                nameDiv.id = "elNo" + i
                //console.log("nameDiv", nameDiv)
                nameDiv.style.backgroundColor = '#f0fff0'
                nameDiv.style.color = '#000000'
                nameDiv.style.borderRadius = '5px'
                nameDiv.style.padding = '3px'
                let xLabel = new CSS2DObject(nameDiv);
                xLabel.position.set(xm, ym, depthBeam / 2);
                xLabel.layers.set(1)
                //console.log("xLabel", xLabel)
                mesh.add(xLabel);
                xLabel.layers.set(1);

                // Knotennummern darstellen

                nameDiv = document.createElement("div");
                nameDiv.className = "emotionLabel";
                nameDiv.textContent = String(nod1 + 1);
                //nameDiv.id = "knlNo" + i
                nameDiv.style.backgroundColor = '#f0fff0'
                nameDiv.style.color = 'blue'
                nameDiv.style.borderColor = 'blue'
                nameDiv.style.padding = '3px'
                xLabel = new CSS2DObject(nameDiv);
                xLabel.position.set(x1, y1, depthBeam / 2);
                xLabel.layers.set(1)
                mesh.add(xLabel);
                xLabel.layers.set(1);

                nameDiv = document.createElement("div");
                nameDiv.className = "emotionLabel";
                nameDiv.textContent = String(nod2 + 1);
                //nameDiv.id = "elNo" + i
                nameDiv.style.backgroundColor = '#f0fff0'
                nameDiv.style.color = 'blue'
                nameDiv.style.borderColor = 'blue'
                nameDiv.style.padding = '3px'
                xLabel = new CSS2DObject(nameDiv);
                xLabel.position.set(x2, y2, depthBeam / 2);
                xLabel.layers.set(1)
                mesh.add(xLabel);
                xLabel.layers.set(1);

            }


            //---------------------------------------------------------------------------------------------------
            // Darstellung Links Rechts, Anfangsknoten
            //---------------------------------------------------------------------------------------------------

            if (show_LR_sides) {

                zeichneLR_pfeile(i, mesh)
            }

        }



        if (maxWoelb_V > 0.0000000000001 && show_webgl_woelb_V) {

            const N = Array(4);
            let sl: number, sl2: number, sl3: number
            let x: number, x_2: number, x_3: number, u: number, x0: number, y0: number
            const maxU = {
                u: 0.0,
                wert: 0.0,
                x: 0.0,
                y: 0.0
            };

            let Ueberhoehung = 0.1 * slmax / maxWoelb_V * scaleFactor
            /*
                        const material = new THREE.LineBasicMaterial({
                            color: 0x5555ff,
                            linewidth: 2
                        });
            */
            const material = new MeshLineMaterial({
                color: 0x0000dd,
                lineWidth: slmax / 100,
                sizeAttenuation: 1,
            });

            for (let i = 0; i < nelem; i++) {
                //console.log("elem i=", i)
                x1 = -node[truss[i].nod[0]].y
                y1 = -node[truss[i].nod[0]].z
                x2 = -node[truss[i].nod[1]].y
                y2 = -node[truss[i].nod[1]].z
                xm = (x1 + x2) / 2
                ym = (y1 + y2) / 2

                sl = truss[i].sl;
                sl2 = sl * sl;
                sl3 = sl2 * sl;

                dx = sl / teilung;
                const points = [];
                maxU.u = 0.0;

                for (let istelle = 0; istelle <= teilung; istelle++) {

                    x = istelle * dx;
                    x_2 = x * x;
                    x_3 = x_2 * x;

                    N[0] = -(9 * x_3 - 18 * sl * x_2 + 11 * sl2 * x - 2 * sl3) / (2 * sl3)
                    N[1] = (9 * x_3 - 9 * sl * x_2 + 2 * sl2 * x) / (2 * sl3)
                    N[2] = (27 * x_3 - 45 * sl * x_2 + 18 * sl2 * x) / (2 * sl3)
                    N[3] = -(27 * x_3 - 36 * sl * x_2 + 9 * sl2 * x) / (2 * sl3)

                    u = N[0] * truss[i].u[0] + N[1] * truss[i].u[1] + N[2] * truss[i].u[2] + N[3] * truss[i].u[3];

                    x0 = x * (x2 - x1) / sl + x1
                    y0 = x * (y2 - y1) / sl + y1
                    //points.push(new THREE.Vector3(x0, y0, u * Ueberhoehung));
                    points.push(x0, y0, u * Ueberhoehung);

                    if (Math.abs(u) > maxU.u) {
                        maxU.u = Math.abs(u)
                        maxU.wert = u
                        maxU.x = x0
                        maxU.y = y0
                    }
                }
                /*
                                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                
                                const line = new THREE.Line(geometry, material);
                                scene.add(line);
                */

                const lines = new MeshLine();
                lines.setPoints(points);

                const meshL = new THREE.Mesh(lines, material);
                scene.add(meshL);

                if (show_webgl_label) {
                    let nameDiv = document.createElement("div");
                    nameDiv.className = "emotionLabel";
                    wert = (maxU.u * unit_length_factor).toPrecision(3);
                    nameDiv.textContent = wert
                    nameDiv.id = "elNo" + i
                    nameDiv.style.backgroundColor = '#ffffff'
                    //console.log("nameDiv", nameDiv)
                    const xLabel = new CSS2DObject(nameDiv);
                    xLabel.position.set(maxU.x, maxU.y, maxU.wert * Ueberhoehung);
                    xLabel.layers.set(1)
                    //console.log("xLabel", xLabel)
                    scene.add(xLabel);
                }
            }

        }

        if (maxWoelb_M > 0.0000000000001 && show_webgl_woelb_M) {

            let Ueberhoehung = 0.1 * slmax / maxWoelb_M * scaleFactor
            /*
                        const material = new THREE.LineBasicMaterial({
                            color: 0x00dd00,
                            linewidth: 2
                        });
                        */
            /*
                        const points = [];
                        
                        for (let j = 0; j < 5*Math.PI; j += (2 * Math.PI) / 100) {
                          points.push(j, Math.sin(j), 0);
                        }
            
            const materialL = new MeshLineMaterial({
                color: 0x0000dd,
                //lineWidth: truss[0].dicke,
                sizeAttenuation: 1,
                //dashArray: 0.01,
                //dashRatio: 0.2
            });
            materialL.transparent = true;
*/

            for (let i = 0; i < nelem; i++) {
                //console.log("elem i=", i)
                x1 = -node[truss[i].nod[0]].y
                y1 = -node[truss[i].nod[0]].z
                x2 = -node[truss[i].nod[1]].y
                y2 = -node[truss[i].nod[1]].z
                xm = (x1 + x2) / 2
                ym = (y1 + y2) / 2

                const points = [];
                points.push(x1, y1, node[truss[i].nod[0]].omega * Ueberhoehung);
                points.push(x2, y2, node[truss[i].nod[1]].omega * Ueberhoehung);
                //points.push(new THREE.Vector3(x1, y1, node[truss[i].nod[0]].omega * Ueberhoehung));
                //points.push(new THREE.Vector3(x2, y2, node[truss[i].nod[1]].omega * Ueberhoehung));

                //const geometry = new THREE.BufferGeometry().setFromPoints(points);

                //const line = new THREE.Line(geometry, material);
                //scene.add(line);

                const lines = new MeshLine();
                lines.setPoints(points);

                const materialL = new MeshLineMaterial({
                    color: 0x0000dd,
                    lineWidth: truss[i].dicke,
                    sizeAttenuation: 1,
                });


                const meshL = new THREE.Mesh(lines, materialL);
                scene.add(meshL);

            }

            for (i = 0; i < nnodes; i++) {

                if (show_webgl_label) {
                    let nameDiv = document.createElement("div");
                    nameDiv.className = "emotionLabel";
                    wert = (node[i].omega * unit_length_factor * unit_length_factor).toPrecision(3);
                    nameDiv.textContent = wert
                    nameDiv.id = "omega" + i
                    nameDiv.style.backgroundColor = '#ffffff'
                    //console.log("nameDiv", nameDiv)
                    const xLabel = new CSS2DObject(nameDiv);
                    xLabel.position.set(-node[i].y, -node[i].z, node[i].omega * Ueberhoehung);
                    xLabel.layers.set(1)
                    //console.log("xLabel", xLabel)
                    scene.add(xLabel);
                }
            }

        }

        console.log("maxSigma, maxWoelb", maxSigma, maxWoelb_M, maxWoelb_V)

        //---------------------------------------------------------------------------------------------------
        if (maxSigma > 0.0000000000001 && show_webgl_sigma) {
            //---------------------------------------------------------------------------------------------------

            let Ueberhoehung = 0.2 * slmax / maxSigma * scaleFactor    // Skalieren
            console.log("Normalspannung", maxSigma, Ueberhoehung)

            let j = 0, sigma1: number, sigma2: number
            let farbe: any;
            let origin, dir;
            let length: number;
            let hex: number;
            /*
                        const material1 = new THREE.MeshBasicMaterial({
                            color: 'darkgrey',
                            opacity: 0.5,
                            transparent: true,
                            side: THREE.DoubleSide
                        })
            */

            for (let i = 0; i < nelem; i++) {

                nod1 = truss[i].nod[0];
                nod2 = truss[i].nod[1];
                x1 = -node[nod1].y
                y1 = -node[nod1].z
                x2 = -node[nod2].y
                y2 = -node[nod2].z
                sigma1 = truss[i].sigma_x[0]
                sigma2 = truss[i].sigma_x[2]

                if (sigma1 * sigma2 >= 0) {

                    const vertices = new Float32Array(3 * 6);

                    j = 0
                    vertices[0 + j] = x1;
                    vertices[1 + j] = y1;
                    vertices[2 + j] = 0.0;
                    j += 3
                    vertices[0 + j] = x2;
                    vertices[1 + j] = y2;
                    vertices[2 + j] = 0.0;
                    j += 3
                    vertices[0 + j] = x2;
                    vertices[1 + j] = y2;
                    vertices[2 + j] = sigma2 * Ueberhoehung;

                    j += 3
                    vertices[0 + j] = x2;
                    vertices[1 + j] = y2;
                    vertices[2 + j] = sigma2 * Ueberhoehung;
                    j += 3
                    vertices[0 + j] = x1;
                    vertices[1 + j] = y1;
                    vertices[2 + j] = sigma1 * Ueberhoehung;
                    j += 3
                    vertices[0 + j] = x1;
                    vertices[1 + j] = y1;
                    vertices[2 + j] = 0.0;

                    const geometry1 = new THREE.BufferGeometry();

                    if (sigma1 > 0 || sigma2 > 0) {
                        farbe = 0x0000dd;
                    } else {
                        farbe = 0xdd0000;
                    }

                    const material1 = new THREE.MeshBasicMaterial({
                        color: farbe,
                        opacity: 0.5,
                        transparent: true,
                        side: THREE.DoubleSide
                    })

                    geometry1.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); // itemSize = 3 because there are 3 values (components) per vertex
                    const mesh1 = new THREE.Mesh(geometry1, material1);
                    scene.add(mesh1);


                    const material = new THREE.LineBasicMaterial({
                        color: farbe,
                        linewidth: 2
                    });

                    const points = [];
                    points.push(new THREE.Vector3(x1, y1, sigma1 * Ueberhoehung));
                    points.push(new THREE.Vector3(x2, y2, sigma2 * Ueberhoehung));

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    const line = new THREE.Line(geometry, material);
                    scene.add(line);

                    origin = new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, 0);
                    length = Math.abs((sigma1 + sigma2) / 2 * Ueberhoehung);

                    if (sigma1 > 0 || sigma2 > 0) {
                        dir = new THREE.Vector3(0, 0, 1);
                        hex = 0x0000dd;
                    } else {
                        dir = new THREE.Vector3(0, 0, -1);
                        hex = 0xdd0000;
                    }

                    let arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
                    // @ts-ignore
                    arrowHelper.line.material.linewidth = 3;
                    scene.add(arrowHelper);

                } else {
                    const dx0 = -sigma1 * truss[i].sl / (sigma2 - sigma1)
                    const x0 = dx0 * (x2 - x1) / truss[i].sl + x1
                    const y0 = dx0 * (y2 - y1) / truss[i].sl + y1
                    {
                        const vertices = new Float32Array(3 * 4);

                        j = 0
                        vertices[0 + j] = x1;
                        vertices[1 + j] = y1;
                        vertices[2 + j] = 0.0;
                        j += 3
                        vertices[0 + j] = x0;
                        vertices[1 + j] = y0;
                        vertices[2 + j] = 0.0;
                        j += 3
                        vertices[0 + j] = x1;
                        vertices[1 + j] = y1;
                        vertices[2 + j] = sigma1 * Ueberhoehung;

                        j += 3
                        vertices[0 + j] = x1;
                        vertices[1 + j] = y1;
                        vertices[2 + j] = 0.0;

                        const geometry1 = new THREE.BufferGeometry();

                        if (sigma1 > 0) {
                            farbe = 0x0000dd;
                        } else {
                            farbe = 0xdd0000;
                        }

                        const material1 = new THREE.MeshBasicMaterial({
                            color: farbe,
                            opacity: 0.5,
                            transparent: true,
                            side: THREE.DoubleSide
                        })

                        geometry1.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); // itemSize = 3 because there are 3 values (components) per vertex
                        const mesh1 = new THREE.Mesh(geometry1, material1);
                        scene.add(mesh1);
                        const material = new THREE.LineBasicMaterial({
                            color: farbe,
                            linewidth: 2
                        });

                        const points = [];
                        points.push(new THREE.Vector3(x1, y1, sigma1 * Ueberhoehung));
                        points.push(new THREE.Vector3(x0, y0, 0.0));

                        const geometry = new THREE.BufferGeometry().setFromPoints(points);

                        const line = new THREE.Line(geometry, material);
                        scene.add(line);
                    }
                    {
                        const vertices = new Float32Array(3 * 4);

                        j = 0
                        vertices[0 + j] = x0;
                        vertices[1 + j] = y0;
                        vertices[2 + j] = 0.0;
                        j += 3
                        vertices[0 + j] = x2;
                        vertices[1 + j] = y2;
                        vertices[2 + j] = 0.0;
                        j += 3
                        vertices[0 + j] = x2;
                        vertices[1 + j] = y2;
                        vertices[2 + j] = sigma2 * Ueberhoehung;

                        j += 3
                        vertices[0 + j] = x0;
                        vertices[1 + j] = y0;
                        vertices[2 + j] = 0.0;

                        const geometry1 = new THREE.BufferGeometry();

                        if (sigma2 > 0) {
                            farbe = 0x0000dd;
                        } else {
                            farbe = 0xdd0000;
                        }

                        const material1 = new THREE.MeshBasicMaterial({
                            color: farbe,
                            opacity: 0.5,
                            transparent: true,
                            side: THREE.DoubleSide
                        })

                        geometry1.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); // itemSize = 3 because there are 3 values (components) per vertex
                        const mesh1 = new THREE.Mesh(geometry1, material1);
                        scene.add(mesh1);

                        const material = new THREE.LineBasicMaterial({
                            color: farbe,
                            linewidth: 2
                        });

                        const points = [];
                        points.push(new THREE.Vector3(x0, y0, 0.0));
                        points.push(new THREE.Vector3(x2, y2, sigma2 * Ueberhoehung));

                        const geometry = new THREE.BufferGeometry().setFromPoints(points);

                        const line = new THREE.Line(geometry, material);
                        scene.add(line);
                    }

                }

                //normalize the direction vector (convert to vector of length 1)
                //dir.normalize();

                origin = new THREE.Vector3(x1, y1, 0);
                length = Math.abs(sigma1 * Ueberhoehung);

                if (sigma1 >= 0) {
                    dir = new THREE.Vector3(0, 0, 1);
                    hex = 0x0000dd;
                } else {
                    dir = new THREE.Vector3(0, 0, -1);
                    hex = 0xdd0000;
                }

                let arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
                // @ts-ignore
                arrowHelper.line.material.linewidth = 3;
                //arrowHelper.line.material = new THREE.LineBasicMaterial({
                //    color: 0x00ff00,
                //    linewidth: 5
                //});

                scene.add(arrowHelper);


                origin = new THREE.Vector3(x2, y2, 0);
                length = Math.abs(sigma2 * Ueberhoehung);

                if (sigma2 >= 0) {
                    dir = new THREE.Vector3(0, 0, 1);
                    hex = 0x0000dd;
                } else {
                    dir = new THREE.Vector3(0, 0, -1);
                    hex = 0xdd0000;
                }

                arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
                // @ts-ignore
                arrowHelper.line.material.linewidth = 3;

                scene.add(arrowHelper);

                if (showSigmaFrame) {
                    const material = new THREE.LineBasicMaterial({
                        color: 0x666666
                    });

                    const points = [];
                    points.push(new THREE.Vector3(-truss[i].pts_y[0], -truss[i].pts_z[0], 0.0));
                    points.push(new THREE.Vector3(-truss[i].pts_y[0], -truss[i].pts_z[0], truss[i].sigma_xe[0] * Ueberhoehung));
                    points.push(new THREE.Vector3(-truss[i].pts_y[1], -truss[i].pts_z[1], truss[i].sigma_xe[1] * Ueberhoehung));
                    points.push(new THREE.Vector3(-truss[i].pts_y[2], -truss[i].pts_z[2], truss[i].sigma_xe[2] * Ueberhoehung));
                    points.push(new THREE.Vector3(-truss[i].pts_y[3], -truss[i].pts_z[3], truss[i].sigma_xe[3] * Ueberhoehung));
                    points.push(new THREE.Vector3(-truss[i].pts_y[0], -truss[i].pts_z[0], truss[i].sigma_xe[0] * Ueberhoehung));

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    const line = new THREE.Line(geometry, material);
                    scene.add(line);

                    const points1 = [];
                    points1.push(new THREE.Vector3(-truss[i].pts_y[1], -truss[i].pts_z[1], 0.0));
                    points1.push(new THREE.Vector3(-truss[i].pts_y[1], -truss[i].pts_z[1], truss[i].sigma_xe[1] * Ueberhoehung));
                    points1.push(new THREE.Vector3(-truss[i].pts_y[2], -truss[i].pts_z[2], 0.0));
                    points1.push(new THREE.Vector3(-truss[i].pts_y[2], -truss[i].pts_z[2], truss[i].sigma_xe[2] * Ueberhoehung));
                    points1.push(new THREE.Vector3(-truss[i].pts_y[3], -truss[i].pts_z[3], 0.0));
                    points1.push(new THREE.Vector3(-truss[i].pts_y[3], -truss[i].pts_z[3], truss[i].sigma_xe[3] * Ueberhoehung));
                    const geometry1 = new THREE.BufferGeometry().setFromPoints(points1);

                    const line1 = new THREE.LineSegments(geometry1, material);
                    scene.add(line1);

                    if (show_webgl_label) {
                        for (j = 0; j < 4; j++) {
                            let nameDiv = document.createElement("div");
                            nameDiv.className = "emotionLabel";
                            wert = (truss[i].sigma_xe[j] * unit_stress_factor).toFixed(3);
                            nameDiv.textContent = wert;
                            nameDiv.id = "sig4" + j
                            nameDiv.style.backgroundColor = '#ffffff'
                            let xLabel = new CSS2DObject(nameDiv);
                            xLabel.position.set(-truss[i].pts_y[j], -truss[i].pts_z[j], truss[i].sigma_xe[j] * Ueberhoehung);
                            xLabel.layers.set(1)
                            scene.add(xLabel);
                        }
                    }

                }

                else if (show_webgl_label) {

                    let nameDiv = document.createElement("div");
                    nameDiv.className = "emotionLabel";
                    wert = (sigma1 * unit_stress_factor).toFixed(3);
                    nameDiv.textContent = wert;
                    nameDiv.id = "sig1"
                    nameDiv.style.backgroundColor = '#ffffff'
                    let xLabel = new CSS2DObject(nameDiv);
                    xLabel.position.set(x1, y1, sigma1 * Ueberhoehung);
                    xLabel.layers.set(1)
                    scene.add(xLabel);

                    nameDiv = document.createElement("div");
                    nameDiv.className = "emotionLabel";
                    wert = (sigma2 * unit_stress_factor).toFixed(3);
                    nameDiv.textContent = wert;
                    nameDiv.id = "sig2"
                    nameDiv.style.backgroundColor = '#ffffff'
                    xLabel = new CSS2DObject(nameDiv);
                    xLabel.position.set(x2, y2, sigma2 * Ueberhoehung);
                    xLabel.layers.set(1)
                    scene.add(xLabel);

                }

            }


        }

        //-------------------------------------------------------------------
        // Schubspannungen
        //-------------------------------------------------------------------

        if (maxTau > 0.0 && show_webgl_tau) {

            //let tau = Array(3)

            let xi: number, tau_i: number, sl: number
            const maxtau = {
                tau: 0.0,
                wert: 0.0,
                x: 0.0,
                y: 0.0
            };

            const n = (teilung + 1) * 2
            //const stress_poly = Array.from(Array(teilung + 4), () => new Array(2).fill(0.0));
            //const stress_area = Array.from(Array(n + 1), () => new Array(2).fill(0.0));



            let Ueberhoehung = 0.2 * slmax / maxTau * scaleFactor
            console.log("maxTau", maxTau, Ueberhoehung)

            let dx: number, x0: number, y0: number

            for (i = 0; i < nelem; i++) {
                sl = truss[i].sl
                dx = sl / teilung
                x1 = node[truss[i].nod[0]].y
                y1 = node[truss[i].nod[0]].z
                x2 = node[truss[i].nod[1]].y
                y2 = node[truss[i].nod[1]].z

                maxtau.tau = 0.0;

                //for (j = 0; j < 3; j++) {
                //    tau[j] = truss[i].stress_R[j];  // truss[i].tau_p1[j] + truss[i].tau_s[j]
                //}
                const polyShapeR = new THREE.Shape()
                const polyShapeL = new THREE.Shape()

                polyShapeR.moveTo(0.0, 0.0)
                for (let istelle = 0; istelle <= teilung; istelle++) {
                    xi = istelle * dx
                    x0 = xi * (x2 - x1) / truss[i].sl
                    y0 = xi * (y2 - y1) / truss[i].sl

                    tau_i = (sl ** 2 - 3 * sl * xi + 2 * xi ** 2) * truss[i].stress_R[0]
                        + 4 * xi * (sl - xi) * truss[i].stress_R[1]
                    tau_i = (tau_i + xi * (2 * xi - sl) * truss[i].stress_R[2]) / sl / sl * Ueberhoehung

                    polyShapeR.lineTo(-xi, tau_i)

                    punkteR[istelle].x = -x0 - truss[i].pts_y[0]
                    punkteR[istelle].y = -y0 - truss[i].pts_z[0]
                    punkteR[istelle].z = tau_i

                    if (Math.abs(tau_i) > maxtau.tau) {
                        maxtau.tau = Math.abs(tau_i)
                        maxtau.wert = tau_i
                        maxtau.x = punkteR[istelle].x
                        maxtau.y = punkteR[istelle].y
                    }

                    tau_i = (sl ** 2 - 3 * sl * xi + 2 * xi ** 2) * truss[i].stress_L[0]
                        + 4 * xi * (sl - xi) * truss[i].stress_L[1]
                    tau_i = (tau_i + xi * (2 * xi - sl) * truss[i].stress_L[2]) / sl / sl * Ueberhoehung

                    polyShapeL.lineTo(-xi, tau_i)

                    punkteL[istelle].x = -x0 - truss[i].pts_y[3]
                    punkteL[istelle].y = -y0 - truss[i].pts_z[3]
                    punkteL[istelle].z = tau_i

                    if (Math.abs(tau_i) > maxtau.tau) {
                        maxtau.tau = Math.abs(tau_i)
                        maxtau.wert = tau_i
                        maxtau.x = punkteL[istelle].x
                        maxtau.y = punkteL[istelle].y
                    }
                }

                polyShapeR.lineTo(-sl, 0.0)
                polyShapeR.lineTo(0.0, 0.0)
                polyShapeL.lineTo(-sl, 0.0)
                polyShapeL.lineTo(0.0, 0.0)

                const geometry_polyR = new THREE.ShapeGeometry(polyShapeR);
                const flaecheR = new THREE.Mesh(geometry_polyR, new THREE.MeshBasicMaterial({
                    color: 'rgb(0, 150, 150)',
                    opacity: 0.05,
                    transparent: true,
                    side: THREE.DoubleSide
                }))

                flaecheR.translateX(-truss[i].pts_y[0])
                flaecheR.translateY(-truss[i].pts_z[0])
                flaecheR.rotateZ(truss[i].alpha)
                flaecheR.rotateX(1.570795)

                // scene.add(flaecheR)


                const geometry_polyL = new THREE.ShapeGeometry(polyShapeL);
                const flaecheL = new THREE.Mesh(geometry_polyL, new THREE.MeshBasicMaterial({
                    color: 'rgb(0, 150, 150)',
                    opacity: 0.05,
                    transparent: true,
                    side: THREE.DoubleSide
                }))

                flaecheL.translateX(-truss[i].pts_y[3])
                flaecheL.translateY(-truss[i].pts_z[3])
                flaecheL.rotateZ(truss[i].alpha)
                flaecheL.rotateX(1.570795)

                // scene.add(flaecheL)



                // jetzt die Spannungsfläche 

                const positions = [];
                const posL = [];
                const posR = [];
                const geometry = new THREE.BufferGeometry();
                const geometrySideL = new THREE.BufferGeometry();
                const geometrySideR = new THREE.BufferGeometry();


                for (let istelle = 0; istelle < teilung; istelle++) {
                    //console.log("L", istelle, punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z)
                    //console.log("R", istelle, punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z)

                    positions.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);
                    positions.push(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z);
                    positions.push(punkteR[istelle + 1].x, punkteR[istelle + 1].y, punkteR[istelle + 1].z);

                    positions.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);
                    positions.push(punkteR[istelle + 1].x, punkteR[istelle + 1].y, punkteR[istelle + 1].z);
                    positions.push(punkteL[istelle + 1].x, punkteL[istelle + 1].y, punkteL[istelle + 1].z);
                }

                for (let istelle = 1; istelle <= teilung; istelle++) {
                    if (punkteR[istelle].z * punkteR[istelle - 1].z > 0) {
                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, 0.0);
                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, punkteR[istelle - 1].z);
                        posR.push(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z);

                        posR.push(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z);
                        posR.push(punkteR[istelle].x, punkteR[istelle].y, 0.0);
                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, 0.0);
                    } else {
                        const sigma1 = punkteR[istelle - 1].z;
                        const sigma2 = punkteR[istelle].z
                        const dx0 = sigma1 * dx / (sigma2 - sigma1)
                        const x0 = dx0 * (x2 - x1) / truss[i].sl + punkteR[istelle - 1].x
                        const y0 = dx0 * (y2 - y1) / truss[i].sl + punkteR[istelle - 1].y

                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, 0.0);
                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, punkteR[istelle - 1].z);
                        posR.push(x0, y0, 0.0);

                        posR.push(x0, y0, 0.0);
                        posR.push(punkteR[istelle].x, punkteR[istelle].y, 0.0);
                        posR.push(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z);
                    }

                    if (punkteL[istelle].z * punkteL[istelle - 1].z > 0) {
                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, 0.0);
                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, punkteL[istelle - 1].z);
                        posL.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);

                        posL.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);
                        posL.push(punkteL[istelle].x, punkteL[istelle].y, 0.0);
                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, 0.0);
                    } else {
                        const sigma1 = punkteL[istelle - 1].z;
                        const sigma2 = punkteL[istelle].z
                        const dx0 = sigma1 * dx / (sigma2 - sigma1)
                        const x0 = dx0 * (x2 - x1) / truss[i].sl + punkteL[istelle - 1].x
                        const y0 = dx0 * (y2 - y1) / truss[i].sl + punkteL[istelle - 1].y

                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, 0.0);
                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, punkteL[istelle - 1].z);
                        posL.push(x0, y0, 0.0);

                        posL.push(x0, y0, 0.0);
                        posL.push(punkteL[istelle].x, punkteL[istelle].y, 0.0);
                        posL.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);
                    }
                }

                if (showSides) {

                    geometrySideR.setAttribute('position', new THREE.Float32BufferAttribute(posR, 3));
                    const materialSide = new THREE.MeshBasicMaterial({
                        color: 'rgb(0, 150, 150)',
                        transparent: true,
                        opacity: 0.1,
                        side: THREE.DoubleSide
                    });
                    const meshSideR = new THREE.Mesh(geometrySideR, materialSide);
                    scene.add(meshSideR)

                    geometrySideL.setAttribute('position', new THREE.Float32BufferAttribute(posL, 3));

                    const meshSideL = new THREE.Mesh(geometrySideL, materialSide);
                    scene.add(meshSideL)
                }

                // itemSize = 3 because there are 3 values (components) per vertex

                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                const material = new THREE.MeshBasicMaterial({
                    color: 'rgb(0, 150, 150)',
                    opacity: 0.7,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh)

                // Linien drumherum, erst links, dann rechts


                const material1 = new THREE.LineBasicMaterial({
                    color: 'rgb(56, 93, 138)',
                    linewidth: 2
                });


                const pointsR = [];
                pointsR.push(new THREE.Vector3(- truss[i].pts_y[0], - truss[i].pts_z[0], 0.0));
                for (let istelle = 0; istelle <= teilung; istelle++) {
                    pointsR.push(new THREE.Vector3(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z));
                }
                pointsR.push(new THREE.Vector3(- truss[i].pts_y[1], - truss[i].pts_z[1], 0.0));

                const geometry1 = new THREE.BufferGeometry().setFromPoints(pointsR);

                const lineR = new THREE.Line(geometry1, material1);
                scene.add(lineR);

                const pointsL = [];
                pointsL.push(new THREE.Vector3(- truss[i].pts_y[3], - truss[i].pts_z[3], 0.0));
                for (let istelle = 0; istelle <= teilung; istelle++) {
                    pointsL.push(new THREE.Vector3(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z));
                }
                pointsL.push(new THREE.Vector3(- truss[i].pts_y[2], - truss[i].pts_z[2], 0.0));

                const geometryL = new THREE.BufferGeometry().setFromPoints(pointsL);

                const lineL = new THREE.Line(geometryL, material1);
                scene.add(lineL);

                if (show_webgl_label) {
                    let nameDiv: HTMLDivElement, xLabel: any

                    let zahl = punkteR[0].z / Ueberhoehung * unit_stress_factor
                    if (Math.abs(zahl) > 1.e-10) {
                        nameDiv = document.createElement("div");
                        nameDiv.className = "emotionLabel";
                        wert = (zahl).toFixed(3);
                        nameDiv.textContent = wert;
                        nameDiv.id = "elNoTauR1" + i
                        nameDiv.style.backgroundColor = '#ffffff'
                        xLabel = new CSS2DObject(nameDiv);
                        xLabel.position.set(punkteR[0].x, punkteR[0].y, punkteR[0].z);
                        xLabel.layers.set(1)
                        mesh.add(xLabel);
                    }
                    if (Math.abs(punkteL[0].z - punkteR[0].z) > 1.e-10) {
                        zahl = punkteL[0].z / Ueberhoehung * unit_stress_factor
                        if (Mxp !== 0.0 && (Math.abs(zahl) > 1.e-10)) {
                            nameDiv = document.createElement("div");
                            nameDiv.className = "emotionLabel";
                            wert = (zahl).toFixed(3);
                            nameDiv.textContent = wert;
                            nameDiv.id = "elNoTauL1" + i
                            nameDiv.style.backgroundColor = '#ffffff'
                            xLabel = new CSS2DObject(nameDiv);
                            xLabel.position.set(punkteL[0].x, punkteL[0].y, punkteL[0].z);
                            xLabel.layers.set(1)
                            mesh.add(xLabel);
                        }
                    }

                    zahl = punkteR[teilung].z / Ueberhoehung * unit_stress_factor
                    if (Math.abs(zahl) > 1.e-10) {
                        nameDiv = document.createElement("div");
                        nameDiv.className = "emotionLabel";
                        wert = (zahl).toFixed(3);
                        nameDiv.textContent = wert;
                        nameDiv.id = "elNoTauR2" + i
                        nameDiv.style.backgroundColor = '#ffffff'
                        xLabel = new CSS2DObject(nameDiv);
                        xLabel.position.set(punkteR[teilung].x, punkteR[teilung].y, punkteR[teilung].z);
                        xLabel.layers.set(1)
                        mesh.add(xLabel);
                    }
                    if (Math.abs(punkteL[teilung].z - punkteR[teilung].z) > 1.e-10) {
                        zahl = punkteL[teilung].z / Ueberhoehung * unit_stress_factor
                        if (Mxp !== 0.0 && (Math.abs(zahl) > 1.e-10)) {
                            nameDiv = document.createElement("div");
                            nameDiv.className = "emotionLabel";
                            wert = (zahl).toFixed(3);
                            nameDiv.textContent = wert;
                            nameDiv.id = "elNoTauL2" + i
                            nameDiv.style.backgroundColor = '#ffffff'
                            xLabel = new CSS2DObject(nameDiv);
                            xLabel.position.set(punkteL[teilung].x, punkteL[teilung].y, punkteL[teilung].z);
                            xLabel.layers.set(1)
                            mesh.add(xLabel);
                        }
                    }
                    zahl = maxtau.tau / Ueberhoehung * unit_stress_factor
                    if (Math.abs(zahl) > 1.e-10) {
                        nameDiv = document.createElement("div");
                        nameDiv.className = "emotionLabel";
                        wert = (zahl).toFixed(3);
                        nameDiv.textContent = wert;
                        nameDiv.id = "elNoTaum1" + i
                        nameDiv.style.backgroundColor = '#ffffff'
                        xLabel = new CSS2DObject(nameDiv);
                        xLabel.position.set(maxtau.x, maxtau.y, maxtau.wert);
                        xLabel.layers.set(1)
                        mesh.add(xLabel);
                    }

                }

                // Pfeile zeichnen

                if (showArrows) zeichneHPfeil(i, mesh)
            }

        }

        //---------------------------------------------------------------------------------------------------
        // Vergleichsspannungen
        //---------------------------------------------------------------------------------------------------

        if (maxSigmaV > 0.0 && show_webgl_sigmaV) {

            let sigma = Array(3)   // tau = Array(3), 

            let xi: number, tau_i: number, sig_i: number, sl: number, sig_V: number

            const maxsigmaV = {
                sigmaV: 0.0,
                wert: 0.0,
                x: 0.0,
                y: 0.0
            };


            let Ueberhoehung = 0.2 * slmax / maxSigmaV * scaleFactor
            console.log("maxSigmaV", maxSigmaV, Ueberhoehung)

            let dx: number, x0: number, y0: number

            for (i = 0; i < nelem; i++) {
                sl = truss[i].sl
                dx = sl / teilung
                x1 = node[truss[i].nod[0]].y
                y1 = node[truss[i].nod[0]].z
                x2 = node[truss[i].nod[1]].y
                y2 = node[truss[i].nod[1]].z

                maxsigmaV.sigmaV = 0.0;

                for (j = 0; j < 3; j++) {
                    //tau[j] = truss[i].stress_R[j];  // truss[i].tau_p1[j] + truss[i].tau_s[j]
                    sigma[j] = truss[i].sigma_x[j]
                }
                const polyShapeR = new THREE.Shape()
                const polyShapeL = new THREE.Shape()

                polyShapeR.moveTo(0.0, 0.0)
                for (let istelle = 0; istelle <= teilung; istelle++) {
                    xi = istelle * dx
                    x0 = xi * (x2 - x1) / truss[i].sl
                    y0 = xi * (y2 - y1) / truss[i].sl

                    tau_i = (sl ** 2 - 3 * sl * xi + 2 * xi ** 2) * truss[i].stress_R[0]
                        + 4 * xi * (sl - xi) * truss[i].stress_R[1]
                    tau_i = (tau_i + xi * (2 * xi - sl) * truss[i].stress_R[2]) / sl / sl

                    if (showSigmaFrame) {
                        sig_i = (truss[i].sigma_xe[1] - truss[i].sigma_xe[0]) / sl * xi + truss[i].sigma_xe[0]
                    } else {
                        sig_i = (sigma[2] - sigma[0]) / sl * xi + sigma[0]
                    }

                    sig_V = Math.sqrt(sig_i * sig_i + 3 * tau_i * tau_i) * Ueberhoehung

                    polyShapeR.lineTo(-xi, sig_V)

                    punkteR[istelle].x = -x0 - truss[i].pts_y[0]
                    punkteR[istelle].y = -y0 - truss[i].pts_z[0]
                    punkteR[istelle].z = sig_V

                    if (Math.abs(sig_V) > maxsigmaV.sigmaV) {
                        maxsigmaV.sigmaV = Math.abs(sig_V)
                        maxsigmaV.wert = sig_V
                        maxsigmaV.x = punkteR[istelle].x
                        maxsigmaV.y = punkteR[istelle].y
                    }

                    tau_i = (sl ** 2 - 3 * sl * xi + 2 * xi ** 2) * truss[i].stress_L[0]
                        + 4 * xi * (sl - xi) * truss[i].stress_L[1]
                    tau_i = (tau_i + xi * (2 * xi - sl) * truss[i].stress_L[2]) / sl / sl

                    if (showSigmaFrame) {
                        sig_i = (truss[i].sigma_xe[2] - truss[i].sigma_xe[3]) / sl * xi + truss[i].sigma_xe[3]
                    }

                    sig_V = Math.sqrt(sig_i * sig_i + 3 * tau_i * tau_i) * Ueberhoehung

                    polyShapeL.lineTo(-xi, sig_V)

                    punkteL[istelle].x = -x0 - truss[i].pts_y[3]
                    punkteL[istelle].y = -y0 - truss[i].pts_z[3]
                    punkteL[istelle].z = sig_V

                    if (Math.abs(sig_V) > maxsigmaV.sigmaV) {
                        maxsigmaV.sigmaV = Math.abs(sig_V)
                        maxsigmaV.wert = sig_V
                        maxsigmaV.x = punkteL[istelle].x
                        maxsigmaV.y = punkteL[istelle].y
                    }
                }

                polyShapeR.lineTo(-sl, 0.0)
                polyShapeR.lineTo(0.0, 0.0)
                polyShapeL.lineTo(-sl, 0.0)
                polyShapeL.lineTo(0.0, 0.0)

                const geometry_polyR = new THREE.ShapeGeometry(polyShapeR);
                const flaecheR = new THREE.Mesh(geometry_polyR, new THREE.MeshBasicMaterial({
                    color: 'rgb(0, 150, 150)',
                    opacity: 0.05,
                    transparent: true,
                    side: THREE.DoubleSide
                }))


                flaecheR.translateX(-truss[i].pts_y[0])
                flaecheR.translateY(-truss[i].pts_z[0])
                flaecheR.rotateZ(truss[i].alpha)
                flaecheR.rotateX(1.570795)

                // scene.add(flaecheR)


                const geometry_polyL = new THREE.ShapeGeometry(polyShapeL);
                const flaecheL = new THREE.Mesh(geometry_polyL, new THREE.MeshBasicMaterial({
                    color: 'rgb(0, 150, 150)',
                    opacity: 0.05,
                    transparent: true,
                    side: THREE.DoubleSide
                }))

                flaecheL.translateX(-truss[i].pts_y[3])
                flaecheL.translateY(-truss[i].pts_z[3])
                flaecheL.rotateZ(truss[i].alpha)
                flaecheL.rotateX(1.570795)

                // scene.add(flaecheL)



                // jetzt die Spannungsfläche 

                const positions = [];
                const posL = [];
                const posR = [];
                const geometry = new THREE.BufferGeometry();
                const geometrySideL = new THREE.BufferGeometry();
                const geometrySideR = new THREE.BufferGeometry();


                for (let istelle = 0; istelle < teilung; istelle++) {
                    //console.log("L", istelle, punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z)
                    //console.log("R", istelle, punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z)

                    positions.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);
                    positions.push(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z);
                    positions.push(punkteR[istelle + 1].x, punkteR[istelle + 1].y, punkteR[istelle + 1].z);

                    positions.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);
                    positions.push(punkteR[istelle + 1].x, punkteR[istelle + 1].y, punkteR[istelle + 1].z);
                    positions.push(punkteL[istelle + 1].x, punkteL[istelle + 1].y, punkteL[istelle + 1].z);
                }

                for (let istelle = 1; istelle <= teilung; istelle++) {
                    if (punkteR[istelle].z * punkteR[istelle - 1].z > 0) {
                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, 0.0);
                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, punkteR[istelle - 1].z);
                        posR.push(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z);

                        posR.push(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z);
                        posR.push(punkteR[istelle].x, punkteR[istelle].y, 0.0);
                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, 0.0);
                    } else {
                        const sigma1 = punkteR[istelle - 1].z;
                        const sigma2 = punkteR[istelle].z
                        const dx0 = sigma1 * dx / (sigma2 - sigma1)
                        const x0 = dx0 * (x2 - x1) / truss[i].sl + punkteR[istelle - 1].x
                        const y0 = dx0 * (y2 - y1) / truss[i].sl + punkteR[istelle - 1].y

                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, 0.0);
                        posR.push(punkteR[istelle - 1].x, punkteR[istelle - 1].y, punkteR[istelle - 1].z);
                        posR.push(x0, y0, 0.0);

                        posR.push(x0, y0, 0.0);
                        posR.push(punkteR[istelle].x, punkteR[istelle].y, 0.0);
                        posR.push(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z);
                    }

                    if (punkteL[istelle].z * punkteL[istelle - 1].z > 0) {
                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, 0.0);
                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, punkteL[istelle - 1].z);
                        posL.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);

                        posL.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);
                        posL.push(punkteL[istelle].x, punkteL[istelle].y, 0.0);
                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, 0.0);
                    } else {
                        const sigma1 = punkteL[istelle - 1].z;
                        const sigma2 = punkteL[istelle].z
                        const dx0 = sigma1 * dx / (sigma2 - sigma1)
                        const x0 = dx0 * (x2 - x1) / truss[i].sl + punkteL[istelle - 1].x
                        const y0 = dx0 * (y2 - y1) / truss[i].sl + punkteL[istelle - 1].y

                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, 0.0);
                        posL.push(punkteL[istelle - 1].x, punkteL[istelle - 1].y, punkteL[istelle - 1].z);
                        posL.push(x0, y0, 0.0);

                        posL.push(x0, y0, 0.0);
                        posL.push(punkteL[istelle].x, punkteL[istelle].y, 0.0);
                        posL.push(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z);
                    }
                }

                if (showSides) {

                    geometrySideR.setAttribute('position', new THREE.Float32BufferAttribute(posR, 3));
                    const materialSide = new THREE.MeshBasicMaterial({
                        color: 'rgb(0, 150, 150)',
                        transparent: true,
                        opacity: 0.1,
                        side: THREE.DoubleSide
                    });
                    const meshSideR = new THREE.Mesh(geometrySideR, materialSide);
                    scene.add(meshSideR)

                    geometrySideL.setAttribute('position', new THREE.Float32BufferAttribute(posL, 3));

                    const meshSideL = new THREE.Mesh(geometrySideL, materialSide);
                    scene.add(meshSideL)
                }

                // itemSize = 3 because there are 3 values (components) per vertex

                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                const material = new THREE.MeshBasicMaterial({
                    color: 'rgb(0, 150, 150)',
                    opacity: 0.7,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh)

                // Linien drumherum, erst links, dann rechts


                const material1 = new THREE.LineBasicMaterial({
                    color: 'rgb(56, 93, 138)',
                    linewidth: 2
                });


                const pointsR = [];
                pointsR.push(new THREE.Vector3(- truss[i].pts_y[0], - truss[i].pts_z[0], 0.0));
                for (let istelle = 0; istelle <= teilung; istelle++) {
                    pointsR.push(new THREE.Vector3(punkteR[istelle].x, punkteR[istelle].y, punkteR[istelle].z));
                }
                pointsR.push(new THREE.Vector3(- truss[i].pts_y[1], - truss[i].pts_z[1], 0.0));

                const geometry1 = new THREE.BufferGeometry().setFromPoints(pointsR);

                const lineR = new THREE.Line(geometry1, material1);
                scene.add(lineR);

                const pointsL = [];
                pointsL.push(new THREE.Vector3(- truss[i].pts_y[3], - truss[i].pts_z[3], 0.0));
                for (let istelle = 0; istelle <= teilung; istelle++) {
                    pointsL.push(new THREE.Vector3(punkteL[istelle].x, punkteL[istelle].y, punkteL[istelle].z));
                }
                pointsL.push(new THREE.Vector3(- truss[i].pts_y[2], - truss[i].pts_z[2], 0.0));

                const geometryL = new THREE.BufferGeometry().setFromPoints(pointsL);

                const lineL = new THREE.Line(geometryL, material1);
                scene.add(lineL);

                if (show_webgl_label) {
                    let nameDiv: HTMLDivElement, xLabel: any

                    // Element Anfang
                    let zahl = punkteR[0].z / Ueberhoehung * unit_stress_factor
                    if (Math.abs(zahl) > 1.e-10) {
                        nameDiv = document.createElement("div");
                        nameDiv.className = "emotionLabel";
                        wert = (zahl).toFixed(3);
                        nameDiv.textContent = wert;
                        nameDiv.id = "elNoTauR1" + i
                        nameDiv.style.backgroundColor = '#ffffff'
                        xLabel = new CSS2DObject(nameDiv);
                        xLabel.position.set(punkteR[0].x, punkteR[0].y, punkteR[0].z);
                        xLabel.layers.set(1)
                        mesh.add(xLabel);
                    }
                    if (Math.abs(punkteL[0].z - punkteR[0].z) > 1.e-10) {
                        zahl = punkteL[0].z / Ueberhoehung * unit_stress_factor
                        if (Math.abs(zahl) > 1.e-10) {
                            if (Mxp !== 0.0 || showSigmaFrame) {
                                nameDiv = document.createElement("div");
                                nameDiv.className = "emotionLabel";
                                wert = (zahl).toFixed(3);
                                nameDiv.textContent = wert;
                                nameDiv.id = "elNoTauL1" + i
                                nameDiv.style.backgroundColor = '#ffffff'
                                xLabel = new CSS2DObject(nameDiv);
                                xLabel.position.set(punkteL[0].x, punkteL[0].y, punkteL[0].z);
                                xLabel.layers.set(1)
                                mesh.add(xLabel);
                            }
                        }
                    }
                    // Element Ende
                    zahl = punkteR[teilung].z / Ueberhoehung * unit_stress_factor
                    if (Math.abs(zahl) > 1.e-10) {
                        nameDiv = document.createElement("div");
                        nameDiv.className = "emotionLabel";
                        wert = (zahl).toFixed(3);
                        nameDiv.textContent = wert;
                        nameDiv.id = "elNoTauR2" + i
                        nameDiv.style.backgroundColor = '#ffffff'
                        xLabel = new CSS2DObject(nameDiv);
                        xLabel.position.set(punkteR[teilung].x, punkteR[teilung].y, punkteR[teilung].z);
                        xLabel.layers.set(1)
                        mesh.add(xLabel);
                    }
                    if (Math.abs(punkteL[teilung].z - punkteR[teilung].z) > 1.e-10) {
                        zahl = punkteL[teilung].z / Ueberhoehung * unit_stress_factor
                        if (Math.abs(zahl) > 1.e-10) {
                            if (Mxp !== 0.0 || showSigmaFrame) {
                                nameDiv = document.createElement("div");
                                nameDiv.className = "emotionLabel";
                                wert = (zahl).toFixed(3);
                                nameDiv.textContent = wert;
                                nameDiv.id = "elNoTauL3" + i
                                nameDiv.style.backgroundColor = '#ffffff'
                                xLabel = new CSS2DObject(nameDiv);
                                xLabel.position.set(punkteL[teilung].x, punkteL[teilung].y, punkteL[teilung].z);
                                xLabel.layers.set(1)
                                mesh.add(xLabel);
                            }
                        }
                    }

                    // maximaler Wert
                    zahl = maxsigmaV.sigmaV / Ueberhoehung * unit_stress_factor
                    if (Math.abs(zahl) > 1.e-10) {
                        nameDiv = document.createElement("div");
                        nameDiv.className = "emotionLabel";
                        wert = (zahl).toFixed(3);
                        nameDiv.textContent = wert;
                        nameDiv.id = "elNoTaum1" + i
                        nameDiv.style.backgroundColor = '#ffffff'
                        xLabel = new CSS2DObject(nameDiv);
                        xLabel.position.set(maxsigmaV.x, maxsigmaV.y, maxsigmaV.wert);
                        xLabel.layers.set(1)
                        mesh.add(xLabel);
                    }

                }

            }

        }



        //-----------------------------------------------------------------------------
        // Koodinatenkreuz
        //-----------------------------------------------------------------------------

        const vlen = slmax / 10;
        const skreuz = slmax / 100;

        const pointsx = [];
        pointsx.push(new THREE.Vector3(-y_s, -z_s, skreuz));
        pointsx.push(new THREE.Vector3(-y_s, -z_s, skreuz + vlen));

        let geometry_line = new THREE.BufferGeometry().setFromPoints(pointsx);

        material_line.setValues({ color: 0xdd0000 });
        const line = new THREE.Line(geometry_line, material_line);
        scene.add(line);

        const pointsy = [];      // y-Achse
        pointsy.push(new THREE.Vector3(-y_s, -z_s, skreuz));
        pointsy.push(new THREE.Vector3(-y_s - vlen, -z_s, skreuz));

        geometry_line = new THREE.BufferGeometry().setFromPoints(pointsy);

        //const line = new THREE.Line(geometry_line, material_line);
        scene.add(new THREE.Line(geometry_line, material_line_green));

        const pointsz = [];      // z-Achse
        pointsz.push(new THREE.Vector3(-y_s, -z_s, skreuz));
        pointsz.push(new THREE.Vector3(-y_s, -z_s - vlen, skreuz));

        geometry_line = new THREE.BufferGeometry().setFromPoints(pointsz);

        scene.add(new THREE.Line(geometry_line, material_line_blue));

        const geometry = new THREE.ConeGeometry(slmax / 100, slmax / 20, 16);             // x-Achse

        let material = new THREE.MeshPhongMaterial({ color: 0xdd0000 });
        let cone = new THREE.Mesh(geometry, material);
        cone.rotateX(1.570795)
        cone.position.set(-y_s, -z_s, skreuz + vlen)
        scene.add(cone);

        //        const geometry = new THREE.ConeGeometry( 2, 5, 16 );   // y-Achse

        material = new THREE.MeshPhongMaterial({ color: 0x00aa55 });
        cone = new THREE.Mesh(geometry, material);
        cone.rotateZ(1.570795)
        cone.position.set(-y_s - vlen, -z_s, skreuz)
        scene.add(cone);

        material = new THREE.MeshPhongMaterial({ color: 0x0000dd });     // z-Achse
        cone = new THREE.Mesh(geometry, material);
        cone.rotateX(3.14159)
        cone.position.set(-y_s, -z_s - vlen, skreuz)
        scene.add(cone);


        if (show_webgl_label && !show_webgl_tau && !show_webgl_sigma && !show_webgl_sigmaV && !show_webgl_woelb_V) {
            let nameDiv = document.createElement("div");
            nameDiv.className = "emotionLabel";
            nameDiv.textContent = 'x';
            nameDiv.id = "elNo-x"
            nameDiv.style.color = '#000000'
            nameDiv.style.border = 'none'
            let xLabel = new CSS2DObject(nameDiv);
            xLabel.position.set(-y_s, -z_s, skreuz + vlen + slmax / 30);
            xLabel.layers.set(1)
            line.add(xLabel);
            xLabel.layers.set(1);

            nameDiv = document.createElement("div");
            nameDiv.className = "emotionLabel";
            nameDiv.textContent = 'y';
            nameDiv.id = "elNo-y"
            nameDiv.style.color = '#000000'
            nameDiv.style.border = 'none'
            xLabel = new CSS2DObject(nameDiv);
            xLabel.position.set(-y_s - vlen - slmax / 30, -z_s, skreuz);
            xLabel.layers.set(1)
            line.add(xLabel);
            xLabel.layers.set(1);

            nameDiv = document.createElement("div");
            nameDiv.className = "emotionLabel";
            nameDiv.textContent = 'z';
            nameDiv.id = "elNo-z"
            nameDiv.style.color = '#000000'
            nameDiv.style.border = 'none'
            xLabel = new CSS2DObject(nameDiv);
            xLabel.position.set(-y_s, -z_s - vlen - slmax / 30, skreuz);
            xLabel.layers.set(1)
            line.add(xLabel);
            xLabel.layers.set(1);
        }

        //____________________________________________________________________
        //____________________________________________________________________

        controls.update();
        camera.updateProjectionMatrix();
        //renderer.render(scene,camera);

        window.dispatchEvent(new Event("resize"));
        //window.dispatchEvent(new Event("forceRender"));
    }


}

//--------------------------------------------------------------------------------------------------------
function zeichneHPfeil(ielem: number, mesh: any) {
    //----------------------------------------------------------------------------------------------------

    let i: number, istelle: number, n: number
    let b: number, a: number, c: number, b2: number, d: number, atemp: number, btemp: number
    let tau_i: number, sl: number, xi: number
    let x1: number, x2: number, y1: number, y2: number, dx: number, dy: number
    let xm1: number, ym1: number, xm2: number, ym2: number, xm3: number, ym3: number


    const si = truss[ielem].sinus
    const co = truss[ielem].cosinus

    sl = truss[ielem].sl

    a = scaleFactorArrows * slmax / 100   // Länge Pfeil
    b = scaleFactorArrows * slmax / 800   // Breite Pfeil
    b2 = scaleFactorArrows * slmax / 250  // Breite Pfeilspitze
    c = slmax / 500  // Abstand vor Querschnitt
    d = scaleFactorArrows * slmax / 100   // Länge Pfeilspitze

    const vertices = [];
    const indices = [];

    n = 0

    for (istelle = 1; istelle <= 3; istelle++) {

        for (i = 1; i <= 2; i++) {
            if (i === 1) {                     // rechte Seite
                x1 = truss[ielem].pts_y[0]
                y1 = truss[ielem].pts_z[0]
                x2 = truss[ielem].pts_y[1]
                y2 = truss[ielem].pts_z[1]
            } else {                         // linke Seite
                x1 = truss[ielem].pts_y[3]
                y1 = truss[ielem].pts_z[3]
                x2 = truss[ielem].pts_y[2]
                y2 = truss[ielem].pts_z[2]

            }
            dx = x2 - x1
            dy = y2 - y1

            xi = istelle * sl / 4
            if (i === 1) {
                tau_i = (sl ** 2 - 3 * sl * xi + 2 * xi ** 2) * truss[ielem].stress_R[0]
                    + 4 * xi * (sl - xi) * truss[ielem].stress_R[1]
                tau_i = (tau_i + xi * (2 * xi - sl) * truss[ielem].stress_R[2]) / sl / sl
            } else {
                tau_i = (sl ** 2 - 3 * sl * xi + 2 * xi ** 2) * truss[ielem].stress_L[0]
                    + 4 * xi * (sl - xi) * truss[ielem].stress_L[1]
                tau_i = (tau_i + xi * (2 * xi - sl) * truss[ielem].stress_L[2]) / sl / sl
            }

            if (Math.abs(tau_i) < 1.e-12) {
                atemp = a / 10
                btemp = b / 10
            } else {
                atemp = a
                btemp = b
            }
            xm1 = x1 + istelle * dx / 4 - co * atemp
            ym1 = y1 + istelle * dy / 4 - si * atemp
            xm2 = x1 + istelle * dx / 4 + co * atemp
            ym2 = y1 + istelle * dy / 4 + si * atemp

            vertices.push(-(xm1 + si * btemp), -(ym1 - co * btemp), c);
            vertices.push(-(xm2 + si * btemp), -(ym2 - co * btemp), c);
            vertices.push(-(xm2 - si * btemp), -(ym2 + co * btemp), c);
            vertices.push(-(xm1 - si * btemp), -(ym1 + co * btemp), c);


            if (tau_i > 1.e-12) {
                xm3 = xm2 + co * d
                ym3 = ym2 + si * d

                vertices.push(-(xm2 + si * b2), -(ym2 - co * b2), c);
                vertices.push(-(xm2 - si * b2), -(ym2 + co * b2), c);
                vertices.push(-(xm3), -(ym3), c);
            } else if (tau_i < -1.e-12) {
                xm3 = xm1 - co * d
                ym3 = ym1 - si * d

                vertices.push(-(xm1 + si * b2), -(ym1 - co * b2), c);
                vertices.push(-(xm1 - si * b2), -(ym1 + co * b2), c);
                vertices.push(-(xm3), -(ym3), c);
            } else {
                xm3 = xm2 + co * d / 10
                ym3 = ym2 + si * d / 10

                vertices.push(-(xm2 + si * b2 / 10), -(ym2 - co * b2 / 10), c);
                vertices.push(-(xm2 - si * b2 / 10), -(ym2 + co * b2 / 10), c);
                vertices.push(-(xm3), -(ym3), c);

            }


            if (i === 1) {
                indices.push(n + 0, n + 1, n + 2)
                indices.push(n + 2, n + 3, n + 0)
                indices.push(n + 4, n + 6, n + 5)
            } else {
                indices.push(n + 0 + 7, n + 1 + 7, n + 2 + 7)
                indices.push(n + 2 + 7, n + 3 + 7, n + 0 + 7)
                indices.push(n + 4 + 7, n + 6 + 7, n + 5 + 7)
            }
        }
        n = n + 14
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        vertexColors: true
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}


//--------------------------------------------------------------------------------------------------------
function zeichneLR_pfeile(ielem: number, mesh: any) {
    //----------------------------------------------------------------------------------------------------

    let i: number, istelle: number
    let b: number, a: number, c: number, b2: number, d: number, atemp: number, btemp: number
    let tau_i: number, sl: number, xi: number
    let x1: number, x2: number, y1: number, y2: number, dx: number, dy: number
    let xm1: number, ym1: number, xm2: number, ym2: number, xm3: number, ym3: number


    const si = truss[ielem].sinus
    const co = truss[ielem].cosinus

    sl = truss[ielem].sl

    a = slmax / 100   // Länge Pfeil
    b = slmax / 800   // Breite Pfeil
    b2 = slmax / 250  // Breite Pfeilspitze
    c = slmax / 1000  // Abstand vor Querschnitt
    d = slmax / 100   // Länge Pfeilspitze

    const vertices = [];
    const indices = [];


    istelle = 1;

    i = 1;
    const nod1 = truss[ielem].nod[0];
    const nod2 = truss[ielem].nod[1];
    x1 = node[nod1].y;
    x2 = node[nod2].y;
    y1 = node[nod1].z;
    y2 = node[nod2].z;


    dx = co * (a + c) //x2 - x1
    dy = si * (a + c) //y2 - y1

    xi = istelle * sl / 4
    tau_i = d


    if (Math.abs(tau_i) < 1.e-12) {
        atemp = a / 10
        btemp = b / 10
    } else {
        atemp = a
        btemp = b
    }
    xm1 = x1 + istelle * dx / 1 - co * atemp
    ym1 = y1 + istelle * dy / 1 - si * atemp
    xm2 = x1 + istelle * dx / 1 + co * atemp
    ym2 = y1 + istelle * dy / 1 + si * atemp

    vertices.push(-(xm1 + si * btemp), -(ym1 - co * btemp), c);
    vertices.push(-(xm2 + si * btemp), -(ym2 - co * btemp), c);
    vertices.push(-(xm2 - si * btemp), -(ym2 + co * btemp), c);
    vertices.push(-(xm1 - si * btemp), -(ym1 + co * btemp), c);

    xm3 = xm2 + co * d
    ym3 = ym2 + si * d

    vertices.push(-(xm2 + si * b2), -(ym2 - co * b2), c);
    vertices.push(-(xm2 - si * b2), -(ym2 + co * b2), c);
    vertices.push(-(xm3), -(ym3), c);


    indices.push(0, 1, 2)
    indices.push(2, 3, 0)
    indices.push(4, 6, 5)

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        vertexColors: true
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    x1 = truss[ielem].pts_y[0]
    y1 = truss[ielem].pts_z[0]
    x2 = truss[ielem].pts_y[1]
    y2 = truss[ielem].pts_z[1]

    let xm = -(x1 + x2 + si * a) / 2
    let ym = -(y1 + y2 - co * a) / 2

    let nameDiv = document.createElement("div");
    nameDiv.className = "emotionLabel";
    nameDiv.textContent = "R";
    nameDiv.id = "elside" + i
    nameDiv.style.backgroundColor = '#f0fff0'
    nameDiv.style.padding = '2px'
    nameDiv.style.borderRadius = '3px'
    //let height = nameDiv.getBoundingClientRect().height
    //console.log("nameDiv", height, nameDiv)
    let xLabel = new CSS2DObject(nameDiv);
    xLabel.position.set(xm, ym, c);
    xLabel.layers.set(1)
    //console.log("xLabel", xLabel)
    mesh.add(xLabel);
    xLabel.layers.set(1);


    x1 = truss[ielem].pts_y[3]
    y1 = truss[ielem].pts_z[3]
    x2 = truss[ielem].pts_y[2]
    y2 = truss[ielem].pts_z[2]

    xm = -(x1 + x2 - si * a) / 2
    ym = -(y1 + y2 + co * a) / 2

    nameDiv = document.createElement("div");
    nameDiv.className = "emotionLabel";
    nameDiv.textContent = "L";
    nameDiv.id = "elside" + i
    //let height = nameDiv.getBoundingClientRect().height
    //console.log("nameDiv", height, nameDiv)
    nameDiv.style.backgroundColor = '#f0fff0'
    nameDiv.style.padding = '2px'
    nameDiv.style.borderRadius = '3px'
    xLabel = new CSS2DObject(nameDiv);
    xLabel.position.set(xm, ym, c);
    xLabel.layers.set(1)
    //console.log("xLabel", xLabel)
    mesh.add(xLabel);
    xLabel.layers.set(1);

}


//--------------------------------------------------------------------------------------------------------
function label_webgl() {
    //--------------------------------------------------------------------------------------------------------
    //console.log("isNAN",isNaN(Gesamt_ys),yM)

    if (Gesamt_ys === undefined || isNaN(yM)) return; // noch nie gerechnet oder Fehler bei Berechnung

    show_webgl_label = !show_webgl_label;
    /*
    let element = document.getElementById("button_label_webgl");
    if (show_webgl_label) {
        element.className = 'button_label_webgl_pressed'
    } else {
        element.className = 'button_webgl'
        console.log("in false");
    }
    console.log("in label_webgl", show_webgl_label, element.className);
    */
    draw_elements();

}

//--------------------------------------------------------------------------------------------------------
function tau_webgl() {
    //--------------------------------------------------------------------------------------------------------

    if (Gesamt_ys === undefined || isNaN(yM)) return;

    console.log("in tau_webgl");
    show_webgl_tau = !show_webgl_tau;
    /*
    let element = document.getElementById("button_tau_webgl");
    if (show_webgl_tau) {
        element.className = 'button_tau_webgl_pressed'
    } else {
        element.className = 'button_webgl'
        console.log("in false");
    }
*/
    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function sigma_webgl() {
    //--------------------------------------------------------------------------------------------------------

    if (Gesamt_ys === undefined || isNaN(yM)) return;

    //console.log("in sigma_webgl");
    show_webgl_sigma = !show_webgl_sigma;
    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function sigmaV_webgl() {
    //--------------------------------------------------------------------------------------------------------

    if (Gesamt_ys === undefined || isNaN(yM)) return;
    console.log("in sigmaV_webgl");
    show_webgl_sigmaV = !show_webgl_sigmaV;
    draw_elements();
}
//--------------------------------------------------------------------------------------------------------
function woelb_M_webgl() {
    //--------------------------------------------------------------------------------------------------------

    if (Gesamt_ys === undefined || isNaN(yM)) return;

    console.log("in woelb_M_webgl");
    show_webgl_woelb_M = !show_webgl_woelb_M;

    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function woelb_V_webgl() {
    //--------------------------------------------------------------------------------------------------------

    if (Gesamt_ys === undefined || isNaN(yM)) return;

    console.log("in woelb_V_webgl");
    show_webgl_woelb_V = !show_webgl_woelb_V;

    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function scale_factor() {
    //--------------------------------------------------------------------------------------------------------

    scaleFactor = get_scale_factor();
    console.log("stressFactor=", scaleFactor)
    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function scale_factor_arrows() {
    //--------------------------------------------------------------------------------------------------------

    scaleFactorArrows = get_scale_factor_arrows();
    console.log("arrowFactor=", scaleFactorArrows)
    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function reset_webgl() {
    //--------------------------------------------------------------------------------------------------------

    controls.reset();
    console.log("reset_webgl=", scaleFactor)
    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function showSides_webgl() {
    //--------------------------------------------------------------------------------------------------------
    showSides = !showSides;
    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function showArrows_webgl() {
    //--------------------------------------------------------------------------------------------------------
    showArrows = !showArrows;
    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function showSigmaFrame_webgl() {
    //--------------------------------------------------------------------------------------------------------
    showSigmaFrame = !showSigmaFrame;
    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function showLeft_Right_webgl() {
    //--------------------------------------------------------------------------------------------------------
    show_LR_sides = !show_LR_sides;
    draw_elements();
}

//--------------------------------------------------------------------------------------------------------

window.addEventListener('label_webgl', label_webgl);
window.addEventListener('tau_webgl', tau_webgl);
window.addEventListener('sigma_webgl', sigma_webgl);
window.addEventListener('sigmaV_webgl', sigmaV_webgl);
window.addEventListener('woelb_M_webgl', woelb_M_webgl);
window.addEventListener('woelb_V_webgl', woelb_V_webgl);

window.addEventListener('scale_factor', scale_factor);
window.addEventListener('scale_factor_arrows', scale_factor_arrows);
window.addEventListener('show_sides_webgl', showSides_webgl);
window.addEventListener('show_arrows_webgl', showArrows_webgl);
window.addEventListener('show_sigma_frame_webgl', showSigmaFrame_webgl);
window.addEventListener('show_LR_webgl', showLeft_Right_webgl);
window.addEventListener('reset_webgl', reset_webgl);
