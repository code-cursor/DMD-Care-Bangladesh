<?php
declare(strict_types=1);

require_once __DIR__ . '/actions/registrations.php';
require_once __DIR__ . '/actions/content.php';
require_once __DIR__ . '/actions/system.php';

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
            redirect_admin();
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
        redirect_admin((string) ($_POST['return_section'] ?? 'dashboard'));
    }
}