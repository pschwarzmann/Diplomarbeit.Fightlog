<?php
// backend/services/MailService.php
// Zentrale Mail-Funktion (fail-safe)

class MailService
{
    /**
     * Sendet eine E-Mail (non-blocking, fail-safe)
     * @param string $to Empfänger-E-Mail
     * @param string $subject Betreff
     * @param string $body HTML/Text-Body
     * @return bool Erfolg
     */
    public static function send(string $to, string $subject, string $body): bool
    {
        try {
            // Prüfe ob Mail-Konfiguration vorhanden
            $mailEnabled = Env::get('MAIL_ENABLED', 'false') === 'true';
            if (!$mailEnabled) {
                error_log("Mail disabled - would send to {$to}: {$subject}");
                return false;
            }
            
            $fromEmail = Env::get('MAIL_FROM', 'noreply@fightlog.local');
            $fromName = Env::get('MAIL_FROM_NAME', 'FightLog');
            
            $headers = [
                "From: {$fromName} <{$fromEmail}>",
                "Reply-To: {$fromEmail}",
                "MIME-Version: 1.0",
                "Content-Type: text/html; charset=UTF-8"
            ];
            
            $result = @mail($to, $subject, $body, implode("\r\n", $headers));
            
            if (!$result) {
                error_log("Mail send failed to {$to}");
            }
            
            return $result;
        } catch (Throwable $e) {
            error_log('Mail send error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Sendet Passwort-Reset-E-Mail
     */
    public static function sendPasswordReset(string $email, string $username, string $token): bool
    {
        // APP_URL aus ENV oder automatisch aus Request bestimmen
        $appUrl = Env::get('APP_URL');
        if (empty($appUrl)) {
            // Automatisch aus Request bestimmen (server-ready)
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
            $appUrl = $protocol . '://' . $host;
        }
        $resetUrl = rtrim($appUrl, '/') . '/frontend/reset-password.html?token=' . urlencode($token);
        
        $subject = 'Passwort zurücksetzen - FightLog';
        $body = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #1e293b;'>Passwort zurücksetzen</h2>
                <p>Hallo {$username},</p>
                <p>Sie haben ein Zurücksetzen Ihres Passworts angefordert. Klicken Sie auf den folgenden Link, um ein neues Passwort zu setzen:</p>
                <p style='margin: 20px 0;'>
                    <a href='{$resetUrl}' style='background: #0a84ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;'>Passwort zurücksetzen</a>
                </p>
                <p>Der Link ist 1 Stunde gültig.</p>
                <p>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte.</p>
                <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
                <p style='color: #64748b; font-size: 0.9em;'>FightLog - Kampfsporterfolge digital erfassen</p>
            </div>
        </body>
        </html>
        ";
        
        return self::send($email, $subject, $body);
    }
    
    /**
     * Sendet Benachrichtigung bei neuer Prüfung
     */
    public static function sendExamNotification(string $email, string $username, array $examData): bool
    {
        $subject = 'Neue Prüfung eingetragen - FightLog';
        $body = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #1e293b;'>Neue Prüfung</h2>
                <p>Hallo {$username},</p>
                <p>Es wurde eine neue Prüfung für Sie eingetragen:</p>
                <ul>
                    <li><strong>Datum:</strong> {$examData['date']}</li>
                    <li><strong>Stufe:</strong> {$examData['level']}</li>
                    <li><strong>Kategorie:</strong> {$examData['category']}</li>
                    <li><strong>Prüfer:</strong> {$examData['instructor']}</li>
                </ul>
                <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
                <p style='color: #64748b; font-size: 0.9em;'>FightLog</p>
            </div>
        </body>
        </html>
        ";
        
        return self::send($email, $subject, $body);
    }
    
    /**
     * Sendet Benachrichtigung bei neuem Ziel
     */
    public static function sendGoalNotification(string $email, string $username, array $goalData): bool
    {
        $subject = 'Neues Ziel zugewiesen - FightLog';
        $body = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #1e293b;'>Neues Ziel</h2>
                <p>Hallo {$username},</p>
                <p>Ihnen wurde ein neues Ziel zugewiesen:</p>
                <p><strong>{$goalData['title']}</strong></p>
                " . ($goalData['targetDate'] ? "<p>Zieldatum: {$goalData['targetDate']}</p>" : "") . "
                <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
                <p style='color: #64748b; font-size: 0.9em;'>FightLog</p>
            </div>
        </body>
        </html>
        ";
        
        return self::send($email, $subject, $body);
    }
}
