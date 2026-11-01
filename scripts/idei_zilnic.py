#!/usr/bin/env python3
"""Robotul de poze zilnice pentru pagina „Idei de amenajare".

Rulează o dată pe zi din GitHub Actions: ia N poze din rezerva verificată
(data/pool-idei.json), le descarcă de pe Pexels, le pregătește pentru web
(1100 px JPG + WebP, plus copii WebP de 480 și 800 px), le pune la COADA galeriei
și scoate cele mai vechi poze ALE ROBOTULUI peste plafon. Apoi regenerează
idei-amenajare.html.

Reguli (1 nov 2026, după ce robotul scosese toate ideile alese de mână):
- images/idei/_alese.txt = ideile alese de mână de fondator. Robotul doar le CITEȘTE:
  nu le scoate, nu le mută, nu le șterge fișierele. Ele stau primele în galerie.
- pozele noi se adaugă la coadă; plafonul (IDEI_MAX) taie doar din pozele robotului.
- titlul, descrierea și textul alternativ descriu POZA REALĂ: vin din rezervă
  (verificate cu ochii, câmpurile titlu/desc/alt_ro) sau, pentru o poză încă
  neverificată, se compun din descrierea Pexels a pozei (text_din_alt).
- se publică doar poze cu "ok": true în rezervă; o poză neverificată (fără "ok")
  trebuie să treacă filtrul pe metadate (trece_filtrul): fără oameni, mărci,
  electronice, cutii, magazine, hoteluri etc.
- pozele scoase de om din galerie stau în images/idei/_scoase/ (nu se urcă pe site)
  și nu se mai publică niciodată — excluderea e pe ID-ul Pexels, indiferent de numele
  fișierului sau de categorie.
"""
import os, re, json, html, shutil, subprocess, sys, urllib.parse, urllib.request

ROOT    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG     = os.path.join(ROOT, "images", "idei")
ALESE   = os.path.join(IMG, "_alese.txt")
LISTA   = os.path.join(IMG, "_lista.txt")
CREDIT  = os.path.join(IMG, "_credite.txt")
CRED_AL = os.path.join(IMG, "_credite_alese.txt")       # creditele celor alese de mână (doar citite)
DIMS    = os.path.join(IMG, "_dimensiuni.txt")
SCOASE  = os.path.join(IMG, "_scoase")
MOTIVE  = os.path.join(SCOASE, "MOTIVE.txt")
POOL    = os.path.join(ROOT, "data", "pool-idei.json")
PAGE    = os.path.join(ROOT, "idei-amenajare.html")

PE_ZI       = int(os.environ.get("IDEI_PE_ZI", "10"))
MAX_GALERIE = int(os.environ.get("IDEI_MAX", "150"))   # total pe pagină, cu tot cu cele alese de mână
WA          = "https://wa.me/40749572087?text="
SLUG        = {"Bucătării": "bucatarie", "Dormitoare": "dormitor", "Dressing": "dressing", "Living": "living"}
ORDINE      = ["Bucătării", "Dormitoare", "Living", "Dressing"]
LATIMI      = (480, 800)                                # copii WebP pentru srcset
SIZES       = "(max-width: 701px) calc(100vw - 40px), (max-width: 1043px) calc(50vw - 31px), 366px"

# ── filtrul pe metadate (pentru poze neverificate cu ochii) ─────────────────
INTERZISE = r"""
 person persons people man men woman women girl girls boy boys child children kid kids baby toddler family couple
 lady guy model portrait face faces hand hands holding sitting standing lying sleeping relaxing reading working smiling
 laptop computer keyboard mouse monitor screen phone smartphone tablet headphones speaker camera printer
 logo brand acer apple macbook iphone samsung dell lenovo asus ikea bosch whirlpool kitchenaid smeg nespresso
 box boxes cardboard moving package packages carton
 prison jail cell hospital hotel hostel motel lobby restaurant cafe bar pub shop store boutique showroom mall market
 library bookstore museum office classroom school church
 food meal breakfast dinner lunch cake fruit fruits vegetables bread cooking cook baking coffee tea wine beer whisky drink drinks cocktail
 dog dogs cat cats puppy kitten pet pets animal bird
 car street outdoor outdoors exterior facade garden yard pool beach balcony terrace
 bathroom toilet shower bathtub
 construction renovation repair tools painting
 christmas halloween party wedding
 clothes clothing dress dresses shirt shirts fashion hanger hangers shoes sneakers
"""
INTERZISE = set(INTERZISE.split())
NECESARE = set("""kitchen kitchens bedroom bedrooms bed beds wardrobe wardrobes closet closets cabinet cabinets cabinetry
 cupboard cupboards shelf shelves shelving bookcase bookshelf bookshelves dresser drawers drawer sideboard
 living room interior furniture island counter countertop dressing walk-in nightstand headboard tv""".split())

def cuvinte(t):
    return set(re.findall(r"[a-z][a-z-]*", (t or "").lower()))

def trece_filtrul(p):
    """True dacă descrierea Pexels (alt + adresa pozei) nu are nimic interzis și vorbește de mobilă/interior."""
    slug = (p.get("url") or "").rstrip("/").rsplit("/", 1)[-1]
    w = cuvinte(p.get("alt", "")) | cuvinte(slug.replace("-", " "))
    if w & INTERZISE:
        return False
    return bool(w & NECESARE)

# ── text din descrierea Pexels (doar pentru poze neverificate) ──────────────
CULORI = [  # (cuvinte englezești, feminin, masculin/neutru)
    (("white",), "albă", "alb"), (("black",), "neagră", "negru"), (("grey", "gray"), "gri", "gri"),
    (("beige", "cream"), "bej", "bej"), (("green", "sage", "olive"), "verde", "verde"),
    (("blue", "navy"), "albastră", "albastru"), (("pink",), "roz", "roz"),
    (("wood", "wooden", "oak", "walnut", "timber"), "din lemn", "din lemn"),
]
DETALII = {  # cuvânt -> (fragment de titlu, descriere)
    "Bucătării": [
        (("island",), "cu insulă", "Insula adaugă blat de lucru și depozitare pe ambele fețe."),
        (("marble",), "cu blat de marmură", "Blatul se alege după cum gătești; corpurile se croiesc pe pereții tăi."),
        (("open shelves", "open shelving", "shelves"), "cu rafturi deschise", "Rafturi deschise în locul unor corpuri suspendate — camera pare mai largă."),
        (("bar", "stools"), "cu bar și scaune înalte", "Barul desparte bucătăria de zona de zi fără să ridici perete."),
        (("dining",), "cu loc de luat masa", "Bucătăria și zona de masă croite ca un singur ansamblu."),
        (("minimalist", "handleless"), "minimalistă", "Fronturi simple, fără detalii în plus — totul se citește ca o suprafață."),
    ],
    "Dormitoare": [
        (("wardrobe", "closet"), "cu dulap", "Dulapul se croiește pe toată înălțimea camerei, fără spațiu pierdut deasupra."),
        (("headboard",), "cu tăblie", "Tăblia se face pe lățimea patului tău, în finisajul ales."),
        (("desk",), "cu birou", "Biroul intră în același corp cu dulapul și rafturile."),
        (("nightstand", "nightstands"), "cu noptiere", "Noptierele se potrivesc la înălțimea patului tău."),
        (("minimalist",), "minimalist", "Puține piese, bine croite — camera rămâne liberă."),
    ],
    "Living": [
        (("tv", "television"), "cu perete TV", "Corpul TV se croiește pe lungimea peretelui, cu loc pentru cabluri."),
        (("bookshelf", "bookshelves", "bookcase", "shelves", "shelving"), "cu rafturi", "Rafturile se calculează pe ce vrei să pui pe ele, de la cărți la obiecte."),
        (("sideboard", "cabinet", "cabinets"), "cu comodă joasă", "Corp jos pe lungimea peretelui — depozitare mare, aspect liniștit."),
        (("minimalist",), "minimalist", "Uși fără mâner, care se citesc ca un perete."),
    ],
    "Dressing": [
        (("walk-in",), "walk-in", "Rafturi și bare pe toți pereții, croite pe ce ai de pus."),
        (("shelves", "shelving"), "cu rafturi", "Rafturi pe toată înălțimea — vezi tot dintr-o privire."),
        (("drawers",), "cu sertare", "Sertare pentru lucrurile mici, rafturi și bare pentru rest."),
        (("mirror",), "cu oglindă", "Oglinda intră în dulap și nu mai ocupă perete separat."),
        (("sliding",), "cu uși glisante", "Ușile glisante nu au nevoie de loc ca să se deschidă."),
    ],
}
TIP = {"Bucătării": ("Bucătărie", True), "Dormitoare": ("Dormitor", False),
       "Living": ("Living", False), "Dressing": ("Dressing", False)}
GENERIC = {"Bucătării": "Corpurile se croiesc pe pereții tăi și în jurul electrocasnicelor.",
           "Dormitoare": "Se croiește pe dimensiunile camerei tale, în finisajul ales.",
           "Living": "Croit pe lungimea peretelui tău, nu pe module standard.",
           "Dressing": "Rafturi, bare și sertare croite pe ce ai de depozitat."}

def text_din_alt(p):
    """(titlu, descriere, alt) în română, compuse din descrierea Pexels a pozei."""
    cat = p["cat"]; a = " " + (p.get("alt") or "").lower() + " "
    nume, fem = TIP[cat]
    culoare = ""
    for en, f, m in CULORI:
        if any(re.search(r"\b" + re.escape(x) + r"\b", a) for x in en):
            culoare = f if fem else m
            break
    gasite = [(t, d) for en, t, d in DETALII[cat] if any(re.search(r"\b" + re.escape(x) + r"\b", a) for x in en)]
    adj = [t for t, _ in gasite if not t.startswith("cu ")][:1]
    cu  = [t for t, _ in gasite if t.startswith("cu ")][:2]
    if len(cu) == 2: cu[1] = cu[1][3:]
    lemn = culoare == "din lemn"
    parti = [nume] + ([culoare] if culoare and not lemn else []) + adj + (["din lemn"] if lemn else [])
    titlu = " ".join(parti) + ((" " + " și ".join(cu)) if cu else "")
    if titlu == nume:                                     # nimic recunoscut în descriere
        titlu += (" modernă" if fem else " modern") if " modern" in a else " croit pe măsură" if not fem else " croită pe măsură"
    desc = gasite[0][1] if gasite else GENERIC[cat]
    alt = titlu + " — idee de amenajare"
    return titlu[:60], desc, alt

# ── unelte ───────────────────────────────────────────────────────────────────
def magick(*args):
    exe = shutil.which("magick") or shutil.which("convert")
    if not exe: raise SystemExit("ImageMagick lipsește")
    subprocess.run([exe, *args], check=True)

def dimensiuni(path):
    exe = shutil.which("magick")
    cmd = [exe, "identify", "-format", "%w %h", path] if exe else ["identify", "-format", "%w %h", path]
    w, h = subprocess.run(cmd, check=True, capture_output=True, text=True).stdout.split()[:2]
    return int(w), int(h)

def citeste(path):
    if not os.path.exists(path): return []
    return [l.rstrip("\n") for l in open(path, encoding="utf-8") if l.strip() and not l.startswith("#")]

def scrie(path, randuri, antet=""):
    with open(path, "w", encoding="utf-8") as f:
        if antet: f.write(antet)
        f.write("\n".join(randuri) + ("\n" if randuri else ""))

def fisiere_poza(base):
    return [os.path.join(IMG, base + e) for e in (".jpg", ".webp")] + \
           [os.path.join(IMG, f"{base}-{w}.webp") for w in LATIMI]

def pregateste(jpg, base):
    """1100 px JPG + WebP și copiile WebP de 480/800 px; întoarce (w, h) ale JPG-ului."""
    magick(jpg, "-resize", "1100x>", "-quality", "84", "-strip", jpg)
    magick(jpg, "-quality", "76", "-define", "webp:method=6", os.path.join(IMG, base + ".webp"))
    for w in LATIMI:
        magick(jpg, "-resize", f"{w}x", "-quality", "76", "-define", "webp:method=6",
               os.path.join(IMG, f"{base}-{w}.webp"))
    for f in fisiere_poza(base):
        if os.path.exists(f): os.chmod(f, 0o644)
    return dimensiuni(jpg)

def base_din(p):
    return p.get("base") or f"{SLUG[p['cat']]}_{p['id']}"

def main():
    pool    = json.load(open(POOL, encoding="utf-8"))
    alese   = citeste(ALESE)
    lista   = citeste(LISTA)
    credite = citeste(CREDIT)
    dims    = {r.split("|")[0]: r for r in citeste(DIMS)}
    if not alese:
        raise SystemExit("images/idei/_alese.txt lipsește sau e gol — nu ating galeria fără ideile alese de mână")
    alese_base = {r.split("|")[0] for r in alese}
    for b in alese_base:
        if not all(os.path.exists(os.path.join(IMG, b + e)) for e in (".jpg", ".webp")):
            raise SystemExit(f"lipsește poza aleasă de mână {b} — mă opresc, nu regenerez pagina")
    pid = lambda base: base.rsplit("_", 1)[-1]           # ID-ul Pexels din numele fișierului
    scoase_id = {pid(r.split("|")[0]) for r in citeste(MOTIVE)}
    respinse_id = {str(p["id"]) for p in pool if p.get("ok") is False}
    # gardă: o poză scoasă (ID în _scoase) nu rămâne în galerie nici dacă a rămas în listă
    lista = [r for r in lista if pid(r.split("|")[0]) not in scoase_id]
    pe_galerie_id = {pid(r.split("|")[0]) for r in lista} | {pid(b) for b in alese_base}
    def eligibila(p):
        i = str(p["id"])
        if i in pe_galerie_id or i in scoase_id or i in respinse_id: return False
        if p.get("ok") is True: return True
        if "ok" not in p: return trece_filtrul(p)       # neverificată cu ochii: doar dacă trece filtrul
        return False                                      # "ok": false = respinsă la verificare
    ramase = [p for p in pool if eligibila(p)]
    print(f"rezervă eligibilă: {len(ramase)} poze")

    pe_cat = {}
    for p in ramase: pe_cat.setdefault(p["cat"], []).append(p)
    azi, i = [], 0
    while len(azi) < PE_ZI and any(pe_cat.get(c) for c in ORDINE):
        c = ORDINE[i % len(ORDINE)]; i += 1
        if pe_cat.get(c): azi.append(pe_cat[c].pop(0))
    print(f"public azi: {len(azi)} poze")

    H = {"User-Agent": "Mozilla/5.0 NormandMobilier/1.0"}
    noi, noi_credite = [], []
    for p in azi:
        base = base_din(p)
        jpg  = os.path.join(IMG, base + ".jpg")
        try:
            data = urllib.request.urlopen(urllib.request.Request(p["src"], headers=H), timeout=45).read()
            open(jpg, "wb").write(data)
            w, h = pregateste(jpg, base)
        except Exception as e:
            print("  sar peste", p["id"], e)
            for f in fisiere_poza(base):
                if os.path.exists(f): os.remove(f)
            continue
        if p.get("titlu") and p.get("desc"):
            titlu, desc, alt = p["titlu"], p["desc"], p.get("alt_ro") or p["titlu"]
        else:
            titlu, desc, alt = text_din_alt(p)
        curat = lambda t: " ".join(str(t).replace("|", " ").split())
        noi.append("|".join([base, p["cat"], curat(titlu), curat(desc), curat(alt)]))
        noi_credite.append(f"{base}|{curat(p['by'])}|{p['url']}|{p['byurl']}")
        dims[base] = f"{base}|{w}|{h}"

    if not noi and os.environ.get("IDEI_DOAR_REGENEREAZA") != "1":
        print("nimic de publicat azi"); return

    lista = lista + noi                                   # noile la COADĂ

    # ── plafon: scoatem cele mai vechi poze ale ROBOTULUI (niciodată pe cele alese) ──
    loc = max(0, MAX_GALERIE - len(alese))
    if len(lista) > loc:
        iesite, lista = lista[:len(lista) - loc], lista[len(lista) - loc:]
        for r in iesite:
            b = r.split("|")[0]
            if b in alese_base: continue                  # gardă: o poză aleasă de mână nu se șterge
            for f in fisiere_poza(b):
                if os.path.exists(f): os.remove(f)
            dims.pop(b, None)
        print(f"ieșite din galerie (cele mai vechi ale robotului): {len(iesite)}")

    pastrate = {r.split("|")[0] for r in lista}
    credite = [c for c in (credite + noi_credite) if c.split("|")[0] in pastrate]
    for b in list(dims):
        if b not in pastrate and b not in alese_base: dims.pop(b)
    for b in alese_base | pastrate:                       # dimensiuni lipsă (ex. prima rulare)
        if b not in dims: dims[b] = "%s|%d|%d" % ((b,) + dimensiuni(os.path.join(IMG, b + ".jpg")))

    scrie(LISTA,  lista)
    scrie(CREDIT, credite)
    scrie(DIMS,   sorted(dims.values()))
    regen(alese, lista, credite + citeste(CRED_AL), dims)
    print(f"galerie: {len(alese)} alese de mână + {len(lista)} ale robotului = {len(alese) + len(lista)}")

def srcset_webp(base):
    parti = [f"images/idei/{base}-{w}.webp {w}w" for w in LATIMI if os.path.exists(os.path.join(IMG, f"{base}-{w}.webp"))]
    return ", ".join(parti + [f"images/idei/{base}.webp 1100w"])

def card(base, cat, titlu, desc, alt, dim, cred):
    msg = f"Bună! Mi-a plăcut ideea „{titlu}” de pe normandmobilier.ro. Se poate face ceva asemănător la mine?"
    w, h = dim.split("|")[1:3]
    cl = ""
    if cred and cred["url"]:
        cl = (f'\n          <a class="cred" href="{html.escape(cred["url"])}" target="_blank" rel="noopener">'
              f'Foto: {html.escape(cred["by"])} · vezi mai multe pe Pexels ↗</a>')
    return f'''      <article class="icard" data-cat="{html.escape(cat)}">
        <div class="ph" data-full="images/idei/{base}.jpg" data-t="{html.escape(titlu)}" data-d="{html.escape(desc)}">
          <picture><source srcset="{srcset_webp(base)}" sizes="{SIZES}" type="image/webp">
          <img src="images/idei/{base}.jpg" alt="{html.escape(alt)}" width="{w}" height="{h}" loading="lazy"></picture>
        </div>
        <div class="bd">
          <h3>{html.escape(titlu)}</h3>
          <p>{html.escape(desc)}</p>{cl}
          <a class="cta" href="{WA}{urllib.parse.quote(msg)}" target="_blank" rel="noopener">Vreau așa — scrie-ne</a>
        </div>
      </article>'''

def regen(alese, lista, credite, dims):
    cred = {}
    for c in credite:
        f, by, url, byurl = c.split("|")
        cred[f] = {"by": by, "url": url}
    cards, cats = [], []
    for r in alese:                                       # alese de mână: primele, în ordinea aleasă
        c = r.split("|")
        base, cat, titlu, desc = c[:4]
        alt = c[4] if len(c) > 4 and c[4] else titlu      # text alternativ neutru, descriptiv
        cards.append(card(base, cat, titlu, desc, alt, dims[base], cred.get(base)))
        cats.append(cat)
    for r in lista:
        base, cat, titlu, desc, alt = r.split("|")[:5]
        cards.append(card(base, cat, titlu, desc, alt, dims[base], cred.get(base)))
        cats.append(cat)
    ordine_cat = [c for c in ORDINE if c in cats] + [c for c in dict.fromkeys(cats) if c not in ORDINE]
    total = len(cards)
    filtre = "\n".join(
        [f'    <button class="fbtn active" data-f="*">Toate ({total})</button>'] +
        [f'    <button class="fbtn" data-f="{html.escape(c)}">{html.escape(c)} ({cats.count(c)})</button>' for c in ordine_cat])
    s = open(PAGE, encoding="utf-8").read()
    s, n1 = re.subn(r'(<div class="idei-filters">\n).*?(\n  </div>)',
                    lambda m: m.group(1) + filtre + m.group(2), s, flags=re.S, count=1)
    s, n2 = re.subn(r'(<main class="idei-grid" id="ideiGrid">\n).*?(\n  </main>)',
                    lambda m: m.group(1) + "\n".join(cards) + m.group(2), s, flags=re.S, count=1)
    if n1 != 1 or n2 != 1:
        raise SystemExit("nu găsesc filtrele sau grila în idei-amenajare.html — nu scriu pagina")
    s = re.sub(r'\d+ de idei de amenajare', f'{total} de idei de amenajare', s)   # description + og + twitter
    for r in alese:                                       # gardă finală
        if f'images/idei/{r.split("|")[0]}.jpg' not in s:
            raise SystemExit("o idee aleasă de mână lipsește din pagină — nu scriu pagina")
    open(PAGE, "w", encoding="utf-8").write(s)

if __name__ == "__main__":
    main()
