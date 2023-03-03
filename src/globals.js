export let berechnung_erfolgreich = false;
export let berechnung_erforderlich = true;

export function berechnungErfolgreich ( wert ) {
    berechnung_erfolgreich = wert;
    document.getElementById("resize").setAttribute('disabled',true)
    document.getElementById("rechnen").style.color="#000000"
}
export function berechnungErforderlich ( wert ) {
    berechnung_erforderlich = wert;
    document.getElementById("resize").setAttribute('disabled',true)
    document.getElementById("rechnen").style.color="#dd0000"
    document.getElementById("info_berechnung").innerText = "Neue Berechnung erforderlich"
}
