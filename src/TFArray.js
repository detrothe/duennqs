class TFArray2D {

    constructor(min_Row = 1, max_Row, min_Col = 1, max_Col) {
        this.nrow = max_Row - min_Row + 1;
        this.ncol = max_Col - min_Col + 1;
        this.minRow = min_Row;
        this.maxRow = max_Row;
        this.minCol = min_Col;
        this.maxCol = max_Col;
        this.konstante = -this.minCol * this.nrow - this.minRow;
        this.length = this.nrow * this.ncol;
        this.marray = Array(this.length);
    }

    _(i, j) {                          // get value

        if (i < this.minRow || i > this.maxRow || j < this.minCol || j > this.maxCol) {
            console.log("wrong index in get", i, j);
            return Number.NaN;
        }
        return this.marray[j * this.nrow + i + this.konstante];
    }

    set(i, j, wert) {

        if (i < this.minRow || i > this.maxRow || j < this.minCol || j > this.maxCol) {
            console.log("wrong index in set", i, j);
            return Number.NaN;
        }
        this.marray[j * this.nrow + i + this.konstante] = wert;
    }

    initV(a) {

        for (let i = 0; i < this.length; i++) {
            this.marray[i] = a[i];
        }
    }

    zero() {

        for (let i = 0; i < this.length; i++) {
            this.marray[i] = 0.0;
        }
    }
}


class TFVector {

    constructor(min_Dim = 1, max_Dim) {
        this.length = max_Dim - min_Dim + 1;
        this.minDim = min_Dim;
        this.maxDim = max_Dim;
        this.marray = Array(this.length);
    }

    _(i) {                         // get value

        if (i < this.minDim || i > this.maxDim) {
            console.log("wrong index in get", i);
            return Number.NaN;
        }
        return this.marray[i - this.minDim];
    }

    set(i, wert) {

        if (i < this.minDim || i > this.maxDim) {
            console.log("wrong index in set", i);
            return Number.NaN;
        }
        this.marray[i - this.minDim] = wert;
    }

    initV(a) {

        for (let i = 0; i < this.length; i++) {
            this.marray[i] = a[i];
        }
    }

    zero() {

        for (let i = 0; i < this.length; i++) {
            this.marray[i] = 0.0;
        }
    }
}

export {TFArray2D, TFVector};
