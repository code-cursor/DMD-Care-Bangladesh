<?php
declare(strict_types=1);

function handle_content_action(string $action, array $user): never
{
    if ($action === 'content_delete') {
        require_role(['super_admin', 'admin']);
        db()->prepare('DELETE FROM content_items WHERE id=?')->execute([(int) $_POST['id']]);
        if (($_POST['type'] ?? '') === 'patient_story') {
            sync_public_patient_story_cards();
        }

        flash('Content deleted.');
        redirect_admin('content', ['type' => (string) $_POST['type']]);
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
        $summary = trim((string) ($_POST['summary'] ?? ''));
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
        foreach (['author','home_text','home_link_text','age','diagnosis_year','status','detail_title','detail_video_url','detail_body','phone','whatsapp','facebook'] as $key) {
            $extra[$key] = trim((string) ($_POST["story_$key"] ?? ''));
        }
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
        flash('Content updated.');
    } else {
        $values[] = $user['id'];
        db()->prepare('INSERT INTO content_items (type,title,slug,summary,body,image_url,position,is_published,extra,created_by_id) VALUES (?,?,?,?,?,?,?,?,?,?)')->execute($values);
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
function sync_public_patient_story_cards(): void
{
    $rows = db()->query('SELECT id,title,summary,image_url,extra FROM content_items WHERE type="patient_story" AND is_published=1 ORDER BY position,id DESC')->fetchAll();
    $stories = array_map(static function (array $row): array {
        $extra = json_decode($row['extra'] ?: '{}', true) ?: [];
        return [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'summary' => $row['summary'],
            'image_url' => $row['image_url'],
            'extra' => [
                'age' => $extra['age'] ?? '',
                'diagnosis_year' => $extra['diagnosis_year'] ?? '',
                'status' => $extra['status'] ?? '',
                'link' => $extra['link'] ?? 'muntasir_billah_story?id=' . (int) $row['id'],
            ],
        ];
    }, $rows);
    $directory = DMD_ROOT . '/assets/js/data';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        throw new RuntimeException('Unable to create the public story-card data directory.');
    }
    $json = json_encode($stories, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR);
    $javascript = 'window.DMD_PATIENT_STORIES = ' . $json . ';' . PHP_EOL;
    if (file_put_contents($directory . '/patient-story-list-data.js', $javascript, LOCK_EX) === false) {
        throw new RuntimeException('Unable to refresh public patient-story cards.');
    }
}
