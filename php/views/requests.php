<section class="work-section active">
  <div class="section-card-title"><h3>Registration Requests</h3><span>Review, export, approve, reject, edit, inspect images, or remove registrations.</span></div>
  <form class="toolbar" method="get">
    <input type="hidden" name="section" value="requests">
    <select name="status" class="form-select form-select-sm"><?php $selectedStatus = $_GET['status'] ?? 'pending'; foreach (['pending','rejected'] as $value): ?><option value="<?= $value ?>" <?= $selectedStatus === $value ? 'selected' : '' ?>><?= ucfirst($value) ?></option><?php endforeach; ?></select>
    <input name="search" value="<?= e($_GET['search'] ?? '') ?>" class="form-control form-control-sm" placeholder="Patient, phone, or email">
    <button class="btn btn-outline-success btn-sm"><i class="bi bi-search"></i></button>
  </form>

  <?php if ($viewRegistration): $viewPayload = json_decode($viewRegistration['payload'] ?: '{}', true) ?: []; $viewAttachments = $viewPayload['attachments'] ?? []; ?>
    <div class="data-form mb-4">
      <div class="card-title-row"><h3><?= e($viewRegistration['patient_name']) ?></h3><a class="btn btn-sm btn-outline-secondary" href="?section=requests">Close</a></div>
      <div class="row g-3 mb-3">
        <div class="col-md-4"><strong>Phone:</strong> <?= e($viewRegistration['guardian_phone']) ?></div>
        <div class="col-md-4"><strong>Email:</strong> <?= e($viewRegistration['guardian_email']) ?></div>
        <div class="col-md-4"><strong>Status:</strong> <?= e($viewRegistration['status']) ?></div>
      </div>
      <div class="row g-3">
        <?php foreach ($viewAttachments as $label => $attachment): $url = attachment_url($attachment); if (!$url) continue; ?>
          <div class="col-md-6 patient-image-card"><strong><?= e(ucwords(str_replace('_', ' ', $label))) ?></strong><?php if (strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION)) === 'pdf'): ?><a class="btn btn-outline-success mt-2" href="<?= e($url) ?>" target="_blank" rel="noopener"><i class="bi bi-file-earmark-pdf"></i> Open PDF report</a><?php else: ?><a href="<?= e($url) ?>" target="_blank" rel="noopener"><img src="<?= e($url) ?>" alt="<?= e($label) ?>"></a><?php endif; ?></div>
        <?php endforeach; ?>
      </div>
      <div class="table-wrap mt-3"><table class="table table-sm"><tbody><?php foreach ($viewPayload as $key => $value): if ($key === 'attachments') continue; ?><tr><th><?= e(ucwords(str_replace('_', ' ', $key))) ?></th><td><?= e(is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value) ?></td></tr><?php endforeach; ?></tbody></table></div>
    </div>
  <?php endif; ?>

  <?php if ($editRegistration): $editPayload = json_decode($editRegistration['payload'] ?: '{}', true) ?: []; ?>
    <form class="data-form mb-4" method="post" enctype="multipart/form-data">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="registration_save"><input type="hidden" name="return_section" value="requests"><input type="hidden" name="id" value="<?= e($editRegistration['id']) ?>"><input type="hidden" name="payload" value="<?= e(json_encode($editPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) ?>">
      <div class="card-title-row"><h3>Edit Registration</h3><a class="btn btn-sm btn-outline-secondary" href="?section=requests">Close</a></div>
      <div class="row g-3">
        <div class="col-md-4"><label class="form-label">Patient Name</label><input name="patient_name" class="form-control" value="<?= e($editRegistration['patient_name']) ?>" required></div>
        <div class="col-md-4"><label class="form-label">Guardian Phone</label><input name="guardian_phone" class="form-control" value="<?= e($editRegistration['guardian_phone']) ?>" required></div>
        <div class="col-md-4"><label class="form-label">Guardian Email</label><input name="guardian_email" type="email" class="form-control" value="<?= e($editRegistration['guardian_email']) ?>"></div>
        <div class="col-md-3"><label class="form-label">Status</label><select name="status" class="form-select"><?php foreach (['pending','accepted','rejected'] as $value): ?><option value="<?= $value ?>" <?= $editRegistration['status'] === $value ? 'selected' : '' ?>><?= ucfirst($value) ?></option><?php endforeach; ?></select></div>
        <div class="col-md-9"><label class="form-label">Notes</label><input name="notes" class="form-control" value="<?= e($editRegistration['notes']) ?>"></div>
        <?php foreach ($editPayload as $key => $value): if ($key === 'attachments') continue; ?><div class="<?= is_array($value) ? 'col-12' : 'col-md-6' ?>"><label class="form-label"><?= e(ucwords(str_replace('_', ' ', $key))) ?></label><?php if (is_array($value)): ?><textarea name="payload_fields[<?= e($key) ?>]" class="form-control" rows="3"><?= e(json_encode($value, JSON_UNESCAPED_UNICODE)) ?></textarea><?php else: ?><input name="payload_fields[<?= e($key) ?>]" class="form-control" value="<?= e($value) ?>"><?php endif; ?></div><?php endforeach; ?>
        <div class="col-md-6"><label class="form-label">Replace Patient Photo</label><input name="patient_photo" type="file" class="form-control" accept="image/jpeg,image/png,image/webp"></div>
        <div class="col-md-6"><label class="form-label">Replace Genetic Report</label><input name="genetic_report" type="file" class="form-control" accept="image/jpeg,image/png,image/webp"></div>
      </div>
      <button class="btn btn-success mt-3"><i class="bi bi-save"></i> Update Registration</button>
    </form>
  <?php endif; ?>

  <div class="table-wrap"><table class="table table-hover align-middle">
    <thead><tr><th>ID</th><th>Patient</th><th>Phone</th><th>Status</th><th>Source</th><th>Created</th><th>Actions</th></tr></thead><tbody>
    <?php foreach ($registrations as $row): ?><tr>
      <td><?= e($row['id']) ?></td><td><?= e($row['patient_name']) ?></td><td><?= e($row['guardian_phone']) ?></td><td><span class="badge-status badge-<?= e($row['status']) ?>"><?= e($row['status']) ?></span></td><td><?= e($row['source']) ?></td><td><?= e($row['created_at']) ?></td>
      <td><div class="actions">
        <a class="btn btn-sm btn-outline-success" href="?action=export_patient&amp;id=<?= e($row['id']) ?>" title="Download Excel"><i class="bi bi-file-earmark-excel"></i></a>
        <a class="btn btn-sm btn-outline-success" href="?section=requests&amp;view_registration=<?= e($row['id']) ?>" title="View details and images"><i class="bi bi-images"></i></a>
        <a class="btn btn-sm btn-outline-secondary" href="?section=requests&amp;edit_registration=<?= e($row['id']) ?>"><i class="bi bi-pencil"></i></a>
        <?php foreach (['accepted'=>'check2','rejected'=>'x'] as $newStatus=>$icon): ?><form method="post"><input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="registration_status"><input type="hidden" name="return_section" value="requests"><input type="hidden" name="id" value="<?= e($row['id']) ?>"><input type="hidden" name="status" value="<?= $newStatus ?>"><button class="btn btn-sm btn-outline-success"><i class="bi bi-<?= $icon ?>"></i></button></form><?php endforeach; ?>
        <?php if (in_array($user['role'], ['super_admin','admin'], true)): ?><form method="post" data-confirm="Delete this registration?"><input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="registration_delete"><input type="hidden" name="return_section" value="requests"><input type="hidden" name="id" value="<?= e($row['id']) ?>"><button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button></form><?php endif; ?>
      </div></td>
    </tr><?php endforeach; ?><?php if (!$registrations): ?><tr><td colspan="7" class="text-center muted">No registrations found.</td></tr><?php endif; ?></tbody>
  </table></div>
</section>