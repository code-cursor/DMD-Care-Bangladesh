<?php
declare(strict_types=1);

require __DIR__ . '/../php/bootstrap.php';

header('Content-Type: application/json; charset=UTF-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    initialize_database();

    $raw = file_get_contents('php://input') ?: '';
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $visitorKey = substr(trim((string) ($payload['visitor_key'] ?? '')), 0, 80);
    if ($visitorKey === '') {
        http_response_code(422);
        echo json_encode(['error' => 'Visitor key is required']);
        exit;
    }

    $path = substr(trim((string) ($payload['path'] ?? '')), 0, 500);
    $userAgent = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500);
    $forwardedFor = trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''))[0]);
    $ipAddress = substr($forwardedFor !== '' ? $forwardedFor : (string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 80);

    $statement = db()->prepare('INSERT INTO visitor_logs (visitor_key, path, user_agent, ip_address, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)');
    $statement->execute([
        $visitorKey,
        $path !== '' ? $path : null,
        $userAgent !== '' ? $userAgent : null,
        $ipAddress !== '' ? $ipAddress : null,
    ]);

    http_response_code(201);
    echo json_encode(['status' => 'ok']);
} catch (Throwable) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to track visit']);
}
