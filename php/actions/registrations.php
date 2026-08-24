<?php
declare(strict_types=1);

function handle_registration_action(string $action, array $user): never
{
    if ($action === 'registration_save') {
        require_role(['super_admin', 'admin', 'editor']);
        $id = (int) ($_POST['id'] ?? 0);
        $name = trim((string) ($_POST['patient_name'] ?? ''));
        $phone = trim((string) ($_POST['guardian_phone'] ?? ''));
        $email = trim((string) ($_POST['guardian_email'] ?? ''));
        $status = (string) ($_POST['status'] ?? 'pending');
        $notes = trim((string) ($_POST['notes'] ?? ''));
        if (mb_strlen($name) < 2 || !valid_phone($phone)) {
            throw new RuntimeException('Enter a valid patient name and guardian phone.');
        }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Guardian email is invalid.');
        }
        if (!in_array($status, ['pending', 'accepted', 'rejected'], true)) {
            throw new RuntimeException('Registration status is invalid.');
        }

        $payloadData = json_decode(json_object((string) ($_POST['payload'] ?? '{}')), true);
        foreach (($_POST['payload_fields'] ?? []) as $key => $value) {
            if (is_string($key) && $key !== 'attachments') {
                if (is_array($value)) {
                    $payloadData[$key] = array_values($value);
                } else {
                    $cleanValue = trim((string) $value);
                    if (is_array($payloadData[$key] ?? null) && str_starts_with($cleanValue, '[')) {
                        $decodedValue = json_decode($cleanValue, true);
                        $payloadData[$key] = is_array($decodedValue) ? $decodedValue : $cleanValue;
                    } else {
                        $payloadData[$key] = $cleanValue;
                    }
                }
            }
        }
        $attachments = is_array($payloadData['attachments'] ?? null) ? $payloadData['attachments'] : [];
        foreach (['patient_photo' => 'photo', 'genetic_report' => 'genetic_report'] as $input => $key) {
            if (!empty($_FILES[$input]['name'])) {
                $attachments[$key] = store_uploaded_image($_FILES[$input], $key);
            }
        }
        if ($attachments) {
            $payloadData['attachments'] = $attachments;
        }
        $payload = json_encode($payloadData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($id) {
            $sql = 'UPDATE registrations SET patient_name=?,guardian_phone=?,guardian_email=?,status=?,notes=?,payload=?,reviewed_by_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?';
            db()->prepare($sql)->execute([$name, $phone, $email ?: null, $status, $notes ?: null, $payload, $user['id'], $id]);
            flash('Registration updated.');
            redirect_admin('requests');
        }
        $sql = 'INSERT INTO registrations (patient_name,guardian_phone,guardian_email,status,source,notes,payload,created_by_id,reviewed_by_id) VALUES (?,?,?,?,"admin",?,?,?,?)';
        db()->prepare($sql)->execute([$name, $phone, $email ?: null, $status, $notes ?: null, $payload, $user['id'], $user['id']]);
        unset($_SESSION['direct_entry_old']);
        flash('Registration created.');
        redirect_admin('direct');
    }

    if ($action === 'registration_status') {
        require_role(['super_admin', 'admin', 'editor']);
        $status = (string) ($_POST['status'] ?? '');
        if (!in_array($status, ['pending', 'accepted', 'rejected'], true)) {
            throw new RuntimeException('Invalid status.');
        }
        db()->prepare('UPDATE registrations SET status=?,reviewed_by_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
            ->execute([$status, $user['id'], (int) $_POST['id']]);
        flash('Registration status updated.');
        redirect_admin('requests');
    }

    if ($action === 'registration_delete') {
        require_role(['super_admin', 'admin']);
        $id = (int) $_POST['id'];
        db()->prepare('DELETE FROM sms_logs WHERE registration_id=?')->execute([$id]);
        db()->prepare('DELETE FROM registrations WHERE id=?')->execute([$id]);
        flash('Registration deleted.');
        redirect_admin('requests');
    }

    throw new RuntimeException('Unknown registration action.');
}