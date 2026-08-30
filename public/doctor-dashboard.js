const token = localStorage.getItem('doctorToken');
const doctorEmail = localStorage.getItem('doctorEmail');
const body = document.querySelector('#appointments-body');
const statusBar = document.querySelector('#dashboard-status');
const totalCount = document.querySelector('#total-count');
const pendingCount = document.querySelector('#pending-count');
const approvedCount = document.querySelector('#approved-count');
const rejectedCount = document.querySelector('#rejected-count');
const identity = document.querySelector('#doctor-identity');
const logoutBtn = document.querySelector('#logout-btn');
const refreshBtn = document.querySelector('#refresh-btn');
const filterButtons = [...document.querySelectorAll('[data-filter]')];

if (!token) {
  window.location.href = 'doctor-login.html';
}

if (doctorEmail && identity) {
  identity.textContent = doctorEmail;
}

let appointments = [];
let activeFilter = 'all';

const setMessage = (message) => {
  if (statusBar) {
    statusBar.textContent = message;
  }
};

const authHeaders = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const renderCounts = () => {
  const total = appointments.length;
  const pending = appointments.filter((item) => item.status === 'pending').length;
  const approved = appointments.filter((item) => item.status === 'approved').length;
  const rejected = appointments.filter((item) => item.status === 'rejected').length;

  totalCount && (totalCount.textContent = String(total));
  pendingCount && (pendingCount.textContent = String(pending));
  approvedCount && (approvedCount.textContent = String(approved));
  rejectedCount && (rejectedCount.textContent = String(rejected));
};

const filteredAppointments = () => {
  if (activeFilter === 'all') {
    return appointments;
  }

  return appointments.filter((item) => item.status === activeFilter);
};

const approveAppointment = async (appointmentId, status) => {
  setMessage(`Updating appointment ${appointmentId}...`);

  const response = await fetch(`/api/doctor/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Could not update the appointment.');
  }

  appointments = appointments.map((item) => (item.id === result.appointment.id ? result.appointment : item));
  renderCounts();
  renderTable();
  setMessage(`Appointment ${appointmentId} marked as ${status}.`);
};

const renderTable = () => {
  if (!body) return;

  const rows = filteredAppointments();

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="8" class="empty">No appointments found for this filter.</td></tr>`;
    return;
  }

  body.innerHTML = rows
    .map(
      (item) => `
        <tr>
          <td>${item.id}</td>
          <td>${item.patient_name}</td>
          <td>${item.email}</td>
          <td>${item.preferred_date}</td>
          <td>${item.preferred_time}</td>
          <td>${item.phone}</td>
          <td><span class="status ${item.status}">${item.status}</span></td>
          <td>
            <div class="row-actions">
              <button class="button approve" type="button" data-action="approve" data-id="${item.id}">Approve</button>
              <button class="button reject" type="button" data-action="reject" data-id="${item.id}">Reject</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
};

const loadAppointments = async () => {
  if (!body) return;

  body.innerHTML = `<tr><td colspan="8" class="empty">Loading appointments...</td></tr>`;
  setMessage('Fetching appointments from the backend database...');

  try {
    const response = await fetch('/api/doctor/appointments', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Could not load appointments.');
    }

    appointments = result.appointments || [];
    renderCounts();
    renderTable();
    setMessage(`Loaded ${appointments.length} appointment${appointments.length === 1 ? '' : 's'}.`);
  } catch (error) {
    body.innerHTML = `<tr><td colspan="8" class="empty">${error.message || 'Unable to load appointments.'}</td></tr>`;
    setMessage('Unable to connect to the appointment database.');
  }
};

body?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const appointmentId = Number(button.dataset.id);
  const nextStatus = button.dataset.action === 'approve' ? 'approved' : 'rejected';

  try {
    button.disabled = true;
    await approveAppointment(appointmentId, nextStatus);
  } catch (error) {
    setMessage(error.message || 'Update failed.');
  } finally {
    button.disabled = false;
  }
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    filterButtons.forEach((item) => item.classList.toggle('active', item === button));
    renderTable();
  });
});

refreshBtn?.addEventListener('click', loadAppointments);

logoutBtn?.addEventListener('click', async () => {
  try {
    await fetch('/api/doctor/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } finally {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorEmail');
    window.location.href = 'doctor-login.html';
  }
});

loadAppointments();
