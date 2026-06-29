// location.js - Hanks BBQ Location Page

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

// ===== INIT LUCIDE ICONS =====
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// ===== MARK BODY AS LOADED =====
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// ===== LOCATION CARD INTERACTIONS =====
document.querySelectorAll('.location-phone, .location-direction').forEach(link => {
    link.addEventListener('click', function(e) {
        if (this.classList.contains('location-phone')) {
            // Phone click is fine, let it go through
        } else {
            console.log('Getting directions for:', this.closest('.location-card')?.querySelector('.location-name')?.textContent);
        }
    });
});