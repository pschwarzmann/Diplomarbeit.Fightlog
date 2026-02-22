<?php
// backend/api/profile-picture.php
// Profilbild-Upload API

require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_out(['success' => false, 'error' => 'Datenbankverbindung fehlgeschlagen: ' . $e->getMessage()], 500);
}

$userId = auth_user_id($mysqli);
if (!$userId) {
    json_out(['success' => false, 'error' => 'Nicht authentifiziert'], 401);
}

// Upload-Verzeichnis
$uploadDir = __DIR__ . '/../uploads/profile-pictures/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// POST - Profilbild hochladen
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['picture']) || $_FILES['picture']['error'] !== UPLOAD_ERR_OK) {
        json_out(['success' => false, 'error' => 'Keine Datei hochgeladen'], 400);
    }
    
    $file = $_FILES['picture'];
    
    // Validierung: Typ
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        json_out(['success' => false, 'error' => 'Nur JPEG, PNG, GIF und WebP erlaubt'], 400);
    }
    
    // Security: Zusätzliche Validierung - Prüfe Datei-Header (Magic Bytes)
    $fileHeader = file_get_contents($file['tmp_name'], false, null, 0, 12);
    $isValidImage = false;
    if (strpos($fileHeader, "\xFF\xD8\xFF") === 0) $isValidImage = ($mimeType === 'image/jpeg');
    elseif (strpos($fileHeader, "\x89PNG") === 0) $isValidImage = ($mimeType === 'image/png');
    elseif (strpos($fileHeader, "GIF87a") === 0 || strpos($fileHeader, "GIF89a") === 0) $isValidImage = ($mimeType === 'image/gif');
    elseif (strpos($fileHeader, "RIFF") === 0 && strpos($fileHeader, "WEBP", 8) !== false) $isValidImage = ($mimeType === 'image/webp');
    
    if (!$isValidImage) {
        json_out(['success' => false, 'error' => 'Ungültiges Bildformat'], 400);
    }
    
    // Validierung: Größe (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        json_out(['success' => false, 'error' => 'Datei zu groß (max 5MB)'], 400);
    }
    
    // Security: Sichere Dateinamen generieren (keine User-Input in Dateinamen)
    $extension = '';
    if ($mimeType === 'image/jpeg') $extension = 'jpg';
    elseif ($mimeType === 'image/png') $extension = 'png';
    elseif ($mimeType === 'image/gif') $extension = 'gif';
    elseif ($mimeType === 'image/webp') $extension = 'webp';
    else {
        json_out(['success' => false, 'error' => 'Ungültiges Bildformat'], 400);
    }
    
    $safeFilename = 'user_' . $userId . '_' . bin2hex(random_bytes(16)) . '.' . $extension;
    $targetPath = $uploadDir . $safeFilename;
    
    // Altes Bild löschen
    $stmt = $mysqli->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc() && $row['profile_picture']) {
        $oldPath = $uploadDir . basename($row['profile_picture']);
        if (file_exists($oldPath)) {
            @unlink($oldPath);
        }
    }
    
    // Datei verschieben
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        json_out(['success' => false, 'error' => 'Upload fehlgeschlagen'], 500);
    }
    
    // DB aktualisieren
    $relativePath = '/backend/uploads/profile-pictures/' . $safeFilename;
    $stmt = $mysqli->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
    $stmt->bind_param('si', $relativePath, $userId);
    
    if ($stmt->execute()) {
        AuditService::log($mysqli, 'profile_picture_updated', $userId, null, null, []);
        json_out(['success' => true, 'picture_url' => $relativePath]);
    } else {
        @unlink($targetPath);
        json_out(['success' => false, 'error' => 'Datenbankfehler'], 500);
    }
}

// DELETE - Profilbild löschen
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $stmt = $mysqli->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc() && $row['profile_picture']) {
        $filePath = $uploadDir . basename($row['profile_picture']);
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
        
        $stmt = $mysqli->prepare("UPDATE users SET profile_picture = NULL WHERE id = ?");
        $stmt->bind_param('i', $userId);
        if ($stmt->execute()) {
            AuditService::log($mysqli, 'profile_picture_deleted', $userId, null, null, []);
            json_out(['success' => true]);
        } else {
            json_out(['success' => false, 'error' => 'Datenbankfehler'], 500);
        }
    } else {
        json_out(['success' => false, 'error' => 'Kein Profilbild vorhanden'], 404);
    }
}
