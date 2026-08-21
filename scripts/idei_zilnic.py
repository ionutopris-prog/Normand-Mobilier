#!/usr/bin/env python3
"""Robotul de poze zilnice pentru pagina „Idei de amenajare".

Rulează o dată pe zi din GitHub Actions: ia N poze din rezerva verificată
(data/pool-idei.json), le descarcă de pe Pexels, le pregătește pentru web,
le pune în capul galeriei și le scoate pe cele mai vechi peste plafon.
Apoi regenerează idei-amenajare.html. Nu cere nimic de la nimeni.
"""
import os, re, json, html, random, shutil, subprocess, urllib.parse, urllib.request

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG    = os.path.join(ROOT, "images", "idei")
LISTA  = os.path.join(IMG, "_lista.txt")
CREDIT = os.path.join(IMG, "_credite.txt")
POOL   = os.path.join(ROOT, "data", "pool-idei.json")
PAGE   = os.path.join(ROOT, "idei-amenajare.html")

PE_ZI      = int(os.environ.get("IDEI_PE_ZI", "10"))
MAX_GALERIE= int(os.environ.get("IDEI_MAX", "150"))
WA         = "https://wa.me/40749572087?text="
SLUG       = {"Bucătării":"bucatarie", "Dormitoare":"dormitor",
              "Dressing":"dressing",  "Living":"living"}

# ── texte: se rotesc, ca descrierile să nu fie identice ──────────────────────
TEXTE = {
"Bucătării": [
 ("Bucătărie pe măsura camerei","Corpuri croite exact pe pereții tăi — fără spații moarte între mobilă și zid."),
 ("Corpuri până în tavan","Depozitare dublă și niciun centimetru de praf deasupra."),
 ("Alb cu blat de lemn","Contrastul care merge în orice apartament și nu se demodează."),
 ("Fronturi fără mâner","Deschidere prin apăsare — linia rămâne continuă pe tot peretele."),
 ("Bucătărie cu insulă","Insula adaugă blat de lucru și depozitare pe ambele fețe."),
 ("Electrocasnice încastrate","Cuptorul la înălțimea ochilor, frigiderul ascuns în corp."),
 ("Bucătărie în L","Cea mai eficientă formă pentru apartamente de două camere."),
 ("Bucătărie în U","Trei laturi de blat: tot ce-ți trebuie la un pas distanță."),
 ("Lumină sub corpurile de sus","Bandă LED care luminează exact acolo unde tai."),
 ("Colțuri folosite până la capăt","Mecanisme rotative pentru colțul care altfel se pierde."),
 ("Bucătărie deschisă spre living","Aceeași linie de mobilă continuă din bucătărie în zona de zi."),
 ("Blat rezistent, ușor de curățat","Alegem materialul de blat după cum gătești, nu după modă."),
 ("Bucătărie mică, folosită bine","Pe doi metri de perete încape tot ce trebuie."),
 ("Coloană de cuptoare","Toate electrocasnicele într-o coloană, blatul rămâne liber."),
 ("Bar de separare","Desparte bucătăria de living fără să ridici perete."),
 ("Sertare pe toată lățimea","Sertare adânci în locul ușilor — vezi tot dintr-o privire."),
 ("Bucătărie cu zonă de luat masa","Masa croită din același material, ca un singur corp."),
 ("Nișe iluminate în perete","Locul pentru condimente și vase, fără rafturi în plus."),
 ("Hotă ascunsă în corp","Hota intră în mobilă, nimic nu iese din linie."),
 ("Combinație lemn și culoare mată","Lemnul cald cu un mat închis — cea mai cerută pereche acum."),
],
"Dormitoare": [
 ("Dulap pe tot peretele","De la podea până în tavan, croit pe milimetru."),
 ("Punte de corpuri peste pat","Depozitare acolo unde altfel era perete gol."),
 ("Dulap cu nișă pentru televizor","Televizorul intră în mobilă, nu pe perete."),
 ("Pat cu ladă de depozitare","Somieră care se ridică — un dulap întreg sub saltea."),
 ("Dormitor cu birou integrat","Dulap, birou și rafturi croite ca un singur corp."),
 ("Mobilier pentru cameră de copil","Pat, dulap și loc de teme, pe dimensiunile camerei mici."),
 ("Paturi suprapuse la comandă","Două locuri de dormit pe suprafața unuia singur."),
 ("Corp lung sub fereastră","Depozitare joasă care nu blochează lumina."),
 ("Tăblie tapițată la comandă","Se face pe lățimea patului tău, în materialul ales de tine."),
 ("Panou de lemn în spatele patului","Tăblia și peretele fac un corp — se montează pe orice lățime."),
 ("Dulap cu uși glisante","Ușile nu au nevoie de spațiu ca să se deschidă."),
 ("Noptiere suspendate","Se curăță ușor dedesubt, camera pare mai mare."),
 ("Dressing în dormitor","Când nu ai cameră separată, dressingul intră aici."),
 ("Comodă joasă cu sertare","Pentru textile, pe toată lungimea peretelui liber."),
 ("Dulap de colț","Colțul camerei transformat în depozitare utilă."),
],
"Dressing": [
 ("Dressing pe toată camera","Rafturi și bare pe toți pereții, cu bancă la mijloc."),
 ("Dressing pe coridor","Un hol strâmt devine dressing pe toată lungimea."),
 ("Rafturi cu lumină","Bandă LED pe fiecare raft: vezi ce ai fără lumina mare."),
 ("Bare pe două niveluri","Dublezi lungimea de agățat în aceeași înălțime."),
 ("Sertare cu compartimente","Fiecare lucru la locul lui, de la ceasuri la cravate."),
 ("Dressing cu uși de sticlă","Praful rămâne afară, hainele rămân la vedere."),
 ("Dressing deschis, fără uși","Acces în două secunde, aspect de magazin."),
 ("Suport pentru pantofi înclinat","Rafturi oblice: vezi perechea, nu cutia."),
 ("Insulă centrală cu sertare","Pentru bijuterii, ochelari, ceasuri — la îndemână."),
 ("Colțul folosit complet","Nicio zonă moartă, nici măcar în unghi."),
 ("Oglindă integrată în dulap","Oglinda pe o ușă, ca să nu ocupe perete separat."),
],
"Living": [
 ("Perete de living la comandă","Croit pe lungimea peretelui tău, nu pe module standard."),
 ("Comodă TV suspendată","Ridicată de la podea — se curăță ușor, camera pare mai mare."),
 ("Bibliotecă până în tavan","Rafturi pe toată înălțimea, calculate pe cărțile tale."),
 ("Rafturi deschise și corpuri închise","La vedere ce arată bine, închis ce nu vrei să se vadă."),
 ("Panou de lemn cu televizor","Panoul ascunde cablurile și încălzește camera."),
 ("Corp de living cu bar","Zona de pahare, integrată în peretele de mobilă."),
 ("Birou încastrat în bibliotecă","Locul de lucru intră în perete, nu ocupă cameră."),
 ("Rafturi cu adâncimi diferite","Pentru cărți și obiecte deopotrivă, în același corp."),
 ("Depozitare ascunsă în living","Uși fără mâner, care se citesc ca un perete."),
 ("Corp jos pe toată lungimea","Linie continuă, depozitare mare, aspect liniștit."),
 ("Bibliotecă de colț","Colțul livingului, folosit până la ultimul raft."),
 ("Nișă pentru televizor","Televizorul încadrat în mobilă, la nivelul ochilor."),
],
}

def magick(*args):
    exe = shutil.which("magick") or shutil.which("convert")
    if not exe: raise SystemExit("ImageMagick lipsește")
    subprocess.run([exe, *args], check=True)

def citeste(path):
    if not os.path.exists(path): return []
    return [l.rstrip("\n") for l in open(path, encoding="utf-8") if l.strip()]

def main():
    key = os.environ.get("PEXELS_KEY", "").strip()
    if not key: raise SystemExit("PEXELS_KEY lipsește din mediu")

    pool    = json.load(open(POOL, encoding="utf-8"))
    lista   = citeste(LISTA)
    credite = citeste(CREDIT)

    publicate = set()
    for r in lista:
        m = re.search(r"_(\d+)\|", r + "|")
        if m: publicate.add(m.group(1))

    ramase = [p for p in pool if p["id"] not in publicate]
    if not ramase:
        print("Rezerva s-a golit — de completat cu un lot nou."); return

    # alegem rotind categoriile, ca ziua să fie variată
    pe_cat = {}
    for p in ramase: pe_cat.setdefault(p["cat"], []).append(p)
    ordine = ["Bucătării", "Dormitoare", "Living", "Dressing"]
    azi, i = [], 0
    while len(azi) < PE_ZI and any(pe_cat.get(c) for c in ordine):
        c = ordine[i % len(ordine)]; i += 1
        if pe_cat.get(c): azi.append(pe_cat[c].pop(0))
    print(f"public azi: {len(azi)} poze")

    H = {"User-Agent": "Mozilla/5.0 NormandMobilier/1.0"}
    noi, noi_credite = [], []
    for n, p in enumerate(azi):
        base = f"{SLUG[p['cat']]}_{p['id']}"
        jpg  = os.path.join(IMG, base + ".jpg")
        try:
            data = urllib.request.urlopen(urllib.request.Request(p["src"], headers=H), timeout=45).read()
            open(jpg, "wb").write(data)
            magick(jpg, "-resize", "1100x>", "-quality", "84", "-strip", jpg)
            magick(jpg, "-quality", "76", "-define", "webp:method=6", os.path.join(IMG, base + ".webp"))
        except Exception as e:
            print("  sar peste", p["id"], e)
            if os.path.exists(jpg): os.remove(jpg)
            continue
        banca = TEXTE[p["cat"]]
        titlu, desc = banca[(len(lista) + n) % len(banca)]
        noi.append(f"{base}|{p['cat']}|{titlu}|{desc}")
        noi_credite.append(f"{base}|{p['by']}|{p['url']}|{p['byurl']}")
        os.chmod(jpg, 0o644); os.chmod(os.path.join(IMG, base + ".webp"), 0o644)

    if not noi:
        print("nimic de publicat azi"); return

    lista = noi + lista

    # ── plafon: scoatem cele mai vechi ───────────────────────────────────────
    scoase = []
    if len(lista) > MAX_GALERIE:
        scoase = lista[MAX_GALERIE:]; lista = lista[:MAX_GALERIE]
        for r in scoase:
            b = r.split("|")[0]
            for ext in (".jpg", ".webp"):
                f = os.path.join(IMG, b + ext)
                if os.path.exists(f): os.remove(f)
        print(f"scoase din galerie: {len(scoase)}")

    ramase_id = {r.split("|")[0] for r in lista}
    credite = [c for c in (noi_credite + credite) if c.split("|")[0] in ramase_id]

    open(LISTA,  "w", encoding="utf-8").write("\n".join(lista) + "\n")
    open(CREDIT, "w", encoding="utf-8").write("\n".join(credite) + "\n")
    regen(lista, credite)
    print(f"galerie: {len(lista)} proiecte")

def regen(lista, credite):
    cred = {}
    for c in credite:
        f, by, url, byurl = c.split("|")
        cred[f] = {"by": by, "url": url}
    rows = [r.split("|") for r in lista]
    cats = []
    for _, c, _, _ in rows:
        if c not in cats: cats.append(c)
    cards = []
    for f, cat, titlu, desc in rows:
        msg = f"Bună! Mi-a plăcut ideea „{titlu}” de pe normandmobilier.ro. Se poate face ceva asemănător la mine?"
        c = cred.get(f)
        cl = ""
        if c and c["url"]:
            cl = (f'\n          <a class="cred" href="{html.escape(c["url"])}" target="_blank" rel="noopener">'
                  f'Foto: {html.escape(c["by"])} · vezi mai multe pe Pexels ↗</a>')
        cards.append(f'''      <article class="icard" data-cat="{html.escape(cat)}">
        <div class="ph" data-full="images/idei/{f}.jpg" data-t="{html.escape(titlu)}" data-d="{html.escape(desc)}">
          <picture><source srcset="images/idei/{f}.webp" type="image/webp">
          <img src="images/idei/{f}.jpg" alt="{html.escape(titlu)} — {html.escape(cat)} la comandă, Normand Mobilier" loading="lazy"></picture>
        </div>
        <div class="bd">
          <h3>{html.escape(titlu)}</h3>
          <p>{html.escape(desc)}</p>{cl}
          <a class="cta" href="{WA}{urllib.parse.quote(msg)}" target="_blank" rel="noopener">Vreau așa — scrie-ne</a>
        </div>
      </article>''')
    filtre = "\n".join(
        [f'    <button class="fbtn active" data-f="*">Toate ({len(rows)})</button>'] +
        [f'    <button class="fbtn" data-f="{html.escape(c)}">{html.escape(c)} ({sum(1 for r in rows if r[1]==c)})</button>'
         for c in cats])
    s = open(PAGE, encoding="utf-8").read()
    s = re.sub(r'(<div class="idei-filters">\n).*?(\n  </div>)',
               lambda m: m.group(1) + filtre + m.group(2), s, flags=re.S, count=1)
    s = re.sub(r'(<main class="idei-grid" id="ideiGrid">\n).*?(\n  </main>)',
               lambda m: m.group(1) + "\n".join(cards) + m.group(2), s, flags=re.S, count=1)
    s = re.sub(r'\d+ de idei de amenajare', f'{len(rows)} de idei de amenajare', s, count=1)
    open(PAGE, "w", encoding="utf-8").write(s)

if __name__ == "__main__":
    main()
