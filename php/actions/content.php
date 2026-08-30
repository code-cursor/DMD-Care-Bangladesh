<?php
declare(strict_types=1);

function handle_content_action(string $action, array $user): never
{
    if ($action === 'content_toggle_home_publish') {
        require_role(['super_admin', 'admin', 'editor']);
        $id = (int) ($_POST['id'] ?? 0);
        $stmt = db()->prepare('SELECT extra FROM content_items WHERE id=? AND type="patient_story"');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Patient story not found.');
        }
        $extra = json_decode((string) ($row['extra'] ?: '{}'), true) ?: [];
        $current = array_key_exists('show_on_home', $extra) ? (bool) $extra['show_on_home'] : true;
        $extra['show_on_home'] = !$current;
        db()->prepare('UPDATE content_items SET extra=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND type="patient_story"')->execute([
            json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $id,
        ]);
        sync_public_patient_story_cards();
        flash($extra['show_on_home'] ? 'Patient story shown on homepage.' : 'Patient story hidden from homepage.');
        redirect_admin('content', ['type' => 'patient_story']);
    }
    if ($action === 'content_toggle_publish') {
        require_role(['super_admin', 'admin', 'editor']);
        $id = (int) ($_POST['id'] ?? 0);
        $type = (string) ($_POST['type'] ?? 'patient_story');
        $stmt = db()->prepare('SELECT is_published FROM content_items WHERE id=?');
        $stmt->execute([$id]);
        $current = $stmt->fetchColumn();
        if ($current === false) {
            throw new RuntimeException('Content item not found.');
        }
        $newStatus = (int) $current === 1 ? 0 : 1;
        db()->prepare('UPDATE content_items SET is_published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')->execute([$newStatus, $id]);
        if ($type === 'patient_story') {
            sync_public_patient_story_cards();
        }
        flash($newStatus === 1 ? 'Patient story published.' : 'Patient story unpublished.');
        redirect_admin('content', ['type' => $type]);
    }

    if ($action === 'content_delete') {
        require_role(['super_admin', 'admin']);
        $id = (int) ($_POST['id'] ?? 0);
        $type = (string) ($_POST['type'] ?? '');
        if ($type === 'patient_story') {
            db()->prepare('DELETE FROM content_items WHERE id=? AND type="patient_story"')->execute([$id]);
            sync_public_patient_story_cards();
            flash('Patient story removed.');
            redirect_admin('content', ['type' => 'patient_story']);
        }
        db()->prepare('DELETE FROM content_items WHERE id=? AND type=?')->execute([$id, $type]);

        flash('Content deleted.');
        $query = ['type' => $type];
        if ($type === 'gallery') {
            $query['media'] = (<?php
declare(strict_types=1);

function handle_content_action(string $action, array $user): never
{
    if ($action === 'content_toggle_home_publish') {
        require_role(['super_admin', 'admin', 'editor']);
        $id = (int) ($_POST['id'] ?? 0);
        $stmt = db()->prepare('SELECT extra FROM content_items WHERE id=? AND type="patient_story"');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new RuntimeException('Patient story not found.');
        }
        $extra = json_decode((string) ($row['extra'] ?: '{}'), true) ?: [];
        $current = array_key_exists('show_on_home', $extra) ? (bool) $extra['show_on_home'] : true;
        $extra['show_on_home'] = !$current;
        db()->prepare('UPDATE content_items SET extra=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND type="patient_story"')->execute([
            json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $id,
        ]);
        sync_public_patient_story_cards();
        flash($extra['show_on_home'] ? 'Patient story shown on homepage.' : 'Patient story hidden from homepage.');
        redirect_admin('content', ['type' => 'patient_story']);
    }
    if ($action === 'content_toggle_publish') {
        require_role(['super_admin', 'admin', 'editor']);
        $id = (int) ($_POST['id'] ?? 0);
        $type = (string) ($_POST['type'] ?? 'patient_story');
        $stmt = db()->prepare('SELECT is_published FROM content_items WHERE id=?');
        $stmt->execute([$id]);
        $current = $stmt->fetchColumn();
        if ($current === false) {
            throw new RuntimeException('Content item not found.');
        }
        $newStatus = (int) $current === 1 ? 0 : 1;
        db()->prepare('UPDATE content_items SET is_published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')->execute([$newStatus, $id]);
        if ($type === 'patient_story') {
            sync_public_patient_story_cards();
        }
        flash($newStatus === 1 ? 'Patient story published.' : 'Patient story unpublished.');
        redirect_admin('content', ['type' => $type]);
    }

    if ($action === 'content_delete') {
        require_role(['super_admin', 'admin']);
        $id = (int) ($_POST['id'] ?? 0);
        $type = (string) ($_POST['type'] ?? '');
        if ($type === 'patient_story') {
            flash('Patient stories are linked to registered patients. Delete the patient from Requests tab if you wish to remove the patient.');
            redirect_admin('content', ['type' => 'patient_story']);
        }
        db()->prepare('DELETE FROM content_items WHERE id=?')->execute([$id]);

        flash('Content deleted.');
        redirect_admin('content', ['type' => $type]);
    }

    if ($action !== 'content_save') {
        throw new RuntimeException('Unknown content action.');
    }

    require_role(['super_admin', 'admin', 'editor']);
    $id = (int) ($_POST['id'] ?? 0);
    $type = (string) ($_POST['type'] ?? '');
    $extra = [];

    if ($type === 'gallery') {
        $title = trim((string) ($_POST['title'] ?? ''));
        $summary = '';
        $mediaType = ($_POST['media_type'] ?? 'photo') === 'video' ? 'video' : 'photo';
        $videoUrl = trim((string) ($_POST['video_url'] ?? ''));
        if ($mediaType === 'video' && $videoUrl === '') {
            throw new RuntimeException('Video URL is required.');
        }
        $extra = ['media_type' => $mediaType, 'video_url' => $videoUrl];
        $body = $mediaType === 'video' ? $videoUrl : null;
    } elseif ($type === 'patient_story') {
        $title = trim((string) ($_POST['story_name'] ?? ''));
        $summary = trim((string) ($_POST['story_status'] ?? ''));
        $body = trim((string) ($_POST['story_detail_body'] ?? ''));
        $homeText = trim((string) ($_POST['story_home_text'] ?? ''));
        if (mb_strlen($homeText) > 350) {
            throw new RuntimeException('Home short story text must be 350 characters or less.');
        }
        $registrationId = (int) ($_POST['registration_id'] ?? 0);
        if ($registrationId > 0) {
            $extra['registration_id'] = $registrationId;
        } elseif ($id > 0) {
            $stmt = db()->prepare('SELECT extra FROM content_items WHERE id=?');
            $stmt->execute([$id]);
            $currExtra = json_decode((string) ($stmt->fetchColumn() ?: '{}'), true) ?: [];
            if (!empty($currExtra['registration_id'])) {
                $extra['registration_id'] = (int) $currExtra['registration_id'];
            }
        }
        foreach (['author','age','diagnosis_year','status','detail_title','detail_video_url','detail_body','phone','whatsapp','facebook'] as $key) {
            $extra[$key] = trim((string) ($_POST["story_$key"] ?? ''));
        }
        $extra['show_on_home'] = isset($_POST['show_on_home']);
        $extra['home_text'] = $homeText;
        $extra['home_link_text'] = 'Click for more stories about me';
        $extra['link'] = 'muntasir_billah_story?id=' . ($id ?: ($registrationId ?: 1));
    } else {
        throw new RuntimeException('Invalid content type.');
    }

    if (mb_strlen($title) < 2) {
        throw new RuntimeException('A title or name is required.');
    }
    $imageUrl = trim((string) ($_POST['existing_image_url'] ?? ''));
    if (!empty($_FILES['image']['name'])) {
        $imageUrl = store_uploaded_image($_FILES['image'], $type)['url'];
    }
    $values = [
        $type, $title, slugify((string) ($_POST['slug'] ?? $title)),
        $summary ?: null, $body ?: null, $imageUrl ?: null,
        (int) ($_POST['position'] ?? 0), isset($_POST['is_published']) ? 1 : 0,
        json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ];
    if ($id) {
        $values[] = $id;
        db()->prepare('UPDATE content_items SET type=?,title=?,slug=?,summary=?,body=?,image_url=?,position=?,is_published=?,extra=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')->execute($values);
        flash('Patient story updated.');
    } else {
        $values[] = $user['id'];
        db()->prepare('INSERT INTO content_items (type,title,slug,summary,body,image_url,position,is_published,extra,created_by_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)')->execute($values);
        flash('Content created.');
    }

    if ($type === 'patient_story') {
        sync_public_patient_story_cards();
    }

    $query = ['type' => $type];
    if ($type === 'gallery') {
        $query['media'] = $extra['media_type'];
    }
    redirect_admin('content', $query);
}

POST['media_type'] ?? 'photo') === 'video' ? 'video' : 'photo';
        }
        redirect_admin('content', $query);
    }

    if ($action !== 'content_save') {
        throw new RuntimeException('Unknown content action.');
    }

    require_role(['super_admin', 'admin', 'editor']);
    $id = (int) ($_POST['id'] ?? 0);
    $type = (string) ($_POST['type'] ?? '');
    $extra = [];

    if ($type === 'gallery') {
        $title = trim((string) ($_POST['title'] ?? ''));
        $summary = '';
        $mediaType = ($_POST['media_type'] ?? 'photo') === 'video' ? 'video' : 'photo';
        $videoUrl = trim((string) ($_POST['video_url'] ?? ''));
        if ($mediaType === 'video' && $videoUrl === '') {
            throw new RuntimeException('Video URL is required.');
        }
        $extra = ['media_type' => $mediaType, 'video_url' => $videoUrl];
        $body = $mediaType === 'video' ? $videoUrl : null;
    } elseif ($type === 'patient_story') {
        $title = trim((string) ($_POST['story_name'] ?? ''));
        $summary = trim((string) ($_POST['story_status'] ?? ''));
        $body = trim((string) ($_POST['story_detail_body'] ?? ''));
        $homeText = trim((string) ($_POST['story_home_text'] ?? ''));
        if (mb_strlen($homeText) > 350) {
            throw new RuntimeException('Home short story text must be 350 characters or less.');
        }
        $registrationId = (int) ($_POST['registration_id'] ?? 0);
        if ($registrationId > 0) {
            $extra['registration_id'] = $registrationId;
        } elseif ($id > 0) {
            $stmt = db()->prepare('SELECT extra FROM content_items WHERE id=?');
            $stmt->execute([$id]);
            $currExtra = json_decode((string) ($stmt->fetchColumn() ?: '{}'), true) ?: [];
            if (!empty($currExtra['registration_id'])) {
                $extra['registration_id'] = (int) $currExtra['registration_id'];
            }
        }
        foreach (['author','age','diagnosis_year','status','detail_title','detail_video_url','detail_body','phone','whatsapp','facebook'] as $key) {
            $extra[$key] = trim((string) ($_POST["story_$key"] ?? ''));
        }
        $extra['show_on_home'] = isset($_POST['show_on_home']);
        $extra['home_text'] = $homeText;
        $extra['home_link_text'] = 'Click for more stories about me';
        $extra['link'] = 'muntasir_billah_story?id=' . ($id ?: ($registrationId ?: 1));
    } else {
        throw new RuntimeException('Invalid content type.');
    }

    if (mb_strlen($title) < 2) {
        throw new RuntimeException('A title or name is required.');
    }
    $imageUrl = trim((string) ($_POST['existing_image_url'] ?? ''));
    if (!empty($_FILES['image']['name'])) {
        $imageUrl = store_uploaded_image($_FILES['image'], $type)['url'];
    }
    $values = [
        $type, $title, slugify((string) ($_POST['slug'] ?? $title)),
        $summary ?: null, $body ?: null, $imageUrl ?: null,
        (int) ($_POST['position'] ?? 0), isset($_POST['is_published']) ? 1 : 0,
        json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ];
    if ($id) {
        $values[] = $id;
        db()->prepare('UPDATE content_items SET type=?,title=?,slug=?,summary=?,body=?,image_url=?,position=?,is_published=?,extra=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')->execute($values);
        flash('Patient story updated.');
    } else {
        $values[] = $user['id'];
        db()->prepare('INSERT INTO content_items (type,title,slug,summary,body,image_url,position,is_published,extra,created_by_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)')->execute($values);
        flash('Content created.');
    }

    if ($type === 'patient_story') {
        sync_public_patient_story_cards();
    }

    $query = ['type' => $type];
    if ($type === 'gallery') {
        $query['media'] = $extra['media_type'];
    }
    redirect_admin('content', $query);
}

