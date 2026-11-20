/** Komma als Dezimaltrenner erlauben; ungültige Eingaben ergeben 0. */
export function testeZahl(wert: string): string | number {
    wert = wert.replace(/,/g, '.');
    if (isNaN(Number(wert))) return 0;
    return wert;
}

/** Zahl im Format der Browsersprache mit min./max. Nachkommastellen (Ergebnistabellen, Grafiken). */
export function myFormat(wert: number, minDecimal: number, maxDecimal: number): string {
    return new Intl.NumberFormat(navigator.language, { minimumFractionDigits: minDecimal, maximumFractionDigits: maxDecimal }).format(wert);
}
