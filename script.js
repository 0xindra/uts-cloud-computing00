// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.log('Service Worker registration failed', err));
}

// Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installPrompt').style.display = 'block';
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            deferredPrompt = null;
            document.getElementById('installPrompt').style.display = 'none';
        });
    }
}

function dismissInstall() {
    document.getElementById('installPrompt').style.display = 'none';
}

// Data Management
let reservations = [];
let editingId = null;

function loadReservations() {
    const stored = localStorage.getItem('reservations');
    if (stored) {
        reservations = JSON.parse(stored);
        renderReservations();
    }
}

function saveReservations() {
    localStorage.setItem('reservations', JSON.stringify(reservations));
}

function renderReservations() {
    const tbody = document.getElementById('reservationList');
    
    if (reservations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>Belum ada reservasi. Buat reservasi pertama Anda!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = reservations.map((res, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${res.nama}</strong></td>
            <td>${res.telepon}</td>
            <td>${formatTanggal(res.tanggal)}</td>
            <td>${res.jam}</td>
            <td><span class="badge bg-info">${res.jumlahTamu} Orang</span></td>
            <td><span class="badge bg-${res.status === 'aktif' ? 'success' : 'secondary'}">${res.status === 'aktif' ? 'Aktif' : 'Selesai'}</span></td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editReservation(${res.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteReservation(${res.id})">Hapus</button>
                <button class="btn btn-sm btn-info" onclick="viewDetail(${res.id})">Detail</button>
            </td>
        </tr>
    `).join('');
}

function formatTanggal(dateStr) {
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

document.getElementById('reservationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        id: editingId || Date.now(),
        nama: document.getElementById('nama').value,
        telepon: document.getElementById('telepon').value,
        tanggal: document.getElementById('tanggal').value,
        jam: document.getElementById('jam').value,
        jumlahTamu: document.getElementById('jumlahTamu').value,
        catatan: document.getElementById('catatan').value,
        status: 'aktif',
        createdAt: new Date().toISOString()
    };

    if (editingId) {
        const index = reservations.findIndex(r => r.id === editingId);
        reservations[index] = { ...reservations[index], ...formData };
        editingId = null;
        document.getElementById('btnText').textContent = '✨ Buat Reservasi';
    } else {
        reservations.unshift(formData);
    }

    saveReservations();
    renderReservations();
    this.reset();
    
    // Show success message
    alert('✅ Reservasi berhasil disimpan!');
});

function editReservation(id) {
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
        document.getElementById('nama').value = reservation.nama;
        document.getElementById('telepon').value = reservation.telepon;
        document.getElementById('tanggal').value = reservation.tanggal;
        document.getElementById('jam').value = reservation.jam;
        document.getElementById('jumlahTamu').value = reservation.jumlahTamu;
        document.getElementById('catatan').value = reservation.catatan;
        
        editingId = id;
        document.getElementById('btnText').textContent = '💾 Update Reservasi';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteReservation(id) {
    if (confirm('Yakin ingin menghapus reservasi ini?')) {
        reservations = reservations.filter(r => r.id !== id);
        saveReservations();
        renderReservations();
    }
}

function clearAllReservations() {
    if (confirm('Yakin ingin menghapus SEMUA reservasi? Tindakan ini tidak dapat dibatalkan!')) {
        reservations = [];
        saveReservations();
        renderReservations();
    }
}

function viewDetail(id) {
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <h5 style="color: var(--gold);">👤 ${reservation.nama}</h5>
                </div>
                <div class="col-6 mb-2">
                    <strong>📞 Telepon:</strong><br>${reservation.telepon}
                </div>
                <div class="col-6 mb-2">
                    <strong>👥 Jumlah Tamu:</strong><br>${reservation.jumlahTamu} Orang
                </div>
                <div class="col-6 mb-2">
                    <strong>📅 Tanggal:</strong><br>${formatTanggal(reservation.tanggal)}
                </div>
                <div class="col-6 mb-2">
                    <strong>⏰ Jam:</strong><br>${reservation.jam}
                </div>
                <div class="col-12 mb-2">
                    <strong>📝 Catatan:</strong><br>${reservation.catatan || '-'}
                </div>
                <div class="col-12">
                    <strong>✅ Status:</strong><br>
                    <span class="badge bg-${reservation.status === 'aktif' ? 'success' : 'secondary'}">${reservation.status === 'aktif' ? 'Aktif' : 'Selesai'}</span>
                </div>
            </div>
        `;
        const modal = new bootstrap.Modal(document.getElementById('detailModal'));
        modal.show();
    }
}

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('tanggal').setAttribute('min', today);

// Initialize
loadReservations();