// ==========================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCw4_T2eUsQ0HE1IAUCTVxOnasHB-CntJM",
    authDomain: "reba-artistry.firebaseapp.com",
    databaseURL: "https://reba-artistry-default-rtdb.firebaseio.com",
    projectId: "reba-artistry",
    storageBucket: "reba-artistry.firebasestorage.app",
    messagingSenderId: "952166828443",
    appId: "1:952166828443:web:ce4e06f886df9c85a0b93e",
    measurementId: "G-5CBHCEWYRK"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}
const database = typeof firebase !== 'undefined' ? firebase.database() : null;
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : database;
// ==========================================
// CONFIGURATION & GLOBAL STATES
// ==========================================
const OWNER_PASSWORD = "A786";
const INSTAGRAM_USERNAME = "rebaa.rtistry"; 
const TIKTOK_USERNAME = "rebaa.rtistry";     

let isOwnerLoggedIn = false;
let selectedCardId = null;
let cardIdToDelete = null; 
let activeFilter = 'All';
let currentEditImageUrl = "";
let cardsData = [];
let isLoading = true; // State for controlling skeleton loaders

// ==========================================
// SUPER FAST BASE64 CONVERTER WITH COMPRESSION
// ==========================================
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 600px Max limit for instant fast rendering
                const MAX_SIZE = 600;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 50% Quality to keep image light (~30-60KB) & ultra fast
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
                resolve(compressedBase64);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

// REALTIME DATABASE LISTENER
document.addEventListener("DOMContentLoaded", () => {
    // Show skeleton loaders immediately on app start
    renderSkeletons();

    if (database) {
        database.ref('cards').on('value', (snapshot) => {
            isLoading = false; // Turn off loading state once data arrives
            const data = snapshot.val();
            if (data) {
                cardsData = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
            } else {
                cardsData = [];
            }

            renderCards();

            if (cardsData.length > 0 && !selectedCardId) {
                selectCard(cardsData[0].id, false);
            }
        });
    } else {
        isLoading = false;
        renderCards();
    }

    updateOwnerUIState();
});

// ==========================================
// SKELETON LOADER SYSTEM
// ==========================================
function renderSkeletons() {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;

    // Generates 4 skeleton cards to indicate loading
    const skeletonHTML = Array(4).fill(0).map(() => `
        <div class="bg-white rounded-2xl border border-rosepink/20 overflow-hidden shadow-sm animate-pulse flex flex-col justify-between">
            <div>
                <!-- Skeleton Image -->
                <div class="h-72 sm:h-80 bg-slate-200"></div>
                <div class="p-3.5 space-y-2">
                    <!-- Skeleton Title -->
                    <div class="h-4 bg-slate-200 rounded-md w-3/4"></div>
                    <!-- Skeleton Price -->
                    <div class="h-3 bg-slate-200 rounded-md w-1/3"></div>
                </div>
            </div>
            <!-- Skeleton Button -->
            <div class="p-3.5 pt-0">
                <div class="h-9 bg-slate-200 rounded-xl w-full"></div>
            </div>
        </div>
    `).join('');

    grid.innerHTML = skeletonHTML;
}

// ==========================================
// OPENING DOOR ANIMATION FUNCTION
// ==========================================
function openStudioDoors() {
    const doorLeft = document.getElementById('door-left');
    const doorRight = document.getElementById('door-right');
    const doorContent = document.getElementById('door-content');
    const welcomeWindow = document.getElementById('welcome-window');

    if (!doorLeft || !doorRight || !welcomeWindow) return;

    doorLeft.style.transition = 'transform 0.9s cubic-bezier(0.77, 0, 0.175, 1)';
    doorRight.style.transition = 'transform 0.9s cubic-bezier(0.77, 0, 0.175, 1)';

    if (doorContent) {
        doorContent.style.transition = 'all 0.3s ease-out';
        doorContent.style.opacity = '0';
        doorContent.style.transform = 'scale(0.85)';
    }

    setTimeout(() => {
        doorLeft.style.transform = 'translateX(-100%)';
        doorRight.style.transform = 'translateX(100%)';
    }, 200);

    setTimeout(() => {
        welcomeWindow.style.display = 'none';
        document.body.classList.remove('overflow-hidden');
    }, 1100);
}

// UI NAVIGATION & MODALS
function toggleSideDrawer(open) {
    const drawer = document.getElementById('side-drawer');
    const backdrop = document.getElementById('side-drawer-backdrop');
    if (!drawer || !backdrop) return;

    if (open) {
        drawer.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function toggleSlotModal(show) {
    const modal = document.getElementById('slot-modal');
    const backdrop = document.getElementById('slot-modal-backdrop');
    if (!modal || !backdrop) return;

    if (show) {
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function setQuickLocation(placeName) {
    const locInput = document.getElementById('cust-location');
    if (locInput) locInput.value = placeName;
}

// CENTER OVERLAY TOAST SYSTEM
function showToast(title, message, isSuccess = true) {
    const container = document.getElementById('toast-container');
    const icon = document.getElementById('toast-icon');
    const iconBg = document.getElementById('toast-icon-bg');
    const titleEl = document.getElementById('toast-title');
    const msgEl = document.getElementById('toast-message');

    if (!container) return;

    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = message;

    if (icon && iconBg) {
        if (isSuccess) {
            icon.className = "fa-solid fa-circle-check text-rosepink text-2xl";
            iconBg.className = "w-14 h-14 rounded-full bg-rosepink/20 flex items-center justify-center mb-3";
        } else {
            icon.className = "fa-solid fa-circle-exclamation text-rose-500 text-2xl";
            iconBg.className = "w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-3";
        }
    }

    container.classList.remove('hidden');
}

function hideToast() {
    const container = document.getElementById('toast-container');
    if (container) container.classList.add('hidden');
}

// OWNER AUTHENTICATION
function handleOwnerAuth() {
    if (!isOwnerLoggedIn) togglePasscodeModal(true);
    else logoutOwner();
}

function togglePasscodeModal(show) {
    const modal = document.getElementById('passcode-modal');
    if (!modal) return;
    if (show) {
        modal.classList.remove('hidden');
        const passInput = document.getElementById('owner-pass-input');
        if (passInput) {
            passInput.value = '';
            setTimeout(() => passInput.focus(), 100);
        }
    } else {
        modal.classList.add('hidden');
    }
}

function verifyOwnerPasscode(event) {
    if (event) event.preventDefault();
    const passInput = document.getElementById('owner-pass-input');
    const pass = passInput ? passInput.value.trim() : '';
    
    if (pass === OWNER_PASSWORD) {
        isOwnerLoggedIn = true;
        updateOwnerUIState();
        togglePasscodeModal(false);
        showToast("Owner Mode Active", "Control Panel Activated Successfully!", true);
        renderCards();
    } else {
        showToast("Access Denied", "Incorrect Passcode Entered!", false);
    }
}

function updateOwnerUIState() {
    const lockIcon = document.getElementById('lock-icon');
    const ownerAuthBtn = document.getElementById('owner-auth-btn');
    const directAddBtn = document.getElementById('direct-add-btn');
    const analyticsBtn = document.getElementById('analytics-btn');

    if (isOwnerLoggedIn) {
        // Owner Mode Active: Open Lock Icon + Green Glow
        if (lockIcon) {
            lockIcon.className = "fa-solid fa-lock-open text-xs sm:text-sm text-emerald-400 transform rotate-12 transition-all duration-300";
        }
        if (ownerAuthBtn) {
            ownerAuthBtn.title = "Deactivate Owner Mode";
            ownerAuthBtn.classList.add('border-emerald-400/50', 'bg-emerald-500/10');
            ownerAuthBtn.classList.remove('border-rosepink/30', 'bg-white/10');
        }
        if (directAddBtn) {
            directAddBtn.classList.remove('hidden');
            directAddBtn.onclick = () => openAddModal();
        }
        if (analyticsBtn) analyticsBtn.classList.remove('hidden');
    } else {
        // Owner Mode Deactive: Closed Lock Icon
        if (lockIcon) {
            lockIcon.className = "fa-solid fa-lock text-xs sm:text-sm text-rosepink transition-all duration-300";
        }
        if (ownerAuthBtn) {
            ownerAuthBtn.title = "Activate Owner Mode";
            ownerAuthBtn.classList.remove('border-emerald-400/50', 'bg-emerald-500/10');
            ownerAuthBtn.classList.add('border-rosepink/30', 'bg-white/10');
        }
        if (directAddBtn) directAddBtn.classList.add('hidden');
        if (analyticsBtn) analyticsBtn.classList.add('hidden');
    }
}
function logoutOwner() {
    isOwnerLoggedIn = false;
    updateOwnerUIState();
    toggleAdminModal(false);
    showToast("Deactivated", "Owner Control Mode Closed", false);
    renderCards();
}

// ADD / EDIT CARDS
function toggleAdminModal(show) {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function openAddModal() {
    if (!isOwnerLoggedIn) return;
    
    const editIdInput = document.getElementById('edit-card-id');
    const heading = document.getElementById('modal-heading');
    const subheading = document.getElementById('modal-subheading');
    const saveBtn = document.getElementById('save-card-btn');
    const titleInput = document.getElementById('new-title');
    const priceInput = document.getElementById('new-price');
    const fileInput = document.getElementById('new-image-file');
    const previewContainer = document.getElementById('image-preview-container');

    if (editIdInput) editIdInput.value = '';
    if (heading) heading.innerText = "ADD NEW DESIGN";
    if (subheading) subheading.innerText = "Publish new henna design into catalog.";
    if (saveBtn) saveBtn.innerText = "PUBLISH DESIGN";
    if (titleInput) titleInput.value = '';
    if (priceInput) priceInput.value = '';
    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.classList.add('hidden');
    
    currentEditImageUrl = "";
    toggleAdminModal(true);
}

function openEditModal(id) {
    if (!isOwnerLoggedIn) return;
    const card = cardsData.find(item => item.id == id);
    if (!card) return;

    const editIdInput = document.getElementById('edit-card-id');
    const heading = document.getElementById('modal-heading');
    const subheading = document.getElementById('modal-subheading');
    const saveBtn = document.getElementById('save-card-btn');
    const titleInput = document.getElementById('new-title');
    const categoryInput = document.getElementById('new-category');
    const priceInput = document.getElementById('new-price');
    const fileInput = document.getElementById('new-image-file');
    const previewImg = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');

    if (editIdInput) editIdInput.value = card.id;
    if (heading) heading.innerText = "EDIT DESIGN";
    if (subheading) subheading.innerText = "Update design details or price.";
    if (saveBtn) saveBtn.innerText = "UPDATE DESIGN";
    if (titleInput) titleInput.value = card.title;
    if (categoryInput) categoryInput.value = card.category;
    if (priceInput) priceInput.value = card.price;
    if (fileInput) fileInput.value = '';
    
    currentEditImageUrl = card.images ? card.images[0] : "";
    if (previewImg && previewContainer && currentEditImageUrl) {
        previewImg.src = currentEditImageUrl;
        previewContainer.classList.remove('hidden');
    }
    toggleAdminModal(true);
}

// SAVE CARD DATA (OPTIMIZED FOR FAST SAVING)
async function saveCardData(e) {
    if (e) e.preventDefault();
    if (!database) {
        showToast("Database Error", "Firebase Connection Not Ready!", false);
        return;
    }

    const editId = document.getElementById('edit-card-id')?.value;
    const title = document.getElementById('new-title')?.value.trim();
    const category = document.getElementById('new-category')?.value;
    const price = Number(document.getElementById('new-price')?.value);
    const fileInput = document.getElementById('new-image-file');
    const saveBtn = document.getElementById('save-card-btn');

    if (!title || !price) {
        showToast("Error", "Please fill design title and price!", false);
        return;
    }

    let finalImageUrl = currentEditImageUrl;

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerText = "SAVING...";
        }

        if (fileInput && fileInput.files && fileInput.files[0]) {
            finalImageUrl = await convertFileToBase64(fileInput.files[0]);
        }

        if (!finalImageUrl) {
            showToast("Error", "Please select an image!", false);
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerText = editId ? "UPDATE DESIGN" : "PUBLISH DESIGN";
            }
            return;
        }

        const payload = { title, category, price, images: [finalImageUrl] };

        if (editId) {
            await database.ref('cards/' + editId).update(payload);
            showToast("Updated!", "Design updated live in Firebase!", true);
        } else {
            await database.ref('cards').push(payload);
            showToast("Published!", "New design added live!", true);
        }

        toggleAdminModal(false);

    } catch (error) {
        console.error(error);
        showToast("Error", "Failed to save design to Firebase!", false);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = editId ? "UPDATE DESIGN" : "PUBLISH DESIGN";
        }
    }
}

// OWNER CARD DELETE CONFIRMATION POPUP SYSTEM
function triggerDeleteModal(id) {
    if (!isOwnerLoggedIn) return;
    cardIdToDelete = id;
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeDeleteModal() {
    cardIdToDelete = null;
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.add('hidden');
}

function confirmDeleteCard() {
    if (!cardIdToDelete || !database) return;
    
    database.ref('cards/' + cardIdToDelete).remove()
        .then(() => {
            showToast("Deleted", "Design card removed live!", false);
            closeDeleteModal();
        })
        .catch(err => showToast("Error", err.message, false));
}

// RENDER & SELECTION
function filterCategory(category) {
    activeFilter = category;
    const btnAll = document.getElementById('btn-All');
    const btnBridal = document.getElementById('btn-Bridal');
    const btnContemporary = document.getElementById('btn-Contemporary');
    const btnAqua = document.getElementById('btn-Aqua');

    const activeClasses = "filter-btn active shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold bg-white/85 backdrop-blur-md border border-rosepink/30 text-hennadark shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:border-pink-500 hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-600 hover:text-white";
    const inactiveClasses = "filter-btn shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold bg-white/85 backdrop-blur-md text-hennadark border border-rosepink/30 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:border-pink-500 hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-600 hover:text-white";

    if (btnAll) btnAll.className = category === 'All' ? activeClasses : inactiveClasses;
    if (btnBridal) btnBridal.className = category === 'Bridal Heritage' ? activeClasses : inactiveClasses;
    if (btnContemporary) btnContemporary.className = category === 'Contemporary Chic' ? activeClasses : inactiveClasses;
    if (btnAqua) btnAqua.className = category === 'Aqua Tattoos' ? activeClasses : inactiveClasses;

    renderCards();

}

function renderCards() {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;

    // Show Skeletons if still fetching from Firebase
    if (isLoading) {
        renderSkeletons();
        return;
    }

    const filteredCards = activeFilter === 'All' 
        ? cardsData 
        : cardsData.filter(card => card.category === activeFilter);

    if (filteredCards.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-rosepink/30">
                <i class="fa-solid fa-leaf text-3xl mb-2 text-rosepink/50"></i>
                <p class="text-xs font-bold uppercase tracking-wider">No Designs Found</p>
            </div>`;
        renderChosenSlider();
        return;
    }

    grid.innerHTML = filteredCards.map(card => {
        const isSelected = card.id === selectedCardId;
        const ownerControls = isOwnerLoggedIn ? `
            <div class="absolute top-2 right-2 z-20 flex gap-1.5 bg-hennadark/80 p-1 rounded-lg backdrop-blur-sm border border-rosepink/30">
                <button onclick="openEditModal('${card.id}')" class="w-7 h-7 rounded-md bg-amber-500 text-white flex items-center justify-center text-xs hover:scale-105 transition-all">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="triggerDeleteModal('${card.id}')" class="w-7 h-7 rounded-md bg-rose-600 text-white flex items-center justify-center text-xs hover:scale-105 transition-all">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        ` : '';

        const imgSrc = (card.images && card.images[0]) ? card.images[0] : '';

        return `
            <div class="bg-white rounded-2xl border-2 ${isSelected ? 'border-pink-500 ring-2 ring-rosepink/40 shadow-lg' : 'border-rosepink/20'} overflow-hidden shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between">
                ${ownerControls}
                <div>
                    <div class="relative h-72 sm:h-80 overflow-hidden bg-gray-100">
                        <img src="${imgSrc}" alt="${card.title}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
                        <span class="absolute bottom-2 left-2 bg-hennadark/80 text-rosepink text-[9px] font-bold uppercase px-2 py-0.5 rounded-md backdrop-blur-sm">
                            ${card.category}
                        </span>
                    </div>

                    <div class="p-3.5">
                        <h4 class="font-serif font-extrabold text-base text-henna line-clamp-1">${card.title}</h4>
                        <p class="text-xs font-black text-rosepinkdark mt-0.5">Rs. ${card.price ? card.price.toLocaleString() : 0}</p>
                    </div>
                </div>

                <div class="p-3.5 pt-0">
                    <button onclick="selectCard('${card.id}', true)" class="select-design-btn w-full py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5">
                        <i class="fa-solid ${isSelected ? 'fa-circle-check text-green-600' : 'fa-plus text-rosepink'}"></i>
                        <span>${isSelected ? 'Selected (Reserve Slot)' : 'Select Design'}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    renderChosenSlider();
}

function selectCard(id, autoOpenModal = true) {
    selectedCardId = id;
    const card = cardsData.find(c => c.id == id);

    if (card) {
        const cardTitleInput = document.getElementById('selected-card-title');
        const modalDesignName = document.getElementById('slot-modal-design-name');
        const bottomBarTitle = document.getElementById('bottom-bar-title');
        const bottomBarPrice = document.getElementById('bottom-bar-price');
        
        if (cardTitleInput) cardTitleInput.value = card.title;
        if (modalDesignName) modalDesignName.innerText = `${card.title} - Rs. ${card.price ? card.price.toLocaleString() : 0}`;
        if (bottomBarTitle) bottomBarTitle.innerText = card.title;
        if (bottomBarPrice) bottomBarPrice.innerText = `Rs. ${card.price ? card.price.toLocaleString() : 0}`;
    }

    renderCards();
    if (autoOpenModal) toggleSlotModal(true);
}

function renderChosenSlider() {
    const slider = document.getElementById('chosen-design-slider');
    const countBadge = document.getElementById('slider-card-count');
    if (!slider) return;

    if (countBadge) countBadge.innerText = `${cardsData.length} Available`;

    slider.innerHTML = cardsData.map(card => {
        const isSelected = card.id === selectedCardId;
        const imgSrc = (card.images && card.images[0]) ? card.images[0] : '';
        return `
            <div onclick="selectCard('${card.id}', false)" class="shrink-0 cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative w-12 h-12 ${isSelected ? 'border-pink-500 ring-2 ring-rosepink/40 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}">
                <img src="${imgSrc}" class="w-full h-full object-cover" alt="${card.title}">
            </div>
        `;
    }).join('');
}

// FORM VALIDATION & SOCIAL MEDIA SUBMISSIONS
function getBookingDetails() {
    const name = document.getElementById('cust-name')?.value.trim();
    const phone = document.getElementById('cust-phone')?.value.trim();
    const date = document.getElementById('cust-date')?.value;
    const location = document.getElementById('cust-location')?.value.trim();
    const card = cardsData.find(c => c.id === selectedCardId);

    if (!card) {
        showToast("Select Design", "Pehle catalog se design select karein!", false);
        return null;
    }
    if (!name || !phone || !date || !location) {
        showToast("Incomplete Form", "Name, Phone, Visit Date aur Location fill karein!", false);
        return null;
    }

    const message = `✨ *SLOT RESERVATION REQUEST - REBA ARTISTRY* ✨\n\n` +
        `👤 *Name:* ${name}\n` +
        `📞 *Phone:* ${phone}\n` +
        `📅 *Visit Date:* ${date}\n` +
        `📍 *Location:* ${location}\n\n` +
        `🎨 *Design:* ${card.title}\n` +
        `💰 *Price:* Rs. ${card.price.toLocaleString()}\n` +
        `💳 *Advance:* Rs. 300 Deposit\n\n` +
        `Please confirm slot availability!`;

    return { name, message };
}

function sendToInstagram() {
    const data = getBookingDetails();
    if (!data) return;

    navigator.clipboard.writeText(data.message).then(() => {
        showToast("Copied to Clipboard!", "Instagram open ho raha hai. Direct Message box mein Paste karke Send karein!", true);
    }).catch(() => {
        showToast("Opening Instagram", "Direct Message Screen open ho rahi hai...", true);
    });

    const nativeAppUrl = `instagram://user?username=rebaa.rtistry`;
    const webFallbackUrl = `https://ig.me/m/rebaa.rtistry`;

    setTimeout(() => {
        window.location.href = nativeAppUrl;

        setTimeout(() => {
            if (!document.hidden) {
                window.open(webFallbackUrl, '_blank');
            }
        }, 1200);
    }, 800);
}

function sendToTikTok() {
    const data = getBookingDetails();
    if (!data) return;

    navigator.clipboard.writeText(data.message).then(() => {
        showToast("Copied to Clipboard!", "TikTok open ho raha hai. Direct Message box mein Paste karke Send karein!", true);
    }).catch(() => {
        showToast("Opening TikTok", "Direct Message Screen open ho rahi hai...", true);
    });

    const nativeAppUrl = `snssdk1128://user/profile/rebaa.rtistry`;
    const webFallbackUrl = `https://www.tiktok.com/@rebaa.rtistry`;

    setTimeout(() => {
        window.location.href = nativeAppUrl;

        setTimeout(() => {
            if (!document.hidden) {
                window.open(webFallbackUrl, '_blank');
            }
        }, 1200);
    }, 800);
}
// ==========================================
// ADVANCED TRAFFIC ANALYTICS LOGIC (STEP 2)
// ==========================================

// 1. Visitor Source Detection (Instagram, TikTok, Direct)
function getTrafficSource() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source')?.toLowerCase();
    const referrer = document.referrer.toLowerCase();

    if (utmSource === 'instagram' || referrer.includes('instagram.com')) {
        return 'instagram';
    } else if (utmSource === 'tiktok' || referrer.includes('tiktok.com')) {
        return 'tiktok';
    } else {
        return 'other';
    }
}

// Visitor Tracking for Realtime Database
function trackVisitorSource() {
    if (!database) return;

    if (sessionStorage.getItem('visited_session')) {
        return; 
    }

    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('utm_source');
    let trackingKey = 'direct';

    if (source === 'instagram') {
        trackingKey = 'instagram';
    } else if (source === 'tiktok') {
        trackingKey = 'tiktok';
    }

    const analyticsRef = database.ref('analytics/' + trackingKey);
    analyticsRef.transaction((currentValue) => {
        return (currentValue || 0) + 1;
    }, (error, committed) => {
        if (committed) {
            sessionStorage.setItem('visited_session', 'true');
        }
    });
}

// Live Analytics Listener for Realtime Database
function listenAnalyticsData() {
    if (!database) return;

    const analyticsRef = database.ref('analytics');
    analyticsRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        
        const instagramCount = data.instagram || 0;
        const tiktokCount = data.tiktok || 0;
        const directCount = data.direct || 0;
        const total = instagramCount + tiktokCount + directCount;

        // UI elements update
        const instaElem = document.getElementById('instagramCount');
        const tiktokElem = document.getElementById('tiktokCount');
        const directElem = document.getElementById('directCount');
        const totalElem = document.getElementById('totalVisitorsCount');

        if (instaElem) instaElem.innerText = instagramCount;
        if (tiktokElem) tiktokElem.innerText = tiktokCount;
        if (directElem) directElem.innerText = directCount;
        if (totalElem) totalElem.innerText = total;
    });
}

// Page Load par Call karein
trackVisitorSource();

// 3. Live Analytics Modal Stream
function listenAnalyticsData() {
    db.collection("analytics").doc("traffic").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const instaEl = document.getElementById("stat-insta");
            const tiktokEl = document.getElementById("stat-tiktok");
            const otherEl = document.getElementById("stat-other");
            const totalEl = document.getElementById("stat-total");

            if (instaEl) instaEl.innerText = data.instagram || 0;
            if (tiktokEl) tiktokEl.innerText = data.tiktok || 0;
            if (otherEl) otherEl.innerText = data.other || 0;
            if (totalEl) totalEl.innerText = data.total || 0;
        }
    });
}

// 4. Toggle Analytics Modal
function toggleAnalyticsModal(show) {
    const modal = document.getElementById('analytics-modal');
    if (!modal) return;
    if (show) {
        modal.classList.remove('hidden');
        listenAnalyticsData();
    } else {
        modal.classList.add('hidden');
    }
}

// Auto track visitor and start real-time listener on page load
document.addEventListener("DOMContentLoaded", () => {
    trackVisitorSource();
    listenAnalyticsData();
});
