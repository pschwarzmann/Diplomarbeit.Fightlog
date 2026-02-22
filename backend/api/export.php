<?php
// Export API (CSV + PDF)
require_once __DIR__ . '/../core/bootstrap.php';

// TCPDF einbinden (falls verfügbar)
$tcpdfAvailable = false;
$tcpdfPath = __DIR__ . '/../vendor/autoload.php';
if (file_exists($tcpdfPath)) {
    require_once $tcpdfPath;
    $tcpdfAvailable = class_exists('TCPDF');
}

$mysqli = db();
$method = $_SERVER['REQUEST_METHOD'];
$viewerId = auth_user_id($mysqli);

// Prüfe ob es ein API-Call ist (für Fehlerbehandlung)
$isApiCall = (
    isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false
) || (
    isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
) || (
    isset($_SERVER['HTTP_CONTENT_TYPE']) && strpos($_SERVER['HTTP_CONTENT_TYPE'], 'application/json') !== false
) || (
    strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false
);

if ($method === 'GET') {
    $type = $_GET['type'] ?? '';
    $format = $_GET['format'] ?? 'csv';
    
    if ($type === 'certificates') {
        // Urkunden exportieren
        require_permission($mysqli, 'view_all_certificates');
        
        $stmt = $mysqli->query("
            SELECT c.id, c.title, c.date, g.name as level, c.instructor, c.category,
                   CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as studentName,
                   u.username as studentUsername
            FROM certificates c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN grade g ON c.grade_id = g.id
            ORDER BY c.date DESC, c.id DESC
        ");
        $data = $stmt->fetch_all(MYSQLI_ASSOC);
        
        if ($format === 'csv') {
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="urkunden_' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            fputcsv($output, ['ID', 'Titel', 'Datum', 'Stufe', 'Prüfer', 'Kategorie', 'Schüler']);
            foreach ($data as $row) {
                fputcsv($output, [
                    $row['id'],
                    $row['title'],
                    $row['date'],
                    $row['level'] ?? '',
                    $row['instructor'],
                    $row['category'] ?? '',
                    $row['studentName'] ?: $row['studentUsername']
                ]);
            }
            fclose($output);
            exit;
        }
        
        if ($format === 'pdf') {
            if (!$tcpdfAvailable) {
                if ($isApiCall) {
                    json_error('PDF-Export nicht verfügbar. Bitte installieren Sie TCPDF via Composer.', 503);
                } else {
                    require_once __DIR__ . '/../errors/handle_error.php';
                    handle_error(503, 'PDF-Export nicht verfügbar');
                }
            }
            
            try {
                $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
                $pdf->SetCreator('FightLog');
                $pdf->SetAuthor('FightLog');
                $pdf->SetTitle('Urkunden Export');
                $pdf->SetSubject('Urkunden Export');
                $pdf->SetKeywords('Urkunden, Export, FightLog');
                
                // Header/Footer entfernen
                $pdf->setPrintHeader(false);
                $pdf->setPrintFooter(false);
                
                // Neue Seite
                $pdf->AddPage();
                
                // Titel
                $pdf->SetFont('helvetica', 'B', 16);
                $pdf->Cell(0, 10, 'Urkunden Export', 0, 1, 'C');
                $pdf->Ln(5);
                
                // Tabelle
                $pdf->SetFont('helvetica', '', 9);
                
                // Header
                $pdf->SetFillColor(242, 242, 242);
                $pdf->SetFont('helvetica', 'B', 9);
                $pdf->Cell(15, 7, 'ID', 1, 0, 'C', true);
                $pdf->Cell(50, 7, 'Titel', 1, 0, 'L', true);
                $pdf->Cell(30, 7, 'Datum', 1, 0, 'C', true);
                $pdf->Cell(35, 7, 'Stufe', 1, 0, 'L', true);
                $pdf->Cell(40, 7, 'Prüfer', 1, 0, 'L', true);
                $pdf->Cell(35, 7, 'Kategorie', 1, 0, 'L', true);
                $pdf->Cell(50, 7, 'Schüler', 1, 1, 'L', true);
                
                // Daten
                $pdf->SetFont('helvetica', '', 8);
                foreach ($data as $row) {
                    $pdf->Cell(15, 6, $row['id'], 1, 0, 'C');
                    $pdf->Cell(50, 6, mb_substr($row['title'], 0, 25), 1, 0, 'L');
                    $pdf->Cell(30, 6, $row['date'], 1, 0, 'C');
                    $pdf->Cell(35, 6, mb_substr($row['level'] ?? '', 0, 15), 1, 0, 'L');
                    $pdf->Cell(40, 6, mb_substr($row['instructor'], 0, 20), 1, 0, 'L');
                    $pdf->Cell(35, 6, mb_substr($row['category'] ?? '', 0, 15), 1, 0, 'L');
                    $pdf->Cell(50, 6, mb_substr($row['studentName'] ?: $row['studentUsername'], 0, 20), 1, 1, 'L');
                }
                
                // Output
                header('Content-Type: application/pdf');
                header('Content-Disposition: attachment; filename="urkunden_' . date('Y-m-d') . '.pdf"');
                $pdf->Output('urkunden_' . date('Y-m-d') . '.pdf', 'D');
                exit;
            } catch (Exception $e) {
                // Error Leakage verhindern: Keine Exception-Details an Client
                error_log('PDF-Generierung fehlgeschlagen: ' . $e->getMessage());
                if ($isApiCall) {
                    json_error('PDF-Generierung fehlgeschlagen', 500);
                } else {
                    require_once __DIR__ . '/../errors/handle_error.php';
                    handle_error(500, 'PDF-Generierung fehlgeschlagen');
                }
            }
        }
    }
    
    if ($type === 'exams') {
        require_permission($mysqli, 'view_all_exams');
        
        $stmt = $mysqli->query("
            SELECT e.id, e.date, g.name as level, e.category, e.instructor, e.comments, e.status,
                   CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as studentName,
                   u.username as studentUsername
            FROM exams e
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN grade g ON e.grade_id = g.id
            ORDER BY e.date DESC, e.id DESC
        ");
        $data = $stmt->fetch_all(MYSQLI_ASSOC);
        
        if ($format === 'csv') {
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="pruefungen_' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            fputcsv($output, ['ID', 'Datum', 'Stufe', 'Kategorie', 'Prüfer', 'Kommentar', 'Status', 'Schüler']);
            foreach ($data as $row) {
                fputcsv($output, [
                    $row['id'],
                    $row['date'],
                    $row['level'] ?? '',
                    $row['category'],
                    $row['instructor'],
                    $row['comments'] ?? '',
                    $row['status'],
                    $row['studentName'] ?: $row['studentUsername']
                ]);
            }
            fclose($output);
            exit;
        }
        
        if ($format === 'pdf') {
            if (!$tcpdfAvailable) {
                if ($isApiCall) {
                    json_error('PDF-Export nicht verfügbar. Bitte installieren Sie TCPDF via Composer.', 503);
                } else {
                    require_once __DIR__ . '/../errors/handle_error.php';
                    handle_error(503, 'PDF-Export nicht verfügbar');
                }
            }
            
            try {
                $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
                $pdf->SetCreator('FightLog');
                $pdf->SetAuthor('FightLog');
                $pdf->SetTitle('Prüfungen Export');
                $pdf->SetSubject('Prüfungen Export');
                
                $pdf->setPrintHeader(false);
                $pdf->setPrintFooter(false);
                $pdf->AddPage();
                
                $pdf->SetFont('helvetica', 'B', 16);
                $pdf->Cell(0, 10, 'Prüfungen Export', 0, 1, 'C');
                $pdf->Ln(5);
                
                $pdf->SetFont('helvetica', '', 9);
                $pdf->SetFillColor(242, 242, 242);
                $pdf->SetFont('helvetica', 'B', 9);
                $pdf->Cell(15, 7, 'ID', 1, 0, 'C', true);
                $pdf->Cell(30, 7, 'Datum', 1, 0, 'C', true);
                $pdf->Cell(30, 7, 'Stufe', 1, 0, 'L', true);
                $pdf->Cell(35, 7, 'Kategorie', 1, 0, 'L', true);
                $pdf->Cell(40, 7, 'Prüfer', 1, 0, 'L', true);
                $pdf->Cell(50, 7, 'Kommentar', 1, 0, 'L', true);
                $pdf->Cell(25, 7, 'Status', 1, 0, 'C', true);
                $pdf->Cell(50, 7, 'Schüler', 1, 1, 'L', true);
                
                $pdf->SetFont('helvetica', '', 8);
                foreach ($data as $row) {
                    $pdf->Cell(15, 6, $row['id'], 1, 0, 'C');
                    $pdf->Cell(30, 6, $row['date'], 1, 0, 'C');
                    $pdf->Cell(30, 6, mb_substr($row['level'] ?? '', 0, 12), 1, 0, 'L');
                    $pdf->Cell(35, 6, mb_substr($row['category'], 0, 15), 1, 0, 'L');
                    $pdf->Cell(40, 6, mb_substr($row['instructor'], 0, 18), 1, 0, 'L');
                    $pdf->Cell(50, 6, mb_substr($row['comments'] ?? '', 0, 22), 1, 0, 'L');
                    $pdf->Cell(25, 6, $row['status'], 1, 0, 'C');
                    $pdf->Cell(50, 6, mb_substr($row['studentName'] ?: $row['studentUsername'], 0, 20), 1, 1, 'L');
                }
                
                header('Content-Type: application/pdf');
                header('Content-Disposition: attachment; filename="pruefungen_' . date('Y-m-d') . '.pdf"');
                $pdf->Output('pruefungen_' . date('Y-m-d') . '.pdf', 'D');
                exit;
            } catch (Exception $e) {
                // Error Leakage verhindern: Keine Exception-Details an Client
                error_log('PDF-Generierung fehlgeschlagen: ' . $e->getMessage());
                if ($isApiCall) {
                    json_error('PDF-Generierung fehlgeschlagen', 500);
                } else {
                    require_once __DIR__ . '/../errors/handle_error.php';
                    handle_error(500, 'PDF-Generierung fehlgeschlagen');
                }
            }
        }
    }
    
    if ($type === 'users') {
        require_permission($mysqli, 'manage_users');
        
        $stmt = $mysqli->query("
            SELECT id, username, email, first_name, last_name, phone, role, school, belt_level
            FROM users
            ORDER BY username
        ");
        $data = $stmt->fetch_all(MYSQLI_ASSOC);
        
        if ($format === 'csv') {
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="benutzer_' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            fputcsv($output, ['ID', 'Benutzername', 'E-Mail', 'Vorname', 'Nachname', 'Telefon', 'Rolle', 'Schule', 'Gürtelgrad']);
            foreach ($data as $row) {
                fputcsv($output, [
                    $row['id'],
                    $row['username'],
                    $row['email'],
                    $row['first_name'] ?? '',
                    $row['last_name'] ?? '',
                    $row['phone'] ?? '',
                    $row['role'],
                    $row['school'] ?? '',
                    $row['belt_level'] ?? ''
                ]);
            }
            fclose($output);
            exit;
        }
        
        if ($format === 'pdf') {
            if (!$tcpdfAvailable) {
                if ($isApiCall) {
                    json_error('PDF-Export nicht verfügbar. Bitte installieren Sie TCPDF via Composer.', 503);
                } else {
                    require_once __DIR__ . '/../errors/handle_error.php';
                    handle_error(503, 'PDF-Export nicht verfügbar');
                }
            }
            
            try {
                $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
                $pdf->SetCreator('FightLog');
                $pdf->SetAuthor('FightLog');
                $pdf->SetTitle('Benutzer Export');
                $pdf->SetSubject('Benutzer Export');
                
                $pdf->setPrintHeader(false);
                $pdf->setPrintFooter(false);
                $pdf->AddPage();
                
                $pdf->SetFont('helvetica', 'B', 16);
                $pdf->Cell(0, 10, 'Benutzer Export', 0, 1, 'C');
                $pdf->Ln(5);
                
                $pdf->SetFont('helvetica', '', 9);
                $pdf->SetFillColor(242, 242, 242);
                $pdf->SetFont('helvetica', 'B', 8);
                $pdf->Cell(12, 7, 'ID', 1, 0, 'C', true);
                $pdf->Cell(35, 7, 'Benutzername', 1, 0, 'L', true);
                $pdf->Cell(45, 7, 'E-Mail', 1, 0, 'L', true);
                $pdf->Cell(30, 7, 'Vorname', 1, 0, 'L', true);
                $pdf->Cell(30, 7, 'Nachname', 1, 0, 'L', true);
                $pdf->Cell(30, 7, 'Telefon', 1, 0, 'L', true);
                $pdf->Cell(25, 7, 'Rolle', 1, 0, 'C', true);
                $pdf->Cell(35, 7, 'Schule', 1, 0, 'L', true);
                $pdf->Cell(30, 7, 'Gürtelgrad', 1, 1, 'L', true);
                
                $pdf->SetFont('helvetica', '', 7);
                foreach ($data as $row) {
                    $pdf->Cell(12, 6, $row['id'], 1, 0, 'C');
                    $pdf->Cell(35, 6, mb_substr($row['username'], 0, 18), 1, 0, 'L');
                    $pdf->Cell(45, 6, mb_substr($row['email'], 0, 25), 1, 0, 'L');
                    $pdf->Cell(30, 6, mb_substr($row['first_name'] ?? '', 0, 15), 1, 0, 'L');
                    $pdf->Cell(30, 6, mb_substr($row['last_name'] ?? '', 0, 15), 1, 0, 'L');
                    $pdf->Cell(30, 6, mb_substr($row['phone'] ?? '', 0, 15), 1, 0, 'L');
                    $pdf->Cell(25, 6, $row['role'], 1, 0, 'C');
                    $pdf->Cell(35, 6, mb_substr($row['school'] ?? '', 0, 18), 1, 0, 'L');
                    $pdf->Cell(30, 6, mb_substr($row['belt_level'] ?? '', 0, 15), 1, 1, 'L');
                }
                
                header('Content-Type: application/pdf');
                header('Content-Disposition: attachment; filename="benutzer_' . date('Y-m-d') . '.pdf"');
                $pdf->Output('benutzer_' . date('Y-m-d') . '.pdf', 'D');
                exit;
            } catch (Exception $e) {
                // Error Leakage verhindern: Keine Exception-Details an Client
                error_log('PDF-Generierung fehlgeschlagen: ' . $e->getMessage());
                if ($isApiCall) {
                    json_error('PDF-Generierung fehlgeschlagen', 500);
                } else {
                    require_once __DIR__ . '/../errors/handle_error.php';
                    handle_error(500, 'PDF-Generierung fehlgeschlagen');
                }
            }
        }
    }
    
    json_error('Ungültiger Export-Typ', 400);
}

json_error('Nur GET erlaubt', 405);
?>
