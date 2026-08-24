<section class="work-section active">
  <div class="section-card-title"><h3>Admin Users</h3><span>Add, edit, activate, deactivate, and remove admin accounts.</span></div>
  <?php if (in_array($user['role'], ['super_admin','admin'], true)): ?>
  <?php $userForm = $editUser ?: ['id'=>'','name'=>'','email'=>'','role'=>'editor','is_active'=>1]; ?>
  <form id="userForm" class="data-form mb-4" method="post">
    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="user_save"><input type="hidden" name="return_section" value="users"><input type="hidden" name="id" value="<?= e($userForm['id']) ?>">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h4 class="mb-0"><?= $editUser ? 'Edit User: ' . e($editUser['name']) : 'Add New User' ?></h4>
      <?php if ($editUser): ?><a class="btn btn-sm btn-outline-secondary" href="?section=users">Cancel Edit</a><?php endif; ?>
    </div>
    <div class="row g-3">
      <div class="col-md-3"><label class="form-label">Name</label><input name="name" class="form-control" value="<?= e($userForm['name']) ?>" required></div>
      <div class="col-md-3"><label class="form-label">Email</label><input name="email" type="email" class="form-control" value="<?= e($userForm['email']) ?>" required></div>
      <div class="col-md-3"><label class="form-label">Password<?= $editUser ? ' <span class="muted small">(leave blank to keep)</span>' : '' ?></label><input name="password" type="password" minlength="6" class="form-control" placeholder="<?= $editUser ? 'Enter new password to change' : 'Min 6 characters' ?>" <?= $editUser ? '' : 'required' ?> autocomplete="new-password"></div>
      <div class="col-md-3"><label class="form-label">Role</label><select name="role" class="form-select"><?php foreach (['admin','editor','viewer','super_admin'] as $role): ?><option value="<?= e($role) ?>" <?= $userForm['role'] === $role ? 'selected' : '' ?>><?= e($role) ?></option><?php endforeach; ?></select></div>
      <?php if ($editUser): ?><div class="col-12"><label class="form-check"><input name="is_active" value="1" type="checkbox" class="form-check-input" <?= $userForm['is_active'] ? 'checked' : '' ?>> Account is active</label></div><?php endif; ?>
    </div>
    <div class="d-flex flex-wrap gap-2 mt-3">
      <button class="btn btn-success" type="submit"><i class="bi bi-<?= $editUser ? 'check-lg' : 'person-plus' ?>"></i> <?= $editUser ? 'Update User & Password' : 'Add User' ?></button>
      <?php if ($editUser): ?><a class="btn btn-outline-secondary" href="?section=users">Cancel</a><?php endif; ?>
    </div>
  </form>
  <?php endif; ?>
  <div class="table-wrap"><table class="table table-hover align-middle"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Actions</th></tr></thead><tbody>
    <?php foreach ($users as $row): ?>
      <tr class="<?= $editUser && (int)$editUser['id'] === (int)$row['id'] ? 'table-active' : '' ?>">
        <td><strong><?= e($row['name']) ?></strong><?php if ((int)$row['id'] === (int)$user['id']): ?> <span class="badge bg-success-subtle text-success border border-success-subtle ms-1">You</span><?php endif; ?></td>
        <td><?= e($row['email']) ?></td>
        <td><?= e($row['role']) ?></td>
        <td><?= $row['is_active'] ? 'Yes' : 'No' ?></td>
        <td><div class="actions">
          <?php if (in_array($user['role'], ['super_admin','admin'], true)): ?><a class="btn btn-sm btn-outline-secondary" href="?section=users&amp;edit_user=<?= e($row['id']) ?>#userForm"><i class="bi bi-pencil"></i> Edit</a><?php endif; ?>
          <?php if (in_array($user['role'], ['super_admin','admin'], true) && (int)$row['id'] !== (int)$user['id']): ?><form method="post"><input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="user_toggle"><input type="hidden" name="return_section" value="users"><input type="hidden" name="id" value="<?= e($row['id']) ?>"><button class="btn btn-sm btn-outline-secondary"><?= $row['is_active'] ? 'Deactivate' : 'Activate' ?></button></form><?php endif; ?>
          <?php if ($user['role'] === 'super_admin' && (int)$row['id'] !== (int)$user['id']): ?><form method="post" data-confirm="Delete this user permanently?"><input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="user_delete"><input type="hidden" name="return_section" value="users"><input type="hidden" name="id" value="<?= e($row['id']) ?>"><button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i> Delete</button></form><?php endif; ?>
        </div></td>
      </tr>
    <?php endforeach; ?>
  </tbody></table></div>
</section>