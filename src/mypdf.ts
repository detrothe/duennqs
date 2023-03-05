import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

//----------------------------------------------------------------------------------------------
export function my_jspdf() {
    //----------------------------------------------------------------------------------------------

    // Default export is a4 paper, portrait, using millimeters for units
    const doc = new jsPDF();

    doc.text("Hello world!", 10, 10);

    autoTable(doc, {
        head: [['Name', 'Email', 'Country']],
        body: [
            ['David', 'david@example.com', 'Sweden'],
            ['Castille', 'castille@example.com', 'Spain'],
            // ...
        ],
    })

    autoTable(doc, { html: '#nodeTable' });
    autoTable(doc, { html: '#elemTable' });

    doc.save("a4.pdf");

    document.getElementById("id_pdf_info").innerText="pdf-file saved with name " + "a4.pdf" + " in your Download folder"
}