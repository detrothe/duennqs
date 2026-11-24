"""Testquerschnitte (cm, kN/cm²) und Formelwerte; schreibt faelle.json für den Browserlauf."""
import json, math, sys
from qwerte import querschnittswerte

E0, NU0 = 21000.0, 0.3


def el(a, b, t, E=E0, nu=NU0):
    return (a, b, t, E, nu)


faelle = {}

# 1) I-Profil mit ungleichen Flanschen (Mittellinienmaße), Steg mittig
bo, to, bu, tu, h, ts = 20.0, 1.5, 30.0, 2.0, 40.0, 1.0
m = max(bo, bu) / 2
kn = [(m - bo / 2, 0), (m, 0), (m + bo / 2, 0), (m - bu / 2, h), (m, h), (m + bu / 2, h)]
els = [el(0, 1, to), el(1, 2, to), el(1, 4, ts), el(3, 4, tu), el(4, 5, tu)]
If_o, If_u = to * bo ** 3 / 12, tu * bu ** 3 / 12
Ao, Au, Aw = bo * to, bu * tu, h * ts
zs = (Au * h + Aw * h / 2) / (Ao + Au + Aw)
formel = dict(area=Ao + Au + Aw, zs=zs,
              Iys=Ao * zs ** 2 + Au * (h - zs) ** 2 + ts * h ** 3 / 12 + Aw * (h / 2 - zs) ** 2,
              Izs=If_o + If_u,
              I_t=(bo * to ** 3 + bu * tu ** 3 + h * ts ** 3) / 3,
              I_omega=If_o * If_u / (If_o + If_u) * h ** 2,
              # Schubmittelpunkt: Abstand vom oberen Flansch h·If_u/(If_o+If_u), bezogen auf S
              zM=h * If_u / (If_o + If_u) - zs)
faelle['I ungleich 20/1,5 – 30/2 – 40/1'] = (kn, els, formel)

# 2) Rechteck-Hohlprofil 20 × 30 × 1, scharfe Ecken
b, hh, t = 20.0, 30.0, 1.0
kn = [(0, 0), (b, 0), (b, hh), (0, hh)]
els = [el(0, 1, t), el(1, 2, t), el(2, 3, t), el(3, 0, t)]
formel = dict(area=2 * (b + hh) * t,
              Iys=2 * b * t * (hh / 2) ** 2 + 2 * t * hh ** 3 / 12,
              Izs=2 * hh * t * (b / 2) ** 2 + 2 * t * b ** 3 / 12,
              I_t=4 * (b * hh) ** 2 / (2 * (b + hh) / t) + 2 * (b + hh) * t ** 3 / 3,   # Bredt + offener Anteil wie duennqs
              I_omega=t * b ** 2 * hh ** 2 / 24 * (hh - b) ** 2 / (b + hh))               # dünnwandiger Kasten, konst. t
faelle['RHP 20 × 30 × 1'] = (kn, els, formel)


def rhp_rund(b, hh, t, r, n):
    pts = []
    def p(y, z):
        if pts and abs(pts[-1][0] - y) < 1e-9 and abs(pts[-1][1] - z) < 1e-9:
            return
        if pts and abs(pts[0][0] - y) < 1e-9 and abs(pts[0][1] - z) < 1e-9:
            return
        pts.append((y, z))
    mitten = [(b - r, r), (b - r, hh - r), (r, hh - r), (r, r)]
    p(r, 0)
    for i, (cy, cz) in enumerate(mitten):
        st = (i - 1) * math.pi / 2
        p(cy + r * math.cos(st), cz + r * math.sin(st))
        for k in range(1, n + 1):
            ph = st + k * math.pi / 2 / n
            p(cy + r * math.cos(ph), cz + r * math.sin(ph))
    els = [el(i, (i + 1) % len(pts), t) for i in range(len(pts))]
    return pts, els


# 3) RHP mit runden Ecken r = 5: Vergleich mit exakter Kreisbogen-Geometrie
b, hh, t, r = 20.0, 30.0, 1.0, 5.0
U = 2 * (b + hh) - 8 * r + 2 * math.pi * r
Am = b * hh - (4 - math.pi) * r ** 2
fein = querschnittswerte(*rhp_rund(b, hh, t, r, 400))
formel = dict(area=U * t, I_t=4 * Am ** 2 / (U / t) + U * t ** 3 / 3, Iys=fein['Iys'], Izs=fein['Izs'], I_omega=fein['I_omega'])
for n in (3, 12):
    kn, els = rhp_rund(b, hh, t, r, n)
    faelle[f'RHP 20 × 30 × 1, r = 5, n = {n}'] = (kn, els, formel)

# 4) U-Profil h = 30, b = 10, tf = 1,2, ts = 0,8
hh, b, tf, ts = 30.0, 10.0, 1.2, 0.8
kn = [(0, 0), (b, 0), (b, hh), (0, hh)]
els = [el(0, 1, tf), el(1, 2, ts), el(2, 3, tf)]
Af, As = b * tf, hh * ts
ys = 2 * Af * (b / 2) / (2 * Af + As)          # von der Flanschspitze (ȳ = 0) gemessen … Steg bei ȳ = b
ys = (2 * Af * b / 2 + As * b) / (2 * Af + As)
e = 3 * b ** 2 * tf / (6 * b * tf + hh * ts)   # Schubmittelpunkt hinter dem Steg (außen), ab Stegmitte
formel = dict(area=2 * Af + As, ys=ys,
              Iys=2 * Af * (hh / 2) ** 2 + ts * hh ** 3 / 12,
              I_t=(2 * b * tf ** 3 + hh * ts ** 3) / 3,
              I_omega=tf * b ** 3 * hh ** 2 / 12 * (3 * b * tf + 2 * hh * ts) / (6 * b * tf + hh * ts),
              yM=(b + e) - ys)                      # ȳ wächst nach links zum Steg hin
faelle['U 30/10, tf = 1,2, ts = 0,8'] = (kn, els, formel)

# 5) Kreis-Hohlprofil d = 30 (Mittellinie), t = 1, n-Eck
d, t = 30.0, 1.0
rr = d / 2
formel = dict(area=math.pi * d * t, Iys=math.pi * rr ** 3 * t, Izs=math.pi * rr ** 3 * t,
              I_t=2 * math.pi * rr ** 3 * t + math.pi * d * t ** 3 / 3, I_omega=0.0)
for n in (24, 72):
    kn = [(rr * math.cos(2 * math.pi * i / n), rr * math.sin(2 * math.pi * i / n)) for i in range(n)]
    els = [el(i, (i + 1) % n, t) for i in range(n)]
    faelle[f'KHP d = 30, t = 1, n = {n}'] = (kn, els, formel)

# 6) Startbeispiel: Hohlkasten mit Flügeln
kn = [(0, 0), (30, 0), (110, 0), (140, 0), (85, 60), (55, 60)]
inz = [(1, 2), (2, 3), (3, 4), (3, 5), (2, 6), (5, 6)]
faelle['Startbeispiel (Kasten mit Flügeln)'] = (kn, [el(a - 1, b - 1, 1.5) for a, b in inz], {})

# 7) Startbeispiel mit Flügeln aus anderem Material (E = 10500, ν = 0,2)
els = [el(a - 1, b - 1, 1.5) for a, b in inz]
els[0] = el(0, 1, 1.5, 10500.0, 0.2)
els[2] = el(2, 3, 1.5, 10500.0, 0.2)
faelle['Startbeispiel, Flügel E = 10500, ν = 0,2'] = (kn, els, {})

# 8) Unsymmetrischer offener Querschnitt
kn = [(0, 0), (12, 0), (12, 30), (20, 30), (20, 35)]
els = [el(0, 1, 1.0), el(1, 2, 0.8), el(2, 3, 1.2), el(3, 4, 1.0)]
faelle['offen, unsymmetrisch'] = (kn, els, {})

# 9) Zweizelliger Kasten (mittlerer Steg), unterschiedliche Dicken
kn = [(0, 0), (20, 0), (40, 0), (40, 25), (20, 25), (0, 25)]
els = [el(0, 1, 1.2), el(1, 2, 1.2), el(2, 3, 0.8), el(3, 4, 1.0), el(4, 5, 1.0), el(5, 0, 0.8), el(1, 4, 0.6)]
faelle['zweizelliger Kasten 40 × 25'] = (kn, els, {})

aus = {}
for name, (kn, els, formel) in faelle.items():
    k = querschnittswerte(kn, els, E0, NU0)
    aus[name] = dict(knoten=kn, elemente=[list(e) for e in els], kontrolle=k, formel=formel)
json.dump(aus, open(sys.argv[1], 'w'), indent=1)
for name, a in aus.items():
    k = a['kontrolle']
    print(f"{name}: Zellen {k['_zellen']}, Rest {k['_rest']:.1e}, It offen {k['_It_offen']:.2f}, geschl. {k['_It_geschl']:.2f}")
