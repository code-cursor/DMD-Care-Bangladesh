<?php
declare(strict_types=1);

require __DIR__ . '/php/bootstrap.php';
require __DIR__ . '/php/admin_actions.php';

$startupError = null;
try {
    initialize_database();
    handle_admin_post();
} catch (Throwable $exception) {
    $startupError = $exception->getMessage();
}

$user = $startupError === null ? current_user() : null;
$flash = take_flash();

if ($user && ($_GET['action'] ?? '') === 'export') {
    $rows = db()->query('SELECT id,patient_name,guardian_phone,guardian_email,status,source,notes,created_at,updated_at FROM registrations WHERE status="accepted" ORDER BY id DESC')->fetchAll(PDO::FETCH_NUM);
    download_excel('accepted_patients_' . date('Y-m-d') . '.xls', ['ID','Patient Name','Guardian Phone','Guardian Email','Status','Source','Notes','Created At','Updated At'], $rows);
}
if ($user && ($_GET['action'] ?? '') === 'export_patient') {
    $statement = db()->prepare('SELECT * FROM registrations WHERE id=?');
    $statement->execute([(int) ($_GET['id'] ?? 0)]);
    $patient = $statement->fetch();
    if (!$patient) {
        redirect_admin('requests');
    }
    $payload = json_decode($patient['payload'] ?: '{}', true) ?: [];
    $rows = [
        ['Patient Name', $patient['patient_name']],
        ['Guardian Phone', $patient['guardian_phone']],
        ['Guardian Email', $patient['guardian_email']],
        ['Status', $patient['status']],
        ['Source', $patient['source']],
        ['Notes', $patient['notes']],
    ];
    foreach ($payload as $key => $value) {
        if ($key !== 'attachments') {
            $rows[] = [ucwords(str_replace('_', ' ', $key)), is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value];
        }
    }
    download_excel(slugify($patient['patient_name']) . '_' . $patient['id'] . '_details.xls', ['Field','Value'], $rows);
}

$sections = ['dashboard', 'requests', 'direct', 'accepted', 'content', 'users', 'sms'];
$section = (string) ($_GET['section'] ?? 'dashboard');
if (!in_array($section, $sections, true)) {
    $section = 'dashboard';
}
$contentType = (string) ($_GET['type'] ?? 'health_team');
$contentMedia = ($_GET['media'] ?? 'photo') === 'video' ? 'video' : 'photo';
if (!in_array($contentType, ['health_team', 'gallery', 'patient_story'], true)) {
    $contentType = 'health_team';
}

if ($user) {
    $metrics = [
        'total' => (int) db()->query('SELECT COUNT(*) FROM registrations')->fetchColumn(),
        'pending' => (int) db()->query('SELECT COUNT(*) FROM registrations WHERE status="pending"')->fetchColumn(),
        'today' => (int) db()->query('SELECT COUNT(*) FROM registrations WHERE DATE(created_at)=CURRENT_DATE')->fetchColumn(),
        'accepted' => (int) db()->query('SELECT COUNT(*) FROM registrations WHERE status="accepted"')->fetchColumn(),
        'rejected' => (int) db()->query('SELECT COUNT(*) FROM registrations WHERE status="rejected"')->fetchColumn(),
        'visitors' => (int) db()->query('SELECT COUNT(*) FROM visitor_logs')->fetchColumn(),
        'visitors_today' => (int) db()->query('SELECT COUNT(*) FROM visitor_logs WHERE DATE(created_at)=CURRENT_DATE')->fetchColumn(),
    ];

    $reportRows = db()->query('SELECT DATE(created_at) AS date, COUNT(*) AS count FROM registrations WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 29 DAY) GROUP BY DATE(created_at) ORDER BY date DESC')->fetchAll();
    $statusFilter = (string) ($_GET['status'] ?? '');
    $search = trim((string) ($_GET['search'] ?? ''));
    $where = [];
    $parameters = [];
    if (in_array($statusFilter, ['pending', 'accepted', 'rejected'], true)) {
        $where[] = 'status=?';
        $parameters[] = $statusFilter;
    }
    if ($search !== '') {
        $where[] = '(patient_name LIKE ? OR guardian_phone LIKE ? OR guardian_email LIKE ?)';
        array_push($parameters, "%$search%", "%$search%", "%$search%");
    }
    $sql = 'SELECT * FROM registrations' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id DESC LIMIT 300';
    $statement = db()->prepare($sql);
    $statement->execute($parameters);
    $registrations = $statement->fetchAll();
    $accepted = db()->query('SELECT * FROM registrations WHERE status="accepted" ORDER BY updated_at DESC LIMIT 300')->fetchAll();

    $statement = db()->prepare('SELECT * FROM content_items WHERE type=? ORDER BY position,id DESC');
    $statement->execute([$contentType]);
    $contents = $statement->fetchAll();
    if ($contentType === 'gallery') {
        $contents = array_values(array_filter($contents, function (array $item) use ($contentMedia): bool {
            $extra = json_decode($item['extra'] ?: '{}', true) ?: [];
            return ($extra['media_type'] ?? 'photo') === $contentMedia;
        }));
    }
    $users = db()->query('SELECT id,name,email,role,is_active,created_at FROM users ORDER BY id')->fetchAll();
    $smsLogs = db()->query('SELECT s.*,r.patient_name FROM sms_logs s LEFT JOIN registrations r ON r.id=s.registration_id ORDER BY s.id DESC LIMIT 200')->fetchAll();
    $acceptedForSms = db()->query('SELECT id,patient_name,guardian_phone FROM registrations WHERE status="accepted" ORDER BY patient_name')->fetchAll();

    $editRegistration = null;
    if ($id = (int) ($_GET['edit_registration'] ?? 0)) {
        $statement = db()->prepare('SELECT * FROM registrations WHERE id=?');
        $statement->execute([$id]);
        $editRegistration = $statement->fetch() ?: null;
    }
    $viewRegistration = null;
    if ($id = (int) ($_GET['view_registration'] ?? 0)) {
        $statement = db()->prepare('SELECT * FROM registrations WHERE id=?');
        $statement->execute([$id]);
        $viewRegistration = $statement->fetch() ?: null;
    }
    $editUser = null;
    if ($id = (int) ($_GET['edit_user'] ?? 0)) {
        $statement = db()->prepare('SELECT id,name,email,role,is_active FROM users WHERE id=?');
        $statement->execute([$id]);
        $editUser = $statement->fetch() ?: null;
    }
    $editContent = null;
    if ($id = (int) ($_GET['edit_content'] ?? 0)) {
        $statement = db()->prepare('SELECT * FROM content_items WHERE id=?');
        $statement->execute([$id]);
        $editContent = $statement->fetch() ?: null;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DMD Care Admin</title>
  <link rel="shortcut icon" href="./assets/src/img/DMD_care_bd_Logo.webp" type="image/x-icon">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link rel="stylesheet" href="./assets/css/pages/admin.css?v=20260822-2">
  <style>
    a.nav-btn,.quick-link{text-decoration:none}.admin-alert{margin-bottom:18px}.actions{display:flex;flex-wrap:wrap;gap:6px}.actions form{display:inline}.content-preview{height:44px;width:60px;object-fit:cover;border-radius:6px}.table-wrap{overflow:auto}.json-field{font-family:ui-monospace,monospace;font-size:.82rem}.login-panel .alert{margin-top:16px}
  </style>
</head>
<body>
<?php if (!$user): ?>
  <?php require __DIR__ . '/php/views/login.php'; ?>
<?php else: ?>
  <div class="app-shell">
    <aside id="adminSidebar" class="sidebar" aria-label="Admin navigation">
      <div class="brand-row">
        <img src="./assets/src/img/DMD_care_bd_Logo.webp" alt="DMD Care Bangladesh">
        <div><strong>DMD Care</strong><span>Admin Console</span></div>
        <button id="mobileMenuCloseBtn" class="mobile-menu-close" type="button" aria-label="Close navigation"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="side-nav-title">Navigation</div>
      <a class="nav-btn <?= $section === 'dashboard' ? 'active' : '' ?>" href="?section=dashboard"><i class="bi bi-speedometer2"></i> Dashboard</a>
      <a class="nav-btn <?= $section === 'requests' ? 'active' : '' ?>" href="?section=requests"><i class="bi bi-inbox"></i> Requests</a>
      <a class="nav-btn <?= $section === 'direct' ? 'active' : '' ?>" href="?section=direct"><i class="bi bi-pencil-square"></i> Direct Entry</a>
      <a class="nav-btn <?= $section === 'accepted' ? 'active' : '' ?>" href="?section=accepted"><i class="bi bi-person-check"></i> Accepted Patients</a>
      <div class="side-nav-title">CMS</div>
      <?php foreach (['health_team'=>['people','Health Team'],'gallery'=>['images','Gallery'],'patient_story'=>['journal-medical','Patient Stories']] as $type => [$icon,$label]): ?>
        <a class="nav-btn <?= $section === 'content' && $contentType === $type ? 'active' : '' ?>" href="?section=content&amp;type=<?= e($type) ?>"><i class="bi bi-<?= e($icon) ?>"></i> <?= e($label) ?></a>
      <?php endforeach; ?>
      <div class="side-nav-title">System</div>
      <a class="nav-btn <?= $section === 'users' ? 'active' : '' ?>" href="?section=users"><i class="bi bi-person-gear"></i> Users</a>
      <a class="nav-btn <?= $section === 'sms' ? 'active' : '' ?>" href="?section=sms"><i class="bi bi-chat-dots"></i> SMS Logs</a>
    </aside>
    <button id="sidebarBackdrop" class="sidebar-backdrop" type="button" tabindex="-1" aria-label="Close navigation"></button>
    <main class="workspace">
      <header class="topbar">
        <button id="mobileMenuBtn" class="mobile-menu-btn" type="button" aria-label="Open navigation"><i class="bi bi-list"></i></button>
        <div><h2><?= e(ucwords(str_replace('_', ' ', $section))) ?></h2><span class="muted"><?= e($user['name']) ?> (<?= e($user['role']) ?>)</span></div>
        <div class="topbar-actions">
          <a href="./index.html" class="btn btn-light btn-sm" target="_blank" rel="noopener"><i class="bi bi-globe2"></i> Website</a>
          <form method="post"><input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="logout"><button class="btn btn-outline-danger btn-sm"><i class="bi bi-box-arrow-right"></i> Logout</button></form>
        </div>
      </header>
      <?php if ($flash): ?><div class="alert alert-<?= e($flash['type']) ?> admin-alert"><?= e($flash['message']) ?></div><?php endif; ?>
      <?php require __DIR__ . '/php/views/' . $section . '.php'; ?>
    </main>
  </div>
  <script src="./assets/js/pages/admin-php.js"></script>
<?php endif; ?>
</body>
</html>