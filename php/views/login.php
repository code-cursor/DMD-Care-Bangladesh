<div class="login-shell">
  <form class="login-panel" method="post" action="admin.php">
    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
    <input type="hidden" name="action" value="login">
    <div class="login-brand">
      <img src="./assets/src/img/DMD_care_bd_Logo.webp" alt="DMD Care Bangladesh" class="login-logo">
      <div><span class="eyebrow">Welcome back</span><h1>DMD Care Admin</h1></div>
    </div>
    <?php if ($startupError): ?><div class="alert alert-danger">Database connection failed: <?= e($startupError) ?></div><?php endif; ?>
    <?php if ($flash): ?><div class="alert alert-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div><?php endif; ?>
    <label class="form-label" for="loginEmail">Email</label>
    <input id="loginEmail" name="email" type="email" class="form-control" autocomplete="username" required>
    <label class="form-label mt-3" for="loginPassword">Password</label>
    <input id="loginPassword" name="password" type="password" class="form-control" autocomplete="current-password" required>
    <button class="btn btn-success w-100 mt-4" type="submit" <?= $startupError ? 'disabled' : '' ?>><i class="bi bi-box-arrow-in-right"></i> Login</button>
  </form>
</div>