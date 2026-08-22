<?php
declare(strict_types=1);

function handle_system_action(string $action, array $user): never
{
    if ($action === 'user_save') {
        require_role(['super_admin', 'admin']);
        $id = (int) ($_POST['id'] ?? 0);
        $name = trim((string) ($_POST['name'] ?? ''));
        $email = strtolower(trim((string) ($_POST['email'] ?? '')));
        $password = (string) ($_POST['password'] ?? '');
        $role = (string) ($_POST['role'] ?? 'editor');
        if (mb_strlen($name) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Enter a valid name and email.');
        }
        if (!in_array($role, ['super_admin', 'admin', 'editor', 'viewer'], true)) {
            throw new RuntimeException('Invalid role.');
        }
        if ($id) {
            $values = [$name, $email, $role, isset($_POST['is_active']) ? 1 : 0];
            $sql = 'UPDATE users SET name=?,email=?,role=?,is_active=?,updated_at=CURRENT_TIMESTAMP';
            if ($password !== '') {
                if (mb_strlen($password) < 8) {
                    throw new RuntimeException('Password must contain at least 8 characters.');
                }
                $sql .= ',password_hash=?';
                $values[] = password_hash($password, PASSWORD_DEFAULT);
            }
            $sql .= ' WHERE id=?';
            $values[] = $id;
            db()->prepare($sql)->execute($values);
            flash('User updated.');
        } else {
            if (mb_strlen($password) < 8) {
                throw new RuntimeException('Password must contain at least 8 characters.');
            }
            db()->prepare('INSERT INTO users (name,email,password_hash,role,is_active) VALUES (?,?,?,?,1)')
                ->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
            flash('User created.');
        }
        redirect_admin('users');
    }

    if ($action === 'user_toggle') {
        require_role(['super_admin', 'admin']);
        $id = (int) $_POST['id'];
        if ($id === (int) $user['id']) {
            throw new RuntimeException('You cannot deactivate your own account.');
        }
        db()->prepare('UPDATE users SET is_active=CASE WHEN is_active=1 THEN 0 ELSE 1 END,updated_at=CURRENT_TIMESTAMP WHERE id=?')->execute([$id]);
        flash('User status updated.');
        redirect_admin('users');
    }

    if ($action === 'user_delete') {
        require_role(['super_admin']);
        $id = (int) $_POST['id'];
        if ($id === (int) $user['id']) {
            throw new RuntimeException('You cannot delete your own account.');
        }
        db()->prepare('DELETE FROM users WHERE id=?')->execute([$id]);
        flash('User deleted.');
        redirect_admin('users');
    }

    if ($action === 'sms_ip_update') {
        require_role(['super_admin', 'admin']);
        $result = update_sms_gateway_ip(trim((string) ($_POST['ip_address'] ?? '')));
        flash($result['message'], $result['success'] ? 'success' : 'warning');
        redirect_admin('sms');
    }

    if ($action === 'sms_send') {
        require_role(['super_admin', 'admin', 'editor']);
        $message = trim((string) ($_POST['message'] ?? ''));
        if ($message === '' || mb_strlen($message) > 320) {
            throw new RuntimeException('Message must contain 1-320 characters.');
        }
        $recipients = [];
        $registrationId = (int) ($_POST['registration_id'] ?? 0);
        if ($registrationId) {
            $statement = db()->prepare('SELECT id,guardian_phone FROM registrations WHERE id=? AND status="accepted"');
            $statement->execute([$registrationId]);
            if ($row = $statement->fetch()) {
                $recipients[] = [(int) $row['id'], 'guardian', $row['guardian_phone']];
            }
        } else {
            foreach (preg_split('/[\s,;]+/', trim((string) ($_POST['phones'] ?? ''))) ?: [] as $phone) {
                if (valid_phone($phone)) {
                    $recipients[] = [null, 'custom', $phone];
                }
            }
        }
        if (!$recipients) {
            throw new RuntimeException('Select a patient or enter valid phone numbers.');
        }
        $sent = 0;
        foreach (array_slice($recipients, 0, 200) as [$patientId, $kind, $phone]) {
            if (send_sms_message($patientId, $kind, $phone, $message)['status'] === 'sent') {
                $sent++;
            }
        }
        flash($sent ? "$sent SMS message(s) sent." : 'SMS logged, but the provider is not configured or failed.', $sent ? 'success' : 'warning');
        redirect_admin('sms');
    }

    throw new RuntimeException('Unknown system action.');
}