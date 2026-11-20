
import { app } from "./index";
import { resizeTable } from "./base_tabelle.js";
import { saveAs } from 'file-saver';
import { current_unit_length, set_current_unit_length } from "./einstellungen"

//------------------------------------------------------------------------------------------------
function handleFileSelect_read() {
    //--------------------------------------------------------------------------------------------

    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = _ => {
        // you can use this method to get file and perform respective operations

        let files = Array.from(input.files);
        console.log("in select read", files);
        let filename;

        // Loop through the FileList and render image files as thumbnails.
        for (let i = 0, f; f = files[i]; i++) {

            filename = files[0].name;
            console.log("filename: ", files[0].name);

            const reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.

                    console.log("in result", e.target.result);
                    let jobj = JSON.parse(e.target.result);
                    console.log("und zurück", jobj);

                    if (jobj.unit_length === undefined) {
                        console.log("#### jobj.unit_length ####", jobj.unit_length)
                        set_current_unit_length("cm")
                    } else {
                        set_current_unit_length(jobj.unit_length)
                    }

                    // in Tabelle schreiben
                    document.getElementById("input_nodes").value = jobj.nnodes;
                    document.getElementById("input_nelem").value = jobj.nelem;

                    document.getElementById("Vy").value = jobj.Vy;
                    document.getElementById("Vz").value = jobj.Vz;
                    document.getElementById("Nx").value = jobj.Nx
                    document.getElementById("Mxp").value = jobj.Mxp;
                    document.getElementById("Mxs").value = jobj.Mxs;
                    document.getElementById("Momega").value = jobj.Momega;
                    document.getElementById("My").value = jobj.My;
                    document.getElementById("Mz").value = jobj.Mz;

                    document.getElementById("fyRd").value = jobj.fyRd;
                    document.getElementById("EMod_ref").value = jobj.EMod_ref;
                    document.getElementById("mue_ref").value = jobj.mue_ref;

                    resizeTable();

                    const tabelle = document.getElementById("nodeTable");
                    let nSpalten = tabelle.rows[0].cells.length;
                    let i, j;
                    for (i = 1; i < tabelle.rows.length; i++) {
                        for (j = 1; j < nSpalten; j++) {

                            tabelle.rows[i].cells[j].firstElementChild.value = jobj.node[i - 1][j - 1];
                        }
                    }

                    const etabelle = document.getElementById("elemTable");
                    nSpalten = etabelle.rows[0].cells.length;

                    for (i = 1; i < etabelle.rows.length; i++) {
                        for (j = 1; j < nSpalten; j++) {

                            etabelle.rows[i].cells[j].firstElementChild.value = jobj.elem[i - 1][j - 1];
                        }
                    }

                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);

        }
    }

    input.click();
}

//------------------------------------------------------------------------------------------------
async function handleFileSelect_save() {
    //--------------------------------------------------------------------------------------------

    console.log("in select save");

    const elem = document.getElementById("input_nodes");

    if (elem) {

        let i, j;

        let tabelle = document.getElementById('nodeTable');
        let n_nodes = tabelle.rows.length - 1;
        let nSpalten = tabelle.rows[0].cells.length - 1;

        const node = Array.from(Array(n_nodes), () => new Array(nSpalten));

        for (i = 0; i < n_nodes; i++) {
            for (j = 0; j < nSpalten; j++) {
                node[i][j] = tabelle.rows[i + 1].cells[j + 1].firstElementChild.value;
            }
        }

        tabelle = document.getElementById('elemTable');
        let n_elem = tabelle.rows.length - 1;
        nSpalten = tabelle.rows[0].cells.length - 1;

        const elem = Array.from(Array(n_elem), () => new Array(nSpalten));

        for (i = 0; i < n_elem; i++) {
            for (j = 0; j < nSpalten; j++) {
                elem[i][j] = tabelle.rows[i + 1].cells[j + 1].firstElementChild.value;
            }
        }

        let polyData = {
            'unit_length': current_unit_length,
            'nnodes': n_nodes,
            'nelem': n_elem,
            'Vy': document.getElementById('Vy').value,
            'Vz': document.getElementById('Vz').value,
            'Nx': document.getElementById('Nx').value,
            'Mxp': document.getElementById('Mxp').value,
            'Mxs': document.getElementById('Mxs').value,
            'Momega': document.getElementById('Momega').value,
            'My': document.getElementById('My').value,
            'Mz': document.getElementById('Mz').value,

            'fyRd': document.getElementById('fyRd').value,
            'EMod_ref': document.getElementById('EMod_ref').value,
            'mue_ref': document.getElementById('mue_ref').value,

            'elem': elem,
            'node': node
        };

        let jsonse = JSON.stringify(polyData);

        console.log("stringify", jsonse);

        if (app.hasFSAccess) {

            try {
                // (A) CREATE BLOB OBJECT
                const myBlob = new Blob([jsonse], { type: "text/plain" });

                // (B) FILE HANDLER & FILE STREAM
                const fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: "Text file",
                        accept: { "text/plain": [".txt"] }
                    }]
                });

                const fileStream = await fileHandle.createWritable();

                // (C) WRITE FILE
                await fileStream.write(myBlob);
                await fileStream.close();

            } catch (error) {
                alert(error.message);
            }

        } else if (app.isMac) {
            const filename = window.prompt("Name der Datei mit Extension, z.B. test.txt\nDie Datei wird im Default Download Ordner gespeichert");
            download(filename, jsonse);
        } else {

            const filename = window.prompt("Name der Datei mit Extension, z.B. test.txt\nDie Datei wird im Default Download Ordner gespeichert");
            const myFile = new File([jsonse], filename, { type: "text/plain;charset=utf-8" });
            try {
                saveAs(myFile);
            } catch (error) {
                alert(error.message);
            }

        }

    }

}

document.getElementById('readFile').addEventListener('click', handleFileSelect_read, false);
document.getElementById('saveFile').addEventListener('click', handleFileSelect_save, false);

//------------------------------------------------------------------------------------------------
function download(filename, text) {
    //--------------------------------------------------------------------------------------------
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}