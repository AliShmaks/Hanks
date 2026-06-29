// ==========================================
// secure-admin.js - Hanks BBQ Admin
// ==========================================

// ✅ STEP 1: Define Supabase FIRST (before anything else)
const SUPABASE_URL = 'https://ntvmjhajmltwxkzkatvf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_6J89cbcX9ONNdxZWBQ9hQA_71Uf-I9E'

// ✅ STEP 2: Create the client RIGHT AFTER the config
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ✅ STEP 3: Now define all other variables
let categories = []

// ==========================================
// 🔐 AUTHENTICATION
// ==========================================

async function loginWithSupabase() {
    const email = document.getElementById('loginEmail').value
    const password = document.getElementById('loginPassword').value
    const errorDiv = document.getElementById('loginError')
    
    if (!email || !password) {
        errorDiv.textContent = 'Please enter email and password'
        errorDiv.style.display = 'block'
        return
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (error) {
            errorDiv.textContent = 'Invalid credentials: ' + error.message
            errorDiv.style.display = 'block'
            return
        }
        
        sessionStorage.setItem('admin_token', data.session.access_token)
        document.getElementById('loginPage').style.display = 'none'
        document.getElementById('adminPanel').style.display = 'block'
        initAdminPanel()
        errorDiv.style.display = 'none'
        showToast('✅ Login successful!')
        
    } catch (err) {
        errorDiv.textContent = 'Error: ' + err.message
        errorDiv.style.display = 'block'
    }
}

async function logout() {
    await supabaseClient.auth.signOut()
    sessionStorage.removeItem('admin_token')
    document.getElementById('adminPanel').style.display = 'none'
    document.getElementById('loginPage').style.display = 'flex'
    showToast('🔒 Logged out')
}

async function checkSession() {
    const token = sessionStorage.getItem('admin_token')
    if (!token) return
    
    const { data: { user }, error } = await supabaseClient.auth.getUser(token)
    if (error || !user) {
        sessionStorage.removeItem('admin_token')
        return
    }
    
    document.getElementById('loginPage').style.display = 'none'
    document.getElementById('adminPanel').style.display = 'block'
    initAdminPanel()
}

// ==========================================
// 📦 TOAST NOTIFICATION
// ==========================================

function showToast(msg) {
    const toast = document.getElementById('toast')
    if (!toast) return
    toast.textContent = msg
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 3000)
}

// ==========================================
// 📁 CATEGORY FUNCTIONS
// ==========================================

async function loadCategories() {
    const { data } = await supabaseClient.from('categories').select('*').order('display_order')
    categories = data || []
    
    const container = document.getElementById('categoriesList')
    if (!container) return
    
    if (categories.length === 0) {
        container.innerHTML = '<div style="color:#475569; text-align:center; padding:32px;">No categories yet. Click + Add Category.</div>'
    } else {
        container.innerHTML = categories.map(cat => `
            <div class="item-row">
                <div style="display:flex; align-items:center; gap:12px;">
                    ${cat.image_seed ? `<img src="${cat.image_seed}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">` : '<div style="width:40px; height:40px; background:#0d0d0d; border-radius:8px; display:flex; align-items:center; justify-content:center;">📁</div>'}
                    <div><div style="font-weight:500; color:#fff;">${escapeHtml(cat.name)}</div><div style="font-size:12px; color:#475569;">${escapeHtml(cat.category_key)} · Order: ${cat.display_order}</div></div>
                </div>
                <div style="display:flex; gap:6px;">
                    <button onclick="editCategory('${cat.id}')" class="btn btn-ghost btn-sm">Edit</button>
                    <button onclick="deleteCategoryItem('${cat.id}')" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </div>
        `).join('')
    }
    
    const catSelect = document.getElementById('prodCategory')
    if (catSelect) {
        catSelect.innerHTML = '<option value="">Select Category</option>' + categories.map(c => `<option value="${escapeHtml(c.category_key)}">${escapeHtml(c.name)}</option>`).join('')
    }
    
    const filterSelect = document.getElementById('productFilter')
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Categories</option>' + categories.map(c => `<option value="${escapeHtml(c.category_key)}">${escapeHtml(c.name)}</option>`).join('')
    }
    
    updateStats()
}

// ===== CATEGORY: SAVE =====
async function saveCategory() {
    const id = document.getElementById('categoryId').value
    let imageUrl = document.getElementById('catImageUrl').value
    
    const fileInput = document.getElementById('catImageFile')
    if (fileInput && fileInput.files.length > 0) {
        const uploadedUrl = await uploadImage(fileInput.files[0], 'categories')
        if (uploadedUrl) imageUrl = uploadedUrl
    }
    
    const categoryName = document.getElementById('catName').value.trim()
    const categoryKey = document.getElementById('catKey').value.trim().toLowerCase().replace(/\s+/g, '-')
    const displayOrder = parseInt(document.getElementById('catOrder').value) || 0
    
    if (!categoryName) {
        showToast('Please fill in category name')
        return
    }
    
    let error
    
    if (id) {
        const { error: updateError } = await supabaseClient
            .from('categories')
            .update({
                name: categoryName,
                image_seed: imageUrl,
                display_order: displayOrder
            })
            .eq('id', id)
        error = updateError
    } else {
        if (!categoryKey) {
            showToast('Please fill in category key')
            return
        }
        const { error: insertError } = await supabaseClient
            .from('categories')
            .insert([{
                category_key: categoryKey,
                name: categoryName,
                image_seed: imageUrl,
                display_order: displayOrder
            }])
        error = insertError
    }
    
    if (error) {
        console.error('Save error:', error)
        if (error.code === '23505') {
            showToast('❌ Category key "' + categoryKey + '" already exists!')
        } else {
            showToast('Error: ' + error.message)
        }
    } else {
        showToast('✅ Category saved!')
        closeCategoryModal()
        await loadCategories()
        await loadProducts()
        updateLastSaved()
    }
}

// ===== CATEGORY: EDIT =====
async function editCategory(id) {
    const cat = categories.find(c => c.id == id)
    if (!cat) return
    
    document.getElementById('categoryModalTitle').innerText = 'Edit Category'
    document.getElementById('categoryId').value = cat.id
    
    const keyField = document.getElementById('catKey')
    keyField.value = cat.category_key
    keyField.disabled = true
    keyField.style.backgroundColor = '#1a1a1a'
    keyField.style.color = '#64748B'
    keyField.style.cursor = 'not-allowed'
    keyField.title = 'Category key cannot be changed'
    
    document.getElementById('catName').value = cat.name
    document.getElementById('catImageUrl').value = cat.image_seed || ''
    document.getElementById('catImageFile').value = ''
    document.getElementById('catOrder').value = cat.display_order
    
    const previewDiv = document.getElementById('catImagePreview')
    if (previewDiv) {
        previewDiv.innerHTML = cat.image_seed ? `<img src="${cat.image_seed}" class="preview-img">` : ''
    }
    
    document.getElementById('categoryModal').style.display = 'flex'
}

// ===== CATEGORY: DELETE =====
async function deleteCategoryItem(id) {
    if (!confirm('⚠️ WARNING: Delete this category? ALL products in it will be deleted!')) return
    
    const { error } = await supabaseClient.from('categories').delete().eq('id', id)
    if (error) {
        showToast('Error: ' + error.message)
    } else {
        showToast('✅ Category deleted!')
        await loadCategories()
        await loadProducts()
        updateLastSaved()
    }
}

// ===== CATEGORY: MODAL =====
function openCategoryModal() {
    document.getElementById('categoryModalTitle').innerText = 'Add Category'
    document.getElementById('categoryId').value = ''
    
    const keyField = document.getElementById('catKey')
    keyField.value = ''
    keyField.disabled = false
    keyField.style.backgroundColor = '#0d0d0d'
    keyField.style.color = '#fff'
    keyField.style.cursor = 'text'
    keyField.title = ''
    
    document.getElementById('catName').value = ''
    document.getElementById('catImageUrl').value = ''
    document.getElementById('catImageFile').value = ''
    document.getElementById('catOrder').value = '0'
    
    const previewDiv = document.getElementById('catImagePreview')
    if (previewDiv) previewDiv.innerHTML = ''
    
    document.getElementById('categoryModal').style.display = 'flex'
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none'

    const keyField = document.getElementById('catKey')
    keyField.disabled = false
    keyField.style.backgroundColor = '#0d0d0d'
    keyField.style.color = '#fff'
    keyField.style.cursor = 'text'
    keyField.title = ''
}

// ==========================================
// 🍔 PRODUCT FUNCTIONS
// ==========================================

async function loadProducts() {
    const filter = document.getElementById('productFilter')?.value || ''
    let query = supabaseClient.from('products').select('*').order('display_order', { ascending: true })
    if (filter) query = query.eq('category_key', filter)
    
    const { data } = await query
    const products = data || []
    const catMap = {}
    categories.forEach(c => catMap[c.category_key] = c.name)
    
    const container = document.getElementById('productsList')
    if (!container) return
    
    if (products.length === 0) {
        container.innerHTML = '<div style="color:#475569; text-align:center; padding:32px;">No products found. Click + Add Product.</div>'
    } else {
        container.innerHTML = products.map(p => `
            <div class="item-row">
                <div style="display:flex; align-items:center; gap:12px;">
                    ${p.image_seed ? `<img src="${p.image_seed}" style="width:44px; height:44px; border-radius:10px; object-fit:cover;">` : '<div style="width:44px; height:44px; background:#0d0d0d; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px;">🍖</div>'}
                    <div><div style="font-weight:500; color:#fff;">${escapeHtml(p.name)} ${p.bestseller ? '⭐' : ''}${p.is_spicy ? '🌶️' : ''}</div><div style="font-size:12px; color:#475569;">${escapeHtml(catMap[p.category_key] || p.category_key)} ${p.has_fries ? '· 🍟' : ''}</div></div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="color:#8B1A1A; font-weight:700;">$${p.price}</span>
                    <button onclick="editProduct('${p.id}')" class="btn btn-ghost btn-sm">Edit</button>
                    <button onclick="deleteProductItem('${p.id}')" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </div>
        `).join('')
    }
    updateStats()
    updateRecentProducts()
}

// ===== PRODUCT: SAVE =====
async function saveProduct() {
    const id = document.getElementById('productId').value
    let imageUrl = document.getElementById('prodImageUrl').value
    
    const fileInput = document.getElementById('prodImageFile')
    if (fileInput && fileInput.files.length > 0) {
        const uploadedUrl = await uploadImage(fileInput.files[0], 'products')
        if (uploadedUrl) imageUrl = uploadedUrl
    }
    
    const productData = {
        category_key: document.getElementById('prodCategory').value,
        name: document.getElementById('prodName').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        ingredients: document.getElementById('prodIngredients').value,
        image_seed: imageUrl,
        display_order: parseInt(document.getElementById('prodOrder').value) || 0,
        bestseller: document.getElementById('prodBestseller').checked,
        has_fries: document.getElementById('prodHasFries').checked,
        is_spicy: document.getElementById('prodSpicy').checked
    }
    
    if (!productData.category_key || !productData.name || isNaN(productData.price)) {
        showToast('Please fill: Category, Name, and Price')
        return
    }
    
    let error
    if (id) {
        error = (await supabaseClient.from('products').update(productData).eq('id', id)).error
    } else {
        error = (await supabaseClient.from('products').insert([productData])).error
    }
    
    if (error) {
        showToast('Error: ' + error.message)
    } else {
        showToast('✅ Product saved!')
        closeProductModal()
        await loadProducts()
        updateLastSaved()
    }
}

// ===== PRODUCT: EDIT =====
async function editProduct(id) {
    const { data } = await supabaseClient.from('products').select('*').eq('id', id).single()
    if (data) {
        document.getElementById('productModalTitle').innerText = 'Edit Product'
        document.getElementById('productId').value = data.id
        document.getElementById('prodCategory').value = data.category_key
        document.getElementById('prodName').value = data.name
        document.getElementById('prodPrice').value = data.price
        document.getElementById('prodIngredients').value = data.ingredients || ''
        document.getElementById('prodImageUrl').value = data.image_seed || ''
        document.getElementById('prodImageFile').value = ''
        document.getElementById('prodOrder').value = data.display_order || 0
        document.getElementById('prodBestseller').checked = data.bestseller || false
        document.getElementById('prodHasFries').checked = data.has_fries || false
        document.getElementById('prodSpicy').checked = data.is_spicy || false
        
        const previewDiv = document.getElementById('prodPreview')
        if (previewDiv) {
            previewDiv.innerHTML = data.image_seed ? `<img src="${data.image_seed}" class="preview-img">` : ''
        }
        
        document.getElementById('productModal').style.display = 'flex'
    }
}

// ===== PRODUCT: DELETE =====
async function deleteProductItem(id) {
    if (!confirm('⚠️ Delete this product?')) return
    
    const { error } = await supabaseClient.from('products').delete().eq('id', id)
    if (error) {
        showToast('Error: ' + error.message)
    } else {
        showToast('✅ Product deleted!')
        await loadProducts()
        updateLastSaved()
    }
}

// ===== PRODUCT: MODAL =====
function openProductModal() {
    document.getElementById('productModalTitle').innerText = 'Add Product'
    document.getElementById('productId').value = ''
    document.getElementById('prodCategory').value = ''
    document.getElementById('prodName').value = ''
    document.getElementById('prodPrice').value = ''
    document.getElementById('prodIngredients').value = ''
    document.getElementById('prodImageUrl').value = ''
    document.getElementById('prodImageFile').value = ''
    document.getElementById('prodOrder').value = '0'
    document.getElementById('prodBestseller').checked = false
    document.getElementById('prodHasFries').checked = false
    document.getElementById('prodSpicy').checked = false
    
    const previewDiv = document.getElementById('prodPreview')
    if (previewDiv) previewDiv.innerHTML = ''
    
    document.getElementById('productModal').style.display = 'flex'
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none'
}

// ==========================================
// 🖼️ IMAGE UPLOAD
// ==========================================

async function uploadImage(file, folder = 'products') {
    if (!file) return null
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${folder}/${fileName}`
    
    const { error } = await supabaseClient.storage.from('images').upload(filePath, file)
    if (error) {
        console.error('Upload error:', error)
        showToast('Upload failed: ' + error.message)
        return null
    }
    
    const { data } = supabaseClient.storage.from('images').getPublicUrl(filePath)
    return data.publicUrl
}

// ==========================================
// 📊 DASHBOARD
// ==========================================

async function updateStats() {
    const { count: catCount } = await supabaseClient.from('categories').select('*', { count: 'exact', head: true })
    const { data: products } = await supabaseClient.from('products').select('bestseller, is_spicy')
    
    const statCategories = document.getElementById('statCategories')
    const statProducts = document.getElementById('statProducts')
    const statBestsellers = document.getElementById('statBestsellers')
    const statSpicy = document.getElementById('statSpicy')
    
    if (statCategories) statCategories.textContent = catCount || 0
    if (statProducts) statProducts.textContent = products?.length || 0
    if (statBestsellers) statBestsellers.textContent = products?.filter(p => p.bestseller).length || 0
    if (statSpicy) statSpicy.textContent = products?.filter(p => p.is_spicy).length || 0
}

async function updateRecentProducts() {
    const { data } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false }).limit(5)
    const catMap = {}
    categories.forEach(c => catMap[c.category_key] = c.name)
    
    const container = document.getElementById('recentProducts')
    if (!container) return
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div style="color:#475569; padding:16px;">No products yet</div>'
    } else {
        container.innerHTML = data.map(p => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(139,26,26,0.1);">
                <div><div style="font-size:13px; color:#fff; font-weight:500;">${escapeHtml(p.name)}</div><div style="font-size:11px; color:#475569;">${escapeHtml(catMap[p.category_key] || p.category_key)}</div></div>
                <span style="color:#8B1A1A; font-weight:600;">$${p.price}</span>
            </div>
        `).join('')
    }
}

// ==========================================
// 🛠️ HELPERS
// ==========================================

function escapeHtml(str) {
    if (!str) return ''
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;'
        if (m === '<') return '&lt;'
        if (m === '>') return '&gt;'
        return m
    })
}

function updateLastSaved() {
    const lastSaved = document.getElementById('lastSaved')
    if (lastSaved) {
        lastSaved.textContent = 'Last saved ' + new Date().toLocaleTimeString()
    }
}

function previewImage(inputId, previewId) {
    const url = document.getElementById(inputId).value
    const previewDiv = document.getElementById(previewId)
    if (url && previewDiv) {
        previewDiv.innerHTML = `<img src="${url}" class="preview-img" onclick="window.open('${url}','_blank')">`
    } else if (previewDiv) {
        previewDiv.innerHTML = ''
    }
}

function previewUploadedImage(fileInput, previewId) {
    const file = fileInput.files[0]
    const previewDiv = document.getElementById(previewId)
    if (file && previewDiv) {
        const reader = new FileReader()
        reader.onload = function(e) {
            previewDiv.innerHTML = `<img src="${e.target.result}" class="preview-img">`
        }
        reader.readAsDataURL(file)
    }
}

// ==========================================
// 🧭 SIDEBAR & TABS
// ==========================================

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open')
    document.getElementById('sidebarBackdrop').classList.toggle('open')
}

function showTab(tab) {
    const divs = ['dashboardDiv', 'categoriesDiv', 'productsDiv']
    divs.forEach(id => { 
        const el = document.getElementById(id)
        if (el) el.style.display = 'none'
    })
    
    const targetDiv = document.getElementById(`${tab}Div`)
    if (targetDiv) targetDiv.style.display = 'block'
    
    document.querySelectorAll('.nav-item').forEach(el => {
        if (el.dataset.tab === tab) {
            el.classList.add('active')
        } else {
            el.classList.remove('active')
        }
    })
    
    const titles = { dashboard: 'Dashboard', categories: 'Categories', products: 'Products' }
    const titleEl = document.getElementById('pageTitle')
    if (titleEl) titleEl.textContent = titles[tab] || 'Dashboard'
    
    if (tab === 'categories') loadCategories()
    if (tab === 'products') { loadCategories(); loadProducts() }
    if (tab === 'dashboard') { updateStats(); updateRecentProducts() }
    
    const sidebar = document.getElementById('sidebar')
    const backdrop = document.getElementById('sidebarBackdrop')
    if (sidebar) sidebar.classList.remove('open')
    if (backdrop) backdrop.classList.remove('open')
}

// ==========================================
// 🚀 INIT
// ==========================================

async function initAdminPanel() {
    await loadCategories()
    await loadProducts()
    showTab('dashboard')
}

// ==========================================
// 📡 EVENT LISTENERS
// ==========================================

document.getElementById('catImageFile')?.addEventListener('change', function() {
    previewUploadedImage(this, 'catImagePreview')
})

document.getElementById('prodImageFile')?.addEventListener('change', function() {
    previewUploadedImage(this, 'prodPreview')
})

document.getElementById('catImageUrl')?.addEventListener('input', () => previewImage('catImageUrl', 'catImagePreview'))
document.getElementById('prodImageUrl')?.addEventListener('input', () => previewImage('prodImageUrl', 'prodPreview'))

document.getElementById('categoryModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCategoryModal()
})

document.getElementById('productModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeProductModal()
})

document.getElementById('loginPassword')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') loginWithSupabase()
})

// ==========================================
// ▶️ START
// ==========================================

checkSession()