<?php
declare(strict_types=1);

require_once __DIR__ . '/../../php/bootstrap.php';

function public_content_items(string $type): array
{
    initialize_database();
    $statement = db()->prepare('SELECT id,type,title,slug,summary,body,image_url,position,is_published,extra,created_at,updated_at FROM content_items WHERE type=? AND is_published=1 ORDER BY position,id DESC');
    $statement->execute([$type]);

    return array_map(static function (array $row) use ($type): array {
        $row['id'] = (int) $row['id'];
        $row['position'] = (int) $row['position'];
        $row['is_published'] = (bool) $row['is_published'];
        $row['extra'] = json_decode($row['extra'] ?: '{}', true) ?: [];
        if ($type === 'patient_story') {
            $row['extra']['home_text'] = mb_substr((string) ($row['extra']['home_text'] ?? ''), 0, 350);
            $row['extra']['home_link_text'] = 'Click for more stories about me';
            $defaultVisible = !empty($row['is_published']);
            $row['extra']['show_on_home'] = array_key_exists('show_on_home', $row['extra']) ? (bool) $row['extra']['show_on_home'] : $defaultVisible;
            $row['extra']['show_on_list'] = array_key_exists('show_on_list', $row['extra']) ? (bool) $row['extra']['show_on_list'] : $defaultVisible;
            $row['extra']['show_detail_page'] = array_key_exists('show_detail_page', $row['extra']) ? (bool) $row['extra']['show_detail_page'] : $defaultVisible;
        }
        return $row;
    }, $statement->fetchAll());
}

function send_public_content(string $type): never
{
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode(public_content_items($type), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
