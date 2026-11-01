<?php
/* Normand Mobilier — primește o configurație din configurator/planner și trimite:
   - către ATELIER: emailul „ca la comanda de mașină" (specificații complete + desenele atașate);
   - către CLIENT (dacă a lăsat email): o confirmare cu TEXT FIX, fără atașamente.
   Tot aici: contorul de vizite (cel mult o dată pe vizitator pe zi, fără IP stocat).
   Site static + acest singur endpoint dinamic. Fără dependențe externe (doar mail()). */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$ATELIER = 'contact@normandmobilier.ro';   // unde ajung comenzile
$FROM    = 'contact@normandmobilier.ro';   // expeditor (email-ul domeniului)
$SITE    = 'Normand Mobilier';
$TEL      = '0749 572 087';
$ADRESA   = 'Str. Brăilei 256, Bl. G6A, parter — Galați';

/* ---- limite anti-abuz (formularul nu poate fi folosit ca releu de spam) ---- */
$LIM_IP_ORA   = 8;      // încercări pe oră de la aceeași adresă (se numără ORICE încercare, nu doar reușitele)
$LIM_ZI       = 40;     // plafon global: cereri pe zi, pentru tot site-ul
$LIM_EMAIL_ZI = 2;      // confirmări pe zi către aceeași adresă de email
$LIM_VIZ_ZI   = 20000;  // câți vizitatori distincți pe zi se țin minte (plafon contra umflării contorului)
$MAX_CORP     = 9000000; // octeți maximum în cerere (desenele sunt ~20–200 KB)

/* ---- folderul de stare: în afara public_html (nu se vede pe web, nu-l atinge deploy-ul) ---- */
function np_state_dir() {
  static $d = null; if ($d !== null) return $d;
  foreach ([dirname(__DIR__) . '/normand-stare', sys_get_temp_dir() . '/normand-stare-' . md5(__DIR__)] as $c) {
    if (!is_dir($c)) { @mkdir($c, 0700, true); }
    if (is_dir($c) && is_writable($c)) { return $d = $c; }
  }
  return $d = '';
}

/* citește–modifică–scrie un JSON sub lacăt exclusiv; întoarce false dacă nu se poate (=> fail-closed) */
function np_json_update($file, callable $fn) {
  $h = @fopen($file, 'c+'); if (!$h) return false;
  if (!flock($h, LOCK_EX)) { fclose($h); return false; }
  $raw = stream_get_contents($h); $j = json_decode((string)$raw, true); if (!is_array($j)) $j = [];
  $res = $fn($j);
  rewind($h); ftruncate($h, 0); $ok = fwrite($h, json_encode($j)) !== false; fflush($h);
  flock($h, LOCK_UN); fclose($h);
  return $ok ? $res : false;
}

/* sarea zilei: amprentele (hash) se fac cu o cheie aleatoare care se schimbă zilnic.
   La prima cerere dintr-o zi nouă se șterg sarea și listele zilelor trecute, deci
   amprenta de ieri nu mai poate fi legată de nimic. IP-ul nu se scrie nicăieri. */
function np_amprenta($extra = '') {
  $dir = np_state_dir(); if ($dir === '') return '';
  $zi = gmdate('Y-m-d'); $f = "$dir/sare-$zi.txt";
  if (!is_file($f)) {
    foreach (array_merge(glob("$dir/sare-*") ?: [], glob("$dir/zi-*") ?: []) as $old) {
      if (strpos(basename($old), $zi) === false) { @unlink($old); }
    }
    $h = @fopen($f, 'x'); if ($h) { fwrite($h, bin2hex(random_bytes(32))); fclose($h); @chmod($f, 0600); }
  }
  $sare = (string)@file_get_contents($f); if (strlen($sare) < 32) return '';
  $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
  return substr(hash_hmac('sha256', $ip . '|' . $extra, $sare), 0, 24);
}

/* ---- contor (stocat în afara public_html, ferit de deploy) ---- */
function np_counter_file() {
  $cands = [ dirname(__DIR__) . '/normand-contor.json', __DIR__ . '/.normand-contor.json' ];
  foreach ($cands as $c) { if (file_exists($c) || is_writable(dirname($c))) return $c; }
  return $cands[1];
}
function np_counter_add(array $chei) {
  return np_json_update(np_counter_file(), function (&$c) use ($chei) {
    $c = array_merge(['orders' => 0, 'opens' => 0, 'views' => 0], $c);
    $c['mod'] = 'din 2026-11-01: vizitatori distincți pe zi (cel mult o dată pe vizitator pe zi)';
    foreach ($chei as $k => $v) {
      if ($k === 'pages' || $k === 'days') {
        if (!isset($c[$k]) || !is_array($c[$k])) $c[$k] = [];
        $c[$k][$v] = ((int)($c[$k][$v] ?? 0)) + 1;
        if ($k === 'days' && count($c['days']) > 120) { ksort($c['days']); $c['days'] = array_slice($c['days'], -120, null, true); }
      } else {
        $c[$k] = ((int)($c[$k] ?? 0)) + 1;
      }
    }
    return true;
  });
}

/* „a mai fost numărat azi?" — ține doar amprente cu sarea zilei, șterse a doua zi */
function np_prima_data_azi($cheie) {
  global $LIM_VIZ_ZI;
  $dir = np_state_dir(); $a = np_amprenta((string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
  if ($dir === '' || $a === '') return false;            // fără stare nu numărăm (nu se poate umfla)
  return np_json_update("$dir/zi-" . gmdate('Y-m-d') . "-vazuti.json", function (&$j) use ($a, $cheie, $LIM_VIZ_ZI) {
    if (count($j) >= $LIM_VIZ_ZI) return false;
    $k = $a . '|' . $cheie;
    if (isset($j[$k])) return false;
    $j[$k] = 1; return true;
  }) === true;
}

/* ping-uri de numărare: doar POST (sendBeacon), cel mult o dată pe vizitator pe zi.
   Fără cookie-uri; IP-ul nu se păstrează (doar amprenta zilei, ștearsă a doua zi). */
if (isset($_GET['ping'])) {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'post_only']); exit; }
  $tip = (string)$_GET['ping'];
  if ($tip === 'view') {
    $PAGINI = ['index', 'categorie', 'idei', 'configurator', 'planner'];
    $p = (string)($_GET['p'] ?? ''); if (!in_array($p, $PAGINI, true)) { $p = 'alt'; }
    $nou_azi = np_prima_data_azi('*');                    // prima pagină văzută azi de acest vizitator
    $nou_pag = np_prima_data_azi('p:' . $p);              // prima dată azi pe pagina asta
    $add = [];
    if ($nou_azi) { $add['views'] = 1; $add['days'] = gmdate('Y-m-d'); }
    if ($nou_pag) { $add['pages'] = $p; }
    if ($add) { np_counter_add($add); }
  } elseif ($tip === 'open') {
    if (np_prima_data_azi('open')) { np_counter_add(['opens' => 1]); }
  }
  echo json_encode(['ok'=>true]); exit;
}
/* citirea publică a contorului (?count) e închisă; cifrele stau în /home/normandm/normand-contor.json */
if (isset($_GET['count'])) { http_response_code(404); echo json_encode(['ok'=>false]); exit; }

/* GET = verificare că PHP rulează (nu trimite nimic) */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['ok'=>true, 'service'=>'normand-oferta', 'mail'=>function_exists('mail')]);
  exit;
}

$raw  = (string)file_get_contents('php://input', false, null, 0, $MAX_CORP + 1);
if (strlen($raw) > $MAX_CORP) { http_response_code(413); echo json_encode(['ok'=>false,'error'=>'too_large']); exit; }
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_request']); exit; }

/* honeypot anti-bot: câmp ascuns care trebuie să rămână gol */
if (!empty($data['website'])) { echo json_encode(['ok'=>true]); exit; }

$name  = trim(mb_substr((string)($data['name']  ?? ''), 0, 120));
$email = trim(mb_substr((string)($data['email'] ?? ''), 0, 160));
$phone = trim(mb_substr((string)($data['phone'] ?? ''), 0, 60));
$city  = trim(mb_substr((string)($data['city']  ?? ''), 0, 120));
$spec  = mb_substr((string)($data['spec'] ?? ''), 0, 12000);
$title = trim(mb_substr((string)($data['title'] ?? 'Configurație mobilier'), 0, 160));
$dry   = !empty($data['dryrun']);
$images = (isset($data['images']) && is_array($data['images'])) ? $data['images'] : [];

if ($name === '' || mb_strlen($spec) < 5) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'missing_fields']); exit; }
$emailValid = ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL));

/* limite FAIL-CLOSED: dacă starea nu se poate citi sau scrie, nu trimitem nimic.
   Încercarea se înregistrează ÎNAINTE de trimitere, deci și erorile se numără. */
if (!$dry) {
  $dir = np_state_dir(); $amp = np_amprenta('oferta');
  if ($dir === '' || $amp === '') { http_response_code(503); echo json_encode(['ok'=>false,'error'=>'unavailable']); exit; }
  $now = time();
  $emailKey = $emailValid ? substr(hash_hmac('sha256', strtolower($email), (string)@file_get_contents("$dir/sare-" . gmdate('Y-m-d') . ".txt")), 0, 24) : '';
  $verdict = np_json_update("$dir/zi-" . gmdate('Y-m-d') . "-limite.json", function (&$j) use ($amp, $now, $emailKey, $LIM_IP_ORA, $LIM_ZI, $LIM_EMAIL_ZI) {
    $j += ['total' => 0, 'ip' => [], 'email' => []];
    $h = array_values(array_filter((array)($j['ip'][$amp] ?? []), function ($t) use ($now) { return $t > $now - 3600; }));
    if (count($h) >= $LIM_IP_ORA) return 'ip';
    if ((int)$j['total'] >= $LIM_ZI) return 'zi';
    $h[] = $now; $j['ip'][$amp] = $h; $j['total'] = (int)$j['total'] + 1;
    $confirmare = false;
    if ($emailKey !== '' && (int)($j['email'][$emailKey] ?? 0) < $LIM_EMAIL_ZI) {
      $j['email'][$emailKey] = (int)($j['email'][$emailKey] ?? 0) + 1; $confirmare = true;
    }
    return $confirmare ? 'ok+confirmare' : 'ok';
  });
  if ($verdict === false) { http_response_code(503); echo json_encode(['ok'=>false,'error'=>'unavailable']); exit; }
  if ($verdict === 'ip' || $verdict === 'zi') { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit; }
  $trimiteConfirmare = ($verdict === 'ok+confirmare');
}

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
if ($okAtelier) { np_counter_add(['orders' => 1]); }

/* confirmare către CLIENT: TEXT FIX, fără nimic scris de expeditor (fără nume, titlu, specificație)
   și fără atașamente — altfel formularul ar putea trimite mesajele altcuiva la orice adresă. */
$okClient = false;
if ($emailValid && !empty($trimiteConfirmare)) {
  $htmlClient = '<!doctype html><html><body style="margin:0;background:#eef1ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">'
    . '<div style="max-width:600px;margin:0 auto;padding:24px 16px">'
    . '<div style="background:#2f4a37;border-radius:14px 14px 0 0;padding:22px 26px">'
    .   '<div style="color:#f5f3ec;font-size:22px;font-weight:700;letter-spacing:.3px;font-family:Georgia,serif">Normand <span style="font-weight:400;color:#c9d3c2;font-size:15px;letter-spacing:2px">MOBILIER</span></div>'
    .   '<div style="color:#c9d3c2;font-size:13px;margin-top:4px">Mobilă la comandă · Galați</div>'
    . '</div>'
    . '<div style="background:#fff;border-radius:0 0 14px 14px;padding:24px 26px;box-shadow:0 8px 24px rgba(20,28,18,.08)">'
    .   '<p style="color:#333;font-size:15px;line-height:1.55;margin:0 0 14px">Bună ziua!</p>'
    .   '<p style="color:#333;font-size:15px;line-height:1.55;margin:0 0 14px">Am primit cererea trimisă din configuratorul de pe normandmobilier.ro. Desenul și detaliile au ajuns la atelier; te contactăm în scurt timp pentru o măsurătoare la fața locului și oferta finală.</p>'
    .   '<p style="color:#6a7566;font-size:13px;line-height:1.5;margin:0 0 18px">Dacă nu tu ai trimis cererea, ignoră acest mesaj — nu vei mai primi altele.</p>'
    .   '<div style="background:#f3f6ef;border-radius:10px;padding:14px 16px;font-size:13px;color:#42513f;line-height:1.6">Ai întrebări între timp? Scrie-ne sau sună:<br><b>' . h($TEL) . '</b> · ' . h($FROM) . '<br>' . h($ADRESA) . '</div>'
    . '</div>'
    . '<div style="text-align:center;color:#9aa896;font-size:12px;padding:16px">Normand Mobilier · normandmobilier.ro</div>'
    . '</div></body></html>';
  $okClient = send_mail($email, $FROM, $SITE, "Am primit cererea ta | {$SITE}", $htmlClient, []);
}

echo json_encode(['ok' => (bool)$okAtelier, 'atelier' => (bool)$okAtelier, 'client' => (bool)$okClient]);
