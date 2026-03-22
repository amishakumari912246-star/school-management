'use strict';

// ═══════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════
const Auth = {
  getToken: () => localStorage.getItem('school_token'),
  getUser() {
    try { return JSON.parse(localStorage.getItem('school_user') || 'null'); }
    catch { return null; }
  },
  set(token, user) {
    localStorage.setItem('school_token', token);
    localStorage.setItem('school_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('school_token');
    localStorage.removeItem('school_user');
  }
};

// ═══════════════════════════════════════════════════════════════════
//  API WRAPPER
// ═══════════════════════════════════════════════════════════════════
async function apiFetch(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  try {
    const res = await fetch('/api' + path, opts);
    if (res.status === 401) { Auth.clear(); showLogin(); return null; }
    return res;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  GENERIC CRUD PAGE FACTORY
// ═══════════════════════════════════════════════════════════════════
function createCrudPage({ title, apiPath, fields, columns }) {
  return {
    async render(container) {
      let editingId = null;
      let items = [];

      const formHtml = fields.map(f => {
        const cls = f.spanFull ? ' class="span-full"' : '';
        if (f.type === 'select') {
          const opts = f.options.map(o => `<option value="${o}">${o}</option>`).join('');
          return `<select name="${f.name}"${cls}><option value="">-- ${f.label} --</option>${opts}</select>`;
        }
        return `<input type="${f.type || 'text'}" name="${f.name}" placeholder="${f.label}"${cls} />`;
      }).join('');

      container.innerHTML = `
        <div class="page-card">
          <h2>${title}</h2>
          <form id="pf" class="grid two">${formHtml}</form>
          <div class="actions">
            <button id="pb-save">Save</button>
            <button id="pb-reset" class="btn-secondary">Reset</button>
          </div>
          <p id="pb-err" class="error" style="display:none"></p>
          <div id="pb-table"></div>
        </div>`;

      const form    = container.querySelector('#pf');
      const errEl   = container.querySelector('#pb-err');
      const tWrap   = container.querySelector('#pb-table');
      const saveBtn = container.querySelector('#pb-save');

      function getFormData() {
        const d = {};
        fields.forEach(f => {
          const el = form.querySelector(`[name="${f.name}"]`);
          if (el) d[f.name] = el.value.trim();
        });
        return d;
      }

      function renderTable() {
        if (!items.length) {
          tWrap.innerHTML = '<p class="no-data">No records found.</p>';
          return;
        }
        const thead = columns.map(c => `<th>${c.label}</th>`).join('') + '<th>Actions</th>';
        const tbody = items.map(item => {
          const cells = columns.map(c => `<td>${item[c.key] ?? ''}</td>`).join('');
          return `<tr>${cells}<td style="white-space:nowrap">
            <button class="btn-sm edit-btn" data-id="${item._id}">Edit</button>
            <button class="btn-sm btn-secondary del-btn" data-id="${item._id}">Delete</button>
          </td></tr>`;
        }).join('');
        tWrap.innerHTML = `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;

        tWrap.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => {
          const item = items.find(i => i._id === btn.dataset.id);
          if (!item) return;
          editingId = item._id;
          fields.forEach(f => {
            const el = form.querySelector(`[name="${f.name}"]`);
            if (el) el.value = item[f.name] ?? '';
          });
          saveBtn.textContent = 'Update';
          errEl.style.display = 'none';
          container.querySelector('#pf').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));

        tWrap.querySelectorAll('.del-btn').forEach(btn => btn.addEventListener('click', async () => {
          if (!confirm('Delete this record?')) return;
          const res = await apiFetch('DELETE', `${apiPath}/${btn.dataset.id}`);
          if (res?.ok) load();
        }));
      }

      async function load() {
        const res = await apiFetch('GET', apiPath);
        if (res?.ok) { items = await res.json(); renderTable(); }
      }

      saveBtn.addEventListener('click', async () => {
        errEl.style.display = 'none';
        const data = getFormData();
        const missing = fields.filter(f => f.required !== false && !data[f.name]);
        if (missing.length) {
          errEl.textContent = 'Required: ' + missing.map(f => f.label).join(', ');
          errEl.style.display = 'block';
          return;
        }
        const res = editingId
          ? await apiFetch('PUT', `${apiPath}/${editingId}`, data)
          : await apiFetch('POST', apiPath, data);
        if (res?.ok) {
          editingId = null;
          form.reset();
          saveBtn.textContent = 'Save';
          load();
        } else {
          const err = await res?.json().catch(() => ({}));
          errEl.textContent = err?.message || 'Error saving record';
          errEl.style.display = 'block';
        }
      });

      container.querySelector('#pb-reset').addEventListener('click', () => {
        editingId = null;
        form.reset();
        saveBtn.textContent = 'Save';
        errEl.style.display = 'none';
      });

      load();
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════
const Pages = {};

// ── Dashboard ────────────────────────────────────────────────────
Pages.dashboard = {
  async render(container) {
    container.innerHTML = '<div class="page-card"><p style="color:#888">Loading...</p></div>';
    const res = await apiFetch('GET', '/dashboard/summary');
    if (!res?.ok) return;
    const d = await res.json();
    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card blue">
          <div class="stat-num">${d.totalStudents}</div>
          <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-card green">
          <div class="stat-num">${d.totalTeachers}</div>
          <div class="stat-label">Total Teachers</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-num">${d.totalClasses}</div>
          <div class="stat-label">Total Classes</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-num">${d.attendancePercent}%</div>
          <div class="stat-label">Attendance</div>
        </div>
        <div class="stat-card teal">
          <div class="stat-num">&#8377;${Number(d.pendingFees).toLocaleString('en-IN')}</div>
          <div class="stat-label">Pending Fees</div>
        </div>
      </div>
      <div class="page-card">
        <h2>Welcome to School Management System</h2>
        <p style="color:#666;line-height:1.8;font-size:0.9rem">
          Use the sidebar to navigate between modules.
          You can manage Students, Teachers, Attendance, Fees, Exams, Results, Admit Cards and more.
          All data is saved locally in JSON files — no database required.
        </p>
      </div>`;
  }
};

// ── Students ─────────────────────────────────────────────────────
Pages.students = {
  async render(container) {
    let editingId = null;
    let items = [];
    const fields = [
      { name: 'firstName',     label: 'First Name' },
      { name: 'lastName',      label: 'Last Name' },
      { name: 'gender',        label: 'Gender',    type: 'select', options: ['Male', 'Female', 'Other'] },
      { name: 'dob',           label: 'Date of Birth', type: 'date' },
      { name: 'className',     label: 'Class' },
      { name: 'section',       label: 'Section' },
      { name: 'fatherName',    label: "Father's Name" },
      { name: 'motherName',    label: "Mother's Name" },
      { name: 'mobile',        label: 'Mobile Number' },
      { name: 'email',         label: 'Email', type: 'email' },
      { name: 'city',          label: 'City' },
      { name: 'state',         label: 'State' },
      { name: 'admissionDate', label: 'Admission Date', type: 'date' },
    ];

    const formHtml = fields.map(f => {
      if (f.type === 'select') {
        const opts = f.options.map(o => `<option value="${o}">${o}</option>`).join('');
        return `<select name="${f.name}"><option value="">-- ${f.label} --</option>${opts}</select>`;
      }
      return `<input type="${f.type || 'text'}" name="${f.name}" placeholder="${f.label}" />`;
    }).join('');

    container.innerHTML = `
      <div class="page-card">
        <h2>🎓 Student Registration</h2>
        <form id="pf" class="grid two">${formHtml}</form>
        <div class="actions">
          <button id="pb-save">Save</button>
          <button id="pb-reset" class="btn-secondary">Reset</button>
        </div>
        <p id="pb-err" class="error" style="display:none"></p>
        <div id="pb-table"></div>
      </div>
      <!-- QR Modal -->
      <div id="qr-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;align-items:center;justify-content:center;">
        <div style="background:#fff;border-radius:12px;padding:28px;text-align:center;min-width:280px;">
          <h3 id="qr-modal-name" style="margin-bottom:4px;"></h3>
          <p id="qr-modal-info" style="color:#666;font-size:13px;margin-bottom:14px;"></p>
          <div id="qr-modal-canvas"></div>
          <p style="font-size:11px;color:#999;margin-top:10px;">Teacher is QR ko scan karein attendance ke liye</p>
          <button id="qr-modal-close" style="margin-top:14px;padding:8px 22px;background:#1976d2;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">Band Karo</button>
        </div>
      </div>`;

    const form = container.querySelector('#pf');
    const errEl = container.querySelector('#pb-err');
    const tWrap = container.querySelector('#pb-table');
    const saveBtn = container.querySelector('#pb-save');

    // QR Modal
    const modal = container.querySelector('#qr-modal');
    container.querySelector('#qr-modal-close').addEventListener('click', () => {
      modal.style.display = 'none';
      container.querySelector('#qr-modal-canvas').innerHTML = '';
    });

    function showQR(student) {
      container.querySelector('#qr-modal-name').textContent = student.firstName + ' ' + student.lastName;
      container.querySelector('#qr-modal-info').textContent = `Class: ${student.className} ${student.section || ''} | Mobile: ${student.mobile || 'N/A'}`;
      container.querySelector('#qr-modal-canvas').innerHTML = '';
      new QRCode(container.querySelector('#qr-modal-canvas'), {
        text: student._id,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.H
      });
      modal.style.display = 'flex';
    }

    function renderTable() {
      if (!items.length) { tWrap.innerHTML = '<p class="no-data">Koi student nahi hai.</p>'; return; }
      const rows = items.map(item => `<tr>
        <td>${item.firstName || ''}</td>
        <td>${item.lastName || ''}</td>
        <td>${item.className || ''}</td>
        <td>${item.section || ''}</td>
        <td>${item.mobile || ''}</td>
        <td>${item.email || ''}</td>
        <td style="white-space:nowrap">
          <button class="btn-sm edit-btn" data-id="${item._id}">Edit</button>
          <button class="btn-sm btn-secondary del-btn" data-id="${item._id}">Delete</button>
          <button class="btn-sm btn-qr" data-id="${item._id}" style="background:#7b1fa2;color:#fff;">📷 QR</button>
        </td>
      </tr>`).join('');
      tWrap.innerHTML = `<table><thead><tr><th>First Name</th><th>Last Name</th><th>Class</th><th>Section</th><th>Mobile</th><th>Email</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>`;
      tWrap.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => {
        const item = items.find(i => i._id === btn.dataset.id);
        if (!item) return;
        editingId = item._id;
        fields.forEach(f => { const el = form.querySelector(`[name="${f.name}"]`); if (el) el.value = item[f.name] ?? ''; });
        saveBtn.textContent = 'Update';
        errEl.style.display = 'none';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
      tWrap.querySelectorAll('.del-btn').forEach(btn => btn.addEventListener('click', async () => {
        if (!confirm('Delete this student?')) return;
        const res = await apiFetch('DELETE', '/students/' + btn.dataset.id);
        if (res?.ok) load();
      }));
      tWrap.querySelectorAll('.btn-qr').forEach(btn => btn.addEventListener('click', () => {
        const student = items.find(i => i._id === btn.dataset.id);
        if (student) showQR(student);
      }));
    }

    async function load() {
      const res = await apiFetch('GET', '/students');
      if (res?.ok) { items = await res.json(); renderTable(); }
    }

    saveBtn.addEventListener('click', async () => {
      errEl.style.display = 'none';
      const d = {};
      fields.forEach(f => { const el = form.querySelector(`[name="${f.name}"]`); if (el) d[f.name] = el.value.trim(); });
      const res = editingId
        ? await apiFetch('PUT', '/students/' + editingId, d)
        : await apiFetch('POST', '/students', d);
      if (res?.ok) { editingId = null; form.reset(); saveBtn.textContent = 'Save'; load(); }
      else { const err = await res?.json().catch(() => ({})); errEl.textContent = err?.message || 'Error saving'; errEl.style.display = 'block'; }
    });
    container.querySelector('#pb-reset').addEventListener('click', () => {
      editingId = null; form.reset(); saveBtn.textContent = 'Save'; errEl.style.display = 'none';
    });
    load();
  }
};

// ── Teachers ─────────────────────────────────────────────────────
Pages.teachers = createCrudPage({
  title: '👨‍🏫 Teacher Registration',
  apiPath: '/teachers',
  fields: [
    { name: 'firstName',   label: 'First Name' },
    { name: 'lastName',    label: 'Last Name' },
    { name: 'gender',      label: 'Gender',    type: 'select', options: ['Male', 'Female', 'Other'] },
    { name: 'subject',     label: 'Subject' },
    { name: 'qualification', label: 'Qualification' },
    { name: 'experience',  label: 'Experience (years)' },
    { name: 'mobile',      label: 'Mobile Number' },
    { name: 'email',       label: 'Email', type: 'email' },
    { name: 'joiningDate', label: 'Joining Date', type: 'date' },
    { name: 'salary',      label: 'Salary (₹)' },
  ],
  columns: [
    { key: 'firstName',     label: 'First Name' },
    { key: 'lastName',      label: 'Last Name' },
    { key: 'subject',       label: 'Subject' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'mobile',        label: 'Mobile' },
    { key: 'salary',        label: 'Salary' },
  ]
});

// ── Attendance ───────────────────────────────────────────────────
Pages.attendance = {
  async render(container) {
    const today = new Date().toISOString().split('T')[0];
    container.innerHTML = `
      <div class="page-card">
        <h2>✅ Attendance Management</h2>

        <!-- QR Scanner Section -->
        <div class="qr-scanner-box">
          <h3>📷 QR Code Scanner se Attendance</h3>
          <p style="color:#666;margin-bottom:10px;">Niche "Scanner Start Karo" button dabao, phir student ka QR code camera ke saamne rakho — attendance automatic ban jayegi!</p>
          <div style="background:#fff3cd;border:1px solid #ffe08a;color:#7a5d00;padding:10px 12px;border-radius:8px;margin-bottom:12px;">
            <div style="font-weight:600;margin-bottom:6px;">📱 Teacher Mobile Link</div>
            <div id="mobile-url" style="font-family:Consolas,monospace;word-break:break-all;">Loading...</div>
            <button id="copy-mobile-url" class="btn-scan" type="button" style="margin-top:8px;padding:8px 12px;font-size:13px;">Copy Link</button>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">
            <select id="student-qr-select" style="min-width:230px;">
              <option value="">-- Student Select Karo --</option>
            </select>
            <button id="btn-generate-qr" class="btn-scan" type="button">🪪 QR Generate Karo</button>
          </div>
          <div id="student-qr-card" style="display:none;background:#fff;border:1px solid #d7d7d7;border-radius:10px;padding:12px;max-width:420px;margin-bottom:12px;">
            <p id="student-qr-name" style="font-weight:700;margin-bottom:8px;"></p>
            <div id="student-qr-canvas" style="margin-bottom:8px;"></div>
            <p style="font-size:12px;color:#666;">Is QR ko teacher mobile se scan kar sakta hai.</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <button id="btn-start-scan" class="btn-scan">📷 Scanner Start Karo</button>
            <button id="btn-stop-scan" class="btn-scan btn-scan-stop" style="display:none;">⏹ Scanner Band Karo</button>
          </div>
          <div id="qr-reader" style="width:100%;max-width:400px;"></div>
          <div id="scan-result-box" style="display:none;margin-top:12px;padding:12px;background:#e8f5e9;border-radius:8px;border:1px solid #4caf50;">
            <strong>✅ Scan Successful!</strong>
            <p id="scan-student-info" style="margin:6px 0;"></p>
            <button id="btn-mark-present" class="btn-scan" style="background:#4caf50;">✅ Present Mark Karo</button>
            <button id="btn-mark-absent" class="btn-scan" style="background:#f44336;margin-left:8px;">❌ Absent Mark Karo</button>
          </div>
          <div id="scan-msg" style="margin-top:8px;font-weight:bold;"></div>
        </div>

        <hr style="margin:20px 0;border:none;border-top:2px solid #eee;" />

        <!-- Manual Attendance Form -->
        <h3>✍️ Manual Attendance</h3>
        <form id="att-form" class="grid two">
          <input type="text" name="studentName" placeholder="Student Name" />
          <input type="text" name="rollNumber" placeholder="Roll Number" />
          <input type="text" name="className" placeholder="Class" />
          <input type="text" name="section" placeholder="Section" />
          <input type="date" name="date" value="${today}" />
          <select name="status">
            <option value="">-- Status --</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Holiday">Holiday</option>
          </select>
        </form>
        <div class="actions">
          <button id="att-save">Save</button>
          <button id="att-reset" class="btn-secondary">Reset</button>
        </div>
        <p id="att-err" class="error" style="display:none"></p>
        <div id="att-table"></div>
      </div>`;

    let scannedStudent = null;
    let students = [];
    let html5QrCode = null;

    async function loadMobileUrl() {
      const urlEl = container.querySelector('#mobile-url');
      try {
        const res = await fetch('/api/network-info');
        if (res.ok) {
          const data = await res.json();
          urlEl.textContent = data.mobileUrl;
          return;
        }
      } catch {}
      urlEl.textContent = 'http://<your-laptop-ip>:5000/';
    }
    await loadMobileUrl();

    container.querySelector('#copy-mobile-url').addEventListener('click', async () => {
      const txt = container.querySelector('#mobile-url').textContent.trim();
      try {
        await navigator.clipboard.writeText(txt);
        const msgEl = container.querySelector('#scan-msg');
        msgEl.textContent = '✅ Mobile link copy ho gaya.';
        msgEl.style.color = 'green';
      } catch {
        const msgEl = container.querySelector('#scan-msg');
        msgEl.textContent = 'Copy nahi hua. Link manually copy karo.';
        msgEl.style.color = 'red';
      }
    });

    async function loadStudentsForQr() {
      const res = await apiFetch('GET', '/students');
      if (!res?.ok) return;
      students = await res.json();
      const selectEl = container.querySelector('#student-qr-select');
      const options = students.map(s => {
        const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
        const cls = `${s.className || ''}${s.section ? ' - ' + s.section : ''}`;
        return `<option value="${s._id}">${name} (${cls})</option>`;
      }).join('');
      selectEl.innerHTML = '<option value="">-- Student Select Karo --</option>' + options;
    }
    await loadStudentsForQr();

    // Load attendance table
    async function loadTable() {
      const res = await apiFetch('GET', '/attendance');
      if (!res) return;
      const items = await res.json();
      const tWrap = container.querySelector('#att-table');
      if (!items.length) { tWrap.innerHTML = '<p style="color:#888;margin-top:12px;">Koi attendance record nahi hai.</p>'; return; }
      const rows = items.map(i => `<tr>
        <td>${i.studentName || ''}</td>
        <td>${i.rollNumber || ''}</td>
        <td>${i.className || ''}</td>
        <td>${i.date || ''}</td>
        <td><span class="badge badge-${(i.status||'').toLowerCase()}">${i.status || ''}</span></td>
        <td><button class="btn-del" data-id="${i._id}">🗑</button></td>
      </tr>`).join('');
      tWrap.innerHTML = `<table class="data-table"><thead><tr><th>Student</th><th>Roll No</th><th>Class</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>`;
      tWrap.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', async () => {
        await apiFetch('DELETE', '/attendance/' + b.dataset.id);
        loadTable();
      }));
    }
    loadTable();

    // Manual save
    container.querySelector('#att-save').addEventListener('click', async () => {
      const form = container.querySelector('#att-form');
      const d = {};
      ['studentName','rollNumber','className','section','date','status'].forEach(n => {
        const el = form.querySelector(`[name="${n}"]`); if (el) d[n] = el.value.trim();
      });
      const errEl = container.querySelector('#att-err');
      if (!d.studentName || !d.date || !d.status) { errEl.textContent = 'Student name, date aur status zaroori hai!'; errEl.style.display=''; return; }
      errEl.style.display = 'none';
      await apiFetch('POST', '/attendance', d);
      form.reset(); form.querySelector('[name="date"]').value = today;
      loadTable();
    });
    container.querySelector('#att-reset').addEventListener('click', () => {
      const form = container.querySelector('#att-form');
      form.reset(); form.querySelector('[name="date"]').value = today;
    });

    container.querySelector('#btn-generate-qr').addEventListener('click', () => {
      const studentId = container.querySelector('#student-qr-select').value;
      const msgEl = container.querySelector('#scan-msg');
      if (!studentId) {
        msgEl.textContent = 'Pehle student select karo.';
        msgEl.style.color = 'red';
        return;
      }
      const s = students.find(x => x._id === studentId);
      if (!s) {
        msgEl.textContent = 'Student data nahi mila.';
        msgEl.style.color = 'red';
        return;
      }
      const qrCanvasWrap = container.querySelector('#student-qr-canvas');
      const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
      qrCanvasWrap.innerHTML = '';
      new QRCode(qrCanvasWrap, {
        text: s._id,
        width: 190,
        height: 190,
        correctLevel: QRCode.CorrectLevel.H
      });
      container.querySelector('#student-qr-name').textContent = `${name} | Class: ${s.className || ''} ${s.section || ''}`;
      container.querySelector('#student-qr-card').style.display = '';
      msgEl.textContent = 'QR ready hai. Ab teacher mobile se scan kare.';
      msgEl.style.color = 'green';
    });

    // QR Scanner
    container.querySelector('#btn-start-scan').addEventListener('click', () => {
      container.querySelector('#btn-start-scan').style.display = 'none';
      container.querySelector('#btn-stop-scan').style.display = '';
      container.querySelector('#scan-result-box').style.display = 'none';
      container.querySelector('#scan-msg').textContent = '';

      html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Stop scanning after first scan
          html5QrCode.stop().catch(() => {});
          container.querySelector('#btn-start-scan').style.display = '';
          container.querySelector('#btn-stop-scan').style.display = 'none';

          // Fetch student by ID
          const res = await apiFetch('GET', '/students/' + decodedText.trim());
          if (!res || !res.ok) {
            container.querySelector('#scan-msg').textContent = '❌ Student nahi mila! QR code galat ho sakta hai.';
            container.querySelector('#scan-msg').style.color = 'red';
            return;
          }
          scannedStudent = await res.json();
          container.querySelector('#scan-student-info').innerHTML = `
            <strong>${scannedStudent.firstName} ${scannedStudent.lastName}</strong> &nbsp;|&nbsp;
            Class: ${scannedStudent.className} ${scannedStudent.section || ''} &nbsp;|&nbsp;
            Mobile: ${scannedStudent.mobile || 'N/A'}`;
          container.querySelector('#scan-result-box').style.display = '';
          container.querySelector('#scan-msg').textContent = '';
        },
        () => {}
      ).catch(err => {
        container.querySelector('#scan-msg').textContent = '❌ Camera open nahi ho saka: ' + err;
        container.querySelector('#scan-msg').style.color = 'red';
        container.querySelector('#btn-start-scan').style.display = '';
        container.querySelector('#btn-stop-scan').style.display = 'none';
      });
    });

    container.querySelector('#btn-stop-scan').addEventListener('click', () => {
      if (html5QrCode) html5QrCode.stop().catch(() => {});
      container.querySelector('#btn-start-scan').style.display = '';
      container.querySelector('#btn-stop-scan').style.display = 'none';
    });

    async function markAttendance(status) {
      if (!scannedStudent) return;
      const d = {
        studentName: scannedStudent.firstName + ' ' + scannedStudent.lastName,
        rollNumber: scannedStudent.rollNumber || scannedStudent._id.slice(0,8),
        className: scannedStudent.className || '',
        section: scannedStudent.section || '',
        date: today,
        status: status
      };
      await apiFetch('POST', '/attendance', d);
      container.querySelector('#scan-result-box').style.display = 'none';
      container.querySelector('#scan-msg').textContent = `✅ ${d.studentName} ki attendance "${status}" mark ho gayi!`;
      container.querySelector('#scan-msg').style.color = 'green';
      scannedStudent = null;
      loadTable();
    }

    container.querySelector('#btn-mark-present').addEventListener('click', () => markAttendance('Present'));
    container.querySelector('#btn-mark-absent').addEventListener('click', () => markAttendance('Absent'));
  }
};

// ── Fees ─────────────────────────────────────────────────────────
Pages.fees = createCrudPage({
  title: '💰 Fee Management',
  apiPath: '/fees',
  fields: [
    { name: 'studentName',  label: 'Student Name' },
    { name: 'rollNumber',   label: 'Roll Number' },
    { name: 'className',    label: 'Class' },
    { name: 'feeType',      label: 'Fee Type', type: 'select', options: ['Tuition Fee', 'Exam Fee', 'Sports Fee', 'Library Fee', 'Transport Fee', 'Other'] },
    { name: 'totalAmount',  label: 'Total Amount (₹)', type: 'number' },
    { name: 'paidAmount',   label: 'Paid Amount (₹)',  type: 'number' },
    { name: 'pendingAmount',label: 'Pending Amount (₹)', type: 'number' },
    { name: 'paymentDate',  label: 'Payment Date', type: 'date' },
    { name: 'paymentMode',  label: 'Payment Mode', type: 'select', options: ['Cash', 'Online', 'Cheque', 'DD'] },
    { name: 'status',       label: 'Status', type: 'select', options: ['Paid', 'Partial', 'Pending'] },
  ],
  columns: [
    { key: 'studentName',   label: 'Student' },
    { key: 'className',     label: 'Class' },
    { key: 'feeType',       label: 'Fee Type' },
    { key: 'totalAmount',   label: 'Total (₹)' },
    { key: 'paidAmount',    label: 'Paid (₹)' },
    { key: 'pendingAmount', label: 'Pending (₹)' },
    { key: 'status',        label: 'Status' },
  ]
});

// ── Exams ────────────────────────────────────────────────────────
Pages.exams = createCrudPage({
  title: '📝 Exam Management',
  apiPath: '/exams',
  fields: [
    { name: 'examName',   label: 'Exam Name' },
    { name: 'subject',    label: 'Subject' },
    { name: 'className',  label: 'Class' },
    { name: 'section',    label: 'Section' },
    { name: 'examDate',   label: 'Exam Date', type: 'date' },
    { name: 'startTime',  label: 'Start Time', type: 'time' },
    { name: 'duration',   label: 'Duration (minutes)' },
    { name: 'totalMarks', label: 'Total Marks', type: 'number' },
    { name: 'venue',      label: 'Venue / Room' },
  ],
  columns: [
    { key: 'examName',   label: 'Exam' },
    { key: 'subject',    label: 'Subject' },
    { key: 'className',  label: 'Class' },
    { key: 'examDate',   label: 'Date' },
    { key: 'totalMarks', label: 'Max Marks' },
    { key: 'venue',      label: 'Venue' },
  ]
});

// ── Results ──────────────────────────────────────────────────────
Pages.results = createCrudPage({
  title: '📈 Exam Results',
  apiPath: '/results',
  fields: [
    { name: 'studentName',  label: 'Student Name' },
    { name: 'rollNumber',   label: 'Roll Number' },
    { name: 'className',    label: 'Class' },
    { name: 'subject',      label: 'Subject' },
    { name: 'examName',     label: 'Exam Name' },
    { name: 'totalMarks',   label: 'Total Marks',   type: 'number' },
    { name: 'marksObtained',label: 'Marks Obtained', type: 'number' },
  ],
  columns: [
    { key: 'studentName',   label: 'Student' },
    { key: 'rollNumber',    label: 'Roll No' },
    { key: 'subject',       label: 'Subject' },
    { key: 'marksObtained', label: 'Obtained' },
    { key: 'totalMarks',    label: 'Total' },
    { key: 'percentage',    label: '%' },
    { key: 'resultStatus',  label: 'Result' },
  ]
});

// ── Admit Card (special page with print) ─────────────────────────
Pages.admitcard = {
  async render(container) {
    let editingId = null;
    let items = [];

    container.innerHTML = `
      <div class="page-card">
        <h2>🪪 Admit Card Management</h2>
        <form id="acf" class="grid two">
          <input name="studentName" placeholder="Student Name" />
          <input name="rollNumber"  placeholder="Roll Number" />
          <input name="className"   placeholder="Class" />
          <input name="section"     placeholder="Section" />
          <input name="fatherName"  placeholder="Father's Name" />
          <input name="examName"    placeholder="Exam Name (e.g. Annual Exam 2026)" />
          <input name="examCenter"  placeholder="Exam Center / Venue" />
          <input type="date" name="examDate" />
          <input name="subjects"    placeholder="Subjects (e.g. Math, Science, English)" class="span-full" />
          <input name="photo"       placeholder="Student Photo URL (optional)" class="span-full" />
        </form>
        <div class="actions">
          <button id="ac-save">Generate Admit Card</button>
          <button id="ac-reset" class="btn-secondary">Reset</button>
        </div>
        <p id="ac-err" class="error" style="display:none"></p>
        <div id="ac-table"></div>
      </div>`;

    const form    = container.querySelector('#acf');
    const errEl   = container.querySelector('#ac-err');
    const tWrap   = container.querySelector('#ac-table');
    const saveBtn = container.querySelector('#ac-save');

    const FIELDS = ['studentName','rollNumber','className','section','fatherName','examName','examCenter','examDate','subjects','photo'];

    function getFormData() {
      const d = {};
      FIELDS.forEach(n => {
        const el = form.querySelector(`[name="${n}"]`);
        if (el) d[n] = el.value.trim();
      });
      return d;
    }

    function renderTable() {
      if (!items.length) {
        tWrap.innerHTML = '<p class="no-data">No admit cards generated yet.</p>';
        return;
      }
      const rows = items.map(item => `
        <tr>
          <td>${item.studentName || ''}</td>
          <td>${item.rollNumber  || ''}</td>
          <td>${item.className   || ''} – ${item.section || ''}</td>
          <td>${item.examName    || ''}</td>
          <td>${item.examDate    || ''}</td>
          <td style="white-space:nowrap">
            <button class="btn-sm print-btn" data-id="${item._id}">🖨 Print</button>
            <button class="btn-sm edit-btn"  data-id="${item._id}">Edit</button>
            <button class="btn-sm btn-secondary del-btn" data-id="${item._id}">Delete</button>
          </td>
        </tr>`).join('');
      tWrap.innerHTML = `<table>
        <thead><tr><th>Student</th><th>Roll No</th><th>Class</th><th>Exam</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody></table>`;

      tWrap.querySelectorAll('.print-btn').forEach(btn => btn.addEventListener('click', () => {
        const item = items.find(i => i._id === btn.dataset.id);
        if (item) showPrint(item);
      }));
      tWrap.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => {
        const item = items.find(i => i._id === btn.dataset.id);
        if (!item) return;
        editingId = item._id;
        FIELDS.forEach(n => { const el = form.querySelector(`[name="${n}"]`); if (el) el.value = item[n] || ''; });
        saveBtn.textContent = 'Update';
      }));
      tWrap.querySelectorAll('.del-btn').forEach(btn => btn.addEventListener('click', async () => {
        if (!confirm('Delete this admit card?')) return;
        const res = await apiFetch('DELETE', `/admitcards/${btn.dataset.id}`);
        if (res?.ok) load();
      }));
    }

    function showPrint(item) {
      const overlay = document.createElement('div');
      overlay.className = 'print-overlay';
      overlay.innerHTML = `
        <div class="admit-card-doc">
          <div class="ac-school-header">
            <div class="ac-school-logo">🏫</div>
            <div class="ac-school-info">
              <h1>Delhi Public School</h1>
              <p class="ac-school-address">Vasant Kunj, Delhi - 110070</p>
              <p class="ac-school-contact">Phone: 011-26123456 | Email: info@dpsvasantkunj.com</p>
            </div>
            <div class="ac-school-logo">🏫</div>
          </div>
          <div class="ac-title">
            <h2>ADMIT CARD</h2>
            <p>${item.examName || 'Examination'}</p>
          </div>
          <div class="ac-body">
            <div class="ac-info">
              <table>
                <tr><td>Student Name</td><td><strong>${item.studentName || ''}</strong></td></tr>
                <tr><td>Father's Name</td><td>${item.fatherName  || ''}</td></tr>
                <tr><td>Roll Number</td><td><strong>${item.rollNumber  || ''}</strong></td></tr>
                <tr><td>Class & Section</td><td>${item.className   || ''} – ${item.section || ''}</td></tr>
                <tr><td>Exam Date</td><td>${item.examDate    || ''}</td></tr>
                <tr><td>Exam Center</td><td>${item.examCenter  || ''}</td></tr>
                <tr><td>Subjects</td><td>${item.subjects    || ''}</td></tr>
              </table>
            </div>
            <div class="ac-photo-box">
              <div class="ac-photo">
                ${item.photo ? `<img src="${item.photo}" alt="Photo" />` : '<span>Paste<br>Photo<br>Here</span>'}
              </div>
            </div>
          </div>
          <div class="ac-instructions">
            <h4>Important Instructions:</h4>
            <ul>
              <li>Students must bring this admit card to the examination hall.</li>
              <li>Electronic devices are strictly prohibited.</li>
              <li>Report 30 minutes before the exam time.</li>
              <li>No student will be allowed without valid ID proof.</li>
            </ul>
          </div>
          <div class="ac-footer">
            <div class="sig">
              <div class="sig-line"></div>
              <p>Class Teacher</p>
            </div>
            <div class="sig">
              <div class="sig-line"></div>
              <p>Exam Controller</p>
            </div>
            <div class="sig">
              <div class="sig-line"></div>
              <p>Principal</p>
            </div>
          </div>
          <div class="no-print-actions">
            <button id="do-print">🖨 Print</button>
            <button id="close-print" class="btn-secondary">✕ Close</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#do-print').addEventListener('click',  () => window.print());
      overlay.querySelector('#close-print').addEventListener('click', () => overlay.remove());
    }

    async function load() {
      const res = await apiFetch('GET', '/admitcards');
      if (res?.ok) { items = await res.json(); renderTable(); }
    }

    saveBtn.addEventListener('click', async () => {
      errEl.style.display = 'none';
      const data = getFormData();
      const req = ['studentName','rollNumber','className','section','fatherName','examName','examCenter','examDate','subjects'];
      if (req.some(k => !data[k])) {
        errEl.textContent = 'Please fill all required fields.';
        errEl.style.display = 'block';
        return;
      }
      const res = editingId
        ? await apiFetch('PUT',  `/admitcards/${editingId}`, data)
        : await apiFetch('POST', '/admitcards', data);
      if (res?.ok) {
        editingId = null;
        form.reset();
        saveBtn.textContent = 'Generate Admit Card';
        load();
      } else {
        const err = await res?.json().catch(() => ({}));
        errEl.textContent = err?.message || 'Error saving';
        errEl.style.display = 'block';
      }
    });

    container.querySelector('#ac-reset').addEventListener('click', () => {
      editingId = null;
      form.reset();
      saveBtn.textContent = 'Generate Admit Card';
      errEl.style.display = 'none';
    });

    load();
  }
};

// ── Student ID Card ─────────────────────────────────────────────────
Pages.idcard = {
  async render(container) {
    let students = [];

    container.innerHTML = `
      <div class="page-card">
        <h2>🪪 Student ID Card Generator</h2>
        <p style="color:#666;margin-bottom:15px;">Student select karo aur ID Card generate karo</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:15px;">
          <select id="student-select" style="min-width:280px;padding:10px;border-radius:8px;border:1.5px solid #ddd;">
            <option value="">-- Student Select Karo --</option>
          </select>
          <button id="btn-generate-id" class="btn-scan">🪪 ID Card Generate Karo</button>
        </div>
        <div id="id-card-preview"></div>
      </div>`;

    async function loadStudents() {
      const res = await apiFetch('GET', '/students');
      if (!res?.ok) return;
      students = await res.json();
      const selectEl = container.querySelector('#student-select');
      const options = students.map(s => {
        const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
        const cls = `${s.className || ''}${s.section ? ' - ' + s.section : ''}`;
        return `<option value="${s._id}">${name} (${cls})</option>`;
      }).join('');
      selectEl.innerHTML = '<option value="">-- Student Select Karo --</option>' + options;
    }
    await loadStudents();

    function showIdCard(student) {
      const name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
      const previewEl = container.querySelector('#id-card-preview');
      previewEl.innerHTML = `
        <div class="id-card-wrapper">
          <div class="id-card-front">
            <div class="id-header">
              <div class="id-logo">🏫</div>
              <div class="id-school-name">
                <h1>Delhi Public School</h1>
                <p>Vasant Kunj, Delhi - 110070</p>
              </div>
              <div class="id-logo">🏫</div>
            </div>
            <div class="id-title">STUDENT IDENTITY CARD</div>
            <div class="id-body">
              <div class="id-photo">
                ${student.photo ? `<img src="${student.photo}" alt="Photo" />` : '<span>Photo</span>'}
              </div>
              <div class="id-details">
                <table>
                  <tr><td>Name</td><td><strong>${name}</strong></td></tr>
                  <tr><td>Class</td><td>${student.className || ''} - ${student.section || ''}</td></tr>
                  <tr><td>Father's Name</td><td>${student.fatherName || ''}</td></tr>
                  <tr><td>Mother's Name</td><td>${student.motherName || ''}</td></tr>
                  <tr><td>D.O.B</td><td>${student.dob || ''}</td></tr>
                  <tr><td>Mobile No.</td><td>${student.mobile || ''}</td></tr>
                  <tr><td>Address</td><td>${student.city || ''}${student.state ? ', ' + student.state : ''}</td></tr>
                </table>
              </div>
            </div>
            <div class="id-footer">
              <div class="id-validity">Valid: 2025-26</div>
              <div class="id-signature">
                <div class="sig-line"></div>
                <p>Principal Sign</p>
              </div>
            </div>
          </div>
          <div class="id-card-back">
            <div class="id-back-header">
              <h2>🏫 Delhi Public School</h2>
              <p>Vasant Kunj, Delhi</p>
            </div>
            <div class="id-back-content">
              <h4>School Address:</h4>
              <p>Delhi Public School, Sector B-3,<br>Vasant Kunj, New Delhi - 110070</p>
              <h4>Contact:</h4>
              <p>Phone: 011-26123456<br>Email: info@dpsvasantkunj.com</p>
              <h4>Instructions:</h4>
              <ul>
                <li>This card is non-transferable.</li>
                <li>If found, please return to school.</li>
                <li>Must be carried daily to school.</li>
                <li>Report loss immediately to office.</li>
              </ul>
            </div>
            <div class="id-back-footer">
              <div class="id-qr" id="id-qr-code"></div>
              <p class="id-number">ID: ${student._id?.slice(0,8).toUpperCase() || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div class="id-card-actions">
          <button id="btn-print-id">🖨 Print ID Card</button>
        </div>`;

      // Generate QR code
      const qrEl = container.querySelector('#id-qr-code');
      if (qrEl && typeof QRCode !== 'undefined') {
        new QRCode(qrEl, {
          text: student._id,
          width: 60,
          height: 60,
          correctLevel: QRCode.CorrectLevel.H
        });
      }

      container.querySelector('#btn-print-id').addEventListener('click', () => {
        const printContent = container.querySelector('.id-card-wrapper').outerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Student ID Card - ${name}</title>
            <link rel="stylesheet" href="/css/style.css" />
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; }
              .id-card-wrapper { display: flex; gap: 30px; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
      });
    }

    container.querySelector('#btn-generate-id').addEventListener('click', () => {
      const studentId = container.querySelector('#student-select').value;
      if (!studentId) {
        alert('Pehle student select karo!');
        return;
      }
      const student = students.find(s => s._id === studentId);
      if (student) showIdCard(student);
    });
  }
};

// ── Classes Management ─────────────────────────────────────────────
Pages.classes = createCrudPage({
  title: '🏫 Class Management',
  apiPath: '/classes',
  fields: [
    { name: 'className',     label: 'Class Name (e.g. 1, 2, 10, 12)' },
    { name: 'section',       label: 'Section (e.g. A, B, C)' },
    { name: 'classTeacher',  label: 'Class Teacher Name' },
    { name: 'roomNumber',    label: 'Room Number' },
    { name: 'capacity',      label: 'Capacity (Max Students)', type: 'number' },
    { name: 'subjects',      label: 'Subjects (comma separated)', spanFull: true },
  ],
  columns: [
    { key: 'className',     label: 'Class' },
    { key: 'section',       label: 'Section' },
    { key: 'classTeacher',  label: 'Class Teacher' },
    { key: 'roomNumber',    label: 'Room No.' },
    { key: 'capacity',      label: 'Capacity' },
    { key: 'subjects',      label: 'Subjects' },
  ]
});

// ── Library Management ─────────────────────────────────────────────
Pages.library = createCrudPage({
  title: '📚 Library Management',
  apiPath: '/library',
  fields: [
    { name: 'bookName',     label: 'Book Name' },
    { name: 'author',       label: 'Author' },
    { name: 'isbn',         label: 'ISBN Number' },
    { name: 'category',     label: 'Category', type: 'select', options: ['Textbook', 'Reference', 'Fiction', 'Non-Fiction', 'Magazine', 'Journal', 'Encyclopedia', 'Other'] },
    { name: 'publisher',    label: 'Publisher' },
    { name: 'quantity',     label: 'Total Quantity', type: 'number' },
    { name: 'available',    label: 'Available Copies', type: 'number' },
    { name: 'price',        label: 'Price (₹)', type: 'number' },
    { name: 'shelf',        label: 'Shelf/Rack No.' },
    { name: 'addedDate',    label: 'Added Date', type: 'date' },
  ],
  columns: [
    { key: 'bookName',   label: 'Book Name' },
    { key: 'author',     label: 'Author' },
    { key: 'isbn',       label: 'ISBN' },
    { key: 'category',   label: 'Category' },
    { key: 'quantity',   label: 'Total' },
    { key: 'available',  label: 'Available' },
    { key: 'shelf',      label: 'Shelf' },
  ]
});

// ── Simple placeholder pages ──────────────────────────────────────
const simplePages = {
  transport: { icon: '🚌', title: 'Transport',  desc: 'Manage school bus routes and students.' },
  notices:   { icon: '📢', title: 'Notices',    desc: 'Manage school announcements and notices.' },
};

Object.entries(simplePages).forEach(([name, cfg]) => {
  Pages[name] = {
    render(container) {
      container.innerHTML = `
        <div class="page-card">
          <h2>${cfg.icon} ${cfg.title}</h2>
          <p style="color:#888;font-size:0.9rem;line-height:1.7">${cfg.desc}<br>
          This module is coming soon in the next version.</p>
        </div>`;
    }
  };
});

// ═══════════════════════════════════════════════════════════════════
//  ROUTER
// ═══════════════════════════════════════════════════════════════════
const PAGE_TITLES = {
  dashboard: 'Dashboard', students: 'Students', teachers: 'Teachers',
  classes: 'Classes', attendance: 'Attendance', fees: 'Fees',
  exams: 'Exams', results: 'Results', admitcard: 'Admit Card', idcard: 'ID Card',
  library: 'Library', transport: 'Transport', notices: 'Notices'
};

function navigate(page) {
  document.querySelectorAll('#sidebar-nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.page === page));
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  const content = document.getElementById('page-content');
  content.innerHTML = '';
  if (Pages[page]) Pages[page].render(content);
  else content.innerHTML = '<div class="page-card"><p>Page not found</p></div>';
}

// ═══════════════════════════════════════════════════════════════════
//  APP SHELL
// ═══════════════════════════════════════════════════════════════════
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-shell').style.display   = 'none';
}

function showApp() {
  const user = Auth.getUser();
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').style.display   = 'flex';
  document.getElementById('user-chip').textContent =
    `${user?.name || 'User'}  •  ${user?.role || ''}`;
  navigate('dashboard');
}

// ═══════════════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // ── Login form ─────────────────────────────────────────────────
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value,
        role:     document.getElementById('login-role').value
      })
    });
    const data = await res.json();
    if (res.ok) {
      Auth.set(data.token, data.user);
      showApp();
    } else {
      errEl.textContent = data.message || 'Login failed';
      errEl.style.display = 'block';
    }
  });

  // ── Sidebar nav ────────────────────────────────────────────────
  document.getElementById('sidebar-nav').addEventListener('click', e => {
    const a = e.target.closest('a[data-page]');
    if (a) { e.preventDefault(); navigate(a.dataset.page); }
  });

  // ── Logout ─────────────────────────────────────────────────────
  document.getElementById('logout-btn').addEventListener('click', () => {
    Auth.clear();
    showLogin();
  });

  // ── Init ───────────────────────────────────────────────────────
  if (Auth.getToken()) showApp(); else showLogin();
});
