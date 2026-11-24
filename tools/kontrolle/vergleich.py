"""Vergleicht die von duennqs angezeigten Querschnittswerte (duennqs.json) mit der Kontrollrechnung (faelle.json)."""
import json, sys
f = json.load(open(sys.argv[1]))
d = json.load(open(sys.argv[2]))
STELLEN = dict(ys=2, zs=2, area=2, area_geom=2, Iys=2, Izs=2, Iyzs=2, I11=1, I22=1, phi_h=2, yM=2, zM=2,
               I_t=1, I_omega=1, r_1=2, r_2=2, r_omega=2, i_M2=2, i_p2=2)


def zahl(t):
    t = t.strip()
    if t in ('-', ''):
        return None
    return float(t.replace('.', '').replace(',', '.'))


auffaellig = 0
for name, fall in f.items():
    k = fall['kontrolle']
    print(f'\n### {name}')
    for key, st in STELLEN.items():
        # φ_h ist bei I11 = I22 (z.B. Kreis, Quadrat) unbestimmt
        if key == 'phi_h' and abs(k['I11'] - k['I22']) <= 1e-9 * k['I11']:
            print(f'{key:9s} duennqs {d[name][key]!r:>16} (unbestimmt, I11 = I22)')
            continue
        dw = zahl(d[name][key])
        kw = k[key]
        tol = 0.5 * 10 ** -st   # Rundung der Anzeige
        if dw is None:
            print(f'{key:9s} duennqs {d[name][key]!r:>16} Kontrolle {kw:16.4f}')
            continue
        ab = dw - kw
        rel = 100 * ab / kw if abs(kw) > 1e-9 else float('nan')
        mark = '' if abs(ab) <= tol * 1.01 or abs(rel) < 1e-4 else '  <<<'
        auffaellig += bool(mark)
        print(f'{key:9s} duennqs {dw:16.4f} Kontrolle {kw:16.4f}  Abw. {ab:+.4f} ({rel:+.5f} %){mark}')

print(f'\n{auffaellig} Abweichung(en) größer als die Rundung der Anzeige (markiert mit <<<)')
sys.exit(1 if auffaellig else 0)
