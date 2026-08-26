<?php
$partnerForm = $editPartner ?: [
    'id' => '',
    'title' => '',
    'summary' => '',
    'image_url' => '',
    'position' => 0,
    'is_published' => 1,
    'extra' => '{}',
];
$partnerExtra = json_decode($partnerForm['extra'] ?: '{}', true) ?: [];
?>
<section class="work-section active">
  <div class="section-card-title">
    <h3>Our Partners</h3>
    <span>Add, edit, or delete partners shown on /our_partners.</span>
  </div>

  <div class="content-grid">
    <form class="data-form" method="post" enctype="multipart/form-data">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="partner_save">
      <input type="hidden" name="return_section" value="partners">
      <input type="hidden" name="id" value="<?= e($partnerForm['id']) ?>">
      <input type="hidden" name="existing_image_url" value="<?= e($partnerForm['image_url']) ?>">

      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h4 class="mb-1"><?= $editPartner ? 'Edit Partner' : 'Add Partner' ?></h4>
          <p class="muted mb-0">Logo changes publish to <strong>/our_partners</strong>.</p>
        </div>
        <?php if ($editPartner): ?>
          <a class="btn btn-outline-secondary btn-sm" href="/admin?section=partners">New</a>
        <?php endif; ?>
      </div>

      <div class="row g-3">
        <div class="col-12"><label class="form-label">Partner Name</label><input name="partner_name" class="form-control" value="<?= e($partnerForm['title']) ?>" required></div>
        <div class="col-12"><label class="form-label">Website URL</label><input name="partner_website" type="url" class="form-control" value="<?= e($partnerExtra['website'] ?? $partnerForm['summary']) ?>" placeholder="https://example.com"></div>
        <div class="col-md-6 partner-logo-field">
          <label class="form-label">Partner Logo</label>
          <input name="image" type="file" class="form-control" accept="image/jpeg,image/png,image/webp" <?= $editPartner ? '' : 'required' ?>>
          <?php if ($partnerForm['image_url']): ?><img class="attachment-preview mt-2" src="<?= e($partnerForm['image_url']) ?>" alt="Current partner logo"><?php endif; ?>
        </div>
        <div class="col-md-3 partner-order-field"><label class="form-label">Display Order</label><input name="position" type="number" class="form-control" value="<?= e($partnerForm['position']) ?>"></div>
        <div class="col-md-3 publish-box partner-publish-field"><input id="partnerPublished" name="is_published" type="checkbox" class="form-check-input" <?= $partnerForm['is_published'] ? 'checked' : '' ?>><label for="partnerPublished">Published</label></div>
      </div>

      <div class="d-flex flex-wrap gap-2 mt-3">
        <button class="btn btn-success" type="submit"><i class="bi bi-save"></i> <?= $editPartner ? 'Update Partner' : 'Add Partner' ?></button>
        <?php if ($editPartner): ?><a class="btn btn-outline-secondary" href="/admin?section=partners">Cancel</a><?php endif; ?>
      </div>
    </form>

    <div class="table-wrap">
      <div class="section-card-title"><h3>Current Partners</h3><span><?= count($partners) ?> partner<?= count($partners) === 1 ? '' : 's' ?> available.</span></div>
      <table class="table table-hover align-middle">
        <thead><tr><th>Logo</th><th>Partner</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <?php foreach ($partners as $row): ?>
            <tr>
              <td><?php if ($row['image_url']): ?><img class="content-preview" src="<?= e($row['image_url']) ?>" alt=""><?php else: ?><i class="bi bi-building"></i><?php endif; ?></td>
              <td><strong><?= e($row['title']) ?></strong><br><small class="muted"><?= e($row['summary'] ?: $row['slug']) ?></small></td>
              <td><?= e($row['position']) ?></td>
              <td><?= $row['is_published'] ? 'Published' : 'Draft' ?></td>
              <td><div class="actions">
                <a class="btn btn-sm btn-outline-secondary" href="/admin?section=partners&amp;edit_partner=<?= e($row['id']) ?>"><i class="bi bi-pencil"></i></a>
                <?php if (in_array($user['role'], ['super_admin','admin'], true)): ?>
                  <form method="post" data-confirm="Delete this partner?"><input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="partner_delete"><input type="hidden" name="return_section" value="partners"><input type="hidden" name="id" value="<?= e($row['id']) ?>"><button class="btn btn-sm btn-outline-danger" type="submit"><i class="bi bi-trash"></i></button></form>
                <?php endif; ?>
              </div></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$partners): ?><tr><td colspan="5" class="text-center muted">No partners added yet.</td></tr><?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</section>
