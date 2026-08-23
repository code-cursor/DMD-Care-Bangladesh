<?php
declare(strict_types=1);

require_once __DIR__ . '/actions/registrations.php';
require_once __DIR__ . '/actions/content.php';
require_once __DIR__ . '/actions/system.php';

function admin_return_url(string $value): string
{
    $value = trim($value);
    if ($value === '') {
        return '/admin';
    }

    $parts = parse_url($value);
    if ($parts === false || isset($parts['scheme']) || isset($parts['host'])) {
        return '/admin';
    }

    $path = '/' . ltrim((string) ($parts['path'] ?? ''), '/');
    if ($path !== '/admin') {
        return '/admin';
    }

    $query = isset($parts['query']) && $parts['query'] !== '' ? '?' . $parts['query'] : '';
    return '/admin' . $query;
}

function handle_admin_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }

    try {
        verify_csrf();
        $action = (string) ($_POST['action'] ?? '');

        if ($action === 'login') {
            $statement = db()->prepare('SELECT * FROM users WHERE email=? LIMIT 1');
            $statement->execute([strtolower(trim((string) ($_POST['email'] ?? '')))]);
            $user = $statement->fetch();
            if (!$user || !(bool) $user['is_active'] || !password_verify((string) ($_POST['password'] ?? ''), $user['password_hash'])) {
                throw new RuntimeException('Invalid email or password.');
            }
            session_regenerate_id(true);
            $_SESSION['user_id'] = (int) $user['id'];
            flash('Welcome back, ' . $user['name'] . '.');
            header('Location: ' . admin_return_url((string) ($_POST['return_to'] ?? '')));
            exit;
        }

        if ($action === 'logout') {
            $_SESSION = [];
            session_regenerate_id(true);
            redirect_admin();
        }

        $user = current_user();
        if (!$user) {
            throw new RuntimeException('Please log in again.');
        }

        if (str_starts_with($action, 'registration_')) {
            handle_registration_action($action, $user);
        }
        if (str_starts_with($action, 'content_')) {
            handle_content_action($action, $user);
        }
        handle_system_action($action, $user);
        throw new RuntimeException('Unknown admin action.');
    } catch (Throwable $exception) {
        flash($exception->getMessage(), 'danger');
        if (($_POST['action'] ?? '') === 'login') {
            header('Location: ' . admin_return_url((string) ($_POST['return_to'] ?? '')));
            exit;
        }
        redirect_admin((string) ($_POST['return_section'] ?? 'dashboard'));
    }
}
