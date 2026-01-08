<?php
/**
 * Gruppen API
 * Verwaltet Schülergruppen
 */

require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_out(['success' => false, 'error' => 'Datenbankverbindung fehlgeschlagen: ' . $e->getMessage()], 500);
}

$userId = auth_user_id($mysqli);
$userRole = auth_user_role($mysqli);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        handleGet($mysqli, $userId, $userRole, $action);
        break;
    case 'POST':
        handlePost($mysqli, $userId, $userRole);
        break;
    case 'PUT':
        handlePut($mysqli, $userId, $userRole);
        break;
    case 'DELETE':
        handleDelete($mysqli, $userId, $userRole);
        break;
    default:
        json_out(['error' => 'Method not allowed'], 405);
}

function handleGet($mysqli, $userId, $userRole, $action) {
    // Login erforderlich
    if (!$userId) {
        json_out(['error' => 'Nicht eingeloggt'], 401);
    }
    
    if ($action === 'members') {
        // Mitglieder einer bestimmten Gruppe abrufen
        $groupId = intval($_GET['group_id'] ?? 0);
        if (!$groupId) {
            json_out(['error' => 'Gruppen-ID fehlt'], 400);
        }
        
        $stmt = $mysqli->prepare("
            SELECT u.id, u.username, u.name
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = ?
            ORDER BY u.name
        ");
        $stmt->bind_param('i', $groupId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $members = [];
        while ($row = $result->fetch_assoc()) {
            $members[] = $row;
        }
        
        json_out(['success' => true, 'members' => $members]);
    }
    
    // Alle Gruppen abrufen (für Trainer/Admin)
    if ($userRole !== 'admin' && $userRole !== 'trainer') {
        json_out(['error' => 'Keine Berechtigung'], 403);
    }
    
    // Admin sieht alle, Trainer nur eigene
    if ($userRole === 'admin') {
        $stmt = $mysqli->prepare("
            SELECT g.*, 
                   u.name as created_by_name,
                   (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
            FROM student_groups g
            LEFT JOIN users u ON g.created_by = u.id
            ORDER BY g.name
        ");
        $stmt->execute();
    } else {
        $stmt = $mysqli->prepare("
            SELECT g.*, 
                   u.name as created_by_name,
                   (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
            FROM student_groups g
            LEFT JOIN users u ON g.created_by = u.id
            WHERE g.created_by = ?
            ORDER BY g.name
        ");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
    }
    
    $result = $stmt->get_result();
    $groups = [];
    
    while ($row = $result->fetch_assoc()) {
        // Mitglieder-IDs abrufen
        $groupId = $row['id'];
        $memberStmt = $mysqli->prepare("SELECT user_id FROM group_members WHERE group_id = ?");
        $memberStmt->bind_param('i', $groupId);
        $memberStmt->execute();
        $memberResult = $memberStmt->get_result();
        
        $userIds = [];
        while ($member = $memberResult->fetch_assoc()) {
            $userIds[] = intval($member['user_id']);
        }
        
        $groups[] = [
            'id' => intval($row['id']),
            'name' => $row['name'],
            'description' => $row['description'],
            'created_by' => intval($row['created_by']),
            'created_by_name' => $row['created_by_name'],
            'member_count' => intval($row['member_count']),
            'userIds' => $userIds
        ];
    }
    
    json_out(['success' => true, 'groups' => $groups]);
}

function handlePost($mysqli, $userId, $userRole) {
    // Login erforderlich
    if (!$userId) {
        json_out(['error' => 'Nicht eingeloggt'], 401);
    }
    
    // Nur Trainer und Admin
    if ($userRole !== 'admin' && $userRole !== 'trainer') {
        json_out(['error' => 'Keine Berechtigung'], 403);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');
    $userIds = $data['userIds'] ?? [];
    
    if (empty($name)) {
        json_out(['error' => 'Gruppenname ist erforderlich'], 400);
    }
    
    // Transaktion starten
    $mysqli->begin_transaction();
    
    try {
        // Gruppe erstellen
        $stmt = $mysqli->prepare("INSERT INTO student_groups (name, description, created_by) VALUES (?, ?, ?)");
        $stmt->bind_param('ssi', $name, $description, $userId);
        $stmt->execute();
        
        $groupId = $mysqli->insert_id;
        
        // Mitglieder hinzufügen
        if (!empty($userIds)) {
            $memberStmt = $mysqli->prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)");
            foreach ($userIds as $memberId) {
                $memberStmt->bind_param('ii', $groupId, $memberId);
                $memberStmt->execute();
            }
        }
        
        $mysqli->commit();
        
        json_out([
            'success' => true, 
            'message' => 'Gruppe erstellt',
            'group' => [
                'id' => $groupId,
                'name' => $name,
                'description' => $description,
                'userIds' => $userIds,
                'member_count' => count($userIds)
            ]
        ]);
    } catch (Exception $e) {
        $mysqli->rollback();
        json_out(['error' => 'Fehler beim Erstellen der Gruppe: ' . $e->getMessage()], 500);
    }
}

function handlePut($mysqli, $userId, $userRole) {
    // Login erforderlich
    if (!$userId) {
        json_out(['error' => 'Nicht eingeloggt'], 401);
    }
    
    // Nur Trainer und Admin
    if ($userRole !== 'admin' && $userRole !== 'trainer') {
        json_out(['error' => 'Keine Berechtigung'], 403);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $groupId = intval($data['id'] ?? 0);
    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');
    $userIds = $data['userIds'] ?? [];
    
    if (!$groupId) {
        json_out(['error' => 'Gruppen-ID fehlt'], 400);
    }
    
    if (empty($name)) {
        json_out(['error' => 'Gruppenname ist erforderlich'], 400);
    }
    
    // Berechtigung prüfen (nur eigene Gruppen oder Admin)
    if ($userRole !== 'admin') {
        $checkStmt = $mysqli->prepare("SELECT created_by FROM student_groups WHERE id = ?");
        $checkStmt->bind_param('i', $groupId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $group = $result->fetch_assoc();
        
        if (!$group || $group['created_by'] != $userId) {
            json_out(['error' => 'Keine Berechtigung'], 403);
        }
    }
    
    // Transaktion starten
    $mysqli->begin_transaction();
    
    try {
        // Gruppe aktualisieren
        $stmt = $mysqli->prepare("UPDATE student_groups SET name = ?, description = ? WHERE id = ?");
        $stmt->bind_param('ssi', $name, $description, $groupId);
        $stmt->execute();
        
        // Alte Mitglieder entfernen
        $deleteStmt = $mysqli->prepare("DELETE FROM group_members WHERE group_id = ?");
        $deleteStmt->bind_param('i', $groupId);
        $deleteStmt->execute();
        
        // Neue Mitglieder hinzufügen
        if (!empty($userIds)) {
            $memberStmt = $mysqli->prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)");
            foreach ($userIds as $memberId) {
                $memberStmt->bind_param('ii', $groupId, $memberId);
                $memberStmt->execute();
            }
        }
        
        $mysqli->commit();
        
        json_out([
            'success' => true,
            'message' => 'Gruppe aktualisiert'
        ]);
    } catch (Exception $e) {
        $mysqli->rollback();
        json_out(['error' => 'Fehler beim Aktualisieren: ' . $e->getMessage()], 500);
    }
}

function handleDelete($mysqli, $userId, $userRole) {
    // Login erforderlich
    if (!$userId) {
        json_out(['error' => 'Nicht eingeloggt'], 401);
    }
    
    // Nur Trainer und Admin
    if ($userRole !== 'admin' && $userRole !== 'trainer') {
        json_out(['error' => 'Keine Berechtigung'], 403);
    }
    
    $groupId = intval($_GET['id'] ?? 0);
    
    if (!$groupId) {
        json_out(['error' => 'Gruppen-ID fehlt'], 400);
    }
    
    // Berechtigung prüfen
    if ($userRole !== 'admin') {
        $checkStmt = $mysqli->prepare("SELECT created_by FROM student_groups WHERE id = ?");
        $checkStmt->bind_param('i', $groupId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $group = $result->fetch_assoc();
        
        if (!$group || $group['created_by'] != $userId) {
            json_out(['error' => 'Keine Berechtigung'], 403);
        }
    }
    
    // Mitglieder und Gruppe löschen (CASCADE sollte das automatisch machen)
    $stmt = $mysqli->prepare("DELETE FROM student_groups WHERE id = ?");
    $stmt->bind_param('i', $groupId);
    $stmt->execute();
    
    json_out(['success' => true, 'message' => 'Gruppe gelöscht']);
}
