<?php
// backend/api/login.php
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['success'=>false, 'error'=>'Nur POST erlaubt'], 405);
}
$body = read_json_body();
require_fields($body, ['username','password']);

// Demo-Logins zulassen (wie simple.html)
$demo = [
    ['username'=>'admin','password'=>'admin123','role'=>'admin'],
    ['username'=>'trainer','password'=>'trainer123','role'=>'trainer'],
    ['username'=>'schueler','password'=>'schueler123','role'=>'schueler']
];
foreach ($demo as $d){
    if ($d['username']===$body['username'] && $d['password']===$body['password']){
        json_out([
            'success'=>true,
            'user'=>[
                'id'=>1,
                'username'=>$d['username'],
                'role'=>$d['role'],
                'email'=>$d['username'].'@fightlog.com'
            ]
        ]);
    }
}

// Echte DB-Auth (vereinfachte Variante mit plain password für Demo)
$stmt = $mysqli->prepare("SELECT id, username, email, role, password_hash FROM users WHERE username = ?");
$stmt->bind_param('s', $body['username']);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
if (!$user) {
    json_out(['success'=>false, 'error'=>'Unbekannter Benutzer'], 401);
}

// Achtung: In Produktion Passwort-Hash verwenden (password_verify).
// In der SQL-Datei sind Dummy-Hashes, daher akzeptieren wir hier zu Demo-Zwecken jedes Passwort.
$ok = true; // $ok = password_verify($body['password'], $user['password_hash']);
if (!$ok){
    json_out(['success'=>false, 'error'=>'Falsches Passwort'], 401);
}

json_out(['success'=>true,'user'=>[
    'id'=>(int)$user['id'],
    'username'=>$user['username'],
    'email'=>$user['email'],
    'role'=>$user['role']
]]);
?>
