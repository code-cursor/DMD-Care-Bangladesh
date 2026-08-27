<?php
$contentForm = $editContent ?: ['id'=>'','title'=>'','slug'=>'','summary'=>'','body'=>'','image_url'=>'','position'=>0,'is_published'=>1,'extra'=>'{}'];
$contentExtra = json_decode($contentForm['extra'] ?: '{}', true) ?: [];

$linkedRegistration = null;
if ($contentType === 'patient_story' && !empty($contentExtra['registration_id'])) {
    $stmt = db()->prepare('SELECT * FROM registrations WHERE id=?');
    $stmt->execute([(int) $contentExtra['registration_id']]);
    $linkedRegistration = $stmt->fetch() ?: null;
}
?>
<section class="work-section active">
  <div class="section-card-title">
    <h3><?= e($contentType === 'gallery' ? 'Gallery' : 'Patient Stories (CMS)') ?></h3>
    <span><?= e($contentType === 'gallery' ? 'Maintain photo and video gallery records.' : 'Manage homepage visibility, story cards, and full story articles for registered patients.') ?></span>
  </div>

  <?php if ($contentType === 'gallery'): ?>
    <div class="content-tabs">
      <a class="content-tab <?= $contentMedia === 'photo' ? 'active' : '' ?>" href="/admin?section=content&amp;type=gallery&amp;media=photo"><i class="bi bi-image"></i> Photo</a>
      <a class="content-tab <?= $contentMedia === 'video' ? 'active' : '' ?>" href="/admin?section=content&amp;type=gallery&amp;media=video"><i class="bi bi-camera-video"></i> Video</a>
    </div>

    <div class="content-grid">
      <form class="data-form" method="post" enctype="multipart/form-data">
        <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="action" value="content_save">
        <input type="hidden" name="return_section" value="content">
        <input type="hidden" name="id" value="<?= e($contentForm['id']) ?>">
        <input type="hidden" name="type" value="gallery">
        <input type="hidden" name="existing_image_url" value="<?= e($contentForm['image_url']) ?>">
        <input type="hidden" name="media_type" value="<?= e($contentMedia) ?>">

        <div class="row g-3">
          <div class="col-12"><label class="form-label">Title</label><input name="title" class="form-control" value="<?= e($contentForm['title']) ?>" required></div>
          <div class="col-12"><label class="form-label">Summary</label><input name="summary" class="form-control" value="<?= e($contentForm['summary']) ?>"></div>
          <?php if ($contentMedia === 'video'): ?>
            <div class="col-12"><label class="form-label">Video URL</label><input name="video_url" class="form-control" value="<?= e($contentExtra['video_url'] ?? $contentForm['body']) ?>" required></div>
          <?php endif; ?>
        </div>

        <div class="row g-3 mt-2">
          <?php if ($contentMedia === 'photo'): ?>
            <div class="col-md-7"><label class="form-label">Upload Image</label><input name="image" type="file" class="form-control" accept="image/jpeg,image/png,image/webp"><?php if ($contentForm['image_url']): ?><img class="attachment-preview mt-2" src="<?= e($contentForm['image_url']) ?>" alt="Current image"><?php endif; ?></div>
          <?php endif; ?>
          <div class="col-md-3"><label class="form-label">Position</label><input name="position" type="number" class="form-control" value="<?= e($contentForm['position']) ?>"></div>
          <div class="col-md-2 publish-box"><input id="published" name="is_published" type="checkbox" class="form-check-input" <?= $contentForm['is_published'] ? 'checked' : '' ?>><label for="published">Published</label></div>
        </div>
        <button class="btn btn-success mt-3"><i class="bi bi-save"></i> <?= $editContent ? 'Update' : 'Create' ?></button>
        <?php if ($editContent): ?><a class="btn btn-outline-secondary mt-3" href="/admin?section=content&amp;type=gallery&amp;media=<?= e($contentMedia) ?>">Cancel</a><?php endif; ?>
      </form>

      <div class="table-wrap">
        <table class="table table-hover align-middle">
          <thead><tr><th>Preview</th><th>Title</th><th>Published</th><th>Actions</th></tr></thead>
          <tbody>
            <?php foreach ($contents as $row): ?>
              <tr>
                <td><?php if ($row['image_url']): ?><img class="content-preview" src="<?= e($row['image_url']) ?>" alt=""><?php else: ?><i class="bi bi-camera-video"></i><?php endif; ?></td>
                <td><?= e($row['title']) ?><br><small class="muted"><?= e($row['slug']) ?></small></td>
                <td><?= $row['is_published'] ? 'Yes' : 'No' ?></td>
                <td>
                  <div class="actions">
                    <a class="btn btn-sm btn-outline-secondary" href="/admin?section=content&amp;type=gallery&amp;media=<?= e($contentMedia) ?>&amp;edit_content=<?= e($row['id']) ?>"><i class="bi bi-pencil"></i></a>
                    <?php if (in_array($user['role'], ['super_admin','admin'], true)): ?>
                      <form method="post" data-confirm="Delete this gallery item?"><input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="content_delete"><input type="hidden" name="return_section" value="content"><input type="hidden" name="id" value="<?= e($row['id']) ?>"><input type="hidden" name="type" value="gallery"><button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button></form>
                    <?php endif; ?>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$contents): ?><tr><td colspan="4" class="text-center muted">No content found.</td></tr><?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>

  <?php else: /* patient_story */ ?>

    <?php if ($editContent): ?>
      <div class="card mb-4 border-primary">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0"><i class="bi bi-person-heart"></i> Editing Story for: <strong><?= e($contentForm['title']) ?></strong></h5>
            <?php if ($linkedRegistration): ?>
              <small class="text-white-50">Registration #<?= e($linkedRegistration['id']) ?> | Phone: <?= e($linkedRegistration['guardian_phone']) ?> | Source: <?= e(ucfirst($linkedRegistration['source'])) ?></small>
            <?php endif; ?>
          </div>
          <div>
            <a href="/muntasir_billah_story?id=<?= e($contentForm['id']) ?>" target="_blank" class="btn btn-light btn-sm text-primary me-2"><i class="bi bi-box-arrow-up-right"></i> View Live Story</a>
            <a href="/admin?section=content&amp;type=patient_story" class="btn btn-outline-light btn-sm"><i class="bi bi-x-lg"></i> Close Editor</a>
          </div>
        </div>
        <div class="card-body">
          <div id="patientStoryTabs" class="content-tabs mb-3">
            <button class="content-tab active" type="button" data-story-section="home"><i class="bi bi-house-heart"></i> 1. Home Page Carousel</button>
            <button class="content-tab" type="button" data-story-section="list"><i class="bi bi-card-list"></i> 2. All Stories Card</button>
            <button class="content-tab" type="button" data-story-section="detail"><i class="bi bi-file-text"></i> 3. Main Story Article</button>
          </div>

          <form class="data-form" method="post" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
            <input type="hidden" name="action" value="content_save">
            <input type="hidden" name="return_section" value="content">
            <input type="hidden" name="id" value="<?= e($contentForm['id']) ?>">
            <input type="hidden" name="registration_id" value="<?= e($contentExtra['registration_id'] ?? '') ?>">
            <input type="hidden" name="type" value="patient_story">
            <input type="hidden" name="existing_image_url" value="<?= e($contentForm['image_url']) ?>">

            <div class="story-editor">
              <div id="storyHomeSection" class="story-editor-group">
                <h4><i class="bi bi-house-door"></i> Home Page Carousel Story</h4>
                <p class="text-muted small">This short text and link are shown in the "Our Patients Stories" carousel on the homepage.</p>
                <div class="row g-3">
                  <div class="col-md-6"><label class="form-label">Patient Name</label><input name="story_name" class="form-control" value="<?= e($contentForm['title']) ?>" required></div>
                  <div class="col-md-6"><label class="form-label">Author / Display Name</label><input name="story_author" class="form-control" value="<?= e($contentExtra['author'] ?? $contentForm['title']) ?>" placeholder="e.g. <?= e($contentForm['title']) ?>"></div>
                  <div class="col-12"><div class="form-check form-switch mb-2"><input id="showOnHomeSwitch" name="show_on_home" type="checkbox" role="switch" class="form-check-input" value="1" <?= (($contentExtra['show_on_home'] ?? true) ? 'checked' : '') ?>><label for="showOnHomeSwitch" class="form-check-label fw-semibold">Show on Home Page</label></div></div>
                  <div class="col-12"><label class="form-label">Home Short Story Text <small class="text-muted">(max 350 characters)</small></label><textarea name="story_home_text" class="form-control" rows="4" maxlength="350" placeholder="Brief teaser story summary to display on the homepage carousel..."><?= e($contentExtra['home_text'] ?? '') ?></textarea></div>
                </div>
              </div>

              <div id="storyListSection" class="story-editor-group d-none">
                <h4><i class="bi bi-card-heading"></i> All Patient Stories Listing Card</h4>
                <p class="text-muted small">These fields appear on the card in the All Patient Stories grid page.</p>
                <div class="row g-3">
                  <div class="col-md-4"><label class="form-label">Age / Diagnosis Age</label><input name="story_age" class="form-control" value="<?= e($contentExtra['age'] ?? '') ?>" placeholder="e.g. Diagnosed at 6 years"></div>
                  <div class="col-md-4"><label class="form-label">Diagnosis Year</label><input name="story_diagnosis_year" class="form-control" value="<?= e($contentExtra['diagnosis_year'] ?? '') ?>" placeholder="e.g. 2022"></div>
                  <div class="col-md-4"><label class="form-label">Patient Status / Condition</label><input name="story_status" class="form-control" value="<?= e($contentExtra['status'] ?? $contentForm['summary']) ?>" placeholder="e.g. Wheelchair user / Physiotherapy care"></div>
                </div>
              </div>

              <div id="storyDetailSection" class="story-editor-group d-none">
                <h4><i class="bi bi-journal-richtext"></i> Main Story Detail Page</h4>
                <p class="text-muted small">Detailed full story article, YouTube video link, and contact options.</p>
                <div class="row g-3">
                  <div class="col-12"><label class="form-label">Story Headline / Title</label><input name="story_detail_title" class="form-control" value="<?= e($contentExtra['detail_title'] ?? $contentForm['title']) ?>"></div>
                  <div class="col-12"><label class="form-label">Story Video URL (YouTube embed or watch URL)</label><input name="story_detail_video_url" class="form-control" value="<?= e($contentExtra['detail_video_url'] ?? '') ?>" placeholder="https://www.youtube.com/embed/... or https://youtu.be/..."></div>
                  <div class="col-12"><label class="form-label">Full Story Narrative Details</label><textarea name="story_detail_body" class="form-control" rows="10" placeholder="Write the complete journey, medical background, challenges, and support details..."><?= e($contentExtra['detail_body'] ?? $contentForm['body']) ?></textarea></div>
                  <div class="col-md-4"><label class="form-label">Guardian Phone</label><input name="story_phone" class="form-control" value="<?= e($contentExtra['phone'] ?? '') ?>" placeholder="+8801XXXXXXXXX"></div>
                  <div class="col-md-4"><label class="form-label">WhatsApp Link / Number</label><input name="story_whatsapp" class="form-control" value="<?= e($contentExtra['whatsapp'] ?? '') ?>" placeholder="https://wa.me/+8801... or phone number"></div>
                  <div class="col-md-4"><label class="form-label">Facebook Profile / Link</label><input name="story_facebook" class="form-control" value="<?= e($contentExtra['facebook'] ?? '') ?>" placeholder="https://facebook.com/..."></div>
                </div>
              </div>
            </div>

            <div class="row g-3 mt-3 pt-3 border-top align-items-center">
              <div class="col-md-5">
                <label class="form-label fw-semibold">Story Photo / Image</label>
                <?php if ($contentForm['image_url']): ?>
                  <div class="mt-2 d-flex align-items-center gap-2">
                    <img class="attachment-preview" src="<?= e($contentForm['image_url']) ?>" alt="Current story photo" style="max-height:60px; border-radius:6px;">
                    <small class="text-muted">Registration photo used on all story cards</small>
                  </div>
                <?php else: ?>
                  <small class="text-muted">No registration photo found. The default story image will be used.</small>
                <?php endif; ?>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold">Display Order / Position</label>
                <input name="position" type="number" class="form-control" value="<?= e($contentForm['position']) ?>">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Public Story Status</label>
                <div class="form-check form-switch pt-1">
                  <input id="publishedSwitch" name="is_published" type="checkbox" role="switch" class="form-check-input" value="1" <?= $contentForm['is_published'] ? 'checked' : '' ?>>
                  <label for="publishedSwitch" class="form-check-label ms-2 fw-semibold">Publish story pages</label>
                </div>
                <small class="text-muted d-block mt-1">Controls All Stories and detail page availability. Use Home Page On/Off for the homepage carousel.</small>
              </div>
            </div>

            <div class="mt-4 d-flex gap-2">
              <button class="btn btn-success"><i class="bi bi-save"></i> Save Story Details</button>
              <a class="btn btn-outline-secondary" href="/admin?section=content&amp;type=patient_story">Cancel</a>
            </div>
          </form>
        </div>
      </div>
    <?php else: ?>
      <div class="alert alert-info d-flex align-items-center mb-4">
        <i class="bi bi-info-circle-fill fs-4 me-3"></i>
        <div>
          <strong>Automatic Patient Integration:</strong> Registered patients (from the public registration form and direct admin entry) are automatically synced here. Click <strong>Edit Story</strong> on any patient below to customize their homepage teaser text, diagnosis details, YouTube video, or full story article. Use <strong>Home Page On/Off</strong> to control only the homepage carousel, or <strong>Published</strong> to show/hide the public story pages.
        </div>
      </div>
    <?php endif; ?>

    <div class="card">
      <div class="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><i class="bi bi-people"></i> Registered Patients &amp; Patient Stories</h5>
        <span class="badge bg-secondary"><?= count($contents) ?> Total Stories</span>
      </div>
      <div class="table-wrap">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width:70px;">Photo</th>
              <th>Patient Name</th>
              <th>Diagnosis / Age</th>
              <th>Home Teaser</th>
              <th>Status / Condition</th>
              <th style="min-width:150px;">Home Page On/Off</th>
              <th style="min-width:140px;">Published</th>
              <th>Order</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($contents as $row): ?>
              <?php
                $rowExtra = json_decode($row['extra'] ?: '{}', true) ?: [];
                $hasHomeText = !empty($rowExtra['home_text']);
                $hasDetailBody = !empty($rowExtra['detail_body']);
                $showOnHome = array_key_exists('show_on_home', $rowExtra) ? (bool) $rowExtra['show_on_home'] : true;
              ?>
              <tr>
                <td>
                  <?php if ($row['image_url']): ?>
                    <img class="content-preview" src="<?= e($row['image_url']) ?>" alt="<?= e($row['title']) ?>">
                  <?php else: ?>
                    <div class="content-preview bg-light d-flex align-items-center justify-content-center text-muted"><i class="bi bi-person"></i></div>
                  <?php endif; ?>
                </td>
                <td>
                  <strong><?= e($row['title']) ?></strong>
                  <?php if (!empty($rowExtra['registration_id'])): ?>
                    <br><small class="text-muted">Reg #<?= e($rowExtra['registration_id']) ?></small>
                  <?php endif; ?>
                </td>
                <td>
                  <?= e($rowExtra['age'] ?: '—') ?>
                  <?php if (!empty($rowExtra['diagnosis_year'])): ?>
                    <br><small class="text-muted">Year: <?= e($rowExtra['diagnosis_year']) ?></small>
                  <?php endif; ?>
                </td>
                <td>
                  <?php if ($hasHomeText): ?>
                    <span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle"></i> Teaser added</span>
                  <?php else: ?>
                    <span class="badge bg-warning-subtle text-warning border border-warning-subtle"><i class="bi bi-dash-circle"></i> No teaser yet</span>
                  <?php endif; ?>
                </td>
                <td><?= e($rowExtra['status'] ?: ($row['summary'] ?: '—')) ?></td>
                <td>
                  <form method="post" class="d-inline">
                    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
                    <input type="hidden" name="action" value="content_toggle_home_publish">
                    <input type="hidden" name="return_section" value="content">
                    <input type="hidden" name="id" value="<?= e($row['id']) ?>">
                    <button type="submit" class="btn btn-sm <?= $showOnHome ? 'btn-success' : 'btn-outline-secondary' ?>" title="Click to show or hide this story only on the homepage carousel">
                      <i class="bi bi-<?= $showOnHome ? 'house-door-fill' : 'house-door' ?>"></i>
                      <?= $showOnHome ? 'On Home' : 'Off Home' ?>
                    </button>
                  </form>
                </td>
                <td>
                  <form method="post" class="d-inline">
                    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
                    <input type="hidden" name="action" value="content_toggle_publish">
                    <input type="hidden" name="return_section" value="content">
                    <input type="hidden" name="id" value="<?= e($row['id']) ?>">
                    <input type="hidden" name="type" value="patient_story">
                    <button type="submit" class="btn btn-sm <?= $row['is_published'] ? 'btn-success' : 'btn-outline-secondary' ?>" title="Click to toggle publish / hide on public website">
                      <i class="bi bi-<?= $row['is_published'] ? 'eye-fill' : 'eye-slash' ?>"></i>
                      <?= $row['is_published'] ? 'Published' : 'Hidden' ?>
                    </button>
                  </form>
                </td>
                <td><?= e($row['position']) ?></td>
                <td class="text-end">
                  <div class="actions justify-content-end">
                    <a class="btn btn-sm btn-primary" href="/admin?section=content&amp;type=patient_story&amp;edit_content=<?= e($row['id']) ?>" title="Edit Story Details">
                      <i class="bi bi-pencil-square"></i> Edit Story
                    </a>
                    <a class="btn btn-sm btn-outline-success" href="/muntasir_billah_story?id=<?= e($row['id']) ?>" target="_blank" title="View Story Live">
                      <i class="bi bi-box-arrow-up-right"></i> View
                    </a>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$contents): ?>
              <tr><td colspan="9" class="text-center text-muted py-4">No registered patients found. Patients registering via website or direct entry will appear here automatically.</td></tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>

  <?php endif; ?>
</section>

