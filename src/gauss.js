export function gauss(n, a, b) {

//***********************************************************************
//                                                                      *
//       function GAUSS to solve  linear equations  A*x=B               *
//                                                                      *
//***********************************************************************

    let i, mem, iz, k, j;
    let c, aji;

    //console.log("in GAUSS");

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
            //console.log("aji : ", aji);
            for (k = i; k < n; k++)
                a[j][k] = a[j][k] - a[i][k] * aji;
//           a[j][i] = aji;
            b[j] = b[j] - b[i] * aji;
            /*
                       printf ("i=%d j=%d k=%d\n",i,j,k);
                       for (ii=0;ii<n;ii++){
                            for (jj=0;jj<n;jj++)
                               printf ("%10.2lf  ",a[ii][jj]);
                            printf ("  b= %10.2lf\n",b[ii]);
                       }
            */
        }
        /*
                printf ("ENDE i=%d j=%d k=%d\n",i,j,k);
                for (ii=0;ii<n;ii++){
                        for (jj=0;jj<n;jj++)
                           printf ("%10.2lf  ",a[ii][jj]);
                        printf ("  b= %10.2lf\n",b[ii]);
                }
        */

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

/*
export function test_main() {

    let a = [];
    a[0] = [25.0, 7.0, 10.0, 13.0, -16.0];
    a[1] = [10.0, 13.0, 16.0, 19.0, 22.0];
    a[2] = [16.0, 19.0, -22.0, 25.0, 28.0];
    a[3] = [22.0, 25.0, 28.0, -31.0, 34.0];
    a[4] = [28.0, -31.0, -34.0, 37.0, -40.0];


    let b = [1.0, 2.0, 3.0, 4.0, 5.0];
    let n = 5;
    let i, j, result;


    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
            console.log(i, j, a[i][j]);
        }
        console.log("  b= ", b[i]);
    }


    result = gauss(n, a, b);

    console.log("result = ", result);
    for (i = 0; i < n; i++) {
        console.log("b" + i + " = " + b[i]);
    }
}
*/