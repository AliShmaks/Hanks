// contact.js - Hanks BBQ Contact Page

// ========== LOADER ==========
let loaderStartTime = Date.now();

function hideLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const elapsed = Date.now() - loaderStartTime;
    const remaining = Math.max(0, 900 - elapsed);
    setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => { loader.style.display = 'none'; }, 500);
    }, remaining);
}

window.addEventListener('load', hideLoader);
setTimeout(hideLoader, 3000);

// ========== SCROLL PROGRESS ==========
let scrollTicking = false;

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const progressBar = document.getElementById('scrollProgress');
            if (progressBar) {
                progressBar.style.width = (height > 0 ? (scrollY / height) * 100 : 0) + '%';
            }
            scrollTicking = false;
        });
        scrollTicking = true;
    }
});

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ========== LOCATION DATA - HANKS BBQ BRANCHES ==========
const locations = [
    { name: 'Khaldeh', phone: '96176002206', display: '76 002 206' },
    { name: 'Dahye', phone: '96181600699', display: '81 600 699' },
    { name: 'Jneh', phone: '96181863086', display: '81 863 086' }
];

// ========== SHOW LOCATION POPUP ==========
function showLocationPopup(callback, contextData = {}) {
    // Remove existing modal if any
    const existingModal = document.getElementById('locationPopup');
    if (existingModal) existingModal.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'locationPopup';
    modal.className = 'location-popup';
    modal.innerHTML = `
        <div class="location-popup-content">
            <div class="location-popup-header">
                <h3>📍 Select Your Branch</h3>
                <button class="location-popup-close" id="closeLocationPopup">&times;</button>
            </div>
            <div class="location-popup-body">
                <p>Which Hanks BBQ branch would you like to contact?</p>
                <div class="location-options">
                    ${locations.map(loc => `
                        <button class="location-option" data-phone="${loc.phone}" data-name="${loc.name}">
                            <span class="loc-name">${loc.name}</span>
                            <span class="loc-phone">${loc.display}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close button
    document.getElementById('closeLocationPopup').onclick = () => {
        modal.remove();
        document.body.style.overflow = '';
    };
    
    // Click outside to close
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    };
    
    // Handle location selection
    document.querySelectorAll('.location-option').forEach(btn => {
        btn.onclick = () => {
            const phoneNum = btn.getAttribute('data-phone');
            const locName = btn.getAttribute('data-name');
            modal.remove();
            document.body.style.overflow = '';
            callback(phoneNum, locName, contextData);
        };
    });
}

// ========== HANDLE PHONE CLICK ==========
function handlePhoneClick(phoneNum, locName, contextData) {
    window.location.href = `tel:${phoneNum}`;
    showToast(`Calling ${locName}...`);
}

// ========== HANDLE WHATSAPP CLICK ==========
function handleWhatsAppClick(phoneNum, locName, contextData) {
    const message = `Hello Hanks BBQ ${locName}! I'm contacting you from your website.`;
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNum}?text=${encodedMsg}`, '_blank');
    showToast(`Opening WhatsApp for ${locName}...`);
}

// ========== HANDLE FORM SUBMIT ==========
function handleFormSubmit(phoneNum, locName, contextData) {
    const { name, userPhone, message } = contextData;
    
    const whatsappMsg = `🍖 *New Contact Message from Hanks BBQ Website* 🍖\n\n🏪 *Branch:* ${locName}\n👤 *Name:* ${name}\n📱 *Phone:* ${userPhone}\n💬 *Message:* ${message}\n\n---\n*Sent from Hanks BBQ Contact Form*`;
    
    const encodedMsg = encodeURIComponent(whatsappMsg);
    window.open(`https://wa.me/${phoneNum}?text=${encodedMsg}`, '_blank');
    
    // Reset form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) contactForm.reset();
    
    showToast(`Sending message to ${locName}...`);
}

// ========== SETUP CONTACT ACTIONS ==========
document.addEventListener('DOMContentLoaded', function() {
    
    // Phone call link - show location popup
    const phoneLink = document.getElementById('phoneLink');
    if (phoneLink) {
        phoneLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLocationPopup(handlePhoneClick, {});
        });
    }
    
    // WhatsApp links - show location popup
    const whatsappLink = document.getElementById('whatsappLink');
    if (whatsappLink) {
        whatsappLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLocationPopup(handleWhatsAppClick, {});
        });
    }
    
    // Contact Form submit
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('contactName')?.value.trim();
            const userPhone = document.getElementById('contactPhone')?.value.trim();
            const message = document.getElementById('contactMessage')?.value.trim();
            
            if (!name || !userPhone || !message) {
                showToast('Please fill in all fields');
                return;
            }
            
            showLocationPopup(handleFormSubmit, { name, userPhone, message });
        });
    }
});

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========== NAVBAR FUNCTIONS ==========
function toggleMenuDropdown() {
    const dropdown = document.getElementById('menuDropdown');
    const arrow = document.getElementById('ddArrow');
    if (dropdown) {
        dropdown.classList.toggle('open');
        if (arrow) {
            arrow.style.transform = dropdown.classList.contains('open') ? 'rotate(180deg)' : '';
        }
    }
}

document.addEventListener('click', function(e) {
    const wrap = document.getElementById('menuDropdownWrap');
    if (wrap && !wrap.contains(e.target)) {
        const dropdown = document.getElementById('menuDropdown');
        const arrow = document.getElementById('ddArrow');
        if (dropdown) dropdown.classList.remove('open');
        if (arrow) arrow.style.transform = '';
    }
});

const menuTrigger = document.getElementById('menuTrigger');
if (menuTrigger) {
    menuTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        toggleMenuDropdown();
    });
}

// ========== MOBILE MENU ==========
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');

function openMobileMenu() {
    if (mobileMenu) mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    if (mobileMenu) mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMobileMenu);

document.querySelectorAll('.mobile-menu-links a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
        closeMobileMenu();
    }
});

// ========== CART BADGE ==========
function updateCartBadge() {
    let cart = JSON.parse(sessionStorage.getItem('hanks_cart')) || [];
    const total = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        if (total > 0) {
            badge.textContent = total;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Listen for cart updates
window.addEventListener('storage', function(e) {
    if (e.key === 'hanks_cart') {
        updateCartBadge();
    }
});

document.addEventListener('DOMContentLoaded', updateCartBadge);

// ========== INIT LUCIDE ICONS ==========
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

setTimeout(function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}, 500);