<?php
declare(strict_types=1);

function handle_system_action(string $action, array $user): never
{
    if ($action === 'health_team_save') {
        require_role(['super_admin', 'admin', 'editor']);
        $id = (int) ($_POST['id'] ?? 0);
        $name = trim((string) ($_POST['doctor_name'] ?? ''));
        $specialty = trim((string) ($_POST['doctor_specialty'] ?? ''));
        $extra = [
            'qualifications' => trim((string) ($_POST['doctor_qualifications'] ?? '')),
            'job_position' => trim((string) ($_POST['doctor_job_position'] ?? '')),
            'workplace' => trim((string) ($_POST['doctor_workplace'] ?? '')),
        ];
        if (mb_strlen($name) < 2) {
            throw new RuntimeException('Doctor name is required.');
        }
        $imageUrl = trim((string) ($_POST['existing_image_url'] ?? ''));
        if (!empty($_FILES['image']['name'])) {
            $imageUrl = store_uploaded_image($_FILES['image'], 'health_team')['url'];
        }
        $body = implode("\n", array_filter($extra));
        $values = [
            'health_team',
            $name,
            slugify($name),
            $specialty ?: null,
            $body ?: null,
            $imageUrl ?: null,
            (int) ($_POST['position'] ?? 0),
            isset($_POST['is_published']) ? 1 : 0,
            json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ];
        if ($id) {
            $values[] = $id;
            db()->prepare('UPDATE content_items SET type=?,title=?,slug=?,summary=?,body=?,image_url=?,position=?,is_published=?,extra=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND type="health_team"')->execute($values);
            flash('Health care team profile updated.');
        } else {
            $values[] = $user['id'];
            db()->prepare('INSERT INTO content_items (type,title,slug,summary,body,image_url,position,is_published,extra,created_by_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)')->execute($values);
            flash('Health care team profile created.');
        }
        redirect_admin('health_team');
    }

    if ($action === 'health_team_delete') {
        require_role(['super_admin', 'admin']);
        db()->prepare('DELETE FROM content_items WHERE id=? AND type="health_team"')->execute([(int) ($_POST['id'] ?? 0)]);
        flash('Health care team profile deleted.');
        redirect_admin('health_team');
    }

    if ($action === 'partner_save') {
        require_role(['super_admin', 'admin', 'editor']);
        $id = (int) ($_POST['id'] ?? 0);
        $title = trim((string) ($_POST['partner_name'] ?? ''));
        $website = trim((string) ($_POST['partner_website'] ?? ''));
        if (mb_strlen($title) < 2) {
            throw new RuntimeException('Partner name is required.');
        }
        if ($website !== '' && !filter_var($website, FILTER_VALIDATE_URL)) {
            throw new RuntimeException('Partner website must be a valid URL.');
        }
        $imageUrl = trim((string) ($_POST['existing_image_url'] ?? ''));
        if (!empty($_FILES['image']['name'])) {
            $imageUrl = store_uploaded_image($_FILES['image'], 'partner')['url'];
        }
        if ($imageUrl === '') {
            throw new RuntimeException('Partner logo is required.');
        }
        $extra = ['website' => $website];
        $values = ['partner', $title, slugify($title), $website ?: null, null, $imageUrl, (int) ($_POST['position'] ?? 0), isset($_POST['is_published']) ? 1 : 0, json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)];
        if ($id) {
            $values[] = $id;
            db()->prepare('UPDATE content_items SET type=?,title=?,slug=?,summary=?,body=?,image_url=?,position=?,is_published=?,extra=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND type="partner"')->execute($values);
            flash('Partner updated.');
        } else {
            $values[] = $user['id'];
            db()->prepare('INSERT INTO content_items (type,title,slug,summary,body,image_url,position,is_published,extra,created_by_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)')->execute($values);
            flash('Partner added.');
        }
        redirect_admin('partners');
    }

    if ($action === 'partner_delete') {
        require_role(['super_admin', 'admin']);
        db()->prepare('DELETE FROM content_items WHERE id=? AND type="partner"')->execute([(int) ($_POST['id'] ?? 0)]);
        flash('Partner deleted.');
        redirect_admin('partners');
    }

    if ($action === 'user_save') {
        require_role(['super_admin']);
        $id = (int) ($_POST['id'] ?? 0);
        $name = trim((string) ($_POST['name'] ?? ''));
        $email = strtolower(trim((string) ($_POST['email'] ?? '')));
        $password = (string) ($_POST['password'] ?? '');
        $role = (string) ($_POST['role'] ?? 'editor');
        if (mb_strlen($name) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Enter a valid name and email.');
        }
        if (!in_array($role, ['admin', 'editor', 'viewer'], true)) {
            throw new RuntimeException('Invalid role.');
        }
        if ($id) {
            $statement = db()->prepare('SELECT role FROM users WHERE id=?');
            $statement->execute([$id]);
            $targetUser = $statement->fetch();
            if (!$targetUser) {
                throw new RuntimeException('User not found.');
            }
            if ($targetUser['role'] === 'super_admin') {
                throw new RuntimeException('Super admin account cannot be managed here.');
            }
            $values = [$name, $email, $role, isset($_POST['is_active']) ? 1 : 0];
            $sql = 'UPDATE users SET name=?,email=?,role=?,is_active=?,updated_at=CURRENT_TIMESTAMP';
            $passwordChanged = false;
            if ($password !== '') {
                if (mb_strlen($password) < 6) {
                    throw new RuntimeException('Password must contain at least 6 characters.');
                }
                $sql .= ',password_hash=?';
                $values[] = password_hash($password, PASSWORD_DEFAULT);
                $passwordChanged = true;
            }
            $sql .= ' WHERE id=?';
            $values[] = $id;
            db()->prepare($sql)->execute($values);
            flash($passwordChanged ? 'User details and password updated successfully.' : 'User updated successfully.');
        } else {
            if (mb_strlen($password) < 6) {
                throw new RuntimeException('Password must contain at least 6 characters.');
            }
            db()->prepare('INSERT INTO users (name,email,password_hash,role,is_active,created_at,updated_at) VALUES (?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)')
                ->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
            flash('User created successfully.');
        }
        redirect_admin('users');
    }

    if ($action === 'user_toggle') {
        require_role(['super_admin']);
        $id = (int) $_POST['id'];
        if ($id === (int) $user['id']) {
            throw new RuntimeException('You cannot deactivate your own account.');
        }
        db()->prepare('UPDATE users SET is_active=CASE WHEN is_active=1 THEN 0 ELSE 1 END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND role <> "super_admin"')->execute([$id]);
        flash('User status updated.');
        redirect_admin('users');
    }

    if ($action === 'user_delete') {
        require_role(['super_admin']);
        $id = (int) $_POST['id'];
        if ($id === (int) $user['id']) {
            throw new RuntimeException('You cannot delete your own account.');
        }
        db()->prepare('DELETE FROM users WHERE id=? AND role <> "super_admin"')->execute([$id]);
        flash('User deleted.');
        redirect_admin('users');
    }

    if ($action === 'sms_ip_update') {
        require_role(['super_admin']);
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
