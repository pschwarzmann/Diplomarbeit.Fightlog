<?php
// backend/api/stats.php
// Dashboard-Statistiken API

require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_out(['success' => false, 'error' => 'Datenbankverbindung fehlgeschlagen: ' . $e->getMessage()], 500);
}

$userId = auth_user_id($mysqli);
$userRole = auth_user_role($mysqli);

if (!$userId) {
    json_out(['success' => false, 'error' => 'Nicht authentifiziert'], 401);
}

// GET - Statistiken abrufen
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stats = [];
    
    // Eigene Statistiken
    $stmt = $mysqli->prepare("
        SELECT 
            (SELECT COUNT(*) FROM certificates WHERE user_id = ?) as certificate_count,
            (SELECT COUNT(*) FROM exams WHERE user_id = ?) as exam_count,
            (SELECT COUNT(*) FROM goals WHERE user_id = ? AND status = 'completed') as completed_goals,
            (SELECT COUNT(*) FROM goals WHERE user_id = ? AND status = 'pending') as pending_goals
    ");
    $stmt->bind_param('iiii', $userId, $userId, $userId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stats['own'] = $result->fetch_assoc();
    
    // Admin/Trainer Statistiken
    if ($userRole === 'admin' || $userRole === 'trainer') {
        $stmt = $mysqli->prepare("
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'schueler') as total_students,
                (SELECT COUNT(*) FROM certificates) as total_certificates,
                (SELECT COUNT(*) FROM exams) as total_exams,
                (SELECT COUNT(*) FROM courses WHERE date >= CURDATE()) as upcoming_courses
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        $stats['global'] = $result->fetch_assoc();
    }
    
    // Prüfungen der letzten 6 Monate (für Chart)
    $stmt = $mysqli->prepare("
        SELECT DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as count
        FROM exams
        WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(date, '%Y-%m')
        ORDER BY month ASC
    ");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stats['exam_chart'] = [];
    while ($row = $result->fetch_assoc()) {
        $stats['exam_chart'][] = $row;
    }
    
    json_out(['success' => true, 'stats' => $stats]);
}
