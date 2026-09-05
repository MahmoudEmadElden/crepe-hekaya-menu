/**
 * المنطق البرمجي التفاعلي لمطعم كريب حكاية — Crepe Hekaya
 * Digital Showcase Menu
 */

(function () {
const { restaurantInfo, categories, menuItems, extraAddons, galleryPhotos } = (typeof window !== 'undefined' && window.CrepeHekayaData) ? window.CrepeHekayaData : {};

// Application State
const state = {
  activeCategory: 'all',
  searchQuery: '',
  selectedVariants: {},
  currentVideoIdx: 0,
  currentPhotoIdx: 0
};

// Video Playlist
const videos = [
  { src: 'assets/videos/cheese-bomb.mp4', poster: 'assets/images/gallery/photo-6.jpeg' },
  { src: 'assets/videos/elmahal.mp4', poster: 'assets/images/gallery/photo-1.jpeg' },
  { src: 'assets/videos/crepe-elmazag.mp4', poster: 'assets/images/gallery/photo-3.jpeg' }
];

// DOM Elements
const elements = {
  categoryNav: document.getElementById('categoryNav'),
  menuGrid: document.getElementById('menuGrid'),
  itemsCounter: document.getElementById('itemsCounter'),
  searchInput: document.getElementById('searchInput'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  zeroState: document.getElementById('zeroState'),
  addonsGrid: document.getElementById('addonsGrid'),
  branchesGrid: document.getElementById('branchesGrid'),

  // Video Stage Elements
  heroVideoPlayer: document.getElementById('heroVideoPlayer'),
  heroVideoSource: document.getElementById('heroVideoSource'),
  videoCenterBtn: document.getElementById('videoCenterBtn'),
  playIconSvg: document.getElementById('playIconSvg'),
  pauseIconSvg: document.getElementById('pauseIconSvg'),
  videoPrevBtn: document.getElementById('videoPrevBtn'),
  videoNextBtn: document.getElementById('videoNextBtn'),
  videoCounter: document.getElementById('videoCounter'),
  videoDots: document.getElementById('videoDots'),

  // Gallery Showcase Elements
  galleryMainImg: document.getElementById('galleryMainImg'),
  galleryOrderBadge: document.getElementById('galleryOrderBadge'),
  galleryPrevBtn: document.getElementById('galleryPrevBtn'),
  galleryNextBtn: document.getElementById('galleryNextBtn'),
  galleryThumbStrip: document.getElementById('galleryThumbStrip'),

  // Details Modal
  itemModal: document.getElementById('itemModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalItemName: document.getElementById('modalItemName'),
  modalDesc: document.getElementById('modalDesc'),
  modalIngredientsSection: document.getElementById('modalIngredientsSection'),
  modalIngredientsList: document.getElementById('modalIngredientsList'),
  modalPrice: document.getElementById('modalPrice')
};

/**
 * تهيئة التطبيق
 */
function initApp() {
  // 1. Initial State for variants
  menuItems.forEach(item => {
    if (item.variants) {
      state.selectedVariants[item.id] = item.defaultVariant || Object.keys(item.variants)[0];
    }
  });

  // 2. Render Components
  setupVideoStage();
  renderGalleryShowcase();
  renderCategories();
  renderCurrentItems();
  renderAddons();
  renderBranches();

  // 3. Attach Event Listeners
  setupEventListeners();
}

/**
 * إعداد والتحكم في مشغل الفيديو الموحد
 */
function setupVideoStage() {
  if (!elements.heroVideoPlayer) return;

  function loadVideo(idx) {
    state.currentVideoIdx = (idx + videos.length) % videos.length;
    const v = videos[state.currentVideoIdx];

    elements.heroVideoPlayer.pause();
    elements.heroVideoPlayer.poster = v.poster;
    elements.heroVideoSource.src = v.src;
    elements.heroVideoPlayer.load();

    // Reset Play Button
    elements.playIconSvg.style.display = 'block';
    elements.pauseIconSvg.style.display = 'none';
    elements.videoCenterBtn.classList.remove('playing');

    // Update Counter & Dots
    if (elements.videoCounter) {
      elements.videoCounter.textContent = `فيديو ${state.currentVideoIdx + 1} من ${videos.length}`;
    }

    if (elements.videoDots) {
      const dots = elements.videoDots.querySelectorAll('.vdot');
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === state.currentVideoIdx);
      });
    }
  }

  // Toggle Play / Pause
  function togglePlay() {
    if (elements.heroVideoPlayer.paused) {
      elements.heroVideoPlayer.play();
      elements.playIconSvg.style.display = 'none';
      elements.pauseIconSvg.style.display = 'block';
      elements.videoCenterBtn.classList.add('playing');
    } else {
      elements.heroVideoPlayer.pause();
      elements.playIconSvg.style.display = 'block';
      elements.pauseIconSvg.style.display = 'none';
      elements.videoCenterBtn.classList.remove('playing');
    }
  }

  elements.videoCenterBtn.addEventListener('click', togglePlay);
  elements.heroVideoPlayer.addEventListener('click', togglePlay);

  elements.heroVideoPlayer.addEventListener('ended', () => {
    elements.playIconSvg.style.display = 'block';
    elements.pauseIconSvg.style.display = 'none';
    elements.videoCenterBtn.classList.remove('playing');
  });

  // Navigation Arrows
  if (elements.videoPrevBtn) {
    elements.videoPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadVideo(state.currentVideoIdx - 1);
    });
  }

  if (elements.videoNextBtn) {
    elements.videoNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadVideo(state.currentVideoIdx + 1);
    });
  }

  // Dots
  if (elements.videoDots) {
    elements.videoDots.addEventListener('click', (e) => {
      const dot = e.target.closest('.vdot');
      if (dot && dot.dataset.vidx !== undefined) {
        loadVideo(parseInt(dot.dataset.vidx, 10));
      }
    });
  }
}

/**
 * إعداد معرض الصور التفاعلي النظيف
 */
function renderGalleryShowcase() {
  if (!elements.galleryThumbStrip || !galleryPhotos) return;

  // Render Thumbnails cleanly without number overlays
  elements.galleryThumbStrip.innerHTML = galleryPhotos.map((photoSrc, idx) => `
    <div class="gallery-strip-item ${idx === state.currentPhotoIdx ? 'active' : ''}" data-pidx="${idx}">
      <img src="${photoSrc}" alt="صورة من مطعم كريب حكاية ${idx + 1}" loading="lazy">
    </div>
  `).join('');

  function showPhoto(idx) {
    state.currentPhotoIdx = (idx + galleryPhotos.length) % galleryPhotos.length;
    const photoUrl = galleryPhotos[state.currentPhotoIdx];

    // Smooth fade transition
    if (elements.galleryMainImg) {
      elements.galleryMainImg.style.opacity = '0.3';
      setTimeout(() => {
        elements.galleryMainImg.src = photoUrl;
        elements.galleryMainImg.style.opacity = '1';
      }, 120);
    }

    // Update Active Strip Item
    const items = elements.galleryThumbStrip.querySelectorAll('.gallery-strip-item');
    items.forEach((item, i) => {
      const isActive = i === state.currentPhotoIdx;
      item.classList.toggle('active', isActive);
      if (isActive) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }

  // Click on Thumbnail
  elements.galleryThumbStrip.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-strip-item');
    if (item && item.dataset.pidx !== undefined) {
      showPhoto(parseInt(item.dataset.pidx, 10));
    }
  });

  // Arrows
  if (elements.galleryPrevBtn) {
    elements.galleryPrevBtn.addEventListener('click', () => {
      showPhoto(state.currentPhotoIdx - 1);
    });
  }

  if (elements.galleryNextBtn) {
    elements.galleryNextBtn.addEventListener('click', () => {
      showPhoto(state.currentPhotoIdx + 1);
    });
  }
}

/**
 * رسم شريط الأقسام
 */
function renderCategories() {
  if (!elements.categoryNav) return;

  elements.categoryNav.innerHTML = categories.map(cat => {
    const isActive = cat.id === state.activeCategory;
    return `
      <button class="category-tab ${isActive ? 'active' : ''}" data-category-id="${cat.id}">
        <span>${cat.name}</span>
      </button>
    `;
  }).join('');
}

/**
 * تصفية وعرض الأصناف الحالية
 */
function renderCurrentItems() {
  let filtered = menuItems;

  // Filter by category
  if (state.activeCategory !== 'all') {
    filtered = filtered.filter(item => item.category === state.activeCategory);
  }

  // Filter by search query
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(item => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description && item.description.toLowerCase().includes(q);
      const matchIngredients = item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(q));
      return matchName || matchDesc || matchIngredients;
    });
  }

  // Update Items Count
  if (elements.itemsCounter) {
    elements.itemsCounter.textContent = `${filtered.length} صنف`;
  }

  // Show/Hide Zero State
  if (filtered.length === 0) {
    elements.menuGrid.style.display = 'none';
    elements.zeroState.style.display = 'block';
  } else {
    elements.menuGrid.style.display = 'grid';
    elements.zeroState.style.display = 'none';
    renderMenuItems(filtered);
  }
}

/**
 * رسم بطاقات الأصناف
 */
function renderMenuItems(items) {
  if (!elements.menuGrid) return;

  elements.menuGrid.innerHTML = items.map(item => {
    let currentPrice = item.price;
    let variantSwitcherHtml = '';

    if (item.variants) {
      const selectedVariant = state.selectedVariants[item.id] || item.defaultVariant || Object.keys(item.variants)[0];
      currentPrice = item.variants[selectedVariant] !== undefined ? item.variants[selectedVariant] : item.price;

      const labels = item.variantLabels || { plain: 'سادة', roumi: 'رومي', mozzarella: 'موزاريلا' };
      const variantButtonsHtml = Object.keys(item.variants).map(vKey => `
        <button class="variant-btn ${selectedVariant === vKey ? 'active' : ''}" data-variant="${vKey}">${labels[vKey] || vKey}</button>
      `).join('');

      variantSwitcherHtml = `
        <div class="variant-switcher" data-item-id="${item.id}">
          ${variantButtonsHtml}
        </div>
      `;
    }

    // Ingredients Tags
    let ingredientsHtml = '';
    if (item.ingredients && item.ingredients.length > 0) {
      ingredientsHtml = `
        <div class="ingredient-tags">
          ${item.ingredients.map(ing => `<span class="tag">${ing}</span>`).join('')}
        </div>
      `;
    }

    return `
      <article class="menu-card fade-in" id="card-${item.id}">
        <div class="card-top">
          <h3 class="item-name">${item.name}</h3>
        </div>

        <p class="item-desc">${item.description || ''}</p>
        
        ${ingredientsHtml}
        ${variantSwitcherHtml}

        <div class="card-bottom">
          <div class="price-box">
            <span class="price-value" id="price-${item.id}">${currentPrice}</span>
            <span class="price-currency">جنيه</span>
          </div>

          <div class="card-actions">
            <button class="btn-add-cart" data-add-cart="${item.id}" aria-label="أضف ${item.name} للسلة">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>أضف للسلة</span>
            </button>
            <button class="btn-details" data-open-modal="${item.id}" aria-label="عرض تفاصيل ${item.name}">
              <span>المكونات</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * تبديل السعر الفوري
 */
function handleVariantChange(itemId, variant) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item || !item.variants) return;

  state.selectedVariants[itemId] = variant;
  const newPrice = item.variants[variant];

  const priceElem = document.getElementById(`price-${itemId}`);
  if (priceElem) {
    priceElem.textContent = newPrice;
  }

  const cardElem = document.getElementById(`card-${itemId}`);
  if (cardElem) {
    const btns = cardElem.querySelectorAll('.variant-btn');
    btns.forEach(b => {
      if (b.dataset.variant === variant) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }
}

/**
 * رسم الإضافات
 */
function renderAddons() {
  if (!elements.addonsGrid) return;

  elements.addonsGrid.innerHTML = extraAddons.map(addon => `
    <div class="addon-card">
      <span class="addon-name">${addon.name}</span>
      <span class="addon-price">+${addon.price} ج</span>
    </div>
  `).join('');
}

/**
 * رسم بيانات الفرع
 */
function renderBranches() {
  if (!elements.branchesGrid || !restaurantInfo.branch) return;

  elements.branchesGrid.innerHTML = `
    <div class="branch-card" style="max-width: 600px; margin: 0 auto;">
      <h3 class="branch-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${restaurantInfo.branch.name}
      </h3>
      <p class="branch-address" style="font-size: 1rem; margin-top: 0.5rem;">${restaurantInfo.branch.address}</p>
    </div>
  `;
}

/**
 * فتح نافذة تفاصيل الصنف
 */
function openItemModal(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item || !elements.itemModal) return;

  let currentPrice = item.price;
  if (item.variants) {
    const v = state.selectedVariants[item.id] || item.defaultVariant || Object.keys(item.variants)[0];
    currentPrice = item.variants[v] !== undefined ? item.variants[v] : item.price;
  }

  elements.modalItemName.textContent = item.name;
  elements.modalDesc.textContent = item.description || 'صنف فاخر ومحضر طازج بأعلى جودة وأفضل المكونات.';
  
  const priceNumElem = document.getElementById('modalPriceNum');
  if (priceNumElem) {
    priceNumElem.textContent = currentPrice;
  }

  if (item.ingredients && item.ingredients.length > 0) {
    elements.modalIngredientsSection.style.display = 'block';
    elements.modalIngredientsList.innerHTML = item.ingredients.map(ing => `<span class="tag">${ing}</span>`).join('');
  } else {
    elements.modalIngredientsSection.style.display = 'none';
  }

  elements.itemModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * إغلاق المودال
 */
function closeItemModal() {
  if (!elements.itemModal) return;
  elements.itemModal.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * ربط الأحداث
 */
function setupEventListeners() {
  // Category Switch
  if (elements.categoryNav) {
    elements.categoryNav.addEventListener('click', e => {
      const tab = e.target.closest('.category-tab');
      if (!tab) return;
      const catId = tab.dataset.categoryId;
      if (!catId) return;

      state.activeCategory = catId;
      renderCategories();
      renderCurrentItems();

      tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  }

  // Search Input
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      if (elements.searchClearBtn) {
        elements.searchClearBtn.style.display = state.searchQuery ? 'flex' : 'none';
      }
      renderCurrentItems();
    });
  }

  // Clear Search
  if (elements.searchClearBtn) {
    elements.searchClearBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.searchClearBtn.style.display = 'none';
      renderCurrentItems();
      elements.searchInput.focus();
    });
  }

  // Reset Button
  const zeroStateResetBtn = document.getElementById('zeroStateResetBtn');
  if (zeroStateResetBtn) {
    zeroStateResetBtn.addEventListener('click', () => {
      if (elements.searchInput) elements.searchInput.value = '';
      state.searchQuery = '';
      state.activeCategory = 'all';
      if (elements.searchClearBtn) elements.searchClearBtn.style.display = 'none';
      renderCategories();
      renderCurrentItems();
    });
  }

  // Variant Switcher & Modal Triggers
  if (elements.menuGrid) {
    elements.menuGrid.addEventListener('click', e => {
      const variantBtn = e.target.closest('.variant-btn');
      if (variantBtn) {
        const switcher = variantBtn.closest('.variant-switcher');
        const itemId = switcher.dataset.itemId;
        const variant = variantBtn.dataset.variant;
        handleVariantChange(itemId, variant);
        return;
      }

      const modalBtn = e.target.closest('[data-open-modal]');
      if (modalBtn) {
        const itemId = modalBtn.dataset.openModal;
        openItemModal(itemId);
        return;
      }

      // Add to Cart
      const addCartBtn = e.target.closest('[data-add-cart]');
      if (addCartBtn) {
        const itemId = addCartBtn.dataset.addCart;
        const item = menuItems.find(i => i.id === itemId);
        if (!item) return;

        const selectedVariant = state.selectedVariants[itemId];
        let unitPrice = item.price;
        let variant = '';
        let variantLabel = '';

        if (item.variants && selectedVariant) {
          unitPrice = item.variants[selectedVariant];
          variant = selectedVariant;
          const labels = item.variantLabels || { plain: 'سادة', roumi: 'رومي', mozzarella: 'موزاريلا' };
          variantLabel = labels[selectedVariant] || selectedVariant;
        }

        if (typeof CrepeAPI !== 'undefined') {
          CrepeAPI.addToCart({
            itemId: item.id,
            name: item.name,
            variant,
            variantLabel,
            unitPrice
          });
          CrepeAPI.showToast('تمت إضافة الصنف للسلة', 'success', 1500);
        }
      }
    });
  }

  // Modal Close
  if (elements.modalCloseBtn) {
    elements.modalCloseBtn.addEventListener('click', closeItemModal);
  }

  if (elements.itemModal) {
    elements.itemModal.addEventListener('click', e => {
      if (e.target === elements.itemModal) closeItemModal();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeItemModal();
    }
  });
}

// Update Auth Button State in Navbar
function updateNavAuthState() {
  if (typeof CrepeAPI === 'undefined') return;
  const authBtn = document.getElementById('navAuthBtn');
  const authBtnText = document.getElementById('authBtnText');
  if (!authBtn || !authBtnText) return;

  if (CrepeAPI.isLoggedIn()) {
    const user = CrepeAPI.getUser();
    authBtnText.textContent = user ? (user.displayName || user.username) : 'حسابي';
    authBtn.href = '#';
    authBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('عايز تسجل خروج؟')) {
        CrepeAPI.logout();
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initApp(); updateNavAuthState(); });
} else {
  initApp();
  updateNavAuthState();
}
})();
