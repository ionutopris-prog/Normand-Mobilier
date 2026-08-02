<?php
/* Normand Mobilier — primește o configurație din configurator/planner și trimite
   un email „ca la comanda de mașină": specificații complete + desenele generate
   (atașate ca imagini), către ATELIER și către CLIENT.
   Site static + acest singur endpoint dinamic. Fără dependențe externe (doar mail()). */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$ATELIER = 'contact@normandmobilier.ro';   // unde ajung comenzile
$FROM    = 'contact@normandmobilier.ro';   // expeditor (email-ul domeniului)
$SITE    = 'Normand Mobilier';
$TEL      = '0749 572 087';
$ADRESA   = 'Str. Brăilei 256, Bl. G6A, parter — Galați';

/* ---- contor persistent (stocat în afara public_html, ferit de deploy) ---- */
function np_counter_file() {
  $cands = [ dirname(__DIR__) . '/normand-contor.json', __DIR__ . '/.normand-contor.json' ];
  foreach ($cands as $c) { if (file_exists($c) || is_writable(dirname($c))) return $c; }
  return $cands[1];
}
function np_counter_read() {
  $f = np_counter_file();
  if (is_readable($f)) { $j = json_decode((string)@file_get_contents($f), true); if (is_array($j)) return array_merge(['orders'=>0,'opens'=>0], $j); }
  return ['orders'=>0, 'opens'=>0];
}
function np_counter_bump($key) {
  $f = np_counter_file(); $c = np_counter_read(); $c[$key] = ((int)($c[$key] ?? 0)) + 1;
  @file_put_contents($f, json_encode($c), LOCK_EX); return $c;
}

/* ping „s-a deschis configuratorul/planner-ul" (sendBeacon, orice metodă) */
if (isset($_GET['ping']) && $_GET['ping'] === 'open') { np_counter_bump('opens'); echo json_encode(['ok'=>true]); exit; }
/* citirea contorului: comenzi trimise + deschideri */
if (isset($_GET['count'])) { echo json_encode(array_merge(['ok'=>true], np_counter_read())); exit; }

/* GET = verificare că PHP rulează (nu trimite nimic) */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['ok'=>true, 'service'=>'normand-oferta', 'mail'=>function_exists('mail')]);
  exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_request']); exit; }

/* honeypot anti-bot: câmp ascuns care trebuie să rămână gol */
if (!empty($data['website'])) { echo json_encode(['ok'=>true]); exit; }

$name  = trim(mb_substr((string)($data['name']  ?? ''), 0, 120));
$email = trim(mb_substr((string)($data['email'] ?? ''), 0, 160));
$phone = trim(mb_substr((string)($data['phone'] ?? ''), 0, 60));
$city  = trim(mb_substr((string)($data['city']  ?? ''), 0, 120));
$spec  = (string)($data['spec'] ?? '');
$title = trim(mb_substr((string)($data['title'] ?? 'Configurație mobilier'), 0, 160));
$dry   = !empty($data['dryrun']);
$images = (isset($data['images']) && is_array($data['images'])) ? $data['images'] : [];

if ($name === '' || mb_strlen($spec) < 5) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'missing_fields']); exit; }
$emailValid = ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL));

/* throttle simplu per-IP (fail-open) ca să nu poată fi folosit ca releu de spam */
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$tf = sys_get_temp_dir() . '/np_oferta_' . md5($ip) . '.json';
$now = time(); $hist = [];
if (is_readable($tf)) { $hist = json_decode((string)@file_get_contents($tf), true) ?: []; }
$hist = array_values(array_filter($hist, fn($t) => $t > $now - 3600));
if (count($hist) >= 8) { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit; }

/* decodează desenele (data URL) în atașamente, cu plafon de mărime */
$attach = []; $totalBytes = 0;
foreach ($images as $i => $durl) {
  if (!is_string($durl) || !preg_match('#^data:image/(png|jpeg);base64,#', $durl, $mm)) continue;
  $bin = base64_decode(substr($durl, strpos($durl, ',') + 1), true);
  if ($bin === false) continue;
  $totalBytes += strlen($bin);
  if ($totalBytes > 6000000) break;            // total ~6MB max
  $ext = $mm[1] === 'jpeg' ? 'jpg' : 'png';
  $attach[] = ['name' => 'desen-' . ($i + 1) . '.' . $ext, 'type' => 'image/' . $mm[1], 'data' => $bin];
  if (count($attach) >= 4) break;
}

function h($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/* corpul HTML al emailului (stilat, „fișă de comandă") */
function order_html($opts) {
  $specRows = '';
  foreach (preg_split('/\n/', $opts['spec']) as $line) {
    $line = trim($line); if ($line === '') continue;
    $line = ltrim($line, "•- \t");
    $parts = explode(':', $line, 2);
    if (count($parts) === 2) {
      $specRows .= '<tr><td style="padding:7px 12px;color:#6a7566;font-size:13px;white-space:nowrap;vertical-align:top">' . h(trim($parts[0])) . '</td>'
                 . '<td style="padding:7px 12px;color:#222;font-size:14px;font-weight:600">' . h(trim($parts[1])) . '</td></tr>';
    } else {
      $specRows .= '<tr><td colspan="2" style="padding:7px 12px;color:#222;font-size:14px">' . h($line) . '</td></tr>';
    }
  }
  $intro = $opts['intro'];
  $contact = $opts['contactBlock'];
  return '<!doctype html><html><body style="margin:0;background:#eef1ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">'
    . '<div style="max-width:600px;margin:0 auto;padding:24px 16px">'
    . '<div style="background:#2f4a37;border-radius:14px 14px 0 0;padding:22px 26px">'
    .   '<div style="color:#f5f3ec;font-size:22px;font-weight:700;letter-spacing:.3px;font-family:Georgia,serif">Normand <span style="font-weight:400;color:#c9d3c2;font-size:15px;letter-spacing:2px">MOBILIER</span></div>'
    .   '<div style="color:#c9d3c2;font-size:13px;margin-top:4px">Mobilă la comandă · ' . h($opts['title']) . '</div>'
    . '</div>'
    . '<div style="background:#fff;border-radius:0 0 14px 14px;padding:24px 26px;box-shadow:0 8px 24px rgba(20,28,18,.08)">'
    .   '<p style="color:#333;font-size:15px;line-height:1.55;margin:0 0 18px">' . $intro . '</p>'
    .   '<div style="border:1px solid #e2e7dd;border-radius:10px;overflow:hidden;margin-bottom:18px">'
    .     '<div style="background:#f3f6ef;padding:9px 12px;font-size:12px;font-weight:700;letter-spacing:.6px;color:#2f4a37;text-transform:uppercase">Specificații configurație</div>'
    .     '<table style="width:100%;border-collapse:collapse">' . $specRows . '</table>'
    .   '</div>'
    .   '<p style="color:#6a7566;font-size:13px;line-height:1.5;margin:0 0 18px">📎 Desenele configurației sunt atașate acestui email (vedere cu uși închise și vederea interiorului).</p>'
    .   $contact
    . '</div>'
    . '<div style="text-align:center;color:#9aa896;font-size:12px;padding:16px">Normand Mobilier · desenul e generat automat din configuratorul de pe normandmobilier.ro</div>'
    . '</div></body></html>';
}

function send_mail($to, $from, $siteName, $subject, $html, $attachments) {
  if (!function_exists('mail')) return false;
  $boundary = 'np_' . bin2hex(random_bytes(8));
  $headers  = "From: {$siteName} <{$from}>\r\n";
  $headers .= "Reply-To: {$from}\r\n";
  $headers .= "MIME-Version: 1.0\r\n";
  $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"";
  $b  = "--{$boundary}\r\n";
  $b .= "Content-Type: text/html; charset=UTF-8\r\n";
  $b .= "Content-Transfer-Encoding: base64\r\n\r\n";
  $b .= chunk_split(base64_encode($html)) . "\r\n";
  foreach ($attachments as $a) {
    $b .= "--{$boundary}\r\n";
    $b .= "Content-Type: {$a['type']}; name=\"{$a['name']}\"\r\n";
    $b .= "Content-Transfer-Encoding: base64\r\n";
    $b .= "Content-Disposition: attachment; filename=\"{$a['name']}\"\r\n\r\n";
    $b .= chunk_split(base64_encode($a['data'])) . "\r\n";
  }
  $b .= "--{$boundary}--";
  $subj = '=?UTF-8?B?' . base64_encode($subject) . '?=';
  return @mail($to, $subj, $b, $headers, "-f{$from}");
}

/* mod „dryrun": validează + decodează, dar NU trimite (pentru verificare) */
if ($dry) {
  echo json_encode(['ok'=>true, 'dryrun'=>true, 'attachments'=>count($attach), 'bytes'=>$totalBytes, 'emailValid'=>$emailValid]);
  exit;
}

$contactAtelier = trim(($phone !== '' ? "Telefon: {$phone}" : '') . ($email !== '' ? ($phone !== '' ? " · " : '') . "Email: {$email}" : '') . ($city !== '' ? " · Localitate: {$city}" : ''));

/* email către ATELIER */
$htmlAtelier = order_html([
  'title' => $title, 'spec' => $spec,
  'intro' => 'Comandă nouă din configurator de la <b>' . h($name) . '</b>' . ($contactAtelier !== '' ? '.<br><span style="color:#6a7566;font-size:13px">' . h($contactAtelier) . '</span>' : '.'),
  'contactBlock' => '<div style="background:#f3f6ef;border-radius:10px;padding:14px 16px;font-size:13px;color:#42513f">Sună clientul pentru o măsurătoare și o ofertă. Datele de contact sunt mai sus.</div>',
]);
$okAtelier = send_mail($ATELIER, $FROM, $SITE, "Comandă nouă — {$title} ({$name})", $htmlAtelier, $attach);
if ($okAtelier) { $hist[] = $now; @file_put_contents($tf, json_encode($hist)); np_counter_bump('orders'); }

/* email de confirmare către CLIENT (dacă a lăsat email valid) */
$okClient = false;
if ($emailValid) {
  $htmlClient = order_html([
    'title' => $title, 'spec' => $spec,
    'intro' => 'Bună ziua, ' . h($name) . '! 👋<br>Am primit configurația ta. Mai jos ai toate detaliile, iar desenele sunt atașate. Te contactăm în scurt timp pentru o măsurătoare la fața locului și oferta finală.',
    'contactBlock' => '<div style="background:#f3f6ef;border-radius:10px;padding:14px 16px;font-size:13px;color:#42513f;line-height:1.6">Ai întrebări între timp? Scrie-ne sau sună:<br><b>' . h($GLOBALS['TEL']) . '</b> · ' . h($GLOBALS['FROM']) . '<br>' . h($GLOBALS['ADRESA']) . '</div>',
  ]);
  $okClient = send_mail($email, $FROM, $SITE, "Configurația ta — {$title} | {$SITE}", $htmlClient, $attach);
}

echo json_encode(['ok' => (bool)$okAtelier, 'atelier' => (bool)$okAtelier, 'client' => (bool)$okClient]);
