<?php
/* Pagina de categorie servită prin PHP, ca preview-ul la share să fie corect.
   Motivul: scraperele social (Facebook, WhatsApp, X) NU rulează JavaScript, deci
   tag-urile puse din JS în categorie.html nu le vede nimeni. Aici le punem în HTML,
   înainte să plece pagina. Conținutul rămâne unul singur: categorie.html. */

$BASE = 'https://normandmobilier.ro/';
$CATS = [
  'Dormitoare' => [
    'desc' => 'Dormitoare la comandă în Galați și Brăila: paturi cu tăblie tapițată și dulapuri cu uși glisante, croite fix pe dimensiunile camerei.',
    'img'  => 'images/og-dormitoare.jpg',
    'alt'  => 'Dormitor la comandă — pat, dulap cu uși oglindă și comodă, Normand Mobilier',
  ],
  'Bucătării' => [
    'desc' => 'Bucătării la comandă în Galați și Brăila, în L sau U, cu insulă și blat rezistent — corpuri croite pe pereți și pe electrocasnice.',
    'img'  => 'images/og-bucatarii.jpg',
    'alt'  => 'Bucătărie la comandă — Normand Mobilier, Galați și Brăila',
  ],
  'Corpuri de mobilă' => [
    'desc' => 'Corpuri de mobilă la comandă în Galați și Brăila: pereți de living, biblioteci și comode, croite pe lungimea pereților tăi.',
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
} elseif ($raw !== '') {
  /* categorie necunoscută: nu o indexăm, trimitem canonicul acasă */
  $html = preg_replace('~(<link rel="canonical" href=")[^"]*(")~', '${1}' . $BASE . '${2}', $html, 1);
  $html = str_replace('</head>', '<meta name="robots" content="noindex,follow">' . "\n</head>", $html);
}

header('Content-Type: text/html; charset=utf-8');
echo $html;
