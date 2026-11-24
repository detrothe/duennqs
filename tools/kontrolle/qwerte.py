"""
Unabhängige Kontrollrechnung dünnwandiger Querschnitte (Linienmodell, wie duennqs ohne Eigenanteile t³).

Eingabe: Knoten (y, z) in cm, Elemente (n1, n2, t, E, nu) mit Knotennummern ab 0.
Wölbfunktion: Integration entlang eines Spannbaums, geschlossene Zellen über das Bredt'sche
Gleichungssystem (Zirkulationen ψ je Zelle) – bewusst ein anderer Weg als die FE-Lösung in duennqs.
"""
import math
import numpy as np


def querschnittswerte(knoten, elemente, Eref=21000.0, nuref=0.3):
    Gref = Eref / (2 * (1 + nuref))
    Y = np.array([k[0] for k in knoten], float)
    Z = np.array([k[1] for k in knoten], float)
    E = []
    for (a, b, t, Ee, nu) in elemente:
        l = math.hypot(Y[b] - Y[a], Z[b] - Z[a])
        E.append(dict(a=a, b=b, t=t, l=l, n=Ee / Eref, g=(Ee / (2 * (1 + nu))) / Gref))

    A = sum(e['n'] * e['l'] * e['t'] for e in E)
    A_geom = sum(e['l'] * e['t'] for e in E)
    ys = sum(e['n'] * e['l'] * e['t'] * (Y[e['a']] + Y[e['b']]) / 2 for e in E) / A
    zs = sum(e['n'] * e['l'] * e['t'] * (Z[e['a']] + Z[e['b']]) / 2 for e in E) / A
    y, z = Y - ys, Z - zs

    def int2(e, u, v):   # ∫ u v dA (ideell) für linear verlaufende u, v
        a, b = e['a'], e['b']
        return e['n'] * e['t'] * e['l'] * (2 * u[a] * v[a] + u[a] * v[b] + u[b] * v[a] + 2 * u[b] * v[b]) / 6

    Iyy = sum(int2(e, z, z) for e in E)
    Izz = sum(int2(e, y, y) for e in E)
    Iyz = sum(int2(e, y, z) for e in E)

    # Hauptachsen: Winkel φ mit z_h = -sin φ·y + cos φ·z, I11 = max ∫ z_h² dA (Suche statt Formel)
    def I_von(phi):
        s, c = math.sin(phi), math.cos(phi)
        return Iyy * c * c - 2 * Iyz * s * c + Izz * s * s
    phis = np.linspace(-math.pi / 2, math.pi / 2, 200001)
    werte = Iyy * np.cos(phis) ** 2 - 2 * Iyz * np.sin(phis) * np.cos(phis) + Izz * np.sin(phis) ** 2
    phi = float(phis[np.argmax(werte)])
    # Feinsuche
    for schritt in [1e-5, 1e-7, 1e-9]:
        kand = np.linspace(phi - 10 * schritt, phi + 10 * schritt, 201)
        phi = float(kand[np.argmax([I_von(p) for p in kand])])
    I11, I22 = I_von(phi), I_von(phi + math.pi / 2)
    s, c = math.sin(phi), math.cos(phi)
    yh, zh = c * y + s * z, -s * y + c * z

    # ---- Wölbfunktion bezogen auf den Schwerpunkt (Pol), Hauptachsensystem
    nk = len(knoten)
    nachbarn = {i: [] for i in range(nk)}
    for i, e in enumerate(E):
        nachbarn[e['a']].append(i)
        nachbarn[e['b']].append(i)
    rt_int = [yh[e['a']] * zh[e['b']] - yh[e['b']] * zh[e['a']] for e in E]   # ∫ r_t ds je Element (a→b)

    # Spannbaum (BFS) und Zellen aus den übrigen Elementen
    wurzel = E[0]['a']
    eltern = {wurzel: (None, None)}   # Knoten → (Elternknoten, Element)
    reihenfolge = [wurzel]
    baum = set()
    for k in reihenfolge:
        for i in nachbarn[k]:
            e = E[i]
            m = e['b'] if e['a'] == k else e['a']
            if m not in eltern:
                eltern[m] = (k, i)
                baum.add(i)
                reihenfolge.append(m)
    if len(eltern) != nk:
        raise ValueError('Querschnitt nicht zusammenhängend')

    def pfad_zur_wurzel(k):
        p = []
        while eltern[k][0] is not None:
            p.append((eltern[k][0], k, eltern[k][1]))   # (von, nach, Element) Richtung Blatt
            k = eltern[k][0]
        return p

    zellen = []   # Liste von {Element: Vorzeichen} für den Umlauf a→b des Sehnenelements
    for i, e in enumerate(E):
        if i in baum:
            continue
        umlauf = {i: +1}
        # von b zurück zur Wurzel, dann von der Wurzel zu a: Umlauf a→b→…→a
        for (von, nach, j) in pfad_zur_wurzel(e['b']):      # gegen die Baumrichtung (nach → von)
            umlauf[j] = umlauf.get(j, 0) + (+1 if (E[j]['a'] == nach) else -1)
        for (von, nach, j) in pfad_zur_wurzel(e['a']):      # in Baumrichtung (von → nach)
            umlauf[j] = umlauf.get(j, 0) + (+1 if (E[j]['a'] == von) else -1)
        zellen.append({j: v for j, v in umlauf.items() if v != 0})

    nz = len(zellen)
    psi = np.zeros(nz)
    if nz:
        K = np.zeros((nz, nz))
        rhs = np.zeros(nz)
        for ci, zc in enumerate(zellen):
            rhs[ci] = sum(v * rt_int[j] for j, v in zc.items())
            for cj, zd in enumerate(zellen):
                K[ci, cj] = sum(v * zd[j] * E[j]['l'] / (E[j]['g'] * E[j]['t']) for j, v in zc.items() if j in zd)
        psi = np.linalg.solve(K, rhs)
    Psi = np.zeros(len(E))   # Schubfluss je Element (Richtung a→b) pro Einheitsverdrillung
    for ci, zc in enumerate(zellen):
        for j, v in zc.items():
            Psi[j] += v * psi[ci]

    omega = np.zeros(nk)
    for k in reihenfolge[1:]:
        von, i = eltern[k]
        e = E[i]
        d = rt_int[i] - Psi[i] * e['l'] / (e['g'] * e['t'])   # ω(b) − ω(a)
        omega[k] = omega[von] + (d if e['a'] == von else -d)
    # Kontrolle: Verträglichkeit an den Sehnenelementen
    rest = max([abs(omega[E[i]['b']] - omega[E[i]['a']] - (rt_int[i] - Psi[i] * E[i]['l'] / (E[i]['g'] * E[i]['t'])))
                for i in range(len(E)) if i not in baum] + [0.0])

    It_offen = sum(e['g'] * e['l'] * e['t'] ** 3 / 3 for e in E)
    It_geschl = float(sum(Psi[i] * rt_int[i] for i in range(len(E))))

    yMh = sum(int2(e, omega, zh) for e in E) / I11
    zMh = -sum(int2(e, omega, yh) for e in E) / I22
    one = np.ones(nk)
    om = omega - zh * yMh + yh * zMh
    om = om - sum(int2(e, om, one) for e in E) / A
    Iw = sum(int2(e, om, om) for e in E)

    def simpson(f):   # ∫ f dA (ideell) für bis zu kubische f, f(Knoten a, Knoten b, Mitte)
        return sum(e['n'] * e['t'] * e['l'] / 6 * (f(e['a'], None) + 4 * f(None, e) + f(e['b'], None)) for e in E)

    def werte_an(k, e, feld):
        if k is not None:
            return feld[k]
        return (feld[e['a']] + feld[e['b']]) / 2

    def fy(k, e):
        yy, zz = werte_an(k, e, yh), werte_an(k, e, zh)
        return yy * (yy * yy + zz * zz)

    def fz(k, e):
        yy, zz = werte_an(k, e, yh), werte_an(k, e, zh)
        return zz * (yy * yy + zz * zz)

    def fw(k, e):
        yy, zz, ww = werte_an(k, e, yh), werte_an(k, e, zh), werte_an(k, e, om)
        return ww * (yy * yy + zz * zz)

    r1 = simpson(fy) / I22 - 2 * yMh
    r2 = simpson(fz) / I11 - 2 * zMh
    rw = simpson(fw) / Iw if Iw > 1e-9 else 0.0
    # Nachbau der alten duennqs-Formeln (bis Version 2.5.0, Fehler behoben in 2.5.1) zur Erklärung von Abweichungen:
    # r1/r2 mit geometrischer statt ideeller Fläche, rω mit yMh² statt y_m² (und geometrischer Fläche)
    def geom(f):
        return sum(e['t'] * e['l'] / 6 * (f(e['a'], None) + 4 * f(None, e) + f(e['b'], None)) for e in E)
    r1_geom = geom(fy) / I22 - 2 * yMh
    rw_dq = 0.0
    for e in E:
        a_, b_ = e['a'], e['b']
        ym, zm, wm = (yh[a_] + yh[b_]) / 2, (zh[a_] + zh[b_]) / 2, (om[a_] + om[b_]) / 2
        dy, dz, dw = yh[b_] - yh[a_], zh[b_] - zh[a_], om[b_] - om[a_]
        rw_dq += (yMh * yMh * wm + (wm * dy * dy + 2 * ym * dy * dw) / 12) * e['l'] * e['t']
        rw_dq += (zMh * zMh * wm + (wm * dz * dz + 2 * zm * dz * dw) / 12) * e['l'] * e['t']
    rw_dq = rw_dq / Iw if Iw > 1e-9 else 0.0
    iP2 = (I11 + I22) / A
    iM2 = iP2 + yMh ** 2 + zMh ** 2
    yM = c * yMh - s * zMh
    zM = s * yMh + c * zMh
    return dict(ys=ys, zs=zs, area=A, area_geom=A_geom, Iys=Iyy, Izs=Izz, Iyzs=Iyz, I11=I11, I22=I22,
                phi_h=math.degrees(phi), yM=yM, zM=zM, I_t=It_offen + It_geschl, I_omega=Iw,
                r_1=r1, r_2=r2, r_omega=rw, i_M2=iM2, i_p2=iP2,
                _It_offen=It_offen, _It_geschl=It_geschl, _zellen=nz, _rest=rest, _r1_alt_bis_2_5_0=r1_geom, _rw_alt_bis_2_5_0=rw_dq)
