
class CTrans {
    constructor(ymin = 0.0, zmin = 0.0, ymax = 1.0, zmax = 1.0, clientWidth=100.0, clientHeight=100.0) {
        this.init(ymin, zmin, ymax, zmax, clientWidth, clientHeight)
    }

    init(ymin, zmin, ymax, zmax, clientWidth, clientHeight) {

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

        console.log("dy,dz", this.dy, this.dz);

        this.height = clientHeight - 1; //  .getElementById("my-svg").clientHeight - 1;
        this.width = clientWidth - 1;

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

export {CTrans};