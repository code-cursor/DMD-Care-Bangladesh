<section class="work-section active">
  <div class="section-card-title"><h3>SMS Management</h3><span>Send guardian or bulk messages and review delivery logs.</span></div>
  <form class="data-form mb-4" method="post">
    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="sms_send"><input type="hidden" name="return_section" value="sms">
    <div class="row g-3">
      <div class="col-md-6"><label class="form-label">Accepted Patient</label><select name="registration_id" class="form-select"><option value="0">Use custom numbers</option><?php foreach ($acceptedForSms as $row): ?><option value="<?= e($row['id']) ?>"><?= e($row['patient_name']) ?> — <?= e($row['guardian_phone']) ?></option><?php endforeach; ?></select></div>
      <div class="col-md-6"><label class="form-label">Custom Numbers</label><input name="phones" class="form-control" placeholder="+8801..., +8801..."></div>
      <div class="col-12"><label class="form-label">Message</label><textarea id="smsMessage" name="message" maxlength="320" rows="4" class="form-control" required></textarea><small class="muted"><span id="smsCount">0</span>/320</small></div>
    </div>
    <button class="btn btn-success mt-3"><i class="bi bi-send"></i> Send SMS</button>
  </form>
  <?php if (in_array($user['role'], ['super_admin','admin'], true)): ?>
  <div class="section-card-title"><h3>IP Update Facility</h3><span>Update the configured SMS gateway IP address without browser API calls.</span></div>
  <form class="data-form mb-4" method="post">
    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="sms_ip_update"><input type="hidden" name="return_section" value="sms">
    <div class="row g-3 align-items-end"><div class="col-md-8"><label class="form-label">Gateway IP Address</label><input name="ip_address" class="form-control" placeholder="192.0.2.10" required></div><div class="col-md-4"><button class="btn btn-outline-success w-100"><i class="bi bi-router"></i> Update IP</button></div></div>
  </form>
  <?php endif; ?>
  <div class="table-wrap"><table class="table table-hover align-middle"><thead><tr><th>ID</th><th>Patient</th><th>To</th><th>Status</th><th>Message</th><th>Created</th></tr></thead><tbody>
    <?php foreach ($smsLogs as $row): ?><tr><td><?= e($row['id']) ?></td><td><?= e($row['patient_name']) ?></td><td><?= e($row['recipient_phone']) ?></td><td><?= e($row['status']) ?></td><td><?= e($row['message']) ?></td><td><?= e($row['created_at']) ?></td></tr><?php endforeach; ?>
    <?php if (!$smsLogs): ?><tr><td colspan="6" class="text-center muted">No SMS logs.</td></tr><?php endif; ?>
  </tbody></table></div>
</section>