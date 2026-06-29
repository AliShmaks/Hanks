/* ========================================
   HANKS BBQ - TESTIMONIALS PAGE JS
   ======================================== */

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

// ===== SCROLL PROGRESS =====
let scrollTicking = false;
window.addEventListener('scroll', function() {
    if (!scrollTicking) {
        requestAnimationFrame(function() {
            const scrollY = window.scrollY;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const progressBar = document.getElementById('scrollProgress');
            if (progressBar) progressBar.style.width = (height > 0 ? (scrollY / height) * 100 : 0) + '%';
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
        if (arrow) arrow.style.transform = dropdown.classList.contains('open') ? 'rotate(180deg)' : '';
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
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) closeMobileMenu();
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
document.addEventListener('DOMContentLoaded', updateCartBadge);

// Listen for cart updates across pages
window.addEventListener('storage', function(e) {
    if (e.key === 'hanks_cart') {
        updateCartBadge();
    }
});

// ===== STATS COUNTER ANIMATION =====
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const target = parseFloat(element.getAttribute('data-target'));
                let current = 0;
                const increment = target / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        element.textContent = target;
                        clearInterval(timer);
                    } else {
                        element.textContent = Math.floor(current);
                    }
                }, 30);
                observer.unobserve(element);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

// ===== SCROLL REVEAL ANIMATIONS =====
if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    function initScrollReveal() {
        // Testimonial cards reveal
        gsap.utils.toArray('.testimonial-card').forEach((card, index) => {
            gsap.fromTo(card,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: index * 0.1,
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });
        
        // Stats section reveal
        gsap.fromTo('.stat-card',
            { opacity: 0, scale: 0.8 },
            {
                opacity: 1,
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.stats-section',
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
        
        // CTA section reveal
        gsap.fromTo('.cta-content',
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                scrollTrigger: {
                    trigger: '.cta-section',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }

    // ===== INIT SCROLL REVEAL =====
    document.addEventListener('DOMContentLoaded', function() {
        initScrollReveal();
    });
}

// ===== INIT LUCIDE ICONS =====
function initLucide() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ===== RUN ON LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    initLucide();
    animateStats();
});

// Run again after a short delay for any dynamic content
setTimeout(function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}, 500);

// Force Lucide icons to load properly in mobile menu
setTimeout(function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}, 100);

// Re-run icons when mobile menu opens
const mobileMenuBtn2 = document.getElementById('mobileMenuBtn');
const mobileMenu2 = document.getElementById('mobileMenu');

if (mobileMenuBtn2 && mobileMenu2) {
    mobileMenuBtn2.addEventListener('click', function() {
        setTimeout(function() {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    });
}