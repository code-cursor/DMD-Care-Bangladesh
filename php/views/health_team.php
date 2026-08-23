<?php
$teamForm = $editHealthTeamMember ?: [
    'id' => '',
    'title' => '',
    'summary' => '',
    'body' => '',
    'image_url' => '',
    'position' => 0,
    'is_published' => 1,
    'extra' => '{}',
];
$teamExtra = json_decode($teamForm['extra'] ?: '{}', true) ?: [];
$bodyLines = array_values(array_filter(preg_split('/\R/', (string) $teamForm['body']) ?: []));
$qualifications = $teamExtra['qualifications'] ?? ($bodyLines[0] ?? '');
$jobPosition = $teamExtra['job_position'] ?? ($bodyLines[1] ?? '');
$workplace = $teamExtra['workplace'] ?? implode(' ', array_slice($bodyLines, 2));
?>
<section class="work-section active">
  <div class="section-card-title">
    <h3>Health Care Team</h3>
    <span>Edit the doctor profiles shown on the public health care team page.</span>
  </div>

  <div class="content-grid">
    <form class="data-form" method="post" enctype="multipart/form-data">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="health_team_save">
      <input type="hidden" name="return_section" value="health_team">
      <input type="hidden" name="id" value="<?= e($teamForm['id']) ?>">
      <input type="hidden" name="existing_image_url" value="<?= e($teamForm['image_url']) ?>">

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1"><?= $editHealthTeamMember ? 'Edit Doctor Profile' : 'New Doctor Profile' ?></h4>
          <p class="muted mb-0">Changes publish to <strong>/health_care_team</strong>.</p>
        </div>
        <?php if ($editHealthTeamMember): ?>
          <a class="btn btn-outline-secondary btn-sm" href="/admin?section=health_team">New</a>
        <?php endif; ?>
      </div>

      <div class="row g-3">
        <div class="col-12">
          <label class="form-label" for="doctorName">Doctor Name</label>
          <input id="doctorName" name="doctor_name" class="form-control" value="<?= e($teamForm['title']) ?>" required>
        </div>
        <div class="col-12">
          <label class="form-label" for="doctorSpecialty">Specialty</label>
          <input id="doctorSpecialty" name="doctor_specialty" class="form-control" value="<?= e($teamForm['summary']) ?>">
        </div>
        <div class="col-12">
          <label class="form-label" for="doctorQualifications">Medical Qualifications</label>
          <textarea id="doctorQualifications" name="doctor_qualifications" class="form-control" rows="2"><?= e($qualifications) ?></textarea>
        </div>
        <div class="col-12">
          <label class="form-label" for="doctorPosition">Job or Academic Position</label>
          <textarea id="doctorPosition" name="doctor_job_position" class="form-control" rows="2"><?= e($jobPosition) ?></textarea>
        </div>
        <div class="col-12">
          <label class="form-label" for="doctorWorkplace">Workplace or Hospital</label>
          <textarea id="doctorWorkplace" name="doctor_workplace" class="form-control" rows="2"><?= e($workplace) ?></textarea>
        </div>
        <div class="col-md-7">
          <label class="form-label" for="doctorImage">Doctor Image</label>
          <input id="doctorImage" name="image" type="file" class="form-control" accept="image/jpeg,image/png,image/webp">
          <?php if ($teamForm['image_url']): ?>
            <img class="attachment-preview mt-2" src="<?= e($teamForm['image_url']) ?>" alt="Current doctor image">
          <?php endif; ?>
        </div>
        <div class="col-md-3">
          <label class="form-label" for="doctorOrder">Display Order</label>
          <input id="doctorOrder" name="position" type="number" class="form-control" value="<?= e($teamForm['position']) ?>">
        </div>
        <div class="col-md-2 publish-box">
          <input id="doctorPublished" name="is_published" type="checkbox" class="form-check-input" <?= $teamForm['is_published'] ? 'checked' : '' ?>>
          <label for="doctorPublished">Published</label>
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2 mt-3">
        <button class="btn btn-success" type="submit"><i class="bi bi-save"></i> <?= $editHealthTeamMember ? 'Update Profile' : 'Create Profile' ?></button>
        <?php if ($editHealthTeamMember): ?>
          <a class="btn btn-outline-secondary" href="/admin?section=health_team">Cancel</a>
        <?php endif; ?>
      </div>
    </form>

    <div class="table-wrap">
      <div class="section-card-title">
        <h3>Current Team Members</h3>
        <span><?= count($healthTeamMembers) ?> profile<?= count($healthTeamMembers) === 1 ? '' : 's' ?> available.</span>
      </div>
      <table class="table table-hover align-middle">
        <thead><tr><th>Photo</th><th>Doctor</th><th>Specialty</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <?php foreach ($healthTeamMembers as $row): ?>
            <tr>
              <td><?php if ($row['image_url']): ?><img class="content-preview" src="<?= e($row['image_url']) ?>" alt=""><?php else: ?><i class="bi bi-person-badge"></i><?php endif; ?></td>
              <td><strong><?= e($row['title']) ?></strong><br><small class="muted"><?= e($row['slug']) ?></small></td>
              <td><?= e($row['summary']) ?></td>
              <td><?= e($row['position']) ?></td>
              <td><?= $row['is_published'] ? 'Published' : 'Draft' ?></td>
              <td>
                <div class="actions">
                  <a class="btn btn-sm btn-outline-secondary" href="/admin?section=health_team&amp;edit_health_team=<?= e($row['id']) ?>"><i class="bi bi-pencil"></i></a>
                  <?php if (in_array($user['role'], ['super_admin','admin'], true)): ?>
                    <form method="post" data-confirm="Delete this doctor profile?">
                      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
                      <input type="hidden" name="action" value="health_team_delete">
                      <input type="hidden" name="return_section" value="health_team">
                      <input type="hidden" name="id" value="<?= e($row['id']) ?>">
                      <button class="btn btn-sm btn-outline-danger" type="submit"><i class="bi bi-trash"></i></button>
                    </form>
                  <?php endif; ?>
                </div>
              </td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$healthTeamMembers): ?><tr><td colspan="6" class="text-center muted">No health care team profiles yet.</td></tr><?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</section>
