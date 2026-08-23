<?php
$contentForm = $editContent ?: ['id'=>'','title'=>'','slug'=>'','summary'=>'','body'=>'','image_url'=>'','position'=>0,'is_published'=>1,'extra'=>'{}'];
$contentExtra = json_decode($contentForm['extra'] ?: '{}', true) ?: [];
$bodyLines = array_values(array_filter(explode("
", (string) $contentForm['body'])));
?>
<section class="work-section active">
  <div class="section-card-title">
    <h3><?= e($contentType === 'gallery' ? 'Gallery' : 'Patient Stories') ?></h3>
    <span><?= e($contentType === 'gallery' ? 'Maintain photo and video gallery records.' : 'Manage the home card, story list, and full patient story page.') ?></span>
  </div>

  <?php if ($contentType === 'gallery'): ?><div class="content-tabs"><a class="content-tab <?= $contentMedia === 'photo' ? 'active' : '' ?>" href="/admin?section=content&amp;type=gallery&amp;media=photo"><i class="bi bi-image"></i> Photo</a><a class="content-tab <?= $contentMedia === 'video' ? 'active' : '' ?>" href="/admin?section=content&amp;type=gallery&amp;media=video"><i class="bi bi-camera-video"></i> Video</a></div><?php endif; ?>
  <?php if ($contentType === 'patient_story'): ?>
    <div id="patientStoryTabs" class="content-tabs">
      <button class="content-tab active" type="button" data-story-section="home"><i class="bi bi-house-heart"></i> Home Page</button>
      <button class="content-tab" type="button" data-story-section="list"><i class="bi bi-card-list"></i> All Stories</button>
      <button class="content-tab" type="button" data-story-section="detail"><i class="bi bi-file-text"></i> Main Story</button>
    </div>
  <?php endif; ?>

  <div class="content-grid">
    <form class="data-form" method="post" enctype="multipart/form-data">
      <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="content_save"><input type="hidden" name="return_section" value="content"><input type="hidden" name="id" value="<?= e($contentForm['id']) ?>"><input type="hidden" name="type" value="<?= e($contentType) ?>"><input type="hidden" name="existing_image_url" value="<?= e($contentForm['image_url']) ?>"><input type="hidden" name="media_type" value="<?= e($contentMedia) ?>">

      <?php if ($contentType === 'gallery'): ?>
        <div class="row g-3">
          <div class="col-12"><label class="form-label">Title</label><input name="title" class="form-control" value="<?= e($contentForm['title']) ?>" required></div>
          <div class="col-12"><label class="form-label">Summary</label><input name="summary" class="form-control" value="<?= e($contentForm['summary']) ?>"></div>
          <?php if ($contentMedia === 'video'): ?><div class="col-12"><label class="form-label">Video URL</label><input name="video_url" class="form-control" value="<?= e($contentExtra['video_url'] ?? $contentForm['body']) ?>" required></div><?php endif; ?>
        </div>
      <?php else: ?>
        <div class="story-editor">
          <div id="storyHomeSection" class="story-editor-group"><h4>Home Page Story</h4><div class="row g-3">
            <div class="col-md-6"><label class="form-label">Patient Name</label><input name="story_name" class="form-control" value="<?= e($contentForm['title']) ?>" required></div>
            <div class="col-md-6"><label class="form-label">Author/Display Name</label><input name="story_author" class="form-control" value="<?= e($contentExtra['author'] ?? $contentForm['title']) ?>"></div>
            <div class="col-12"><label class="form-label">Home Short Text</label><textarea name="story_home_text" class="form-control" rows="4"><?= e($contentExtra['home_text'] ?? '') ?></textarea></div>
            <div class="col-12"><label class="form-label">Home Link Text</label><input name="story_home_link_text" class="form-control" value="<?= e($contentExtra['home_link_text'] ?? 'Click for more stories about me') ?>"></div>
          </div></div>
          <div id="storyListSection" class="story-editor-group d-none"><h4>All Patient Stories Card</h4><div class="row g-3">
            <div class="col-md-4"><label class="form-label">Age/Diagnosis Age</label><input name="story_age" class="form-control" value="<?= e($contentExtra['age'] ?? '') ?>"></div>
            <div class="col-md-4"><label class="form-label">Diagnosis Year</label><input name="story_diagnosis_year" class="form-control" value="<?= e($contentExtra['diagnosis_year'] ?? '') ?>"></div>
            <div class="col-md-4"><label class="form-label">Status</label><input name="story_status" class="form-control" value="<?= e($contentExtra['status'] ?? $contentForm['summary']) ?>"></div>
          </div></div>
          <div id="storyDetailSection" class="story-editor-group d-none"><h4>Main Story Page</h4><div class="row g-3">
            <div class="col-12"><label class="form-label">Story Page Title</label><input name="story_detail_title" class="form-control" value="<?= e($contentExtra['detail_title'] ?? $contentForm['title']) ?>"></div>
            <div class="col-12"><label class="form-label">Story Video URL</label><input name="story_detail_video_url" class="form-control" value="<?= e($contentExtra['detail_video_url'] ?? '') ?>"></div>
            <div class="col-12"><label class="form-label">Full Story Details</label><textarea name="story_detail_body" class="form-control" rows="10"><?= e($contentExtra['detail_body'] ?? $contentForm['body']) ?></textarea></div>
            <div class="col-md-4"><label class="form-label">Guardian Phone</label><input name="story_phone" class="form-control" value="<?= e($contentExtra['phone'] ?? '') ?>"></div>
            <div class="col-md-4"><label class="form-label">WhatsApp Link</label><input name="story_whatsapp" class="form-control" value="<?= e($contentExtra['whatsapp'] ?? '') ?>"></div>
            <div class="col-md-4"><label class="form-label">Facebook Link</label><input name="story_facebook" class="form-control" value="<?= e($contentExtra['facebook'] ?? '') ?>"></div>
          </div></div>
        </div>
      <?php endif; ?>

      <div class="row g-3 mt-2">
        <?php if (!($contentType === 'gallery' && $contentMedia === 'video')): ?><div class="col-md-7"><label class="form-label">Upload Image</label><input name="image" type="file" class="form-control" accept="image/jpeg,image/png,image/webp"><?php if ($contentForm['image_url']): ?><img class="attachment-preview mt-2" src="<?= e($contentForm['image_url']) ?>" alt="Current image"><?php endif; ?></div><?php endif; ?>
        <div class="col-md-3"><label class="form-label">Position</label><input name="position" type="number" class="form-control" value="<?= e($contentForm['position']) ?>"></div>
        <div class="col-md-2 publish-box"><input id="published" name="is_published" type="checkbox" class="form-check-input" <?= $contentForm['is_published'] ? 'checked' : '' ?>><label for="published">Published</label></div>
      </div>
      <button class="btn btn-success mt-3"><i class="bi bi-save"></i> <?= $editContent ? 'Update' : 'Create' ?></button>
      <?php if ($editContent): ?><a class="btn btn-outline-secondary mt-3" href="/admin?section=content&amp;type=<?= e($contentType) ?><?= $contentType === 'gallery' ? '&amp;media=' . e($contentMedia) : '' ?>">Cancel</a><?php endif; ?>
    </form>

    <div class="table-wrap"><table class="table table-hover align-middle"><thead><tr><th>Preview</th><th>Title</th><th>Published</th><th>Actions</th></tr></thead><tbody>
      <?php foreach ($contents as $row): ?><tr><td><?php if ($row['image_url']): ?><img class="content-preview" src="<?= e($row['image_url']) ?>" alt=""><?php else: ?><i class="bi bi-camera-video"></i><?php endif; ?></td><td><?= e($row['title']) ?><br><small class="muted"><?= e($row['slug']) ?></small></td><td><?= $row['is_published'] ? 'Yes' : 'No' ?></td><td><div class="actions"><a class="btn btn-sm btn-outline-secondary" href="/admin?section=content&amp;type=<?= e($contentType) ?><?= $contentType === 'gallery' ? '&amp;media=' . e($contentMedia) : '' ?>&amp;edit_content=<?= e($row['id']) ?>"><i class="bi bi-pencil"></i></a><?php if (in_array($user['role'], ['super_admin','admin'], true)): ?><form method="post" data-confirm="Delete this content item?"><input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="content_delete"><input type="hidden" name="return_section" value="content"><input type="hidden" name="id" value="<?= e($row['id']) ?>"><input type="hidden" name="type" value="<?= e($contentType) ?>"><button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button></form><?php endif; ?></div></td></tr><?php endforeach; ?>
      <?php if (!$contents): ?><tr><td colspan="4" class="text-center muted">No content found.</td></tr><?php endif; ?>
    </tbody></table></div>
  </div>
</section>
