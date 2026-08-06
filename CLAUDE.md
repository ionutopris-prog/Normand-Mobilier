# Normand Mobilier — context pentru Claude Code

> **Proiect SEPARAT** de GABE (`~/Projects/gabe`), marketing-ai (`~/Projects/marketing-ai`)
> și jocul Triworld (`~/Documents/Unreal Projects/Triworld`). Nu le amesteca.
> Vezi memoria: `project_normand_mobilier.md`.

## Ce e
Site **catalog + configurator** pentru **Normand Mobilier** — fabrică de mobilă (PAL / melaminat).
Fondator: Ionuț Opriș. Domeniu: **normandmobilier.ro**. Conținut în **română**.

## Stack
Site **static** (HTML/CSS/JS vanilla) + puțin **PHP** pentru trimiterea ofertelor.
Fără framework, fără build — fișiere servite direct.

## Fișiere cheie
- `index.html` — pagina principală
- `categorie.html` — catalog pe categorii
- `configurator.html` + `furniture-engine.js` — **configuratorul de mobilă** (motorul de configurare)
- `planner.html` — planner (aranjare/plan)
- `trimite-oferta.php` — trimite oferta (backend PHP, formular)
- `whatsapp.js` — integrare WhatsApp
- `images/` — poze produse
- `sitemap.xml`, `robots.txt` — SEO

## Deploy
- **GitHub:** `github.com/ionutopris-prog/Normand-Mobilier`
- **Hosting:** Datahost · **Domeniu:** normandmobilier.ro
- (verifică fluxul exact de deploy: push GitHub → sync la Datahost? sau upload manual?)

## Convenții
- Conținut + comentarii pot fi în **română** (site românesc).
- Cod simplu, vanilla — fără să complici cu framework-uri (fondator începător).
- **Backup-uri manuale** în folder (`site.zip`, foldere cu timestamp `17.xx.xx`, `.zip`-uri) —
  NU le comite/șterge fără să întrebi; sunt copiile lui de siguranță.
- Onestitate brutală, contrapondere reală — nu răspunsuri de complezență.

## De confirmat (când lucrăm aici prima dată)
- Cum se face exact deploy-ul la Datahost.
- Ce face precis `furniture-engine.js` (configuratorul) — de citit înainte de a-l modifica.
