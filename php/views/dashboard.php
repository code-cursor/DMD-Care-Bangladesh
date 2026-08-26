<section class="work-section active">
  <div class="metrics-grid">
    <?php foreach ([['Total Patients','total','clipboard2-pulse'],['Pending','pending','hourglass-split'],["Today's Registration",'today','calendar-check'],['Accepted','accepted','check2-circle'],['Rejected','rejected','x-circle'],['Total Visitors','visitors','people'],["Today's Visitors",'visitors_today','person-check']] as [$label,$key,$icon]): ?>
      <div class="metric"><span><?= e($label) ?></span><strong><?= e($metrics[$key]) ?></strong><i class="bi bi-<?= e($icon) ?>"></i></div>
    <?php endforeach; ?>
  </div>
  <div class="quick-links">
    <a class="quick-link" href="?section=requests"><i class="bi bi-inbox"></i><span>Review Requests</span></a>
    <a class="quick-link" href="?section=direct"><i class="bi bi-pencil-square"></i><span>Add Registration</span></a>
    <a class="quick-link" href="/admin?section=content&amp;type=gallery"><i class="bi bi-layout-text-window"></i><span>Manage Content</span></a>
    <a class="quick-link" href="?section=partners"><i class="bi bi-building"></i><span>Manage Partners</span></a>
    <a class="quick-link" href="?section=sms"><i class="bi bi-chat-dots"></i><span>SMS Activity</span></a>
    <a class="quick-link" href="?action=export"><i class="bi bi-file-earmark-excel"></i><span>Download Excel</span></a>
  </div>
  <div class="table-wrap mt-4">
    <div class="card-title-row"><h3>Last 30 Days</h3><span class="badge-soft">Registrations</span></div>
    <table class="table table-sm align-middle"><thead><tr><th>Date</th><th>Requests</th></tr></thead><tbody>
      <?php foreach ($reportRows as $row): ?><tr><td><?= e($row['date']) ?></td><td><?= e($row['count']) ?></td></tr><?php endforeach; ?>
      <?php if (!$reportRows): ?><tr><td colspan="2" class="muted">No recent requests.</td></tr><?php endif; ?>
    </tbody></table>
  </div>
</section>
