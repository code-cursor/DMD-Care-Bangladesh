<?php
declare(strict_types=1);

const DMD_ROOT = __DIR__ . '/..';

function load_env(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (strlen($value) >= 2 && (($value[0] === '"' && $value[-1] === '"') || ($value[0] === "'" && $value[-1] === "'"))) {
            $value = substr($value, 1, -1);
        }
        if ($key !== '' && getenv($key) === false) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

load_env(DMD_ROOT . '/.env');

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('dmd_admin_session');
session_set_cookie_params([
    'httponly' => true,
    'secure' => $isHttps,
    'samesite' => 'Lax',
    'path' => '/',
]);
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function env_value(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}

function database_config(): array
{
    $url = env_value('PHP_DATABASE_URL', env_value('DATABASE_URL', ''));
    if ($url && str_starts_with($url, 'sqlite:///')) {
        $path = substr($url, 10);
        if (!preg_match('~^(?:[A-Za-z]:[\\/]|/)~', $path)) {
            $path = DMD_ROOT . '/' . ltrim($path, '/');
        }
        return ['dsn' => 'sqlite:' . $path, 'user' => null, 'password' => null, 'driver' => 'sqlite'];
    }

    if ($url) {
        $normalized = preg_replace('/^mysql\+[^:]+:/', 'mysql:', $url);
        $parts = parse_url((string) $normalized);
        if ($parts !== false && ($parts['scheme'] ?? '') === 'mysql') {
            parse_str($parts['query'] ?? '', $query);
            $database = ltrim($parts['path'] ?? '', '/');
            return [
                'dsn' => sprintf(
                    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                    $parts['host'] ?? '127.0.0.1',
                    $parts['port'] ?? 3306,
                    $database,
                    $query['charset'] ?? 'utf8mb4'
                ),
                'user' => isset($parts['user']) ? urldecode($parts['user']) : '',
                'password' => isset($parts['pass']) ? urldecode($parts['pass']) : '',
                'driver' => 'mysql',
            ];
        }
    }

    return [
        'dsn' => sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            env_value('DB_HOST', '127.0.0.1'),
            env_value('DB_PORT', '3306'),
            env_value('DB_DATABASE', 'dmd_care_bangladesh')
        ),
        'user' => env_value('DB_USERNAME', 'root'),
        'password' => env_value('DB_PASSWORD', ''),
        'driver' => 'mysql',
    ];
}

function db(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = database_config();
    $pdo = new PDO($config['dsn'], $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    if ($config['driver'] === 'mysql') {
        $pdo->exec("SET time_zone = '+06:00'");
    }
    return $pdo;
}

function initialize_database(): void
{
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;
    $pdo = db();
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

    if ($driver === 'sqlite') {
        $statements = [
            'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(120) NOT NULL, email VARCHAR(191) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role VARCHAR(40) NOT NULL DEFAULT "editor", is_active INTEGER NOT NULL DEFAULT 1, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS registrations (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_name VARCHAR(180) NOT NULL, guardian_phone VARCHAR(40) NOT NULL, guardian_email VARCHAR(191), status VARCHAR(30) NOT NULL DEFAULT "pending", source VARCHAR(30) NOT NULL DEFAULT "public", notes TEXT, payload TEXT NOT NULL DEFAULT "{}", created_by_id INTEGER, reviewed_by_id INTEGER, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS content_items (id INTEGER PRIMARY KEY AUTOINCREMENT, type VARCHAR(50) NOT NULL, title VARCHAR(200) NOT NULL, slug VARCHAR(220) NOT NULL, summary TEXT, body TEXT, image_url VARCHAR(500), position INTEGER NOT NULL DEFAULT 0, is_published INTEGER NOT NULL DEFAULT 1, extra TEXT NOT NULL DEFAULT "{}", created_by_id INTEGER, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS visitor_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_key VARCHAR(80) NOT NULL, path VARCHAR(500), user_agent VARCHAR(500), ip_address VARCHAR(80), created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS sms_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, registration_id INTEGER, recipient_type VARCHAR(40) NOT NULL, recipient_phone VARCHAR(40) NOT NULL, message TEXT NOT NULL, provider VARCHAR(80) NOT NULL DEFAULT "configured-http", status VARCHAR(40) NOT NULL DEFAULT "queued", response TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
        ];
    } else {
        $statements = [
            'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(191) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role VARCHAR(40) NOT NULL DEFAULT "editor", is_active TINYINT(1) NOT NULL DEFAULT 1, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX(email)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS registrations (id INT AUTO_INCREMENT PRIMARY KEY, patient_name VARCHAR(180) NOT NULL, guardian_phone VARCHAR(40) NOT NULL, guardian_email VARCHAR(191), status VARCHAR(30) NOT NULL DEFAULT "pending", source VARCHAR(30) NOT NULL DEFAULT "public", notes TEXT, payload JSON NOT NULL, created_by_id INT, reviewed_by_id INT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX(patient_name), INDEX(guardian_phone), INDEX(status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS content_items (id INT AUTO_INCREMENT PRIMARY KEY, type VARCHAR(50) NOT NULL, title VARCHAR(200) NOT NULL, slug VARCHAR(220) NOT NULL, summary TEXT, body TEXT, image_url VARCHAR(500), position INT NOT NULL DEFAULT 0, is_published TINYINT(1) NOT NULL DEFAULT 1, extra JSON NOT NULL, created_by_id INT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX(type), INDEX(slug)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS visitor_logs (id INT AUTO_INCREMENT PRIMARY KEY, visitor_key VARCHAR(80) NOT NULL, path VARCHAR(500), user_agent VARCHAR(500), ip_address VARCHAR(80), created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX(visitor_key), INDEX(created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS sms_logs (id INT AUTO_INCREMENT PRIMARY KEY, registration_id INT, recipient_type VARCHAR(40) NOT NULL, recipient_phone VARCHAR(40) NOT NULL, message TEXT NOT NULL, provider VARCHAR(80) NOT NULL DEFAULT "configured-http", status VARCHAR(40) NOT NULL DEFAULT "queued", response TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX(status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
        ];
    }

    foreach ($statements as $statement) {
        $pdo->exec($statement);
    }

    if ((int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() === 0) {
        $statement = $pdo->prepare('INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, "super_admin", 1)');
        $statement->execute([
            env_value('ADMIN_BOOTSTRAP_NAME', 'Super Admin'),
            strtolower((string) env_value('ADMIN_BOOTSTRAP_EMAIL', 'admin@example.com')),
            password_hash((string) env_value('ADMIN_BOOTSTRAP_PASSWORD', 'ChangeMeNow123!'), PASSWORD_DEFAULT),
        ]);
    }
}

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf(): void
{
    $submitted = (string) ($_POST['csrf_token'] ?? '');
    if (!hash_equals(csrf_token(), $submitted)) {
        throw new RuntimeException('Your session expired. Please try again.');
    }
}

function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $statement = db()->prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?');
    $statement->execute([(int) $_SESSION['user_id']]);
    $user = $statement->fetch();
    if (!$user || !(bool) $user['is_active']) {
        unset($_SESSION['user_id']);
        return null;
    }
    return $user;
}

function require_role(array $roles): array
{
    $user = current_user();
    if (!$user || !in_array($user['role'], $roles, true)) {
        throw new RuntimeException('You do not have permission to perform this action.');
    }
    return $user;
}

function flash(string $message, string $type = 'success'): void
{
    $_SESSION['flash'] = ['message' => $message, 'type' => $type];
}

function take_flash(): ?array
{
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $flash;
}

function redirect_admin(string $section = 'dashboard', array $query = []): never
{
    $query = array_merge(['section' => $section], $query);
    header('Location: /admin?' . http_build_query($query));
    exit;
}

function download_excel(string $filename, array $headers, array $rows): never
{
    header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename) . '"');
    echo "\xEF\xBB\xBF<table border=\"1\"><thead><tr>";
    foreach ($headers as $header) {
        echo '<th>' . e($header) . '</th>';
    }
    echo '</tr></thead><tbody>';
    foreach ($rows as $row) {
        echo '<tr>';
        foreach ($row as $value) {
            echo '<td>' . e(is_scalar($value) || $value === null ? $value : json_encode($value, JSON_UNESCAPED_UNICODE)) . '</td>';
        }
        echo '</tr>';
    }
    echo '</tbody></table>';
    exit;
}
function slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?: '';
    $value = trim($value, '-');
    return $value !== '' ? $value : 'item-' . time();
}

function valid_phone(string $phone): bool
{
    return preg_match('/^\+?[0-9]{8,15}$/', str_replace(' ', '', $phone)) === 1;
}

function json_object(string $value): string
{
    $value = trim($value);
    if ($value === '') {
        return '{}';
    }
    $decoded = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($decoded)) {
        throw new RuntimeException('JSON data must be an object.');
    }
    return json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function attachment_url(mixed $attachment): string
{
    if (is_string($attachment)) {
        return $attachment;
    }
    return is_array($attachment) ? (string) ($attachment['url'] ?? '') : '';
}
function store_uploaded_image(array $file, string $prefix = 'image'): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return [];
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Attachment upload failed.');
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $maxSize = 2 * 1024 * 1024;
    if ($prefix === 'genetic_report') {
        $extensions['application/pdf'] = 'pdf';
        $maxSize = $mime === 'application/pdf' ? 5 * 1024 * 1024 : $maxSize;
    }
    if (!isset($extensions[$mime]) || $file['size'] > $maxSize) {
        throw new RuntimeException($prefix === 'genetic_report' ? 'Genetic report must be PDF, JPG, PNG, or WebP within the size limit.' : 'Image must be JPG, PNG, or WebP and no larger than 2MB.');
    }
    $directory = DMD_ROOT . '/uploads';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        throw new RuntimeException('Unable to create upload directory.');
    }
    $filename = $prefix . '-' . bin2hex(random_bytes(10)) . '.' . $extensions[$mime];
    if (!move_uploaded_file($file['tmp_name'], "$directory/$filename")) {
        throw new RuntimeException('Unable to save image.');
    }
    return ['url' => "uploads/$filename", 'original_name' => basename((string) $file['name'])];
}

function update_sms_gateway_ip(string $ipAddress): array
{
    if (!filter_var($ipAddress, FILTER_VALIDATE_IP)) {
        throw new RuntimeException('Enter a valid IP address.');
    }
    $url = (string) env_value('SMS_IP_UPDATE_URL', '');
    if ($url === '') {
        return ['success' => false, 'message' => 'SMS_IP_UPDATE_URL is not configured'];
    }
    $headers = ["Content-Type: application/json"];
    if ($key = env_value('SMS_API_KEY', '')) {
        $headers[] = "Authorization: Bearer $key";
    }
    $context = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => implode("\r\n", $headers),
        'content' => json_encode(['ip' => $ipAddress]),
        'timeout' => 15,
        'ignore_errors' => true,
    ]]);
    $result = @file_get_contents($url, false, $context);
    $status = 0;
    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $match)) {
            $status = (int) $match[1];
        }
    }
    return ['success' => $status >= 200 && $status < 300, 'message' => $result === false ? 'Provider request failed' : substr($result, 0, 500)];
}
function send_sms_message(?int $registrationId, string $recipientType, string $phone, string $message): array
{
    $url = (string) env_value('SMS_API_URL', '');
    $status = 'skipped';
    $responseText = 'SMS_API_URL is not configured';

    if ($url !== '') {
        $payload = json_encode([
            'to' => $phone,
            'message' => $message,
            'sender_id' => env_value('SMS_SENDER_ID', 'DMDCARE'),
        ]);
        $headers = ["Content-Type: application/json"];
        if ($key = env_value('SMS_API_KEY', '')) {
            $headers[] = "Authorization: Bearer $key";
        }
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $payload,
            'timeout' => 15,
            'ignore_errors' => true,
        ]]);
        $result = @file_get_contents($url, false, $context);
        $responseText = $result === false ? 'SMS provider request failed' : substr($result, 0, 2000);
        $httpStatus = 0;
        foreach ($http_response_header ?? [] as $header) {
            if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $match)) {
                $httpStatus = (int) $match[1];
            }
        }
        $status = $httpStatus >= 200 && $httpStatus < 300 ? 'sent' : 'failed';
    }

    $statement = db()->prepare('INSERT INTO sms_logs (registration_id, recipient_type, recipient_phone, message, provider, status, response) VALUES (?, ?, ?, ?, "configured-http", ?, ?)');
    $statement->execute([$registrationId, $recipientType, $phone, $message, $status, $responseText]);
    return ['status' => $status, 'response' => $responseText];
}
