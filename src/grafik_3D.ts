// Option 1: Import the entire three.js core library.
import * as THREE from 'three';

import { OrbitControls } from './OrbitControls.js';

import { node, truss, Gesamt_ys, Gesamt_zs } from "./duennQ"
import { nnodes, nelem } from "./duennQ_tabelle.js"
import { ymin, ymax, zmin, zmax, slmax } from "./systemlinien";
import { myScreen } from "./index.js";
import { CSS2DObject, CSS2DRenderer } from "./renderers/CSS2DRenderer.js"

import { FontLoader, Font } from "./renderers/FontLoaders.js";
import { TTFLoader } from "./renderers/TTFLoader.js";
import { TextGeometry } from './renderers/TextGeometry.js';

//import { OBJLoader } from 'three-addons';
/*
export function main_3D() {
    const canvas = document.querySelector('#c3');
    const renderer = new THREE.WebGLRenderer({canvas});

    const fov = 50;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 4;

    const scene = new THREE.Scene();

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    const material = new THREE.MeshPhongMaterial({color: 0x44aa88});  // greenish blue

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    function render(time) {
        time *= 0.001;  // convert time to seconds

        cube.rotation.x = time;
        cube.rotation.y = time;

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}
*/

export let maxWoelb: number;
export let maxSigma: number;

// modul variablen

let scene = null
let camera = null as THREE.OrthographicCamera;
let controls = null as OrbitControls;

//--------------------------------------------------------------------------------------------------------
export function main_3D() {
    //--------------------------------------------------------------------------------------------------------

    console.log("main_3D")

    const container = document.getElementById("my-webgl");
    const canvas = document.getElementById('c3') as HTMLCanvasElement  //.querySelector('#c3');
    let leng = Math.min(myScreen.svgWidth, myScreen.clientHeight)
    canvas.height = leng
    canvas.width = leng

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });  // canvas,
    renderer.setSize(leng, leng);
    container.appendChild(renderer.domElement);
    //console.log("renderer.domElement", renderer.domElement)

    const labelRenderer = new CSS2DRenderer();  // {element:canvas}
    labelRenderer.setSize(leng, leng);
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

    //  makeInstance(geometry, 0x44aa88, 0);  // Würfel 

    //makeInstance(geometry, 0x8844aa, -2);
    //makeInstance(geometry, 0xaa8844,  2);
    /*
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

        console.log("scene length", scene.children.length)
        console.log("scene child", scene.children)

        while (scene.children.length > 1) {  // Licht soll bleiben
            removeObject3D(scene.children[scene.children.length - 1])
        }

        scene.add(line);
    */
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

    controls.addEventListener('change', requestRenderIfNotRequested);
    window.addEventListener('resize', requestRenderIfNotRequested);
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

    let text:string = 'dßnnQs.js';


    loader.load('./fonts/ttf/kenpixel.ttf', function (json) {

        console.log("json", json)
        const font = new Font(json);
        console.log("font", font)
        createText(font, text);
        //const shapes = font   //.generateShapes("Hallo", 100);

    });

    //render();
    //window.dispatchEvent(new Event("resize"));

}

function createText(font:FontLoader, text) {

    let textMesh1, textMesh2, textGeo, material;


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

    const centerOffset = - 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

    textMesh1 = new THREE.Mesh(textGeo, material);

    textMesh1.position.x = centerOffset;
    textMesh1.position.y = hover;
    textMesh1.position.z = 0;

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
export function draw_elements(y_s: number, z_s: number, y_M: number, z_M: number, phi: number) {
    //--------------------------------------------------------------------------------------------------------

    let i: number, j: number
    let y1: number, y2: number, x1: number, x2: number, xm: number, ym: number

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

        console.log("minMax", -ymax, -ymin, -zmin, -zmax);
        let rand = slmax / 10.0;

        let dx = Gesamt_ys;
        let dy = Gesamt_zs;

        camera.left = -ymax - rand + dx;
        camera.right = -ymin + rand + dx;
        camera.top = -zmin + rand + dy;
        camera.bottom = -zmax - rand + dy;

        controls.target.set(-dx, -dy, 0);

        maxWoelb = 0.0
        for (let i = 0; i < nnodes; i++) {
            maxWoelb = Math.max(Math.abs(node[i].omega), maxWoelb)
        }
        //create a blue LineBasicMaterial
        const material_line = new THREE.LineBasicMaterial({
            color: 0x0000ff,
            linewidth: 4
        });
        const material_line_blue = new THREE.LineBasicMaterial({
            color: 0x0000ff,
            linewidth: 4
        });
        const material_line_green = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            linewidth: 4
        });

        maxSigma = 0.0

        for (let i = 0; i < nelem; i++) {
            //console.log("elem i=", i)
            x1 = -node[truss[i].nod[0]].y
            y1 = -node[truss[i].nod[0]].z
            x2 = -node[truss[i].nod[1]].y
            y2 = -node[truss[i].nod[1]].z
            xm = (x1 + x2) / 2
            ym = (y1 + y2) / 2
            /*
                        const points = [];
                        points.push(new THREE.Vector3(x1, y1, 0));
                        points.push(new THREE.Vector3(x2, y2, 0));

                        const geometry_line = new THREE.BufferGeometry().setFromPoints(points);

                        const line = new THREE.Line(geometry_line, material_line);
                        scene.add(line);
            */

            const elemShape = new THREE.Shape();
            elemShape.moveTo(-truss[i].pts_y[0], -truss[i].pts_z[0]);
            elemShape.lineTo(-truss[i].pts_y[1], -truss[i].pts_z[1]);
            elemShape.lineTo(-truss[i].pts_y[2], -truss[i].pts_z[2]);
            elemShape.lineTo(-truss[i].pts_y[3], -truss[i].pts_z[3]);
            elemShape.lineTo(-truss[i].pts_y[0], -truss[i].pts_z[0]);


            const extrudeSettings = {
                depth: 0,
                bevelEnabled: false,
                bevelSegments: 5,
                steps: 1,
                bevelSize: 1,
                bevelThickness: 1
            };

            const geometry = new THREE.ExtrudeGeometry(elemShape, extrudeSettings);

            const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());

            scene.add(mesh);

            //let label = document.getElementById('label_x_achse') //as HTMLCanvasElement;
            //txt.style.left = '200px'
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

            maxSigma = Math.max(Math.abs(truss[i].sigma_x[0]), Math.abs(truss[i].sigma_x[2]), maxSigma)
        }

        console.log("maxSigma", maxSigma)
        /*
                if ((Math.abs(maxWoelb) > 0.0000000000001) && (I_omega > 0.0000000000001)) {
                    let Ueberhoehung = 0.1 * slmax / maxWoelb // * scf // Skalieren der Wölblinien
                    console.log("Verwölbung",maxWoelb,Ueberhoehung)

                    let j = 0, nod1:number, nod2: number, omega1:number, omega2:number
                    for (let i = 0; i < nelem; i++) {
                        const vertices = new Float32Array(3*6);
                        nod1 = truss[i].nod[0];
                        nod2 = truss[i].nod[1];
                        x1 = -node[nod1].y
                        y1 = -node[nod1].z
                        x2 = -node[nod2].y
                        y2 = -node[nod2].z
                        omega1 = node[nod1].omega
                        omega2 = node[nod2].omega

                        j = 0
                        vertices[0+j] = x1 ;vertices[1+j] = y1 ;vertices[2+j] = 0.0 ;
                        j+=3
                        vertices[0+j] = x2 ;vertices[1+j] = y2 ;vertices[2+j] = 0.0 ;
                        j+=3
                        vertices[0+j] = x2 ;vertices[1+j] = y2 ;vertices[2+j] = omega2*Ueberhoehung ;

                        j+=3
                        vertices[0+j] = x2 ;vertices[1+j] = y2 ;vertices[2+j] = omega2*Ueberhoehung ;
                        j+=3
                        vertices[0+j] = x1 ;vertices[1+j] = y1 ;vertices[2+j] = omega1*Ueberhoehung ;
                        j+=3
                        vertices[0+j] = x1 ;vertices[1+j] = y1 ;vertices[2+j] = 0.0 ;

                        const geometry1 = new THREE.BufferGeometry();

                        geometry1.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); // itemSize = 3 because there are 3 values (components) per vertex
                        const material1 = new THREE.MeshBasicMaterial({
                            color: 'darkgrey',
                            opacity: 0.5,
                            transparent: true,
                            side: THREE.DoubleSide
                        })
                        const mesh1 = new THREE.Mesh(geometry1, material1);
                        scene.add(mesh1);

                        const material = new THREE.LineBasicMaterial({
                            color: 0x0000dd,
                            linewidth: 5
                        });

                        const points = [];
                        points.push( new THREE.Vector3( x1, y1,  omega1*Ueberhoehung) );
                        points.push( new THREE.Vector3( x2, y2, omega2*Ueberhoehung ) );

                        const geometry = new THREE.BufferGeometry().setFromPoints( points );

                        const line = new THREE.Line( geometry, material );
                        scene.add( line );
                    }

                } else {

                }
        */
        if (maxSigma > 0.0000000000001) {

            let Ueberhoehung = 0.1 * slmax / maxSigma // * scf // Skalieren der Wölblinien
            console.log("Normalspannung", maxSigma, Ueberhoehung)

            let j = 0, nod1: number, nod2: number, sigma1: number, sigma2: number
            for (let i = 0; i < nelem; i++) {
                const vertices = new Float32Array(3 * 6);
                nod1 = truss[i].nod[0];
                nod2 = truss[i].nod[1];
                x1 = -node[nod1].y
                y1 = -node[nod1].z
                x2 = -node[nod2].y
                y2 = -node[nod2].z
                sigma1 = truss[i].sigma_x[0]
                sigma2 = truss[i].sigma_x[2]

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

                geometry1.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); // itemSize = 3 because there are 3 values (components) per vertex
                const material1 = new THREE.MeshBasicMaterial({
                    color: 'darkgrey',
                    opacity: 0.5,
                    transparent: true,
                    side: THREE.DoubleSide
                })
                const mesh1 = new THREE.Mesh(geometry1, material1);
                scene.add(mesh1);

                const material = new THREE.LineBasicMaterial({
                    color: 0x0000dd,
                    linewidth: 5
                });

                const points = [];
                points.push(new THREE.Vector3(x1, y1, sigma1 * Ueberhoehung));
                points.push(new THREE.Vector3(x2, y2, sigma2 * Ueberhoehung));

                const geometry = new THREE.BufferGeometry().setFromPoints(points);

                const line = new THREE.Line(geometry, material);
                scene.add(line);
            }

        }

        {
            let tau = Array(3)

            let xi: number, tau_i: number, tau_j: number, sl: number, nod1: number

            const teilung = 5
            const n = (teilung + 1) * 2
            //const stress_poly = Array.from(Array(teilung + 4), () => new Array(2).fill(0.0));
            //const stress_area = Array.from(Array(n + 1), () => new Array(2).fill(0.0));
            let maxTau = 0.0

            for (i = 0; i < nelem; i++) {
                for (j = 0; j < 3; j++) {
                    tau_j = truss[i].tau_p1[j] + truss[i].tau_s[j]
                    if (Math.abs(tau_j) > maxTau) maxTau = Math.abs(tau_j)
                }
            }

            if (maxTau > 0.0) {

                let Ueberhoehung = 0.3 * slmax / maxTau // * scf //
                console.log("maxTau", maxTau, Ueberhoehung)

                let dx: number, sl: number

                for (i = 0; i < nelem; i++) {
                    sl = truss[i].sl
                    dx = sl / teilung
                    for (j = 0; j < 3; j++) {
                        tau[j] = truss[i].tau_p1[j] + truss[i].tau_s[j]
                    }
                    const polyShape = new THREE.Shape()
                    polyShape.moveTo(0.0, 0.0)
                    for (let istelle = 0; istelle <= teilung; istelle++) {
                        xi = istelle * dx
                        tau_i = (sl ** 2 - 3 * sl * xi + 2 * xi ** 2) * tau[0] + 4 * xi * (sl - xi) * tau[1]
                        tau_i = (tau_i + xi * (2 * xi - sl) * tau[2]) / sl / sl * Ueberhoehung

                        polyShape.lineTo(-xi, tau_i)

                        console.log("tau_i", i, istelle, xi, tau_i)
                    }
                    polyShape.lineTo(-sl, 0.0)
                    polyShape.lineTo(0.0, 0.0)

                    const geometry_poly = new THREE.ShapeGeometry(polyShape);
                    let flaeche = new THREE.Mesh(geometry_poly, new THREE.MeshBasicMaterial({
                        color: 'red',
                        opacity: 0.5,
                        transparent: true,
                        side: THREE.DoubleSide
                    }))
                    //flaeche.rotateY(-1.570795)
                    nod1 = truss[i].nod[0];
                    flaeche.translateX(-node[nod1].y)
                    flaeche.translateY(-node[nod1].z)
                    flaeche.rotateZ(truss[i].alpha)
                    flaeche.rotateX(1.570795)
                    scene.add(flaeche)
                    /*
                    scene.add(new THREE.Mesh(geometry_poly, new THREE.MeshBasicMaterial({
                    color: 'red',
                    opacity: 0.5,
                    transparent: true,
                    side: THREE.DoubleSide
                    })))
                    */
                }
            }
        }
        /*
                const polyShape = new THREE.Shape()
                    .moveTo(0, 0)
                    .lineTo(40, 0)
                    .lineTo(40, 30)
                    .lineTo(0, 20)
                    .lineTo(0, 0); // close path

                const geometry_poly = new THREE.ShapeGeometry(polyShape);
                scene.add(new THREE.Mesh(geometry_poly, new THREE.MeshBasicMaterial({
                    color: 'red',
                    opacity: 0.5,
                    transparent: true,
                    side: THREE.DoubleSide
                })))
        */
        /*
        const geometry1 = new THREE.BufferGeometry();
// create a simple square shape. We duplicate the top left and bottom right
// vertices because each vertex needs to appear once per triangle.
        let d = 2.0
        const vertices = new Float32Array([
            -1.0, -1.0, d,
            1.0, -1.0, 1.0,
            1.0, 1.0, 3.0,

            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0
        ]);

// itemSize = 3 because there are 3 values (components) per vertex
        geometry1.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const material1 = new THREE.MeshBasicMaterial({
            color: 'darkgrey',
            opacity: 0.5,
            transparent: true,
            side: THREE.DoubleSide
        })
        const mesh1 = new THREE.Mesh(geometry1, material1);
        scene.add(mesh1);
*/
        /*
                const heartShape = new THREE.Shape();

                heartShape.moveTo( 25, 25 );
                heartShape.bezierCurveTo( 25, 25, 20, 0, 0, 0 );
                heartShape.bezierCurveTo( - 30, 0, - 30, 35, - 30, 35 );
                heartShape.bezierCurveTo( - 30, 55, - 10, 77, 25, 95 );
                heartShape.bezierCurveTo( 60, 77, 80, 55, 80, 35 );
                heartShape.bezierCurveTo( 80, 35, 80, 0, 50, 0 );
                heartShape.bezierCurveTo( 35, 0, 25, 25, 25, 25 );

                const extrudeSettings = { depth: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

                const geometry = new THREE.ExtrudeGeometry( heartShape, extrudeSettings );

                const mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial() );
                scene.add(mesh);

         */

        const pointsx = [];
        pointsx.push(new THREE.Vector3(-y_s, -z_s, 10));
        pointsx.push(new THREE.Vector3(-y_s, -z_s, 20));

        let geometry_line = new THREE.BufferGeometry().setFromPoints(pointsx);

        material_line.setValues({ color: 0xff0000 });
        const line = new THREE.Line(geometry_line, material_line);
        scene.add(line);

        const pointsy = [];      // y-Achse
        pointsy.push(new THREE.Vector3(-y_s, -z_s, 10));
        pointsy.push(new THREE.Vector3(-y_s - 10, -z_s, 10));

        geometry_line = new THREE.BufferGeometry().setFromPoints(pointsy);

        //const line = new THREE.Line(geometry_line, material_line);
        scene.add(new THREE.Line(geometry_line, material_line_green));

        const pointsz = [];      // z-Achse
        pointsz.push(new THREE.Vector3(-y_s, -z_s, 10));
        pointsz.push(new THREE.Vector3(-y_s, -z_s - 10, 10));

        geometry_line = new THREE.BufferGeometry().setFromPoints(pointsz);

        scene.add(new THREE.Line(geometry_line, material_line_blue));

        const geometry = new THREE.ConeGeometry(1.2, 4, 16);   // x-Achse

        let material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        let cone = new THREE.Mesh(geometry, material);
        cone.rotateX(1.570795)
        cone.position.set(-y_s, -z_s, 20)
        scene.add(cone);

        //        const geometry = new THREE.ConeGeometry( 2, 5, 16 );   // y-Achse

        material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        cone = new THREE.Mesh(geometry, material);
        cone.rotateZ(1.570795)
        cone.position.set(-y_s - 10, -z_s, 10)
        scene.add(cone);

        material = new THREE.MeshPhongMaterial({ color: 0x0000ff });     // z-Achse
        cone = new THREE.Mesh(geometry, material);
        cone.rotateX(3.14159)
        cone.position.set(-y_s, -z_s - 10, 10)
        scene.add(cone);


        window.dispatchEvent(new Event("resize"));
    }

    //add_element();
}