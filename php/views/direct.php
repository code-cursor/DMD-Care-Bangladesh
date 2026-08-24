<?php
$sections = [
  'Patient and Family Information' => [
    ['date_of_birth','Date of Birth','date'], ['age','Age','number'], ['gender','Gender','select',['Male','Female','Other']], ['birth_certificate_no','Birth Certificate No.','text'], ['nid','Patient NID','text'],
    ['father_name',"Father's Name",'text'], ['father_nid',"Father's NID",'text'], ['father_occupation',"Father's Occupation",'text'], ['father_education',"Father's Education",'text'],
    ['mother_name',"Mother's Name",'text'], ['mother_nid',"Mother's NID",'text'], ['mother_occupation',"Mother's Occupation",'text'], ['mother_education',"Mother's Education",'text'],
    ['guardian_relation','Guardian Relation with Patient','text'], ['emergency_contact_no','Emergency Contact No.','tel'], ['present_address','Present Address','textarea'], ['permanent_address','Permanent Address','textarea'], ['nationality','Nationality','text'], ['blood_group','Blood Group','select',['A+','A-','B+','B-','AB+','AB-','O+','O-']],
  ],
  'Diagnosis and Medical Information' => [
    ['diagnosis_type','Diagnosis Type','text'], ['age_at_diagnosis','Age at Diagnosis','text'], ['diagnosis_date','Date of Diagnosis','date'], ['genTest','Genetic Test Done?','select',['Yes','No']], ['mutation','Genetic Mutation Type','select',['Exon Deletion','Duplication','Point Mutation','Other']], ['mutation_details','Other Mutation Details','text'], ['family_history','Family History of DMD','text'], ['Ability','Current Walking Ability','select',['Walks independently','Uses wheelchair','Fully dependent']], ['breath_report','Breathing Difficulties','select',['Yes','No']], ['cardiac_report','Cardiac Problems','select',['Yes','No']], ['other_health_issues','Other Health Issues','text'],
  ],
  'Education and Social Information' => [
    ['school_attendance','School Attendance','select',['Yes','No']], ['class_level','Class / Level','text'], ['inclusive_education_support','Inclusive Education Support','text'], ['hobbies_interests','Hobbies / Interests','text'], ['emotional_challenges','Emotional or Social Challenges','textarea'],
  ],
  'Financial and Family Support' => [
    ['total_family_members','Total Family Members','number'], ['monthly_family_income','Monthly Family Income','text'], ['financial_challenges','Financial Challenges Related to Treatment','textarea'], ['fin_support','Financial Support Type','select',['Treatment','Physiotherapy','Wheelchair','Education Support','Other']], ['fin_support_details','Other Financial Support Details','text'],
  ],
  'Treatment and Care Information' => [
    ['gene_report','Gene Mutation Report Attached','select',['Yes','No']], ['steroid','Steroid Use','select',['Yes','No']], ['steroid_medicine','Steroid Medicine Name','text'], ['steroid_start_age','Age when Steroid Started','text'], ['steroid_duration','Duration of Steroid Use','text'], ['cardiac_eva','Cardiac Evaluation Done','select',['Yes','No']], ['res_report','Respiratory Evaluation Done','select',['Yes','No']], ['therapy','Therapy Received','select',['Occupational therapy','Physiotherapy','Speech therapy','Hydrotherapy','Other']], ['devices','Assistive Devices Used','select',['Ankle Braces','Wheelchair','Standing Frame','Others']], ['current_medicines','Current Medications','textarea'], ['doctor_hospital','Doctor / Hospital','textarea'],
  ],
  'Living Information' => [
    ['liv_area','Living Area','select',['Urban','Semi-urban','Rural']], ['housing','Housing Type','select',['Own','Rented','Shared']], ['access','Internet Access','select',['Yes','No']], ['insurance','Health Insurance','select',['Yes','No']],
  ],
];
$directOld = $_SESSION['direct_entry_old'] ?? [];
unset($_SESSION['direct_entry_old']);
$directPayloadOld = is_array($directOld['payload_fields'] ?? null) ? $directOld['payload_fields'] : [];
$directValue = static fn(string $key, string $default = ''): string => (string) ($directOld[$key] ?? $default);
$directPayloadValue = static fn(string $key): string => (string) ($directPayloadOld[$key] ?? '');
?>
<section class="work-section active">
  <div class="section-card-title"><h3>Direct Entry</h3><span>Full patient registration form matching the public registration workflow.</span></div>
  <form id="directEntryForm" class="data-form" method="post" enctype="multipart/form-data" novalidate>
    <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="registration_save"><input type="hidden" name="return_section" value="direct"><input type="hidden" name="payload" value="{}">
    <div class="story-editor-group"><h4>Primary Contact</h4><div class="row g-3">
      <div class="col-md-4"><label class="form-label">Patient Full Name</label><input name="patient_name" class="form-control" value="<?= e($directValue('patient_name')) ?>" required></div>
      <div class="col-md-4"><label class="form-label">Guardian Contact No.</label><input name="guardian_phone" type="tel" class="form-control" placeholder="+8801XXXXXXXXX" value="<?= e($directValue('guardian_phone')) ?>" required></div>
      <div class="col-md-4"><label class="form-label">Email Address</label><input name="guardian_email" type="email" class="form-control" value="<?= e($directValue('guardian_email')) ?>"></div>
    </div></div>
    <?php foreach ($sections as $heading => $fields): ?>
      <div class="story-editor-group mt-4"><h4><?= e($heading) ?></h4><div class="row g-3">
        <?php foreach ($fields as $field): [$key,$label,$kind] = $field; $options = $field[3] ?? []; ?>
          <div class="<?= $kind === 'textarea' ? 'col-md-6' : 'col-md-4' ?>"><label class="form-label"><?= e($label) ?></label>
          <?php if ($kind === 'select'): ?><select name="payload_fields[<?= e($key) ?>]" class="form-select" required><option value="">Select</option><?php foreach ($options as $option): ?><option value="<?= e($option) ?>" <?= $directPayloadValue($key) === $option ? 'selected' : '' ?>><?= e($option) ?></option><?php endforeach; ?></select>
          <?php elseif ($kind === 'textarea'): ?><textarea name="payload_fields[<?= e($key) ?>]" class="form-control" rows="2" required><?= e($directPayloadValue($key)) ?></textarea>
          <?php else: ?><input name="payload_fields[<?= e($key) ?>]" type="<?= e($kind) ?>" class="form-control" value="<?= e($directPayloadValue($key)) ?>" required><?php endif; ?></div>
        <?php endforeach; ?>
      </div></div>
    <?php endforeach; ?>
    <div class="story-editor-group mt-4"><h4>Attachments, Review, and Consent</h4><div class="row g-3">
      <div class="col-md-6"><label class="form-label">Patient Photo</label><input name="patient_photo" type="file" class="form-control" accept="image/jpeg,image/png,image/webp"></div>
      <div class="col-md-6"><label class="form-label">Genetic Report</label><input name="genetic_report" type="file" class="form-control" accept="application/pdf,image/jpeg,image/png,image/webp"><small class="muted">PDF up to 5MB; image up to 2MB.</small></div>
      <div class="col-md-4"><label class="form-label">Registration Status</label><select name="status" class="form-select"><option <?= $directValue('status', 'pending') === 'pending' ? 'selected' : '' ?>>pending</option><option <?= $directValue('status') === 'accepted' ? 'selected' : '' ?>>accepted</option><option <?= $directValue('status') === 'rejected' ? 'selected' : '' ?>>rejected</option></select></div>
      <div class="col-md-8"><label class="form-label">Admin Notes</label><input name="notes" class="form-control" value="<?= e($directValue('notes')) ?>"></div>
      <div class="col-12"><label class="form-check"><input name="consent" value="1" type="checkbox" class="form-check-input" <?= isset($directOld['consent']) ? 'checked' : '' ?> required> Consent confirmed for storing and using this registration information.</label></div>
    </div></div>
    <button class="btn btn-success mt-4"><i class="bi bi-save"></i> Save Registration</button>
  </form>
</section>