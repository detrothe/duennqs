/** Liefert ein Element per id; wirft, wenn es fehlt (Fehler im HTML). */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} nicht gefunden`);
    return el as T;
}

/** Größe des Browserfensters und Breite der 2D-Grafik in Pixeln */
export const myScreen = {
    clientWidth: 0,
    clientHeight: 0,
    svgWidth: 0,
};
