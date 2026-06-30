
// ========== SUPABASE CONFIG ==========
const SUPABASE_URL = 'https://ntvmjhajmltwxkzkatvf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_6J89cbcX9ONNdxZWBQ9hQA_71Uf-I9E'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ========== GLOBAL VARIABLES ==========
let allCategories = []
let allProducts = {}
let selectedCat = null
let menuMode = 'dinein'
let currentView = localStorage.getItem('menu_view') || 'grid'

// ========== LOADER FUNCTIONS ==========
let loaderStartTime = null

function forceHideLoader() {
    const loader = document.getElementById('loader')
    if (loader) {
        loader.classList.add('fade-out')
        setTimeout(() => {
            loader.style.display = 'none'
            document.body.classList.add('loaded')
            // ❌ REMOVE THIS LINE
            // triggerCategoryAnimations(); 
        }, 500)
    }
}

function showLoader() {
    const loader = document.getElementById('loader')
    if (loader) {
        loader.classList.remove('fade-out')
        loader.style.display = 'flex'
        loader.style.opacity = '1'
    }
    loaderStartTime = Date.now()
}

function hideLoader() {
    const elapsed = Date.now() - loaderStartTime
    const remaining = Math.max(0, 900 - elapsed)
    
    const hideLoaderAndAnimate = () => {
        const loader = document.getElementById('loader')
        if (loader) {
            loader.classList.add('fade-out')
            setTimeout(() => {
                loader.style.display = 'none'
                document.body.classList.add('loaded')
                triggerCategoryAnimations(); // 🆕 ADD THIS
            }, 500)
        }
    }
    
    if (remaining > 0) {
        setTimeout(hideLoaderAndAnimate, remaining)
    } else {
        hideLoaderAndAnimate()
    }
}

// 🆕 ADD THIS NEW FUNCTION - Put it right after hideLoader()
function triggerCategoryAnimations() {
    const cards = document.querySelectorAll('.cat-card');
    if (cards.length === 0) return;
    
    // Reset animations
    cards.forEach((card) => {
        card.style.animation = 'none';
        card.style.opacity = '0';
        card.style.transform = 'scale(1.3)';
    });
    
    // Force reflow
    void document.body.offsetHeight;
    
    // ALL cards animate at the SAME time - NO stagger
    cards.forEach((card) => {
        card.style.animation = `categoryZoomIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
        card.style.animationDelay = '0s'; // ← ALL AT ONCE
    });
}

// Keep this at the bottom of LOADER FUNCTIONS
setTimeout(forceHideLoader, 3000)

// ========== SCROLL PROGRESS ==========
let scrollTicking = false
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            const scrollY = window.scrollY
            const height = document.documentElement.scrollHeight - window.innerHeight
            const progressBar = document.getElementById('scrollProgress')
            if (progressBar) {
                progressBar.style.width = (height > 0 ? (scrollY / height) * 100 : 0) + '%'
            }
            scrollTicking = false
        })
        scrollTicking = true
    }
})

// ========== LOAD DATA FROM SUPABASE ==========
async function loadDataFromSupabase() {
    try {
        console.log('Loading data from Supabase...')
        
        const { data: categories, error: catError } = await supabaseClient
            .from('categories')
            .select('*')
            .order('display_order')
        
        if (catError) throw catError
        allCategories = categories || []
        
        const { data: products, error: prodError } = await supabaseClient
            .from('products')
            .select('*')
            .order('display_order', { ascending: true }) 
        
        if (prodError) throw prodError
        
        allProducts = {}
        products?.forEach(product => {
            if (!allProducts[product.category_key]) {
                allProducts[product.category_key] = []
            }
            allProducts[product.category_key].push(product)
        })
        
        console.log('Data loaded:', { categories: allCategories.length, products: products?.length })
        
    } catch (error) {
        console.error('Error loading data:', error)
        showToast('Error loading menu data')
    }
}

// ========== CART FUNCTIONS ==========
let cart = JSON.parse(sessionStorage.getItem('hanks_cart')) || []

function saveCart() {
    sessionStorage.setItem('hanks_cart', JSON.stringify(cart))
    updateCartUI()
}

function addToCart(catId, idx, buttonElement = null) {
    const item = allProducts[catId][idx]
    const key = catId + '-' + idx
    const existing = cart.find(c => c.key === key)
    
    if (existing) {
        existing.qty++
    } else {
        cart.push({ 
            key, catId, idx, 
            name: item.name, 
            price: item.price, 
            image: item.image_seed, 
            qty: 1 
        })
    }
    saveCart()
    showToast(item.name + ' added to cart!')
    
    updateSingleCard(catId, idx)
}

function updateSingleCard(catId, idx) {
    const key = catId + '-' + idx
    const cartItem = cart.find(c => c.key === key)
    const actionContainer = document.querySelector(`.mc-action[data-key="${key}"]`)
    
    if (!actionContainer) return
    
    const isDelivery = menuMode === 'delivery'
    
    if (isDelivery) {
        if (cartItem && cartItem.qty > 0) {
            actionContainer.innerHTML = `
                <div class="quantity-selector">
                    <button class="qty-minus" data-cat="${catId}" data-idx="${idx}">−</button>
                    <span class="qty-number">${cartItem.qty}</span>
                    <button class="qty-plus" data-cat="${catId}" data-idx="${idx}">+</button>
                </div>
            `
        } else {
            actionContainer.innerHTML = `<button class="atc-btn" data-cat="${catId}" data-idx="${idx}">+ Add</button>`
        }
    }
    
    attachButtonEvents()
}

function attachButtonEvents() {
    document.querySelectorAll('.atc-btn').forEach(btn => {
        btn.removeEventListener('click', handleAtcClick)
        btn.addEventListener('click', handleAtcClick)
    })
    
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.removeEventListener('click', handleMinusClick)
        btn.addEventListener('click', handleMinusClick)
    })
    
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.removeEventListener('click', handlePlusClick)
        btn.addEventListener('click', handlePlusClick)
    })
}

function handleAtcClick(e) {
    e.stopPropagation()
    const btn = e.currentTarget
    const cat = btn.getAttribute('data-cat')
    const idx = parseInt(btn.getAttribute('data-idx'))
    addToCart(cat, idx)
}

function handleMinusClick(e) {
    e.stopPropagation()
    const btn = e.currentTarget
    const cat = btn.getAttribute('data-cat')
    const idx = parseInt(btn.getAttribute('data-idx'))
    const key = cat + '-' + idx
    const cartItem = cart.find(c => c.key === key)
    const item = allProducts[cat][idx]
    
    if (cartItem) {
        if (cartItem.qty > 1) {
            cartItem.qty--
            saveCart()
            updateSingleCard(cat, idx)
            showToast(`Removed 1 ${item.name}`)
        } else {
            cart = cart.filter(c => c.key !== key)
            saveCart()
            updateSingleCard(cat, idx)
            showToast(`${item.name} removed from cart`)
        }
    }
}

function handlePlusClick(e) {
    e.stopPropagation()
    const btn = e.currentTarget
    const cat = btn.getAttribute('data-cat')
    const idx = parseInt(btn.getAttribute('data-idx'))
    const key = cat + '-' + idx
    const cartItem = cart.find(c => c.key === key)
    const item = allProducts[cat][idx]
    
    if (cartItem) {
        cartItem.qty++
        saveCart()
        updateSingleCard(cat, idx)
        showToast(`Added 1 ${item.name}`)
    } else {
        cart.push({ 
            key, catId: cat, idx, 
            name: item.name, 
            price: item.price, 
            image: item.image_seed, 
            qty: 1 
        })
        saveCart()
        updateSingleCard(cat, idx)
        showToast(`${item.name} added to cart!`)
    }
}

function updateCartUI() {
    const total = cart.reduce((sum, item) => sum + item.qty, 0)
    const badge = document.getElementById('navCartBadge')
    if (badge) {
        if (total > 0) {
            badge.textContent = total
            badge.style.display = 'flex'
        } else {
            badge.style.display = 'none'
        }
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast')
    if (!toast) return
    toast.textContent = msg
    toast.classList.add('show')
    setTimeout(() => {
        toast.classList.remove('show')
    }, 2500)
}

function setView(view) {
    // Force grid view only
    currentView = 'grid';
    localStorage.setItem('menu_view', 'grid');
    
    const grid = document.getElementById('prodGrid');
    if (grid) {
        grid.classList.remove('view-grid', 'view-list');
        grid.classList.add('view-grid');
    }
    
    renderProducts();
}
// ========== MENU FUNCTIONS ==========
function showCatView() {
    selectedCat = null
    const cv = document.getElementById('catView')
    const pv = document.getElementById('prodView')
    if (cv) cv.style.display = 'block'
    if (pv) pv.style.display = 'none'
}

function renderCatGrid() {
    const grid = document.getElementById('catGrid')
    if (!grid) return
    
    if (allCategories.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">Loading categories...</div>'
        return
    }
    
    grid.innerHTML = allCategories.map(cat => {
        let imgSrc = cat.image_seed || ''
        return `
            <div class="cat-card" onclick="selectCategory('${cat.category_key}')">
                <div class="cat-img">
                    <img src="${imgSrc}" alt="${cat.name}" onerror="this.src='https://placehold.co/200x200/333/8B1A1A?text=${cat.name.charAt(0)}'">
                </div>
                <p class="cat-name">${cat.name}</p>
            </div>
        `
    }).join('')
    
    if (typeof lucide !== 'undefined') lucide.createIcons()
}

function renderCatFilter() {
    const filter = document.getElementById('catFilter')
    if (!filter) return
    
    filter.innerHTML = allCategories.map(cat => {
        let imgSrc = cat.image_seed || ''
        return `
            <div class="filter-card ${cat.category_key === selectedCat ? 'active-f' : ''}" data-cat="${cat.category_key}">
                <div class="filter-ring">
                    <img src="${imgSrc}" alt="${cat.name}" onerror="this.src='https://placehold.co/100x100/333/8B1A1A?text=${cat.name.charAt(0)}'">
                </div>
                <p class="filter-name">${cat.name}</p>
            </div>
        `
    }).join('')
    
    document.querySelectorAll('.filter-card').forEach(card => {
        card.addEventListener('click', () => {
            const catId = card.getAttribute('data-cat')
            if (catId && catId !== selectedCat) {
                switchCategory(catId)
            }
        })
    })
    
    if (typeof lucide !== 'undefined') lucide.createIcons()
}

function renderProducts() {
    const grid = document.getElementById('prodGrid')
    if (!grid) return
    grid.classList.remove('view-grid', 'view-list');
    grid.classList.add('view-' + currentView);
    const items = allProducts[selectedCat] || []
    
    if (!items.length) {
        grid.innerHTML = '<p style="text-align:center; padding:40px; color:#888;">Coming soon...</p>'
        if (typeof lucide !== 'undefined') lucide.createIcons()
        return
    }
    
    const isDelivery = menuMode === 'delivery'
    
    grid.innerHTML = items.map((item, idx) => {
        let imgSrc = item.image_seed || ''
        const key = selectedCat + '-' + idx
        const cartItem = cart.find(c => c.key === key)
        const hasCartItem = cartItem && cartItem.qty > 0
        
        let actionHtml = ''
        if (isDelivery) {
            if (hasCartItem) {
                actionHtml = `
                    <div class="quantity-selector">
                        <button class="qty-minus" data-cat="${selectedCat}" data-idx="${idx}">−</button>
                        <span class="qty-number">${cartItem.qty}</span>
                        <button class="qty-plus" data-cat="${selectedCat}" data-idx="${idx}">+</button>
                    </div>
                `
            } else {
                actionHtml = `<button class="atc-btn" data-cat="${selectedCat}" data-idx="${idx}">+ Add</button>`
            }
        }
        
        return `
            <div class="menu-card" onclick="openDetail('${selectedCat}', ${idx})" style="cursor:pointer">
                <div class="mc-img">
                    <img src="${imgSrc}" alt="${item.name}" onerror="this.src='https://placehold.co/300x200/333/8B1A1A?text=${item.name.charAt(0)}'">
                    ${item.bestseller ? '<div class="badge-bs">★ Bestseller</div>' : ''}
                </div>
                <div class="mc-info">
                    <h3>${item.name}</h3>
                    <span class="price">$${item.price.toFixed(2)}</span>
                    ${item.ingredients ? `<p class="desc">${item.ingredients}</p>` : ''}
                    <div class="badge-group">
                        ${item.has_fries ? '<span class="badge-fries">🍟 Fries</span>' : ''}
                        ${item.is_spicy ? '<span class="badge-spicy">🌶️ Spicy</span>' : ''}
                    </div>
                    <div class="mc-bottom">
                        ${actionHtml ? `<div class="mc-action" data-key="${key}">${actionHtml}</div>` : ''}
                    </div>
                </div>
            </div>
        `
    }).join('')
    
    if (typeof lucide !== 'undefined') lucide.createIcons()
    attachButtonEvents()
    
    if (grid) {
        grid.style.animation = 'none'
        grid.offsetHeight
        grid.style.animation = null
    }
}

// ========== CATEGORY ACTIONS ==========
window.selectCategory = async function(id) {
    showLoader()
    selectedCat = id
    
    const url = new URL(window.location)
    url.searchParams.set('cat', id)
    window.history.pushState({}, '', url)
    
    const cv = document.getElementById('catView')
    const pv = document.getElementById('prodView')
    if (cv) cv.style.display = 'none'
    if (pv) pv.style.display = 'block'
    
    renderCatFilter()
    
    const title = document.getElementById('productsPageTitle')
    if (title) {
        title.textContent = menuMode === 'delivery' ? 'Delivery Menu' : 'Dine-in Menu'
    }
    
    renderProducts()
    hideLoader()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

window.switchCategory = function(id) {
    if (selectedCat === id) return
    
    selectedCat = id
    
    document.querySelectorAll('.filter-card').forEach(card => {
        const catId = card.getAttribute('data-cat')
        if (catId === id) {
            card.classList.add('active-f')
        } else {
            card.classList.remove('active-f')
        }
    })
    
    const activeCard = document.querySelector('.filter-card.active-f')
    if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
    
    renderProducts()
}

window.backToCategories = function() {
    showLoader()
    selectedCat = null
    
    const url = new URL(window.location)
    url.searchParams.delete('cat')
    window.history.pushState({}, '', url)
    
    const cv = document.getElementById('catView')
    const pv = document.getElementById('prodView')
    if (cv) cv.style.display = 'block'
    if (pv) pv.style.display = 'none'
    
    renderCatGrid()
    hideLoader()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}
window.addEventListener('popstate', function(event) {
    const params = new URLSearchParams(window.location.search)
    const categoryFromURL = params.get('cat')
    
    if (categoryFromURL && allCategories.find(c => c.category_key === categoryFromURL)) {
        showLoader()
        selectedCat = categoryFromURL
        const cv = document.getElementById('catView')
        const pv = document.getElementById('prodView')
        if (cv) cv.style.display = 'none'
        if (pv) pv.style.display = 'block'
        renderCatFilter()
        renderProducts()
        hideLoader()
    } else {
        showLoader()
        selectedCat = null
        const cv = document.getElementById('catView')
        const pv = document.getElementById('prodView')
        if (cv) cv.style.display = 'block'
        if (pv) pv.style.display = 'none'
        renderCatGrid()
        hideLoader()
    }
})

window.scrollCatFilter = function(amount) {
    const container = document.getElementById('catFilter')
    if (container) {
        container.scrollBy({ left: amount, behavior: 'smooth' })
    }
}

// ========== MENU DROPDOWN ==========
window.toggleMenuDropdown = function() {
    const dd = document.getElementById('menuDropdown')
    const arrow = document.getElementById('ddArrow')
    if (dd) {
        dd.classList.toggle('open')
        if (arrow) {
            arrow.style.transform = dd.classList.contains('open') ? 'rotate(180deg)' : ''
        }
    }
}

// ========== MOBILE MENU ==========
function openMobileMenu() {
    const menu = document.getElementById('mobileMenu')
    if (menu) menu.classList.add('open')
    document.body.style.overflow = 'hidden'
}

function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu')
    if (menu) menu.classList.remove('open')
    document.body.style.overflow = ''
}

// ========== FULLSCREEN DETAIL PAGE ==========
window.openDetail = function(catId, idx) {
    const item = allProducts[catId][idx];
    if (!item) return;
    
    const page = document.getElementById('detailPage');
    
    document.getElementById('detailHero').innerHTML = `<img src="${item.image_seed || ''}" alt="${item.name}" onerror="this.src='https://placehold.co/600x400/333/8B1A1A?text=${item.name.charAt(0)}'">`;
    document.getElementById('detailName').textContent = item.name;
    document.getElementById('detailPrice').textContent = `$${item.price.toFixed(2)}`;
    document.getElementById('detailDesc').textContent = item.ingredients || '';
    
    let badgesHtml = '';
    if (item.bestseller) badgesHtml += '<span class="badge-bs" style="position:relative;top:0;right:0;background:#8B1A1A;color:#ffffff;padding:5px 12px;border-radius:30px;font-size:0.7rem;font-weight:800;">★ Bestseller</span>';
    if (item.has_fries) badgesHtml += '<span class="badge-fries">🍟 Includes Fries</span>';
    if (item.is_spicy) badgesHtml += '<span class="badge-spicy">🌶️ Spicy</span>';
    document.getElementById('detailBadges').innerHTML = badgesHtml;
    
    renderDetailFooter(catId, idx);
    
    page.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.closeDetail = function() {
    const page = document.getElementById('detailPage');
    page.classList.remove('active');
    document.body.style.overflow = '';
}

window.renderDetailFooter = function(catId, idx) {
    const isDelivery = menuMode === 'delivery';
    const key = catId + '-' + idx;
    const cartItem = cart.find(c => c.key === key);
    const hasCartItem = cartItem && cartItem.qty > 0;
    
    const footer = document.getElementById('detailFooter');
    let html = '';
    
    if (isDelivery) {
        if (hasCartItem) {
            html = `
                <div class="quantity-selector-container">
                    <div class="quantity-selector">
                        <button class="qty-minus" onclick="detailChangeQty('${catId}', ${idx}, -1)">−</button>
                        <span class="qty-number">${cartItem.qty}</span>
                        <button class="qty-plus" onclick="detailChangeQty('${catId}', ${idx}, 1)">+</button>
                    </div>
                </div>
            `;
        } else {
            html = `<button class="atc-btn" onclick="detailAddToCart('${catId}', ${idx})"><i data-lucide="shopping-bag" class="w-4 h-4"></i> Add to Cart</button>`;
        }
    }
    
    footer.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.detailAddToCart = function(catId, idx) {
    addToCart(catId, idx);
    renderDetailFooter(catId, idx);
}

window.detailChangeQty = function(catId, idx, delta) {
    const key = catId + '-' + idx;
    const cartItem = cart.find(c => c.key === key);
    if (!cartItem) return;
    
    cartItem.qty += delta;
    const item = allProducts[catId][idx];
    
    if (cartItem.qty <= 0) {
        cart = cart.filter(c => c.key !== key);
        saveCart();
        renderProducts();
        renderDetailFooter(catId, idx);
        showToast(`${item.name} removed from cart`);
    } else {
        saveCart();
        renderProducts();
        renderDetailFooter(catId, idx);
        if (delta > 0) showToast(`Added 1 ${item.name}`);
        else showToast(`Removed 1 ${item.name}`);
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeDetail();
});

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons()
    updateCartUI()
    
    setTimeout(function() {
        setView(currentView);
    }, 100);
    
    const urlParams = new URLSearchParams(window.location.search)
    menuMode = urlParams.get('mode') || 'dinein'
    
    const title = document.getElementById('menuTitle')
    const subtitle = document.getElementById('menuSubtitle')
    
    if (title) {
        title.textContent = menuMode === 'delivery' ? 'Delivery Menu' : 'Dine-in Menu'
    }
    if (subtitle) {
        subtitle.textContent = menuMode === 'delivery' 
            ? 'Add items to your cart for delivery' 
            : 'Browse our full menu'
    }
    
    showLoader()
    
    await loadDataFromSupabase()
    
    renderCatGrid()
    
    const categoryFromURL = urlParams.get('cat')
    if (categoryFromURL && allCategories.find(c => c.category_key === categoryFromURL)) {
        selectedCat = categoryFromURL
        const cv = document.getElementById('catView')
        const pv = document.getElementById('prodView')
        if (cv) cv.style.display = 'none'
        if (pv) pv.style.display = 'block'
        renderCatFilter()
        renderProducts()
    } else {
        showCatView()
    }
    
    hideLoader()
    
    const mobileBtn = document.getElementById('mobileMenuBtn')
    const closeBtn = document.getElementById('closeMenuBtn')
    
    if (mobileBtn) mobileBtn.addEventListener('click', openMobileMenu)
    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu)
    
    document.querySelectorAll('.mobile-menu-links a').forEach(link => {
        link.addEventListener('click', closeMobileMenu)
    })
    
    document.addEventListener('click', function(e) {
        const wrap = document.getElementById('menuDropdownWrap')
        if (wrap && !wrap.contains(e.target)) {
            const dd = document.getElementById('menuDropdown')
            const arrow = document.getElementById('ddArrow')
            if (dd) dd.classList.remove('open')
            if (arrow) arrow.style.transform = ''
        }
    })
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const menu = document.getElementById('mobileMenu')
            if (menu && menu.classList.contains('open')) {
                closeMobileMenu()
            }
        }
    })
})

// Make functions global
window.addToCart = addToCart
window.setView = setView
