// checkout.js - Hanks BBQ Checkout Page

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

// ========== CART FUNCTIONS ==========
let cart = JSON.parse(sessionStorage.getItem('hanks_cart')) || [];

function saveCart() {
    sessionStorage.setItem('hanks_cart', JSON.stringify(cart));
    updateCartUI();
}

function removeFromCart(key) {
    cart = cart.filter(c => c.key !== key);
    saveCart();
    updateCartUI();
}

function changeQty(key, delta) {
    const item = cart.find(c => c.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(c => c.key !== key);
    }
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Update cart badge in navbar
    const badges = ['navCartBadge'];
    badges.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (totalQty > 0) {
                el.textContent = totalQty;
                el.style.display = 'flex';
            } else {
                el.style.display = 'none';
            }
        }
    });
    
    // Update checkout items
    const container = document.getElementById('checkoutItems');
    if (container) {
        if (cart.length === 0) {
            container.innerHTML = `<div class="empty-cart">Your cart is empty.<br><a href="menu.html?mode=delivery">Browse Menu</a></div>`;
        } else {
            container.innerHTML = cart.map(item => {
                let imgSrc = item.image || '';
                return `
                    <div class="checkout-item" data-key="${item.key}">
                        <div class="checkout-item-img">
                            <img src="${imgSrc}" alt="${item.name}" onerror="this.style.display='none'">
                        </div>
                        <div class="checkout-item-info">
                            <div class="checkout-item-name">${item.name}</div>
                            <div class="checkout-item-price">$${item.price.toFixed(2)} each</div>
                        </div>
                        <div class="checkout-qty-controls">
                            <button class="qty-btn" onclick="changeQty('${item.key}', -1)">−</button>
                            <span class="qty-value">${item.qty}</span>
                            <button class="qty-btn" onclick="changeQty('${item.key}', 1)">+</button>
                        </div>
                        <div class="checkout-item-total">$${(item.price * item.qty).toFixed(2)}</div>
                        <button class="remove-item" onclick="removeFromCart('${item.key}')">✕</button>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Update total
    const totalEl = document.getElementById('checkoutTotal');
    if (totalEl) {
        totalEl.textContent = `$${totalPrice.toFixed(2)}`;
    }
}

// ========== LOCATION DATA - HANKS BBQ BRANCHES ==========
const locations = [
    { name: 'Khaldeh', phone: '96176002206', display: '76 002 206' },
    { name: 'Dahye', phone: '96181600699', display: '81 600 699' },
    { name: 'Jneh', phone: '96181863086', display: '81 863 086' }
];

// ========== PLACE ORDER - WITH LOCATION SELECTION ==========
function placeOrder() {
    const name = document.getElementById('coName')?.value.trim();
    const phone = document.getElementById('coPhone')?.value.trim();
    const address = document.getElementById('coAddress')?.value.trim();
    const note = document.getElementById('coNote')?.value.trim();
    
    if (!name || !phone || !address) {
        showToast('Please fill in all required fields');
        return;
    }
    
    if (cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }
    
    // Show location selection popup
    showLocationPopup(name, phone, address, note);
}

// ========== SHOW LOCATION SELECTION POPUP ==========
function showLocationPopup(name, phone, address, note) {
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
                <p>Which Hanks BBQ branch would you like to order from?</p>
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
            sendOrderToWhatsApp(phoneNum, locName, name, phone, address, note);
        };
    });
}

// ========== SEND ORDER TO SELECTED BRANCH ==========
function sendOrderToWhatsApp(phoneNum, locName, customerName, customerPhone, address, note) {
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Format WhatsApp message
    let message = '🍖 *NEW ORDER FROM HANKS BBQ* 🍖\n\n';
    message += `🏪 *Branch:* ${locName}\n`;
    message += `👤 *Name:* ${customerName}\n`;
    message += `📞 *Phone:* ${customerPhone}\n`;
    message += `📍 *Address:* ${address}\n`;
    if (note) message += `📝 *Note:* ${note}\n`;
    message += '\n━━━━━━━━━━━━━━━━━━\n\n';
    message += '*ORDER DETAILS:*\n';
    
    cart.forEach(item => {
        message += `• ${item.name} x${item.qty} — $${(item.price * item.qty).toFixed(2)}\n`;
    });
    
    message += '\n━━━━━━━━━━━━━━━━━━\n';
    message += `💰 *TOTAL: $${totalPrice.toFixed(2)}*\n\n`;
    message += '_Delivery fee calculated upon arrival._\n';
    message += `Thank you for ordering from Hanks BBQ ${locName}! 🍖🔥`;
    
    // Encode message for WhatsApp
    const encodedMsg = encodeURIComponent(message);
    
    // Open WhatsApp with selected branch number
    window.open(`https://wa.me/${phoneNum}?text=${encodedMsg}`, '_blank');
    
    showToast(`Opening WhatsApp for ${locName}...`);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
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

// ========== INIT LUCIDE ICONS ==========
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

setTimeout(function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}, 500);

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});

// Make functions global
window.removeFromCart = removeFromCart;
window.changeQty = changeQty;
window.placeOrder = placeOrder;