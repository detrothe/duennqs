// Option 1: Import the entire three.js core library.
import * as THREE from 'three';
import {myPanel} from "./mygui.js"

import { OrbitControls } from './OrbitControls.js';

import { node, truss, Gesamt_ys, Gesamt_zs, yM, zM, phi0 } from "./duennQ"
import { nnodes, nelem } from "./duennQ_tabelle.js"
import { ymin, ymax, zmin, zmax, slmax } from "./duennQ";
import { myScreen } from "./index.js";
import { CSS2DObject, CSS2DRenderer } from "./renderers/CSS2DRenderer.js"

import { FontLoader, Font } from "./renderers/FontLoaders.js";
import { TTFLoader } from "./renderers/TTFLoader.js";
import { TextGeometry } from './renderers/TextGeometry.js';


let show_webgl_label = false;
let show_webgl_tau = false;
let show_webgl_sigma = false;
let show_webgl_woelb_M = false;
let show_webgl_woelb_V = false;



export let maxWoelb_M: number;
export let maxWoelb_V: number;
export let maxSigma: number;
export let maxTau: number;

// modul variablen

let scene = null
let camera = null as THREE.OrthographicCamera;
let controls = null as OrbitControls;
let renderer = null as THREE.WebGLRenderer;
let labelRenderer = null as CSS2DRenderer

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

    const teilung = 10


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


    if (scene !== null) {

        const ele = document.getElementById("footer");
        const h = ele.clientHeight;
        console.log("h", h)

        let width = myScreen.svgWidth;
        let height = myScreen.clientHeight

        if (height > width) {
            height -= h
        } else {
            width -= h
        }

        renderer.setSize(width, height);
        labelRenderer.setSize(width, height);

        console.log("minMax", -ymax, -ymin, -zmin, -zmax);
        let rand = slmax / 10.0;

        let dx = Gesamt_ys;
        let dy = Gesamt_zs;

        camera.left = -ymax - rand + dx;
        camera.right = -ymin + rand + dx;
        camera.top = -zmin + rand + dy;
        camera.bottom = -zmax - rand + dy;
        //console.log("camera", camera)

        if (height > width) {
            let dh = camera.top - camera.bottom
            console.log("dh", dh, height / width)
            dh = (height / width - 1) * dh / 2;
            camera.top += dh
            camera.bottom -= dh;
        } else {
            let dh = camera.right - camera.left
            console.log("dh", dh, width / height)
            dh = (width / height - 1) * dh / 2;
            camera.right += dh
            camera.left -= dh;

        }

        controls.target.set(-dx, -dy, 0);


        //___________________________________________________________________________

        maxWoelb_M = 0.0
        for (let i = 0; i < nnodes; i++) {
            maxWoelb_M = Math.max(Math.abs(node[i].omega), maxWoelb_M)
        }

        maxWoelb_V = 0.0
        for (let i = 0; i < nelem; i++) {
            for (j = 0; j < 2; j++) {
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
            color: 0x00dd00,
            linewidth: 4
        });

        maxSigma = 0.0
        for (let i = 0; i < nelem; i++) {
            maxSigma = Math.max(Math.abs(truss[i].sigma_x[0]), Math.abs(truss[i].sigma_x[2]), maxSigma)
        }

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

        if (show_webgl_sigma || show_webgl_tau || show_webgl_woelb_M || show_webgl_woelb_V) {
            if (maxTau > 1e-12 || maxSigma > 1e-12 || maxWoelb_M > 1e-12) {
                depthBeam = 0.1;
            } else {
                depthBeam = 5;
            }
        } else {
            depthBeam = 5;
        }

        for (i = 0; i < teilung + 1; i++) {
            punkteL.push(new TPunkt())
            punkteR.push(new TPunkt())
        }

        //punkteL[0].x = 3

        for (let i = 0; i < nelem; i++) {


            //console.log("elem i=", i)
            x1 = -node[truss[i].nod[0]].y
            y1 = -node[truss[i].nod[0]].z
            x2 = -node[truss[i].nod[1]].y
            y2 = -node[truss[i].nod[1]].z
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


            if (show_webgl_label && !show_webgl_tau && !show_webgl_sigma) {
                let nameDiv = document.createElement("div");
                nameDiv.className = "emotionLabel";
                nameDiv.textContent = String(i + 1);
                nameDiv.id = "elNo" + i
                //console.log("nameDiv", nameDiv)
                const xLabel = new CSS2DObject(nameDiv);
                xLabel.position.set(xm, ym, 0);
                xLabel.layers.set(1)
                //console.log("xLabel", xLabel)
                mesh.add(xLabel);
                xLabel.layers.set(1);
            }

        }


        if (maxWoelb_M > 0.0000000000001 && show_webgl_woelb_M) {

            let Ueberhoehung = 0.1 * slmax / maxWoelb_M

            const material = new THREE.LineBasicMaterial({
                color: 0x00dd00,
                linewidth: 2
            });

            for (let i = 0; i < nelem; i++) {
                //console.log("elem i=", i)
                x1 = -node[truss[i].nod[0]].y
                y1 = -node[truss[i].nod[0]].z
                x2 = -node[truss[i].nod[1]].y
                y2 = -node[truss[i].nod[1]].z
                xm = (x1 + x2) / 2
                ym = (y1 + y2) / 2

                const points = [];
                points.push(new THREE.Vector3(x1, y1, node[truss[i].nod[0]].omega * Ueberhoehung));
                points.push(new THREE.Vector3(x2, y2, node[truss[i].nod[1]].omega * Ueberhoehung));

                const geometry = new THREE.BufferGeometry().setFromPoints(points);

                const line = new THREE.Line(geometry, material);
                scene.add(line);

            }

        }

        if (maxWoelb_V > 0.0000000000001 && show_webgl_woelb_V) {

            let Ueberhoehung = 0.1 * slmax / maxWoelb_V

            const material = new THREE.LineBasicMaterial({
                color: 0x00dd00,
                linewidth: 2
            });

            for (let i = 0; i < nelem; i++) {
                //console.log("elem i=", i)
                x1 = -node[truss[i].nod[0]].y
                y1 = -node[truss[i].nod[0]].z
                x2 = -node[truss[i].nod[1]].y
                y2 = -node[truss[i].nod[1]].z
                xm = (x1 + x2) / 2
                ym = (y1 + y2) / 2

                const points = [];
                points.push(new THREE.Vector3(x1, y1, truss[i].u[0] * Ueberhoehung));
                points.push(new THREE.Vector3(x2, y2, truss[i].u[1] * Ueberhoehung));

                const geometry = new THREE.BufferGeometry().setFromPoints(points);

                const line = new THREE.Line(geometry, material);
                scene.add(line);

            }

        }

        console.log("maxSigma, maxWoelb", maxSigma, maxWoelb_M, maxWoelb_V)

        if (maxSigma > 0.0000000000001 && show_webgl_sigma) {

            let Ueberhoehung = 0.2 * slmax / maxSigma // * scf // Skalieren
            console.log("Normalspannung", maxSigma, Ueberhoehung)

            let j = 0, nod1: number, nod2: number, sigma1: number, sigma2: number
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

            }


        }

        // Schubspannungen

        {
            let tau = Array(3)

            let xi: number, tau_i: number, sl: number, nod1: number


            const n = (teilung + 1) * 2
            //const stress_poly = Array.from(Array(teilung + 4), () => new Array(2).fill(0.0));
            //const stress_area = Array.from(Array(n + 1), () => new Array(2).fill(0.0));

            if (maxTau > 0.0 && show_webgl_tau) {

                let Ueberhoehung = 0.3 * slmax / maxTau // * scf //
                console.log("maxTau", maxTau, Ueberhoehung)

                let dx: number, sl: number, x0: number, y0: number
                let wert: string;

                for (i = 0; i < nelem; i++) {
                    sl = truss[i].sl
                    dx = sl / teilung
                    x1 = node[truss[i].nod[0]].y
                    y1 = node[truss[i].nod[0]].z
                    x2 = node[truss[i].nod[1]].y
                    y2 = node[truss[i].nod[1]].z

                    for (j = 0; j < 3; j++) {
                        tau[j] = truss[i].stress_R[j];  // truss[i].tau_p1[j] + truss[i].tau_s[j]
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
                        tau_i = (tau_i + xi * (2 * xi - sl) * truss[i].stress_R[2]) / sl / sl * Ueberhoehung

                        polyShapeR.lineTo(-xi, tau_i)

                        punkteR[istelle].x = -x0 - truss[i].pts_y[0]
                        punkteR[istelle].y = -y0 - truss[i].pts_z[0]
                        punkteR[istelle].z = tau_i

                        tau_i = (sl ** 2 - 3 * sl * xi + 2 * xi ** 2) * truss[i].stress_L[0]
                            + 4 * xi * (sl - xi) * truss[i].stress_L[1]
                        tau_i = (tau_i + xi * (2 * xi - sl) * truss[i].stress_L[2]) / sl / sl * Ueberhoehung

                        polyShapeL.lineTo(-xi, tau_i)

                        punkteL[istelle].x = -x0 - truss[i].pts_y[3]
                        punkteL[istelle].y = -y0 - truss[i].pts_z[3]
                        punkteL[istelle].z = tau_i

                        //console.log("tau_i", i, istelle, xi, tau_i)
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
                    //flaeche.rotateY(-1.570795)
                    //nod1 = truss[i].nod[0];
                    //flaeche.translateX(-node[nod1].y)
                    //flaeche.translateY(-node[nod1].z)

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

                        let nameDiv = document.createElement("div");
                        nameDiv.className = "emotionLabel";
                        wert = (punkteR[0].z / Ueberhoehung).toFixed(3);
                        nameDiv.textContent = wert;
                        nameDiv.id = "elNoTauR1" + i
                        //console.log("nameDiv", nameDiv)
                        let xLabel = new CSS2DObject(nameDiv);
                        xLabel.position.set(punkteR[0].x, punkteR[0].y, punkteR[0].z);
                        xLabel.layers.set(1)
                        //console.log("xLabel", xLabel)
                        mesh.add(xLabel);
                        xLabel.layers.set(1);

                        nameDiv = document.createElement("div");
                        nameDiv.className = "emotionLabel";
                        wert = (punkteL[0].z / Ueberhoehung).toFixed(3);
                        nameDiv.textContent = wert;
                        nameDiv.id = "elNoTauL1" + i
                        //console.log("nameDiv", nameDiv)
                        xLabel = new CSS2DObject(nameDiv);
                        xLabel.position.set(punkteL[0].x, punkteL[0].y, punkteL[0].z);
                        xLabel.layers.set(1)
                        //console.log("xLabel", xLabel)
                        mesh.add(xLabel);
                        xLabel.layers.set(1);

                    }

                }
            }
        }

        // Koodinatenkreuz

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

        material = new THREE.MeshPhongMaterial({ color: 0x00dd00 });
        cone = new THREE.Mesh(geometry, material);
        cone.rotateZ(1.570795)
        cone.position.set(-y_s - vlen, -z_s, skreuz)
        scene.add(cone);

        material = new THREE.MeshPhongMaterial({ color: 0x0000dd });     // z-Achse
        cone = new THREE.Mesh(geometry, material);
        cone.rotateX(3.14159)
        cone.position.set(-y_s, -z_s - vlen, skreuz)
        scene.add(cone);

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
function label_webgl() {
    //--------------------------------------------------------------------------------------------------------
    //console.log("isNAN",isNaN(Gesamt_ys),yM)
    if (Gesamt_ys === undefined || isNaN(yM)) return; // noch nie gerechnet oder Fehler bei Berechnung

    show_webgl_label = !show_webgl_label;
    let element = document.getElementById("button_label_webgl");
    if (show_webgl_label) {
        element.className = 'button_label_webgl_pressed'
    } else {
        element.className = 'button_webgl'
        console.log("in false");
    }
    console.log("in label_webgl", show_webgl_label, element.className);
    draw_elements();

}

//--------------------------------------------------------------------------------------------------------
function tau_webgl() {
    //--------------------------------------------------------------------------------------------------------

    if (Gesamt_ys === undefined || isNaN(yM)) return;

    console.log("in tau_webgl");
    show_webgl_tau = !show_webgl_tau;
    let element = document.getElementById("button_tau_webgl");
    if (show_webgl_tau) {
        element.className = 'button_tau_webgl_pressed'
    } else {
        element.className = 'button_webgl'
        console.log("in false");
    }

    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function sigma_webgl() {
    //--------------------------------------------------------------------------------------------------------

    if (Gesamt_ys === undefined || isNaN(yM)) return;

    console.log("in sigma_webgl");
    show_webgl_sigma = !show_webgl_sigma;
    let element = document.getElementById("button_sigma_webgl");
    if (show_webgl_sigma) {
        element.className = 'button_sigma_webgl_pressed'
    } else {
        element.className = 'button_webgl'
        console.log("in false");
    }

    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function woelb_M_webgl() {
    //--------------------------------------------------------------------------------------------------------

    if (Gesamt_ys === undefined || isNaN(yM)) return;

    console.log("in woelb_M_webgl");
    show_webgl_woelb_M = !show_webgl_woelb_M;
    let element = document.getElementById("button_woelb_M_webgl");
    if (show_webgl_woelb_M) {
        element.className = 'button_woelb_M_webgl_pressed'
    } else {
        element.className = 'button_webgl'
        console.log("in false");
    }

    draw_elements();
}

//--------------------------------------------------------------------------------------------------------
function woelb_V_webgl() {
    //--------------------------------------------------------------------------------------------------------

    if (Gesamt_ys === undefined || isNaN(yM)) return;

    console.log("in woelb_V_webgl");
    show_webgl_woelb_V = !show_webgl_woelb_V;
    let element = document.getElementById("button_woelb_V_webgl");
    if (show_webgl_woelb_V) {
        element.className = 'button_woelb_V_webgl_pressed'
    } else {
        element.className = 'button_webgl'
        console.log("in false");
    }

    draw_elements();
}

//--------------------------------------------------------------------------------------------------------

document.getElementById('button_label_webgl').addEventListener('click', label_webgl, false);
document.getElementById('button_tau_webgl').addEventListener('click', tau_webgl, false);
document.getElementById('button_sigma_webgl').addEventListener('click', sigma_webgl, false);
document.getElementById('button_woelb_M_webgl').addEventListener('click', woelb_M_webgl, false);
document.getElementById('button_woelb_V_webgl').addEventListener('click', woelb_V_webgl, false);

