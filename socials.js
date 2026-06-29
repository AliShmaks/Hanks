// socials.js - Hanks BBQ Socials Page

// ===== LOADER =====
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

// ===== SCROLL PROGRESS BAR =====
let scrollTicking = false;
window.addEventListener('scroll', function() {
    if (!scrollTicking) {
        requestAnimationFrame(function() {
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

// ===== MENU DROPDOWN =====
function toggleMenuDropdown() {
    const dropdown = document.getElementById('menuDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
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
        const arrow = document.querySelector('.dropdown-arrow');
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

// ===== MOBILE MENU =====
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

// ===== CART BADGE =====
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

// Listen for cart updates across pages
window.addEventListener('storage', function(e) {
    if (e.key === 'hanks_cart') {
        updateCartBadge();
    }
});

document.addEventListener('DOMContentLoaded', updateCartBadge);

// ===== TOAST FUNCTION =====
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ===== WHATSAPP POPUP WITH 3 NUMBERS =====
function createWhatsAppModal() {
    const modal = document.createElement('div');
    modal.className = 'whatsapp-modal';
    modal.id = 'whatsappModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-icon">
                <i class="fab fa-whatsapp"></i>
            </div>
            <h3>Choose a number</h3>
            <p>Select a WhatsApp number to chat with us</p>
            <div class="number-options">
                <div class="number-btn" data-number="96176002206">
                    <span class="number-text">
                        <i class="fas fa-phone-alt"></i>
                        <span>🇱🇧 Khaldeh - 76 002 206</span>
                    </span>
                    <i class="fab fa-whatsapp whatsapp-icon"></i>
                </div>
                <div class="number-btn" data-number="96181600699">
                    <span class="number-text">
                        <i class="fas fa-phone-alt"></i>
                        <span>🇱🇧 Dahye - 81 600 699</span>
                    </span>
                    <i class="fab fa-whatsapp whatsapp-icon"></i>
                </div>
                <div class="number-btn" data-number="96181863086">
                    <span class="number-text">
                        <i class="fas fa-phone-alt"></i>
                        <span>🇱🇧 Jneh - 81 863 086</span>
                    </span>
                    <i class="fab fa-whatsapp whatsapp-icon"></i>
                </div>
            </div>
            <button class="close-modal-btn">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// ===== INITIALIZE WHATSAPP =====
document.addEventListener('DOMContentLoaded', function() {
    const whatsappCard = document.getElementById('whatsappBtn');
    
    if (whatsappCard) {
        whatsappCard.addEventListener('click', function(e) {
            e.preventDefault();
            
            let modal = document.getElementById('whatsappModal');
            if (!modal) {
                modal = createWhatsAppModal();
            }
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            const numberBtns = modal.querySelectorAll('.number-btn');
            numberBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const phoneNumber = this.getAttribute('data-number');
                    const whatsappUrl = `https://wa.me/${phoneNumber}`;
                    window.open(whatsappUrl, '_blank');
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    showToast('Opening WhatsApp...');
                });
            });
            
            const closeBtn = modal.querySelector('.close-modal-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
    }
});

// ===== INSTAGRAM AND TIKTOK UPDATED LINKS =====
const instagramCard = document.querySelector('.social-card.instagram');
if (instagramCard) {
    instagramCard.setAttribute('href', 'https://www.instagram.com/hanks.bbq/?hl=en');
    instagramCard.setAttribute('target', '_blank');
}

const tiktokCard = document.querySelector('.social-card.tiktok');
if (tiktokCard) {
    tiktokCard.setAttribute('href', 'https://www.tiktok.com/@hanks_bbq_delbani');
    tiktokCard.setAttribute('target', '_blank');
}

// ===== INIT LUCIDE ICONS =====
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// ===== MARK BODY AS LOADED =====
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});