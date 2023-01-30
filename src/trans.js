import {myScreen} from "./index";
//import * as THREE from "three";
//import {OrbitControls} from "./OrbitControls";

class CTrans {
    constructor(ymin = 0.0, zmin = 0.0, ymax = 1.0, zmax = 1.0) {
        this.init(ymin, zmin, ymax, zmax)
    }

    init(ymin, zmin, ymax, zmax) {

        let dy, dz;

        this.ymin = Number(ymin);
        this.ymax = Number(ymax);
        this.zmin = Number(zmin);
        this.zmax = Number(zmax);

        dy = this.ymax - this.ymin;
        dz = this.zmax - this.zmin;

        this.ymin -= 0.1 * dy;
        this.ymax += 0.1 * dy;
        this.zmin -= 0.1 * dz;
        this.zmax += 0.1 * dz;

        this.dy = this.ymax - this.ymin;
        this.dz = this.zmax - this.zmin;

        console.log("Grenzen", this.ymin, this.ymax, this.zmin, this.zmax);

        //this.ratio_world = this.dy / this.dz;

        console.log("dy,dz", this.dy, this.dz);

        this.height = myScreen.clientHeight - 1; //  .getElementById("my-svg").clientHeight - 1;
        //this.width = document.getElementById("dataviz_area").clientWidth - 1;
        this.width = myScreen.svgWidth - 1;

        //this.ratio = this.width / this.height;

        dz = this.dy * this.height / this.width;
        console.log("dz", dz, this.dz);
        dy = this.dz * this.width / this.height;
        console.log("dy", dy, this.dy);

        if (dz >= this.dz) {
            const delta_dz = (dz - this.dz) / 2;
            this.zmin = this.zmin - delta_dz;
            this.zmax = this.zmax + delta_dz;
            this.dz = this.zmax - this.zmin;
            console.log("new z", delta_dz, this.zmin, this.zmax, this.dz);
        } else if (dy >= this.dy) {
            const delta_dy = (dy - this.dy) / 2;
            this.ymin = this.ymin - delta_dy;
            this.ymax = this.ymax + delta_dy;
            this.dy = this.ymax - this.ymin;
            console.log("new y", delta_dy, this.ymin, this.ymax, this.dy);
        }
    }

    yPix(y) {
        return (this.ymax - y) * this.width / this.dy;
    }

    zPix(z) {
        return (z - this.zmin) * this.height / this.dz;
    }

    yWorld(yPix) {
        return this.ymax - yPix * this.dy / this.width;
    }

    zWorld(zPix) {
        return zPix * this.dz / this.height + this.zmin;
    }

}

/*
export class C_3D {

    //canvas = null;
    //renderer = null;
    //scene = null;
    //controls = null;
    //camera = null;

    constructor() {
        this.canvas1 = document.querySelector('#c3')
        let canvas = this.canvas1
        console.log("can",canvas)
        this.renderer = new THREE.WebGLRenderer({canvas, antialias: true})

        this.fov = 75;
        this.aspect = 2;  // the canvas default
        this.near = 0.1;
        this.far = 5;

        this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
        this.camera.position.z = 3;

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 0, 0);
        this.controls.update();

         this.scene = new THREE.Scene();


    }
}
*/

export {CTrans};