<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once __DIR__ . '/../db/config.php';
function json_ok($d=[], $c=200){ http_response_code($c); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function json_error($m,$c=400,$x=[]){ http_response_code($c); echo json_encode(array_merge(['success'=>false,'error'=>$m],$x), JSON_UNESCAPED_UNICODE); exit; }
function body_json(){ $raw=file_get_contents('php://input')?:''; $d=json_decode($raw,true); return is_array($d)?$d:[]; }
function normalize_date($s){
    if(!is_string($s)) return null;
    $s = trim($s);
    if($s==='') return null;
    if(preg_match('/^(\d{2})\.(\d{2})\.(\d{4})$/',$s,$m)){
        $d=(int)$m[1]; $mo=(int)$m[2]; $y=(int)$m[3];
        if(checkdate($mo,$d,$y)) return sprintf('%04d-%02d-%02d',$y,$mo,$d);
        return null;
    }
    if(preg_match('/^(\d{4})-(\d{2})-(\d{2})$/',$s,$m)){
        $y=(int)$m[1]; $mo=(int)$m[2]; $d=(int)$m[3];
        if(checkdate($mo,$d,$y)) return $m[0];
        return null;
    }
    return null;
}
function bearer_token(){ $h=$_SERVER['HTTP_AUTHORIZATION']??$_SERVER['Authorization']??''; if(stripos($h,'Bearer ')===0) return substr($h,7); return null; }
function auth_user_id($mysqli){ $t=bearer_token(); if(!$t) return null; $s=$mysqli->prepare("SELECT user_id FROM sessions WHERE token=? AND expires_at>NOW()"); $s->bind_param('s',$t); if(!$s->execute()) return null; $r=$s->get_result(); if($row=$r->fetch_assoc()) return (int)$row['user_id']; return null; }
?>