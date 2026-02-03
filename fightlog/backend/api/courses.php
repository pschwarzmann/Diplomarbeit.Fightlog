<?php
// backend/api/courses.php
require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_out(['success' => false, 'error' => 'Datenbankverbindung fehlgeschlagen: ' . $e->getMessage()], 500);
}

$userId = auth_user_id($mysqli);
$userRole = auth_user_role($mysqli);

// GET - Kurse abrufen
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Prüfe auf spezielle Aktionen
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    // Teilnehmer eines Kurses abrufen (für Admin/Trainer)
    if ($action === 'participants') {
        $courseId = isset($_GET['courseId']) ? (int)$_GET['courseId'] : 0;
        if (!$courseId) {
            json_out(['success' => false, 'error' => 'courseId erforderlich'], 400);
        }
        
        $stmt = $mysqli->prepare("
            SELECT cb.id, cb.user_id, cb.booking_date, cb.status,
                   u.name, u.username, u.email
            FROM course_bookings cb
            JOIN users u ON cb.user_id = u.id
            WHERE cb.course_id = ? AND cb.status != 'cancelled'
            ORDER BY cb.booking_date ASC
        ");
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        $res = $stmt->get_result();
        $participants = $res->fetch_all(MYSQLI_ASSOC);
        json_out($participants);
    }
    
    // Standard: Alle Kurse mit Buchungsstatus für aktuellen User
    // current_participants wird dynamisch aus course_bookings berechnet
    $sql = "
        SELECT sc.id, sc.title, sc.instructor, sc.date, sc.duration, 
               sc.description, sc.max_participants, sc.price,
               'approved' AS status,
               (SELECT COUNT(*) FROM course_bookings cb2 WHERE cb2.course_id = sc.id AND cb2.status != 'cancelled') AS current_participants,
               (sc.max_participants - (SELECT COUNT(*) FROM course_bookings cb3 WHERE cb3.course_id = sc.id AND cb3.status != 'cancelled')) AS free_spots,
               (SELECT cb.status FROM course_bookings cb 
                WHERE cb.course_id = sc.id AND cb.user_id = ? AND cb.status != 'cancelled'
                LIMIT 1) AS booking_status
        FROM courses sc
        ORDER BY sc.date ASC, sc.id DESC
    ";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if (!$res) {
        json_out(['success' => false, 'error' => 'Query fehlgeschlagen: ' . $mysqli->error], 500);
    }
    $list = $res->fetch_all(MYSQLI_ASSOC);
    json_out($list);
}

// POST - Kurs erstellen oder Buchung verwalten
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();
    $action = isset($body['action']) ? $body['action'] : 'add';

    // Kurs hinzufügen (Admin/Trainer)
    if ($action === 'add') {
        require_permission($mysqli, 'create_courses');
        require_fields($body, ['title', 'date', 'instructor', 'duration', 'max_participants', 'price']);
        $desc = isset($body['description']) ? $body['description'] : null;
        $max = (int)$body['max_participants'];
        $price = $body['price'];
        $duration = $body['duration'];
        
        $stmt = $mysqli->prepare("
            INSERT INTO courses (title, instructor, date, duration, max_participants, current_participants, price, description) 
            VALUES (?, ?, ?, ?, ?, 0, ?, ?)
        ");
        $stmt->bind_param('ssssiss', $body['title'], $body['instructor'], $body['date'], $duration, $max, $price, $desc);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Insert fehlgeschlagen: ' . $stmt->error], 500);
        }
        
        $courseId = $stmt->insert_id;
        
        // Optional: Schüler direkt hinzufügen
        if (isset($body['userIds']) && is_array($body['userIds']) && count($body['userIds']) > 0) {
            $bookStmt = $mysqli->prepare("INSERT INTO course_bookings (course_id, user_id, status) VALUES (?, ?, 'confirmed')");
            foreach ($body['userIds'] as $uid) {
                $bookStmt->bind_param('ii', $courseId, $uid);
                $bookStmt->execute();
            }
            // Update current_participants
            $updateStmt = $mysqli->prepare("UPDATE courses SET current_participants = (SELECT COUNT(*) FROM course_bookings WHERE course_id = ? AND status != 'cancelled') WHERE id = ?");
            $updateStmt->bind_param('ii', $courseId, $courseId);
            $updateStmt->execute();
        }
        
        json_out(['success' => true, 'id' => $courseId]);
    }

    // Kurs aktualisieren (Admin/Trainer)
    if ($action === 'update') {
        require_permission($mysqli, 'edit_courses');
        require_fields($body, ['id', 'title']);
        $id = (int)$body['id'];
        $title = $body['title'];
        $instructor = isset($body['instructor']) ? $body['instructor'] : null;
        $date = isset($body['date']) ? $body['date'] : null;
        $duration = isset($body['duration']) ? $body['duration'] : null;
        $max = isset($body['max_participants']) ? (int)$body['max_participants'] : null;
        $price = isset($body['price']) ? $body['price'] : null;
        $desc = isset($body['description']) ? $body['description'] : null;
        
        $stmt = $mysqli->prepare("
            UPDATE courses 
            SET title = ?, 
                instructor = COALESCE(?, instructor), 
                date = COALESCE(?, date),
                duration = COALESCE(?, duration),
                max_participants = COALESCE(?, max_participants),
                price = COALESCE(?, price),
                description = ?
            WHERE id = ?
        ");
        $stmt->bind_param('ssssissi', $title, $instructor, $date, $duration, $max, $price, $desc, $id);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Update fehlgeschlagen: ' . $stmt->error], 500);
        }
        json_out(['success' => true]);
    }

    // Kurs löschen (Admin/Trainer)
    if ($action === 'delete') {
        require_permission($mysqli, 'delete_courses');
        require_fields($body, ['id']);
        
        // Zuerst Buchungen löschen (FK-Constraint)
        $delBookings = $mysqli->prepare("DELETE FROM course_bookings WHERE course_id = ?");
        $delBookings->bind_param('i', $body['id']);
        $delBookings->execute();
        
        // Dann Kurs löschen
        $stmt = $mysqli->prepare("DELETE FROM courses WHERE id = ?");
        $stmt->bind_param('i', $body['id']);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Delete fehlgeschlagen: ' . $stmt->error], 500);
        }
        json_out(['success' => true]);
    }

    // Schüler meldet sich für Kurs an
    if ($action === 'book') {
        require_permission($mysqli, 'book_courses');
        require_fields($body, ['courseId']);
        $courseId = (int)$body['courseId'];
        $bookUserId = $userId; // Aktueller User
        
        // Transaktion starten für Race-Condition-Schutz
        $mysqli->begin_transaction();
        
        try {
            // Kurs mit FOR UPDATE sperren um Race Conditions zu verhindern
            $checkStmt = $mysqli->prepare("SELECT max_participants, current_participants, date FROM courses WHERE id = ? FOR UPDATE");
            $checkStmt->bind_param('i', $courseId);
            $checkStmt->execute();
            $course = $checkStmt->get_result()->fetch_assoc();
            
            if (!$course) {
                $mysqli->rollback();
                json_out(['success' => false, 'error' => 'Kurs nicht gefunden'], 404);
            }
        
            if ($course['current_participants'] >= $course['max_participants']) {
                $mysqli->rollback();
                json_out(['success' => false, 'error' => 'Keine freien Plätze mehr'], 400);
            }
            
            // Prüfe ob bereits gebucht
            $existsStmt = $mysqli->prepare("SELECT id, status FROM course_bookings WHERE course_id = ? AND user_id = ?");
            $existsStmt->bind_param('ii', $courseId, $bookUserId);
            $existsStmt->execute();
            $existing = $existsStmt->get_result()->fetch_assoc();
            
            if ($existing && $existing['status'] !== 'cancelled') {
                $mysqli->rollback();
                json_out(['success' => false, 'error' => 'Bereits angemeldet'], 400);
            }
            
            // Buchung erstellen oder reaktivieren
            if ($existing) {
                $stmt = $mysqli->prepare("UPDATE course_bookings SET status = 'confirmed', booking_date = NOW() WHERE id = ?");
                $stmt->bind_param('i', $existing['id']);
            } else {
                $stmt = $mysqli->prepare("INSERT INTO course_bookings (course_id, user_id, status) VALUES (?, ?, 'confirmed')");
                $stmt->bind_param('ii', $courseId, $bookUserId);
            }
            
            if (!$stmt->execute()) {
                $mysqli->rollback();
                json_out(['success' => false, 'error' => 'Buchung fehlgeschlagen: ' . $stmt->error], 500);
            }
            
            // Update current_participants
            $updateStmt = $mysqli->prepare("UPDATE courses SET current_participants = (SELECT COUNT(*) FROM course_bookings WHERE course_id = ? AND status != 'cancelled') WHERE id = ?");
            $updateStmt->bind_param('ii', $courseId, $courseId);
            $updateStmt->execute();
            
            // Transaktion erfolgreich abschließen
            $mysqli->commit();
            json_out(['success' => true]);
            
        } catch (Exception $e) {
            $mysqli->rollback();
            json_out(['success' => false, 'error' => 'Buchung fehlgeschlagen: ' . $e->getMessage()], 500);
        }
    }

    // Schüler meldet sich von Kurs ab
    if ($action === 'cancel') {
        require_fields($body, ['courseId']);
        $courseId = (int)$body['courseId'];
        $bookUserId = $userId;
        
        // Prüfe Kursdatum (Abmeldung nur bis 1 Tag vorher)
        $checkStmt = $mysqli->prepare("SELECT date FROM courses WHERE id = ?");
        $checkStmt->bind_param('i', $courseId);
        $checkStmt->execute();
        $course = $checkStmt->get_result()->fetch_assoc();
        
        if (!$course) {
            json_out(['success' => false, 'error' => 'Kurs nicht gefunden'], 404);
        }
        
        $courseDate = new DateTime($course['date']);
        $today = new DateTime();
        $today->setTime(0, 0, 0);
        $diff = $today->diff($courseDate)->days;
        $isFuture = $courseDate > $today;
        
        if (!$isFuture || $diff < 1) {
            json_out(['success' => false, 'error' => 'Abmeldung nur bis 1 Tag vor dem Kurs möglich'], 400);
        }
        
        // Buchung stornieren
        $stmt = $mysqli->prepare("UPDATE course_bookings SET status = 'cancelled' WHERE course_id = ? AND user_id = ?");
        $stmt->bind_param('ii', $courseId, $bookUserId);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Stornierung fehlgeschlagen: ' . $stmt->error], 500);
        }
        
        // Update current_participants
        $updateStmt = $mysqli->prepare("UPDATE courses SET current_participants = (SELECT COUNT(*) FROM course_bookings WHERE course_id = ? AND status != 'cancelled') WHERE id = ?");
        $updateStmt->bind_param('ii', $courseId, $courseId);
        $updateStmt->execute();
        
        json_out(['success' => true]);
    }

    // Admin/Trainer: Teilnehmer zum Kurs hinzufügen
    if ($action === 'addParticipant') {
        require_permission($mysqli, 'edit_courses');
        require_fields($body, ['courseId', 'userId']);
        $courseId = (int)$body['courseId'];
        $targetUserId = (int)$body['userId'];
        
        // Prüfe ob bereits gebucht
        $existsStmt = $mysqli->prepare("SELECT id, status FROM course_bookings WHERE course_id = ? AND user_id = ?");
        $existsStmt->bind_param('ii', $courseId, $targetUserId);
        $existsStmt->execute();
        $existing = $existsStmt->get_result()->fetch_assoc();
        
        if ($existing && $existing['status'] !== 'cancelled') {
            json_out(['success' => false, 'error' => 'Teilnehmer bereits angemeldet'], 400);
        }
        
        // Buchung erstellen oder reaktivieren
        if ($existing) {
            $stmt = $mysqli->prepare("UPDATE course_bookings SET status = 'confirmed', booking_date = NOW() WHERE id = ?");
            $stmt->bind_param('i', $existing['id']);
        } else {
            $stmt = $mysqli->prepare("INSERT INTO course_bookings (course_id, user_id, status) VALUES (?, ?, 'confirmed')");
            $stmt->bind_param('ii', $courseId, $targetUserId);
        }
        
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Hinzufügen fehlgeschlagen: ' . $stmt->error], 500);
        }
        
        // Update current_participants
        $updateStmt = $mysqli->prepare("UPDATE courses SET current_participants = (SELECT COUNT(*) FROM course_bookings WHERE course_id = ? AND status != 'cancelled') WHERE id = ?");
        $updateStmt->bind_param('ii', $courseId, $courseId);
        $updateStmt->execute();
        
        json_out(['success' => true]);
    }

    // Admin/Trainer: Teilnehmer aus Kurs entfernen
    if ($action === 'removeParticipant') {
        require_permission($mysqli, 'edit_courses');
        require_fields($body, ['courseId', 'userId']);
        $courseId = (int)$body['courseId'];
        $targetUserId = (int)$body['userId'];
        
        $stmt = $mysqli->prepare("UPDATE course_bookings SET status = 'cancelled' WHERE course_id = ? AND user_id = ?");
        $stmt->bind_param('ii', $courseId, $targetUserId);
        
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Entfernen fehlgeschlagen: ' . $stmt->error], 500);
        }
        
        // Update current_participants
        $updateStmt = $mysqli->prepare("UPDATE courses SET current_participants = (SELECT COUNT(*) FROM course_bookings WHERE course_id = ? AND status != 'cancelled') WHERE id = ?");
        $updateStmt->bind_param('ii', $courseId, $courseId);
        $updateStmt->execute();
        
        json_out(['success' => true]);
    }

    json_out(['success' => false, 'error' => 'Unbekannte Aktion'], 400);
}

json_out(['success' => false, 'error' => 'Nur GET/POST erlaubt'], 405);
?>
