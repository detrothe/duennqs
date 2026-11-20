export function gauss(n: number, a: number[][], b: number[] | Float64Array): number {

//***********************************************************************
//                                                                      *
//       function GAUSS to solve  linear equations  A*x=B               *
//                                                                      *
//***********************************************************************

    let i: number, mem: number, iz: number, k: number, j: number;
    let c: number, aji: number;

//                   calculate solution vector b

    for (i = 0; i < n - 1; i++) {

//                   pivoting

        mem = i;
        c = a[i][i];
        for (iz = i + 1; iz < n; iz++) {
            if (Math.abs(a[iz][i]) > Math.abs(c)) {
                c = a[iz][i];
                mem = iz;
            }
        }
        if (c === 0.0) {
            console.log("S I N G U L A E R E   M A T R I X      column : ", i);
            console.log("GAUSS");
            return (1);
        }

        if (mem !== i) {
            for (k = i; k < n; k++) {
                c = a[i][k];
                a[i][k] = a[mem][k];
                a[mem][k] = c;
            }
            c = b[i];
            b[i] = b[mem];
            b[mem] = c;
        }

        for (j = i + 1; j < n; j++) {
            aji = a[j][i] / a[i][i];
            for (k = i; k < n; k++)
                a[j][k] = a[j][k] - a[i][k] * aji;
            b[j] = b[j] - b[i] * aji;
        }

    }

    if (a[n - 1][n - 1] === 0.0) {
        console.log("S I N G U L A E R E   M A T R I X      column : ", n);
        console.log("GAUSS");
        return (1);
    }

    b[n - 1] = b[n - 1] / a[n - 1][n - 1];
    for (i = n - 2; i >= 0; i--) {
        c = 0.0;
        for (j = i + 1; j < n; j++) c = c + a[i][j] * b[j];
        b[i] = (b[i] - c) / a[i][i];
    }

    return (0);

}
