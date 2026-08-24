<?php
declare(strict_types=1);

require_once __DIR__ . '/php/bootstrap.php';

function registration_json(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function normalize_registration_value(mixed $value): string
{
    return trim(mb_strtolower((string) $value, 'UTF-8'));
}

function normalized_registration_identifier(mixed $value): string
{
    return preg_replace('/[^\p{L}\p{N}]+/u', '', normalize_registration_value($value)) ?: '';
}

function registration_health_issues(array $payload): array
{
    return array_values(array_filter([
        normalized_registration_identifier($payload['diagnosis_type'] ?? ''),
        normalized_registration_identifier($payload['other_health_issues'] ?? ''),
    ]));
}

function same_registration_patient(array $parsed, array $existing): bool
{
    $newPayload = $parsed['payload'];
    $oldPayload = json_decode((string) ($existing['payload'] ?? '{}'), true);
    $oldPayload = is_array($oldPayload) ? $oldPayload : [];

    foreach (['birth_certificate_no', 'nid'] as $key) {
        $newValue = normalized_registration_identifier($newPayload[$key] ?? '');
        $oldValue = normalized_registration_identifier($oldPayload[$key] ?? '');
        if ($newValue !== '' && $oldValue !== '' && $newValue === $oldValue) {
            return true;
        }
    }

    if (normalized_registration_identifier($parsed['patient_name']) !== normalized_registration_identifier($existing['patient_name'] ?? '')) {
        return false;
    }

    $newBirthDate = normalize_registration_value($newPayload['date_of_birth'] ?? '');
    $oldBirthDate = normalize_registration_value($oldPayload['date_of_birth'] ?? '');
    if ($newBirthDate !== '' && $oldBirthDate !== '') {
        return $newBirthDate === $oldBirthDate;
    }

    return normalized_registration_identifier($parsed['guardian_phone']) === normalized_registration_identifier($existing['guardian_phone'] ?? '');
}

function ensure_not_duplicate_registration(array $parsed): void
{
    $newIssues = registration_health_issues($parsed['payload']);
    if (!$newIssues) {
        throw new RuntimeException('Diagnosis type or health issue is required.');
    }

    $rows = db()->query('SELECT patient_name, guardian_phone, payload FROM registrations WHERE status IN ("pending", "accepted")')->fetchAll();
    foreach ($rows as $row) {
        $oldPayload = json_decode((string) ($row['payload'] ?? '{}'), true);
        $oldIssues = registration_health_issues(is_array($oldPayload) ? $oldPayload : []);
        if (same_registration_patient($parsed, $row) && array_intersect($newIssues, $oldIssues)) {
            registration_json(409, [
                'code' => 'duplicate_patient_health_issue',
                'message' => 'This patient is already registered with this disease or health issue.',
            ]);
        }
    }
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        registration_json(405, ['message' => 'Method not allowed.']);
    }

    initialize_database();

    $payload = json_decode(json_object((string) ($_POST['payload'] ?? '{}')), true);
    foreach ($_POST as $key => $value) {
        if ($key === 'payload' || $key === 'patient_name' || $key === 'guardian_phone' || $key === 'guardian_email') {
            continue;
        }
        if (is_string($key)) {
            $payload[$key] = is_array($value) ? array_values($value) : trim((string) $value);
        }
    }

    $patientName = trim((string) ($_POST['patient_name'] ?? $payload['patient_full_name'] ?? $payload['full_name'] ?? ''));
    $guardianPhone = trim((string) ($_POST['guardian_phone'] ?? $payload['contact_no'] ?? $payload['emergency_contact_no'] ?? ''));
    $guardianEmail = trim((string) ($_POST['guardian_email'] ?? $payload['email_address'] ?? $payload['email'] ?? ''));

    if (mb_strlen($patientName) < 2) {
        throw new RuntimeException('Patient full name is required.');
    }
    if (!valid_phone($guardianPhone)) {
        throw new RuntimeException('A valid guardian/contact phone is required.');
    }
    if ($guardianEmail !== '' && !filter_var($guardianEmail, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Guardian email is invalid.');
    }

    $payload['patient_name'] = $patientName;
    $payload['guardian_phone'] = $guardianPhone;
    if ($guardianEmail !== '') {
        $payload['guardian_email'] = $guardianEmail;
    }

    $parsed = [
        'patient_name' => $patientName,
        'guardian_phone' => $guardianPhone,
        'payload' => $payload,
    ];
    ensure_not_duplicate_registration($parsed);

    $attachments = [];
    foreach (['photo' => 'photo', 'genetic_report' => 'genetic_report'] as $input => $key) {
        if (!empty($_FILES[$input]['name'])) {
            $attachments[$key] = store_uploaded_image($_FILES[$input], $key);
        }
    }
    if ($attachments) {
        $payload['attachments'] = $attachments;
    }

    $statement = db()->prepare('INSERT INTO registrations (patient_name, guardian_phone, guardian_email, status, source, payload) VALUES (?, ?, ?, "pending", "public", ?)');
    $statement->execute([
        $patientName,
        $guardianPhone,
        $guardianEmail !== '' ? $guardianEmail : null,
        json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);

    registration_json(201, [
        'id' => (int) db()->lastInsertId(),
        'status' => 'pending',
        'message' => 'Registration submitted successfully',
    ]);
} catch (JsonException $exception) {
    registration_json(422, ['message' => 'Payload must be valid JSON.']);
} catch (Throwable $exception) {
    registration_json(422, ['message' => $exception->getMessage()]);
}
