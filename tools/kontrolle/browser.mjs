// Jeden Testquerschnitt als automatische Sicherung einspielen, Seite neu laden, rechnen, Querschnittswerte lesen.
import fs from 'fs';
const [faelleDatei, ausDatei] = process.argv.slice(2);
const faelle = JSON.parse(fs.readFileSync(faelleDatei, 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let l; for (let i = 0; i < 50; i++) { try { l = await (await fetch('http://127.0.0.1:9333/json/list')).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(l.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) console.log('EXC', JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
const IDS = ['ys', 'zs', 'area', 'area_geom', 'Iys', 'Izs', 'Iyzs', 'I11', 'I22', 'phi_h', 'yM', 'zM', 'I_t', 'I_omega', 'r_1', 'r_2', 'r_omega', 'i_M2', 'i_p2'];

await cmd('Page.enable'); await cmd('Runtime.enable');
await cmd('Page.navigate', { url: 'http://127.0.0.1:4173/' }); await sleep(2500);
await ev(`localStorage.setItem('DUENNQS_einheit_querschnittswerte', 'cm'); localStorage.setItem('DUENNQS_unit_length', 'cm')`);
const ergebnis = {};
for (const [name, f] of Object.entries(faelle)) {
    const eingabe = {
        version: 3, unit_length: 'cm', nnodes: f.knoten.length, nelem: f.elemente.length,
        Vy: '', Vz: '100', Nx: '', Mxp: '10', Mxs: '', Momega: '', My: '100', Mz: '',
        fyRd: '23.5', EMod_ref: '21000', mue_ref: '0.3', material_equal: false, freetext: '',
        node: f.knoten.map(([y, z]) => [String(y), String(z)]),
        elem: f.elemente.map(([a, b, t, E, nu]) => [String(E), String(nu), String(t), a + 1, b + 1]),
    };
    // vor den Skripten der Seite setzen (beim Neuladen sichert die App sonst über pagehide die alte Eingabe)
    const skript = await cmd('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('DUENNQS_current_input', ${JSON.stringify(JSON.stringify({ eingabe: JSON.stringify(eingabe), gerechnet: false }))})` });
    await cmd('Page.reload'); await sleep(2500);
    await cmd('Page.removeScriptToEvaluateOnNewDocument', { identifier: skript.result.identifier });
    const n = await ev(`document.getElementById('id_knoten_tabelle').shadowRoot.getElementById('mytable').rows.length - 1`);
    await ev(`document.getElementById('rechnen').click()`); await sleep(1200);
    const roh = await ev(`(${JSON.stringify(IDS)}).map(i => document.getElementById(i).innerText)`);
    const fehler = await ev(`[...document.querySelectorAll('dialog[open]')].map(d => d.innerText).join(' | ')`);
    ergebnis[name] = Object.fromEntries(IDS.map((k, i) => [k, roh[i]]));
    const knSicherung = await ev(`JSON.parse(JSON.parse(localStorage.getItem('DUENNQS_current_input')).eingabe).node.length`);
    console.log(name, 'Knoten', n, 'in Sicherung', knSicherung, fehler ? 'DIALOG: ' + fehler : '');
    if (fehler) await ev(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
}
fs.writeFileSync(ausDatei, JSON.stringify(ergebnis, null, 1));
ws.close();
