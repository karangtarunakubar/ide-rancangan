// Global data variables to be populated from CSV files
let pengurusIntiData = [];
let bidangData = [];
let portofolioData = [];
let kecamatanData = [];
let umkmData = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Helper function to fetch and parse CSV data
    const fetchCsvData = (url) => {
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(error),
            });
        });
    };

    try {
        // Fetch all datasets in parallel for faster loading
        const [
            pengurusRaw, 
            bidangRaw, 
            portofolioRaw, 
            kecamatanRaw, 
            umkmRaw
        ] = await Promise.all([
            fetchCsvData('pengurus_inti.csv'),
            fetchCsvData('bidang_data.csv'),
            fetchCsvData('portofolio.csv'),
            fetchCsvData('kecamatan.csv'),
            fetchCsvData('umkm.csv')
        ]);

        pengurusIntiData = pengurusRaw;

        // Process bidangData to restore nested structures
        bidangData = bidangRaw.map(item => {
            // Parse the 'anggota' JSON string back into an array of objects
            item.anggota = item.anggota ? JSON.parse(item.anggota) : [];
            // Split the 'programs' string back into an array
            item.programs = item.programs ? item.programs.split(', ') : [];
            return item;
        });
        
        portofolioData = portofolioRaw;
        kecamatanData = kecamatanRaw;
        umkmData = umkmRaw;

        // Now that data is loaded, render the content
        renderPengurus();
        renderBidang(bidangData);
        renderPortofolio();
        renderKecamatan(kecamatanData);
        renderUmkm(umkmData);
        renderHierarkiAndFlow();

        // Hide loading indicator and show main content
        document.getElementById('loading-indicator').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');

        // Set up Intersection Observer for animations after content is rendered
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add a staggered delay for a nicer effect
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, index * 50); // 50ms delay between each item
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

        // Back to Top Button Logic
        const backToTopButton = document.getElementById('back-to-top');

        // Sticky Nav Logic
        const nav = document.getElementById('main-nav');
        const navPlaceholder = document.getElementById('nav-placeholder');
        const header = document.getElementById('site-header');
        // Calculate the offset based on the bottom of the header, not just the nav
        const stickyOffset = header.offsetHeight;

        // Debounce function to limit how often a function can run.
        const debounce = (func, delay) => {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        };

        const handleScroll = () => {
            // Back to top
            if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                backToTopButton.classList.remove('hidden');
                backToTopButton.classList.add('flex');
            } else {
                backToTopButton.classList.add('hidden');
                backToTopButton.classList.remove('flex');
            }

            // Sticky nav
            if (window.pageYOffset > stickyOffset) {
                nav.classList.add('sticky-nav');
                navPlaceholder.style.height = `${nav.offsetHeight}px`;
            } else {
                nav.classList.remove('sticky-nav');
                navPlaceholder.style.height = '0px';
            }
        }

        // Use the debounced scroll handler
        window.addEventListener('scroll', debounce(handleScroll, 15));

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

    } catch (error) {
        console.error("Error loading or parsing CSV data:", error);
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.innerHTML = `<p class="text-red-600 font-semibold">Failed to load data. Please check the console or try refreshing the page.</p>`;
    }
});

// HELPER AVATAR FALLBACK GENERATOR
function getAvatarUrl(avatarPath, name) {
    const fallback = `https://ui-avatars.com/api/?background=e0e5ec&color=2563eb&bold=true&name=${encodeURIComponent(name)}`;
    return { path: avatarPath || fallback, fallback: fallback };
}

// RENDER FUNCTIONS
function renderPengurus() {
    const container = document.getElementById('pengurus-grid');
    container.innerHTML = pengurusIntiData.map(item => {
        const imgInfo = getAvatarUrl(item.avatar, item.nama);
        return `
            <div class="neu-flat p-6 flex flex-col justify-between fade-in-up">
                <div>
                    <div class="flex items-center gap-4 mb-4">
                        <div class="neu-circle w-14 h-14 p-0.5 flex-shrink-0 overflow-hidden">
                            <img src="${imgInfo.path}" alt="${item.nama}" class="w-full h-full object-cover rounded-full" onerror="this.src='${imgInfo.fallback}';">
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800 text-sm">${item.role}</h3>
                            <p class="text-xs text-blue-600 font-semibold">${item.nama}</p>
                        </div>
                    </div>
                    <p class="text-xs text-slate-600 mb-4">${item.desc}</p>
                </div>
                ${item.notes && item.notes !== '-' ? `
                    <div class="neu-pressed p-2 text-[11px] text-amber-700 flex items-center gap-2">
                        <i class="fa-solid fa-circle-info"></i>
                        <span>${item.notes}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderBidang(data) {
    const container = document.getElementById('bidang-grid');
    container.innerHTML = data.map((item, index) => {
        const imgInfo = getAvatarUrl(item.ketuaAvatar, item.ketua);
        return `
            <div onclick="openModal(${index})" class="neu-flat p-6 cursor-pointer hover:border-blue-500 transition flex flex-col justify-between fade-in-up">
                <div>
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-xs font-bold text-blue-600">${item.kode}</span>
                        <span class="text-[10px] text-slate-400" data-tooltip="View Details"><i class="fa-solid fa-arrow-up-right-from-square"></i> Detail</span>
                    </div>
                    <h3 class="font-bold text-slate-800 text-sm mb-3">${item.nama}</h3>
                    <div class="flex items-center gap-3 mb-3">
                        <div class="neu-circle w-10 h-10 p-0.5 flex-shrink-0 overflow-hidden">
                            <img src="${imgInfo.path}" alt="${item.ketua}" class="w-full h-full object-cover rounded-full" onerror="this.src='${imgInfo.fallback}';">
                        </div>
                        <div>
                            <p class="text-xs text-slate-800 font-bold">${item.ketua}</p>
                            <p class="text-[10px] text-blue-600 font-medium">Ketua Bidang</p>
                        </div>
                    </div>
                    <p class="text-xs text-slate-500 line-clamp-2">${item.desc}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-300">
                    <p class="text-[10px] text-slate-400 font-bold uppercase">Program Utama:</p>
                    <p class="text-xs text-slate-700 truncate"><i class="fa-solid fa-chevron-right text-blue-500 mr-1"></i>${item.programs && item.programs.length > 0 ? item.programs[0] : 'N/A'}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderPortofolio() {
    const container = document.getElementById('portofolio-grid');
    container.innerHTML = portofolioData.map(item => `
        <div class="neu-flat p-6 fade-in-up">
            <div class="flex justify-between items-center mb-2">
                <span class="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">${item.tag}</span>
                <span class="text-[10px] text-slate-400">${item.tgl}</span>
            </div>
            <h3 class="font-bold text-slate-800 text-sm mb-2">${item.judul}</h3>
            <p class="text-xs text-slate-600">${item.desc}</p>
        </div>
    `).join('');
}

function renderKecamatan(data) {
    const container = document.getElementById('kecamatan-grid');
    container.innerHTML = data.map(item => `
        <div class="neu-flat p-5 fade-in-up">
            <div class="flex items-center gap-2 mb-2">
                <i class="fa-solid fa-location-dot text-red-500 text-sm"></i>
                <h3 class="font-bold text-slate-800 text-sm">${item.nama}</h3>
            </div>
            <p class="text-[11px] text-slate-500 mb-2">Pusat: <span class="font-semibold text-slate-700">${item.pusat}</span></p>
            <div class="neu-pressed p-2 text-[11px] text-blue-800">
                <p class="font-bold text-[10px] uppercase text-blue-600">Keunggulan:</p>
                <p>${item.keunggulan}</p>
            </div>
        </div>
    `).join('');
}

function renderUmkm(data) {
    const container = document.getElementById('umkm-grid');
    container.innerHTML = data.map(item => `
        <div class="neu-flat p-6 flex flex-col justify-between fade-in-up">
            <div>
                <div class="flex items-center gap-4 mb-4">
                    <div class="neu-circle w-14 h-14 p-0.5 flex-shrink-0 overflow-hidden">
                        <img src="${item.logo || 'https://ui-avatars.com/api/?background=e0e5ec&color=2563eb&bold=true&name=UMKM'}" 
                             alt="${item.nama}" 
                             class="w-full h-full object-cover rounded-full"
                             onerror="this.src='https://ui-avatars.com/api/?background=e0e5ec&color=2563eb&bold=true&name=UMKM';">
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm">${item.nama}</h3>
                        <p class="text-xs text-blue-600 font-semibold">${item.jenis}</p>
                    </div>
                </div>
                <p class="text-xs text-slate-600 mb-4">${item.deskripsi}</p>
            </div>
        </div>
    `).join('');
}

// TAB SWITCHING
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('nav button').forEach(el => {
        el.classList.remove('active', 'text-blue-600');
        el.classList.add('text-slate-600');
    });

    document.getElementById(`sec-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-${tabId}`);
    activeBtn.classList.add('active', 'text-blue-600');
}

// FILTER BIDANG
function filterBidang() {
    const q = document.getElementById('searchBidang').value.toLowerCase();
    const filtered = bidangData.filter(b => 
        b.nama.toLowerCase().includes(q) || 
        b.ketua.toLowerCase().includes(q) ||
        b.anggota.some(a => a.nama.toLowerCase().includes(q))
    );
    renderBidang(filtered);
}

// FILTER KECAMATAN
function filterKecamatan() {
    const q = document.getElementById('searchKecamatan').value.toLowerCase();
    const filtered = kecamatanData.filter(k => 
        k.nama.toLowerCase().includes(q) ||
        k.pusat.toLowerCase().includes(q) ||
        k.keunggulan.toLowerCase().includes(q)
    );
    renderKecamatan(filtered);
}

// FILTER UMKM
function filterUmkm() {
    const q = document.getElementById('searchUmkm').value.toLowerCase();
    const filtered = umkmData.filter(u => 
        u.nama.toLowerCase().includes(q) ||
        u.jenis.toLowerCase().includes(q)
    );
    renderUmkm(filtered);
}

// RENDER HIERARKI & FLOW
function renderHierarkiAndFlow() {
    // --- Part 1: Update the diagram text ---
    const penasehat = pengurusIntiData.find(p => p.role.toLowerCase().includes('penasehat'));
    if (penasehat) {
        document.getElementById('flow-penasehat-role').innerText = penasehat.role;
        document.getElementById('flow-penasehat-name').innerText = penasehat.nama;
    }

    const ketuaRoles = pengurusIntiData
        .filter(p => p.role.toLowerCase().includes('ketua'))
        .map(p => p.role)
        .join(' & ');
    document.getElementById('flow-ketua-roles').innerText = "Ketua & Wakil Ketua"; // Keep it simple

    const sekretariatRoles = "Sekretaris & Bendahara Umum"; // Keep it simple
    document.getElementById('flow-sekretariat-roles').innerText = sekretariatRoles;

    document.getElementById('flow-bidang-count').innerText = `${bidangData.length} Bidang Pelaksana`;
    document.getElementById('flow-kecamatan-count').innerText = `${kecamatanData.length} Kecamatan & Pemkab`;

    // --- Part 2: Update the table ---
    const tableBody = document.getElementById('hierarki-table-body');
    const tableData = [
        {
            level: 'Penasehat',
            color: 'text-amber-600',
            jabatan: 'Dewan Penasehat / Pembina',
            fungsi: 'Memberikan pertimbangan strategis & pengawasan.',
            flow: 'Mutualisme Kebijakan',
            flowIcon: 'fa-arrows-left-right',
            flowColor: 'text-emerald-600'
        },
        {
            level: 'Level 1',
            color: 'text-blue-600',
            jabatan: 'Ketua & Wakil Ketua Umum',
            fungsi: 'Pengambil keputusan tertinggi & penanggung jawab penuh.',
            flow: 'Komando Instruktif',
            flowIcon: 'fa-arrow-down',
            flowColor: 'text-blue-600'
        },
        {
            level: 'Level 2',
            color: 'text-indigo-600',
            jabatan: 'Sekretaris & Bendahara Umum',
            fungsi: 'Manajemen tata kelola administrasi & keuangan.',
            flow: 'Koordinasi Operasional',
            flowIcon: 'fa-arrow-down-short-wide',
            flowColor: 'text-indigo-600'
        },
        {
            level: 'Level 3',
            color: 'text-slate-700',
            jabatan: `${bidangData.length} Ketua & Anggota Bidang`,
            fungsi: 'Pelaksana teknis kegiatan & program unggulan.',
            flow: 'Mutualisme Lapangan',
            flowIcon: 'fa-arrows-rotate',
            flowColor: 'text-emerald-600'
        },
        {
            level: 'External',
            color: 'text-emerald-600',
            jabatan: `Karang Taruna Kecamatan & Pemkab`,
            fungsi: `Mitra strategis pembangunan daerah di ${kecamatanData.length} Kecamatan.`,
            flow: 'Mutualisme Sinergi',
            flowIcon: 'fa-handshake',
            flowColor: 'text-emerald-600'
        }
    ];

    tableBody.innerHTML = tableData.map(row => `
        <tr>
            <td class="p-3 font-semibold ${row.color}">${row.level}</td>
            <td class="p-3 font-bold text-slate-800">${row.jabatan}</td>
            <td class="p-3">${row.fungsi}</td>
            <td class="p-3">
                <span class="neu-pressed px-2 py-1 ${row.flowColor} font-bold">
                    <i class="fa-solid ${row.flowIcon} mr-1"></i>${row.flow}
                </span>
            </td>
        </tr>
    `).join('');
}

// COPY TO CLIPBOARD
function copyToClipboard(text, buttonElement) {
    if (!text || !navigator.clipboard) return;

    navigator.clipboard.writeText(text).then(() => {
        const originalContent = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Copied!';
        buttonElement.disabled = true;
        setTimeout(() => {
            buttonElement.innerHTML = originalContent;
            buttonElement.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        // Optionally provide user feedback on error
    });
}

// MODAL FUNCTIONS
function openModal(index) {
    const q = document.getElementById('searchBidang').value.toLowerCase();
    const currentData = q ? bidangData.filter(b => b.nama.toLowerCase().includes(q) || b.ketua.toLowerCase().includes(q) || b.anggota.some(a => a.nama.toLowerCase().includes(q))) : bidangData;
    const item = currentData[index];

    if (!item) return;

    document.getElementById('modalKode').innerText = item.kode;
    document.getElementById('modalJudul').innerText = item.nama;
    document.getElementById('modalKetua').innerText = item.ketua;
    document.getElementById('modalDesc').innerText = item.desc;

    const ketuaImgInfo = getAvatarUrl(item.ketuaAvatar, item.ketua);
    const modalAvatar = document.getElementById('modalKetuaAvatar');
    modalAvatar.src = ketuaImgInfo.path;
    modalAvatar.onerror = () => { modalAvatar.src = ketuaImgInfo.fallback; };

    document.getElementById('modalAnggota').innerHTML = item.anggota.map(a => {
        const imgInfo = getAvatarUrl(a.avatar, a.nama);
        return `
            <div class="neu-btn p-2 flex items-center gap-2">
                <div class="neu-circle w-8 h-8 p-0.5 flex-shrink-0 overflow-hidden">
                    <img src="${imgInfo.path}" alt="${a.nama}" class="w-full h-full object-cover rounded-full" onerror="this.src='${imgInfo.fallback}';">
                </div>
                <div>
                    <p class="font-bold text-slate-800 text-[11px] leading-tight">${a.nama}</p>
                    <p class="text-[9px] text-blue-600">${a.role}</p>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('modalPrograms').innerHTML = item.programs.map(p => `<li>${p}</li>`).join('');
    document.getElementById('modalKPI').innerText = item.kpi;

    const notesBox = document.getElementById('modalNotesBox');
    if(item.notes) {
        document.getElementById('modalNotes').innerText = item.notes;
        notesBox.classList.remove('hidden');
    } else {
        notesBox.classList.add('hidden');
    }

    document.getElementById('modalBidang').classList.remove('hidden');
    document.getElementById('modalBidang').classList.add('flex');
}

function closeModal() {
    document.getElementById('modalBidang').classList.add('hidden');
    document.getElementById('modalBidang').classList.remove('flex');
}
