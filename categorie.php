<?php
/* Pagina de categorie servită prin PHP, ca preview-ul la share să fie corect.
   Motivul: scraperele social (Facebook, WhatsApp, X) NU rulează JavaScript, deci
   tag-urile puse din JS în categorie.html nu le vede nimeni. Aici le punem în HTML,
   înainte să plece pagina. Conținutul rămâne unul singur: categorie.html. */

$BASE = 'https://normandmobilier.ro/';
$CATS = [
  'Dormitoare' => [
    'desc' => 'Dormitoare la comandă în Galați și Brăila: paturi cu tăblie tapițată și dulapuri cu uși glisante, croite fix pe dimensiunile camerei.',
    'info' => 'Paturi cu tăblie tapițată, dulapuri cu uși glisante sau batante și corpuri suspendate, croite fix pe dimensiunile camerei — depozitare maximă, aspect curat.',
    'img'  => 'images/og-dormitoare.jpg',
    'alt'  => 'Dormitor la comandă — pat, dulap cu uși oglindă și comodă, Normand Mobilier',
  ],
  'Bucătării' => [
    'desc' => 'Bucătării la comandă în Galați și Brăila, în L sau U, cu insulă și blat rezistent — corpuri croite pe pereți și pe electrocasnice.',
    'info' => 'Bucătării în formă de L sau U, cu insulă și blat rezistent, care folosesc fiecare colț. Corpuri suspendate și de bază, croite pe pereți și în jurul electrocasnicelor.',
    'img'  => 'images/og-bucatarii.jpg',
    'alt'  => 'Bucătărie la comandă — Normand Mobilier, Galați și Brăila',
  ],
  'Corpuri de mobilă' => [
    'desc' => 'Corpuri de mobilă la comandă în Galați și Brăila: pereți de living, biblioteci și comode, croite pe lungimea pereților tăi.',
    'info' => 'Pereți de living, biblioteci, comode și corpuri de depozitare — proiectate pe lungimea pereților tăi, cu vitrine, sertare și rafturi după nevoie.',
    'img'  => 'images/og-corpuri.jpg',
    'alt'  => 'Perete de living la comandă — Normand Mobilier, Galați și Brăila',
  ],
];

$raw   = isset($_GET['titlu']) ? (string)$_GET['titlu'] : '';
$known = isset($CATS[$raw]);
$html  = @file_get_contents(__DIR__ . '/categorie.html');
if ($html === false) { http_response_code(500); exit('categorie.html lipsește'); }

/* linkurile interne și canonicul trebuie să arate spre .php, nu spre .html */
$html = str_replace('categorie.html?titlu=', 'categorie.php?titlu=', $html);

function np_meta(&$h, $pattern, $value) {
  $h = preg_replace($pattern, '${1}' . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . '${2}', $h, 1);
}

if ($known) {
  $c     = $CATS[$raw];
  $title = $raw . ' la comandă în Galați · Brăila';
  $url   = $BASE . 'categorie.php?titlu=' . rawurlencode($raw);
  $img   = $BASE . $c['img'];

  np_meta($html, '~(<title>)[^<]*(</title>)~',                                    $title . ' — Normand Mobilier');
  np_meta($html, '~(<meta name="description" content=")[^"]*(")~',                $c['desc']);
  np_meta($html, '~(<meta property="og:title" content=")[^"]*(")~',               $title);
  np_meta($html, '~(<meta name="twitter:title" content=")[^"]*(")~',              $title);
  np_meta($html, '~(<meta property="og:description" content=")[^"]*(")~',         $c['desc']);
  np_meta($html, '~(<meta name="twitter:description" content=")[^"]*(")~',        $c['desc']);
  np_meta($html, '~(<meta property="og:url" content=")[^"]*(")~',                 $url);
  np_meta($html, '~(<meta property="og:image" content=")[^"]*(")~',               $img);
  np_meta($html, '~(<meta name="twitter:image" content=")[^"]*(")~',              $img);
  np_meta($html, '~(<meta property="og:image:alt" content=")[^"]*(")~',           $c['alt']);
  np_meta($html, '~(<meta name="twitter:image:alt" content=")[^"]*(")~',          $c['alt']);
  np_meta($html, '~(<link rel="canonical" href=")[^"]*(")~',                      $url);
  np_meta($html, '~(<meta name="robots" content=")[^"]*(")~',                     'index, follow');
  /* titlul vizibil e pus din server, nu doar din JS (îl văd și cei care nu rulează JS) */
  np_meta($html, '~(<h1 id="categoryTitle">)[^<]*(</h1>)~',                      $raw);
  np_meta($html, '~(<div class="cover-title" id="coverTitle">)[^<]*(</div>)~',  $raw);
  np_meta($html, '~(<span id="breadcrumbTitle">)[^<]*(</span>)~',               $raw);
  np_meta($html, '~(<p id="categoryDesc">)[^<]*(</p>)~',                         $c['info']);
}
/* fără categorie sau categorie necunoscută: rămâne ce e în categorie.html —
   un singur <meta name="robots" content="noindex, follow"> și canonicul spre prima pagină */

/* poza mare din stânga: src/srcset puse din server (nu doar din JS), ca să se încarce imediat.
   Prima poză se citește chiar din productsByCategory din categorie.html (sursa unică),
   deci rămâne mereu aceeași cu alegerea fondatorului. */
function np_hero_photo($html, $known, $raw) {
  if ($known) {
    $re = '~"' . preg_quote($raw, '~') . '":\s*\[\s*\{[^}]*?photos:\s*\[\s*"([^"]+)"~u';
  } else {
    $re = '~const defaultProducts = \[\s*\{[^}]*?photos:\s*\[\s*"([^"]+)"~u';
  }
  return preg_match($re, $html, $m) ? $m[1] : '';
}
$hero = np_hero_photo($html, $known, $raw);
if ($hero !== '' && preg_match('~^images/[a-z0-9/_-]+\.jpg$~', $hero) && is_file(__DIR__ . '/' . $hero)) {
  $v = function ($w, $ext) use ($hero) { return preg_replace('~\.jpg$~', '-' . $w . '.' . $ext, $hero); };
  $sizes = '(max-width: 900px) calc(94vw - 76px), 394px';
  $hasV = is_file(__DIR__ . '/' . $v(480, 'webp')) && is_file(__DIR__ . '/' . $v(800, 'jpg'));
  $dim = @getimagesize(__DIR__ . '/' . $hero);
  $wh = $dim ? ' width="' . (int)$dim[0] . '" height="' . (int)$dim[1] . '"' : '';
  $alt = htmlspecialchars($known ? $raw : 'Mobilă la comandă', ENT_QUOTES, 'UTF-8');
  if ($hasV) {
    $src = '<source id="heroSrc" type="image/webp" srcset="' . $v(480, 'webp') . ' 480w, ' . $v(800, 'webp') . ' 800w" sizes="' . $sizes . '">';
    $img = '<img id="heroImg" alt="' . $alt . '" fetchpriority="high" src="' . $v(800, 'jpg') . '" srcset="' . $v(480, 'jpg') . ' 480w, ' . $v(800, 'jpg') . ' 800w" sizes="' . $sizes . '"' . $wh . '>';
  } else {
    $src = '<source id="heroSrc" type="image/webp">';
    $img = '<img id="heroImg" alt="' . $alt . '" fetchpriority="high" src="' . $hero . '"' . $wh . '>';
  }
  $html = str_replace('<source id="heroSrc" type="image/webp">', $src, $html);
  $html = str_replace('<img id="heroImg" alt="" fetchpriority="high">', $img, $html);
}

header_remove('X-Powered-By');
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
echo $html;
