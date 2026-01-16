<?php
// ===== FIGHTLOG - ZIELE API (NEU) =====
// Neues System mit Templates und Unterzielen

require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();
$method = $_SERVER['REQUEST_METHOD'];
$userId = auth_user_id($mysqli);
$userRole = auth_user_role($mysqli);

// =============================================
// GET - Daten abrufen
// =============================================
if ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : 'userGoals';
    
    // Alle verfügbaren Ziel-Templates abrufen
    if ($action === 'templates') {
        $sql = "
            SELECT gt.id, gt.title, gt.definition, gt.category,
                   (SELECT COUNT(*) FROM goal_template_subtasks WHERE template_id = gt.id) AS subtask_count
            FROM goal_templates gt
            ORDER BY gt.category, gt.title
        ";
        $res = $mysqli->query($sql);
        if (!$res) json_out(['success' => false, 'error' => 'DB-Fehler: ' . $mysqli->error], 500);
        json_out(['success' => true, 'templates' => $res->fetch_all(MYSQLI_ASSOC)]);
    }
    
    // Unterziele eines Templates abrufen
    if ($action === 'subtasks') {
        $templateId = isset($_GET['templateId']) ? (int)$_GET['templateId'] : 0;
        if (!$templateId) json_out(['success' => false, 'error' => 'templateId erforderlich'], 400);
        
        $stmt = $mysqli->prepare("SELECT id, definition, sort_order FROM goal_template_subtasks WHERE template_id = ? ORDER BY sort_order");
        $stmt->bind_param('i', $templateId);
        $stmt->execute();
        $subtasks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_out(['success' => true, 'subtasks' => $subtasks]);
    }
    
    // Ziele eines Users mit Fortschritt abrufen
    if ($action === 'userGoals') {
        $targetUserId = isset($_GET['userId']) ? (int)$_GET['userId'] : $userId;
        
        // Berechtigungsprüfung: eigene oder fremde?
        if ($targetUserId !== $userId && $userRole === 'schueler') {
            json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
        }
        
        $sql = "
            SELECT ug.id, ug.user_id, ug.template_id, ug.target_date, ug.status, ug.created_at, ug.completed_at,
                   gt.title, gt.definition, gt.category,
                   (SELECT COUNT(*) FROM goal_template_subtasks WHERE template_id = gt.id) AS total_subtasks,
                   (SELECT COUNT(*) FROM user_goal_progress ugp 
                    JOIN goal_template_subtasks gts ON ugp.subtask_id = gts.id 
                    WHERE ugp.user_goal_id = ug.id AND ugp.completed = 1) AS completed_subtasks
            FROM user_goals ug
            JOIN goal_templates gt ON ug.template_id = gt.id
            WHERE ug.user_id = ?
            ORDER BY 
                CASE ug.status 
                    WHEN 'in_progress' THEN 1 
                    WHEN 'completed' THEN 2 
                    WHEN 'cancelled' THEN 3 
                END,
                ug.target_date ASC,
                ug.created_at DESC
        ";
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param('i', $targetUserId);
        $stmt->execute();
        $goals = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        // Progress berechnen
        foreach ($goals as &$goal) {
            $total = (int)$goal['total_subtasks'];
            $completed = (int)$goal['completed_subtasks'];
            $goal['progress'] = $total > 0 ? round(($completed / $total) * 100) : 0;
        }
        
        json_out(['success' => true, 'goals' => $goals]);
    }
    
    // Fortschritt/Unterziele eines User-Ziels abrufen
    if ($action === 'goalProgress') {
        $userGoalId = isset($_GET['userGoalId']) ? (int)$_GET['userGoalId'] : 0;
        if (!$userGoalId) json_out(['success' => false, 'error' => 'userGoalId erforderlich'], 400);
        
        // Prüfe Berechtigung
        $checkStmt = $mysqli->prepare("SELECT user_id, template_id FROM user_goals WHERE id = ?");
        $checkStmt->bind_param('i', $userGoalId);
        $checkStmt->execute();
        $goalInfo = $checkStmt->get_result()->fetch_assoc();
        
        if (!$goalInfo) json_out(['success' => false, 'error' => 'Ziel nicht gefunden'], 404);
        if ((int)$goalInfo['user_id'] !== $userId && $userRole === 'schueler') {
            json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
        }
        
        // Alle Unterziele mit Fortschritt laden
        $sql = "
            SELECT gts.id AS subtask_id, gts.definition, gts.sort_order,
                   COALESCE(ugp.completed, 0) AS completed,
                   ugp.completed_at
            FROM goal_template_subtasks gts
            LEFT JOIN user_goal_progress ugp ON gts.id = ugp.subtask_id AND ugp.user_goal_id = ?
            WHERE gts.template_id = ?
            ORDER BY gts.sort_order
        ";
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param('ii', $userGoalId, $goalInfo['template_id']);
        $stmt->execute();
        $subtasks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        json_out(['success' => true, 'subtasks' => $subtasks]);
    }
    
    // Kategorien abrufen
    if ($action === 'categories') {
        $res = $mysqli->query("SELECT DISTINCT category FROM goal_templates ORDER BY category");
        $categories = [];
        while ($row = $res->fetch_assoc()) {
            $categories[] = $row['category'];
        }
        json_out(['success' => true, 'categories' => $categories]);
    }
    
    // Ein einzelnes Template mit Unterzielen abrufen (für Bearbeitung)
    if ($action === 'templateDetails') {
        $templateId = isset($_GET['templateId']) ? (int)$_GET['templateId'] : 0;
        if (!$templateId) json_out(['success' => false, 'error' => 'templateId erforderlich'], 400);
        
        // Template laden
        $stmt = $mysqli->prepare("SELECT id, title, definition, category FROM goal_templates WHERE id = ?");
        $stmt->bind_param('i', $templateId);
        $stmt->execute();
        $template = $stmt->get_result()->fetch_assoc();
        
        if (!$template) json_out(['success' => false, 'error' => 'Template nicht gefunden'], 404);
        
        // Unterziele laden
        $stmt2 = $mysqli->prepare("SELECT id, definition, sort_order FROM goal_template_subtasks WHERE template_id = ? ORDER BY sort_order");
        $stmt2->bind_param('i', $templateId);
        $stmt2->execute();
        $template['subtasks'] = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);
        
        json_out(['success' => true, 'template' => $template]);
    }
    
    json_out(['success' => false, 'error' => 'Unbekannte Aktion'], 400);
}

// =============================================
// POST - Ziel zuweisen / Fortschritt speichern / Templates verwalten
// =============================================
if ($method === 'POST') {
    $body = read_json_body();
    $action = isset($body['action']) ? $body['action'] : '';
    
    // ========== TEMPLATE CRUD (nur Admin/Trainer) ==========
    
    // Neues Template erstellen
    if ($action === 'createTemplate') {
        if ($userRole === 'schueler') {
            json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
        }
        
        $title = isset($body['title']) ? trim($body['title']) : '';
        $definition = isset($body['definition']) ? trim($body['definition']) : '';
        $category = isset($body['category']) ? trim($body['category']) : '';
        $subtasks = isset($body['subtasks']) ? $body['subtasks'] : [];
        
        if (!$title) json_out(['success' => false, 'error' => 'Titel erforderlich'], 400);
        
        // Template erstellen
        $stmt = $mysqli->prepare("INSERT INTO goal_templates (title, definition, category) VALUES (?, ?, ?)");
        $stmt->bind_param('sss', $title, $definition, $category);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        $templateId = $stmt->insert_id;
        
        // Unterziele erstellen
        if (!empty($subtasks)) {
            $subtaskStmt = $mysqli->prepare("INSERT INTO goal_template_subtasks (template_id, definition, sort_order) VALUES (?, ?, ?)");
            $sortOrder = 1;
            foreach ($subtasks as $subtask) {
                $def = is_array($subtask) ? trim($subtask['definition'] ?? '') : trim($subtask);
                if ($def) {
                    $subtaskStmt->bind_param('isi', $templateId, $def, $sortOrder);
                    $subtaskStmt->execute();
                    $sortOrder++;
                }
            }
        }
        
        json_out(['success' => true, 'templateId' => $templateId]);
    }
    
    // Template aktualisieren
    if ($action === 'updateTemplate') {
        if ($userRole === 'schueler') {
            json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
        }
        
        $templateId = isset($body['templateId']) ? (int)$body['templateId'] : 0;
        $title = isset($body['title']) ? trim($body['title']) : '';
        $definition = isset($body['definition']) ? trim($body['definition']) : '';
        $category = isset($body['category']) ? trim($body['category']) : '';
        $subtasks = isset($body['subtasks']) ? $body['subtasks'] : [];
        
        if (!$templateId) json_out(['success' => false, 'error' => 'templateId erforderlich'], 400);
        if (!$title) json_out(['success' => false, 'error' => 'Titel erforderlich'], 400);
        
        // Template aktualisieren
        $stmt = $mysqli->prepare("UPDATE goal_templates SET title = ?, definition = ?, category = ? WHERE id = ?");
        $stmt->bind_param('sssi', $title, $definition, $category, $templateId);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        
        // Alte Unterziele löschen und neue erstellen
        $mysqli->query("DELETE FROM goal_template_subtasks WHERE template_id = $templateId");
        
        if (!empty($subtasks)) {
            $subtaskStmt = $mysqli->prepare("INSERT INTO goal_template_subtasks (template_id, definition, sort_order) VALUES (?, ?, ?)");
            $sortOrder = 1;
            foreach ($subtasks as $subtask) {
                $def = is_array($subtask) ? trim($subtask['definition'] ?? '') : trim($subtask);
                if ($def) {
                    $subtaskStmt->bind_param('isi', $templateId, $def, $sortOrder);
                    $subtaskStmt->execute();
                    $sortOrder++;
                }
            }
        }
        
        json_out(['success' => true]);
    }
    
    // Template löschen
    if ($action === 'deleteTemplate') {
        if ($userRole === 'schueler') {
            json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
        }
        
        $templateId = isset($body['templateId']) ? (int)$body['templateId'] : 0;
        if (!$templateId) json_out(['success' => false, 'error' => 'templateId erforderlich'], 400);
        
        // Prüfen ob Template verwendet wird
        $checkStmt = $mysqli->prepare("SELECT COUNT(*) AS cnt FROM user_goals WHERE template_id = ?");
        $checkStmt->bind_param('i', $templateId);
        $checkStmt->execute();
        $usage = $checkStmt->get_result()->fetch_assoc();
        
        if ($usage['cnt'] > 0) {
            json_out(['success' => false, 'error' => 'Template wird noch von ' . $usage['cnt'] . ' Ziel(en) verwendet'], 400);
        }
        
        // Unterziele löschen
        $mysqli->query("DELETE FROM goal_template_subtasks WHERE template_id = $templateId");
        
        // Template löschen
        $stmt = $mysqli->prepare("DELETE FROM goal_templates WHERE id = ?");
        $stmt->bind_param('i', $templateId);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        
        json_out(['success' => true]);
    }
    
    // Ziel-Template dem User zuweisen
    if ($action === 'assignGoal') {
        $templateId = isset($body['templateId']) ? (int)$body['templateId'] : 0;
        $targetUserId = isset($body['userId']) ? (int)$body['userId'] : $userId;
        $targetDate = isset($body['targetDate']) && !empty($body['targetDate']) ? $body['targetDate'] : null;
        
        if (!$templateId) json_out(['success' => false, 'error' => 'templateId erforderlich'], 400);
        
        // Berechtigungsprüfung
        if ($targetUserId !== $userId && $userRole === 'schueler') {
            json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
        }
        
        // Prüfen ob Template existiert
        $checkStmt = $mysqli->prepare("SELECT id FROM goal_templates WHERE id = ?");
        $checkStmt->bind_param('i', $templateId);
        $checkStmt->execute();
        if (!$checkStmt->get_result()->fetch_assoc()) {
            json_out(['success' => false, 'error' => 'Template nicht gefunden'], 404);
        }
        
        // Ziel zuweisen (mit oder ohne target_date)
        if ($targetDate) {
            $stmt = $mysqli->prepare("INSERT INTO user_goals (user_id, template_id, target_date, status) VALUES (?, ?, ?, 'in_progress')");
            $stmt->bind_param('iis', $targetUserId, $templateId, $targetDate);
        } else {
            $stmt = $mysqli->prepare("INSERT INTO user_goals (user_id, template_id, status) VALUES (?, ?, 'in_progress')");
            $stmt->bind_param('ii', $targetUserId, $templateId);
        }
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        
        $userGoalId = $stmt->insert_id;
        
        // Progress-Einträge für alle Unterziele erstellen
        $subtaskStmt = $mysqli->prepare("SELECT id FROM goal_template_subtasks WHERE template_id = ?");
        $subtaskStmt->bind_param('i', $templateId);
        $subtaskStmt->execute();
        $subtasks = $subtaskStmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        $insertProgress = $mysqli->prepare("INSERT INTO user_goal_progress (user_goal_id, subtask_id, completed) VALUES (?, ?, 0)");
        foreach ($subtasks as $st) {
            $insertProgress->bind_param('ii', $userGoalId, $st['id']);
            $insertProgress->execute();
        }
        
        json_out(['success' => true, 'id' => $userGoalId]);
    }
    
    // Unterziel als erledigt/nicht erledigt markieren
    if ($action === 'toggleSubtask') {
        $userGoalId = isset($body['userGoalId']) ? (int)$body['userGoalId'] : 0;
        $subtaskId = isset($body['subtaskId']) ? (int)$body['subtaskId'] : 0;
        $completed = isset($body['completed']) ? (int)$body['completed'] : 0;
        
        if (!$userGoalId || !$subtaskId) {
            json_out(['success' => false, 'error' => 'userGoalId und subtaskId erforderlich'], 400);
        }
        
        // Berechtigungsprüfung
        $checkStmt = $mysqli->prepare("SELECT user_id FROM user_goals WHERE id = ?");
        $checkStmt->bind_param('i', $userGoalId);
        $checkStmt->execute();
        $goalInfo = $checkStmt->get_result()->fetch_assoc();
        
        if (!$goalInfo) json_out(['success' => false, 'error' => 'Ziel nicht gefunden'], 404);
        if ((int)$goalInfo['user_id'] !== $userId && $userRole === 'schueler') {
            json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
        }
        
        // Progress updaten oder erstellen
        $completedAt = $completed ? date('Y-m-d H:i:s') : null;
        $stmt = $mysqli->prepare("
            INSERT INTO user_goal_progress (user_goal_id, subtask_id, completed, completed_at) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE completed = VALUES(completed), completed_at = VALUES(completed_at)
        ");
        $stmt->bind_param('iiis', $userGoalId, $subtaskId, $completed, $completedAt);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        
        // Prüfen ob alle Unterziele erledigt sind
        $progressStmt = $mysqli->prepare("
            SELECT 
                (SELECT COUNT(*) FROM goal_template_subtasks gts 
                 JOIN user_goals ug ON gts.template_id = ug.template_id 
                 WHERE ug.id = ?) AS total,
                (SELECT COUNT(*) FROM user_goal_progress 
                 WHERE user_goal_id = ? AND completed = 1) AS done
        ");
        $progressStmt->bind_param('ii', $userGoalId, $userGoalId);
        $progressStmt->execute();
        $progress = $progressStmt->get_result()->fetch_assoc();
        
        $allDone = (int)$progress['total'] > 0 && (int)$progress['done'] >= (int)$progress['total'];
        
        // Status aktualisieren
        if ($allDone) {
            $updateStmt = $mysqli->prepare("UPDATE user_goals SET status = 'completed', completed_at = NOW() WHERE id = ?");
            $updateStmt->bind_param('i', $userGoalId);
            $updateStmt->execute();
        } else {
            $updateStmt = $mysqli->prepare("UPDATE user_goals SET status = 'in_progress', completed_at = NULL WHERE id = ? AND status = 'completed'");
            $updateStmt->bind_param('i', $userGoalId);
            $updateStmt->execute();
        }
        
        $newProgress = (int)$progress['total'] > 0 ? round(((int)$progress['done'] / (int)$progress['total']) * 100) : 0;
        
        json_out(['success' => true, 'progress' => $newProgress, 'completed' => $allDone]);
    }
    
    // Ziel abbrechen
    if ($action === 'cancelGoal') {
        $userGoalId = isset($body['userGoalId']) ? (int)$body['userGoalId'] : 0;
        if (!$userGoalId) json_out(['success' => false, 'error' => 'userGoalId erforderlich'], 400);
        
        // Berechtigungsprüfung
        $checkStmt = $mysqli->prepare("SELECT user_id FROM user_goals WHERE id = ?");
        $checkStmt->bind_param('i', $userGoalId);
        $checkStmt->execute();
        $goalInfo = $checkStmt->get_result()->fetch_assoc();
        
        if (!$goalInfo) json_out(['success' => false, 'error' => 'Ziel nicht gefunden'], 404);
        if ((int)$goalInfo['user_id'] !== $userId && $userRole === 'schueler') {
            json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
        }
        
        $stmt = $mysqli->prepare("UPDATE user_goals SET status = 'cancelled' WHERE id = ?");
        $stmt->bind_param('i', $userGoalId);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        
        json_out(['success' => true]);
    }
    
    // Ziel löschen
    if ($action === 'deleteGoal') {
        $userGoalId = isset($body['userGoalId']) ? (int)$body['userGoalId'] : 0;
        if (!$userGoalId) json_out(['success' => false, 'error' => 'userGoalId erforderlich'], 400);
        
        // Berechtigungsprüfung
        $checkStmt = $mysqli->prepare("SELECT user_id FROM user_goals WHERE id = ?");
        $checkStmt->bind_param('i', $userGoalId);
        $checkStmt->execute();
        $goalInfo = $checkStmt->get_result()->fetch_assoc();
        
        if (!$goalInfo) json_out(['success' => false, 'error' => 'Ziel nicht gefunden'], 404);
        if ((int)$goalInfo['user_id'] !== $userId && $userRole === 'schueler') {
            json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
        }
        
        // Progress löschen
        $mysqli->query("DELETE FROM user_goal_progress WHERE user_goal_id = $userGoalId");
        
        // Ziel löschen
        $stmt = $mysqli->prepare("DELETE FROM user_goals WHERE id = ?");
        $stmt->bind_param('i', $userGoalId);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        
        json_out(['success' => true]);
    }
    
    json_out(['success' => false, 'error' => 'Unbekannte Aktion'], 400);
}

json_out(['success' => false, 'error' => 'Methode nicht erlaubt'], 405);
?>
