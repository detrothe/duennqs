import { jsPDF } from "jspdf";

export function my_jspdf() {
// Default export is a4 paper, portrait, using millimeters for units
const doc = new jsPDF();

doc.text("Hello world!", 10, 10);
doc.save("a4.pdf");
}