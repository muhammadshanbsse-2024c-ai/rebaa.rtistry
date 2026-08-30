// ==========================================
// CONFIGURATION & GLOBAL STATES
// ==========================================
const OWNER_PASSWORD = "A786";
const INSTAGRAM_USERNAME = "reba_artistry"; 
const TIKTOK_USERNAME = "reba_artistry";    


let isOwnerLoggedIn = false;
let selectedCardId = null;
let cardIdToDelete = null; // Store card ID for custom delete popup
let activeFilter = 'All';
let currentEditImageUrl = "";

let cardsData = [
    {
        id: 1,
        title: "Royal Shehnai Full-Elbow",
        category: "Bridal Heritage",
        price: 28000,
        images: ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"]
    },
    {
        id: 2,
        title: "Maharani Classic Mid-Arm",
        category: "Bridal Heritage",
        price: 18500,
        images: ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80"]
    },
    {
        id: 3,
        title: "Minimalist Arabic Pattern",
        category: "Contemporary Chic",
        price: 9500,
        images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"]
    }
];

document.addEventListener("DOMContentLoaded", () => {
    if (cardsData.length > 0) {
        selectCard(cardsData[0].id, false);
    } else {
        renderCards();
    }
    updateOwnerUIState();
});

// UI NAVIGATION & MODALS
function toggleSideDrawer(open) {
    const drawer = document.getElementById('side-drawer');
    const backdrop = document.getElementById('side-drawer-backdrop');
    if (!drawer || !backdrop) return;

    if (open) {
        drawer.classList.add('drawer-open');
        backdrop.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.remove('drawer-open');
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
    const ownerBtnText = document.getElementById('owner-btn-text');
    const directAddBtn = document.getElementById('direct-add-btn');

    if (isOwnerLoggedIn) {
        if (lockIcon) lockIcon.className = "fa-solid fa-unlock text-rosepink text-[10px]";
        if (ownerBtnText) ownerBtnText.innerText = "Deactivate Owner";
        if (directAddBtn) {
            directAddBtn.classList.remove('hidden');
            directAddBtn.onclick = () => openAddModal();
        }
    } else {
        if (lockIcon) lockIcon.className = "fa-solid fa-lock text-rosepink text-[10px]";
        if (ownerBtnText) ownerBtnText.innerText = "Owner Panel";
        if (directAddBtn) directAddBtn.classList.add('hidden');
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
    const card = cardsData.find(item => item.id === id);
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
    
    currentEditImageUrl = card.images[0] || "";
    if (previewImg && previewContainer && currentEditImageUrl) {
        previewImg.src = currentEditImageUrl;
        previewContainer.classList.remove('hidden');
    }
    toggleAdminModal(true);
}

function saveCardData(e) {
    if (e) e.preventDefault();
    const editId = document.getElementById('edit-card-id')?.value;
    const title = document.getElementById('new-title')?.value.trim();
    const category = document.getElementById('new-category')?.value;
    const price = Number(document.getElementById('new-price')?.value);
    const fileInput = document.getElementById('new-image-file');

    if (!title || !price) {
        showToast("Error", "Please fill design title and price!", false);
        return;
    }

    const executeSave = (imageUrl) => {
        if (editId) {
            const cardIndex = cardsData.findIndex(item => item.id == editId);
            if (cardIndex !== -1) {
                cardsData[cardIndex] = { ...cardsData[cardIndex], title, category, price, images: [imageUrl] };
                showToast("Updated!", "Design updated successfully!");
                if (selectedCardId == editId) selectCard(Number(editId), false);
            }
        } else {
            const newCard = { id: Date.now(), title, category, price, images: [imageUrl] };
            cardsData.push(newCard);
            showToast("Published!", "New design added to catalog!");
            selectCard(newCard.id, false);
        }

        toggleAdminModal(false);
        renderCards();
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (event) { executeSave(event.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (editId && currentEditImageUrl) {
        executeSave(currentEditImageUrl);
    } else {
        showToast("Error", "Please upload a photo for the design!", false);
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
    if (!cardIdToDelete) return;
    
    cardsData = cardsData.filter(item => item.id !== cardIdToDelete);
    if (selectedCardId === cardIdToDelete) {
        selectedCardId = cardsData.length > 0 ? cardsData[0].id : null;
        if (selectedCardId) selectCard(selectedCardId, false);
    }
    
    closeDeleteModal();
    showToast("Deleted", "Design card has been removed!", false);
    renderCards();
}

// RENDER & SELECTION
function filterCategory(category) {
    activeFilter = category;
    const btnAll = document.getElementById('btn-All');
    const btnBridal = document.getElementById('btn-Bridal');
    const btnContemporary = document.getElementById('btn-Contemporary');

    const activeClasses = "filter-btn active shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold bg-henna text-cream transition-all shadow";
    const inactiveClasses = "filter-btn shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold bg-softpink text-henna border border-rosepink/30 hover:bg-rosepink transition-all";

    if (btnAll) btnAll.className = category === 'All' ? activeClasses : inactiveClasses;
    if (btnBridal) btnBridal.className = category === 'Bridal Heritage' ? activeClasses : inactiveClasses;
    if (btnContemporary) btnContemporary.className = category === 'Contemporary Chic' ? activeClasses : inactiveClasses;

    renderCards();
}

function renderCards() {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;

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
                <button onclick="openEditModal(${card.id})" class="w-7 h-7 rounded-md bg-amber-500 text-white flex items-center justify-center text-xs hover:scale-105 transition-all">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="triggerDeleteModal(${card.id})" class="w-7 h-7 rounded-md bg-rose-600 text-white flex items-center justify-center text-xs hover:scale-105 transition-all">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        ` : '';

        return `
            <div class="bg-white rounded-2xl border-2 ${isSelected ? 'border-rosepink ring-2 ring-rosepink/30' : 'border-rosepink/20'} overflow-hidden shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between">
                ${ownerControls}
                <div>
                    <div class="relative h-72 sm:h-80 overflow-hidden bg-gray-100">
                        <img src="${card.images[0]}" alt="${card.title}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
                        <span class="absolute bottom-2 left-2 bg-hennadark/80 text-rosepink text-[9px] font-bold uppercase px-2 py-0.5 rounded-md backdrop-blur-sm">
                            ${card.category}
                        </span>
                    </div>

                    <div class="p-3.5">
                        <h4 class="font-serif font-extrabold text-base text-henna line-clamp-1">${card.title}</h4>
                        <p class="text-xs font-black text-rosepinkdark mt-0.5">Rs. ${card.price.toLocaleString()}</p>
                    </div>
                </div>

                <div class="p-3.5 pt-0">
                    <button onclick="selectCard(${card.id}, true)" class="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${isSelected ? 'bg-rosepink text-hennadark' : 'bg-softpink text-henna border border-rosepink/30 hover:bg-rosepink/40'}">
                        <i class="fa-solid ${isSelected ? 'fa-circle-check' : 'fa-plus'}"></i>
                        ${isSelected ? 'Selected (Reserve Slot)' : 'Select Design'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    renderChosenSlider();
}

function selectCard(id, autoOpenModal = true) {
    selectedCardId = id;
    const card = cardsData.find(c => c.id === id);

    if (card) {
        const cardTitleInput = document.getElementById('selected-card-title');
        const modalDesignName = document.getElementById('slot-modal-design-name');
        const bottomBarTitle = document.getElementById('bottom-bar-title');
        const bottomBarPrice = document.getElementById('bottom-bar-price');
        
        if (cardTitleInput) cardTitleInput.value = card.title;
        if (modalDesignName) modalDesignName.innerText = `${card.title} - Rs. ${card.price.toLocaleString()}`;
        if (bottomBarTitle) bottomBarTitle.innerText = card.title;
        if (bottomBarPrice) bottomBarPrice.innerText = `Rs. ${card.price.toLocaleString()}`;
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
        return `
            <div onclick="selectCard(${card.id}, false)" class="shrink-0 cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative w-12 h-12 ${isSelected ? 'border-rosepink ring-2 ring-rosepink/40 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}">
                <img src="${card.images[0]}" class="w-full h-full object-cover" alt="${card.title}">
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
        showToast("Details copied to clipboard! Instagram is opening. Paste it in the Direct Message box and hit Send!", true);
    }).catch(() => {
        showToast("Opening Instagram", "Direct Message screen is opening...", true);
    });

    // Corrected URLs
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
        showToast("Details copied to clipboard! Tiktok is opening. Paste it in the Direct Message box and hit Send!", true);
    }).catch(() => {
        showToast("Opening TikTok", "Direct Message screen is opening...", true);
    });

    // Corrected URLs
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
// OPENING DOOR ANIMATION FUNCTION
function openStudioDoors() {
    const doorLeft = document.getElementById('door-left');
    const doorRight = document.getElementById('door-right');
    const doorContent = document.getElementById('door-content');
    const welcomeWindow = document.getElementById('welcome-window');

    if (doorLeft && doorRight && doorContent) {
        // 1. Center Emblem aur Button fade-out hoga
        doorContent.style.opacity = '0';
        doorContent.style.transform = 'scale(0.8)';

        // 2. Darwaze Dono Taraf Slide Open Honge
        setTimeout(() => {
            doorLeft.style.transform = 'translateX(-100%)';
            doorRight.style.transform = 'translateX(100%)';
        }, 200);

        // 3. Animation khatam hone par overlay poori tarah hat jayega
        setTimeout(() => {
            if (welcomeWindow) {
                welcomeWindow.style.display = 'none';
            }
        }, 1200);
    }
}
