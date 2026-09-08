/**
 * Hesham Fouad — King of Crepe
 * Main Application Logic & Retro-Modern UI Interactivity
 */
document.addEventListener('DOMContentLoaded', () => {
  const data = window.HeshamFouadData;
  if (!data) return;

  const { restaurantInfo, categories, menuItems, extraAddons, extraSauces, sweetSauces } = data;

  let currentModalItem = null;
  let selectedAddons = [];
  let selectedSauces = [];

  // Initialize features
  initNavigation();
  initVideoReels();
  initCategoryAccordion();
  initModal();

  // Also support full menu grid if on menu.html
  const legacyMenuGrid = document.getElementById('menu-items-grid');
  if (legacyMenuGrid) {
    renderMenuGrid(menuItems, 'all');
  }

  /* ==========================================================================
     Navigation & Mobile Menu
     ========================================================================== */
  function initNavigation() {
    const toggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        const icon = toggle.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-bars');
          icon.classList.toggle('fa-times');
        }
      });
    }

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          if (navLinks) navLinks.classList.remove('open');
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ==========================================================================
     Video Reels Sound & Hover
     ========================================================================== */
  function initVideoReels() {
    const reelWraps = document.querySelectorAll('.reel-video-wrap');
    reelWraps.forEach(wrap => {
      const video = wrap.querySelector('video');
      if (!video) return;

      wrap.addEventListener('mouseenter', () => {
        video.play().catch(() => {});
      });

      wrap.addEventListener('mouseleave', () => {
        video.pause();
      });

      const soundBtn = wrap.parentElement.querySelector('.btn-play-sound');
      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          video.muted = !video.muted;
          const icon = soundBtn.querySelector('i');
          if (icon) {
            icon.className = video.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
          }
          if (video.paused) {
            video.play().catch(() => {});
          }
        });
      }
    });
  }

  /* ==========================================================================
     INTERACTIVE CATEGORY ACCORDION (Matches the reference image!)
     ========================================================================== */
  let activeCategoryId = 'signature';

  function initCategoryAccordion() {
    const container = document.getElementById('category-accordion-wrapper');
    if (!container) return;

    renderCategoryAccordion(activeCategoryId);
  }

  function renderCategoryAccordion(activeCatId) {
    const container = document.getElementById('category-accordion-wrapper');
    if (!container) return;

    // Filter main categories (excluding standalone sauces from main accordion)
    const displayCategories = categories.filter(c => c.id !== 'sauces');
    const activeCat = displayCategories.find(c => c.id === activeCatId) || displayCategories[0];
    const catItems = menuItems.filter(i => i.categoryId === activeCat.id);

    // Pick featured item
    const featuredItem = catItems.find(i => i.popular || i.isSignature) || catItems[0] || {
      id: 'hesham-fouad-signature',
      name: 'كريب هشام فؤاد المخصوص',
      description: 'أضخم حجم حشو مشكل في أسيوط',
      price: 150,
      image: 'assets/images/hesham-holding-crepe.png'
    };

    // Other categories that are not active
    const inactiveCats = displayCategories.filter(c => c.id !== activeCat.id);

    let html = `
      <!-- Active Expanded Category Box -->
      <div class="cat-expanded-box">
        <div class="cat-banner-header" onclick="window.HeshamFouadApp.toggleCat('${activeCat.id}')">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <i class="fas ${activeCat.icon}"></i>
            <span>${activeCat.name}</span>
          </div>
          <i class="fas fa-chevron-down arrow-icon"></i>
        </div>

        <div class="cat-expanded-content">
          <!-- Featured Column (Left / Right) -->
          <div class="cat-featured-col">
            <img src="${featuredItem.image || 'assets/images/logo.png'}" alt="${featuredItem.name}" class="cat-featured-img">
            <h4 class="cat-featured-title">${featuredItem.name}</h4>
            <p class="cat-featured-desc">${featuredItem.description.substring(0, 75)}...</p>
            <button class="btn-featured-order" onclick="window.HeshamFouadApp.openCustomizer('${featuredItem.id}')">
              <i class="fas fa-shopping-bag"></i>
              <span>طلب ${featuredItem.price} ج.م</span>
            </button>
          </div>

          <!-- Items List Column (Matches reference mockup rows) -->
          <div class="cat-items-list-col">
            ${catItems.slice(0, 5).map(item => `
              <div class="menu-list-row" onclick="window.HeshamFouadApp.openCustomizer('${item.id}')">
                <div class="menu-list-info">
                  <h4 class="menu-list-name">${item.name}</h4>
                  <p class="menu-list-desc">${item.description.substring(0, 60)}...</p>
                </div>
                <div class="menu-list-price-wrap">
                  <span class="menu-list-price">${item.price} ج</span>
                  <button class="btn-quick-add" title="أضف للطلب">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Collapsible Banners for Other Categories -->
      ${inactiveCats.map(cat => `
        <div class="cat-pill-row" onclick="window.HeshamFouadApp.switchCategory('${cat.id}')">
          <div class="cat-pill-left">
            <i class="fas ${cat.icon}"></i>
            <span>${cat.name}</span>
          </div>
          <i class="fas fa-arrow-left" style="color: var(--text-muted-dark); font-size: 1.1rem;"></i>
        </div>
      `).join('')}
    `;

    container.innerHTML = html;
  }

  /* ==========================================================================
     Legacy Menu Grid Support (for menu.html)
     ========================================================================== */
  function renderMenuGrid(items, activeCatId = 'all') {
    const container = document.getElementById('menu-items-grid');
    if (!container) return;

    let filtered = items;
    if (activeCatId && activeCatId !== 'all') {
      filtered = items.filter(item => item.categoryId === activeCatId);
    }

    container.innerHTML = filtered.map(item => `
      <div class="menu-card" data-id="${item.id}">
        <div class="menu-card-header">
          <h3 class="menu-card-title">${item.name}</h3>
          <span class="badge-discount-tag">خصم 15%</span>
        </div>
        <p class="menu-card-desc">${item.description}</p>
        <div class="menu-card-footer">
          <span class="menu-price">${item.price} ج.م</span>
          <button class="btn-add-cart" onclick="window.HeshamFouadApp.openCustomizer('${item.id}')">
            <i class="fas fa-shopping-bag"></i>
            <span>اطلب الآن</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  /* ==========================================================================
     Customizer Modal (Addons, Sauces, Sweet Sauces & Price Math)
     ========================================================================== */
  function initModal() {
    const modal = document.getElementById('customizer-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  function openCustomizer(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    currentModalItem = item;
    selectedAddons = [];
    selectedSauces = [];

    const modal = document.getElementById('customizer-modal');
    if (!modal) return;

    const modalTitle = modal.querySelector('#modal-item-name');
    const modalDesc = modal.querySelector('#modal-item-desc');
    const modalPrice = modal.querySelector('#modal-item-price');
    const addonsWrap = modal.querySelector('#modal-addons-list');
    const saucesWrap = modal.querySelector('#modal-sauces-list');

    if (modalTitle) modalTitle.textContent = item.name;
    if (modalDesc) modalDesc.textContent = item.description;
    if (modalPrice) modalPrice.textContent = `${item.price} ج.م`;

    const isSweet = item.categoryId === 'sweet';
    const relevantSauces = isSweet ? sweetSauces : extraSauces;

    if (addonsWrap) {
      addonsWrap.innerHTML = extraAddons.map(addon => `
        <label class="custom-checkbox-row">
          <input type="checkbox" value="${addon.id}" data-price="${addon.price}" data-name="${addon.name}" onchange="window.HeshamFouadApp.onAddonToggle(this)">
          <span class="custom-name">${addon.name}</span>
          <span class="custom-price">+${addon.price} ج</span>
        </label>
      `).join('');
    }

    if (saucesWrap) {
      saucesWrap.innerHTML = relevantSauces.map(sauce => `
        <label class="custom-checkbox-row">
          <input type="checkbox" value="${sauce.id}" data-price="${sauce.price}" data-name="${sauce.name}" onchange="window.HeshamFouadApp.onSauceToggle(this)">
          <span class="custom-name">${sauce.name}</span>
          <span class="custom-price">+${sauce.price} ج</span>
        </label>
      `).join('');
    }

    updateModalTotal();
    modal.classList.add('active');
  }

  function closeModal() {
    const modal = document.getElementById('customizer-modal');
    if (modal) modal.classList.remove('active');
  }

  function onAddonToggle(checkbox) {
    const addon = {
      id: checkbox.value,
      name: checkbox.dataset.name,
      price: Number(checkbox.dataset.price)
    };

    if (checkbox.checked) {
      selectedAddons.push(addon);
    } else {
      selectedAddons = selectedAddons.filter(a => a.id !== addon.id);
    }
    updateModalTotal();
  }

  function onSauceToggle(checkbox) {
    const sauce = {
      id: checkbox.value,
      name: checkbox.dataset.name,
      price: Number(checkbox.dataset.price)
    };

    if (checkbox.checked) {
      selectedSauces.push(sauce);
    } else {
      selectedSauces = selectedSauces.filter(s => s.id !== sauce.id);
    }
    updateModalTotal();
  }

  function updateModalTotal() {
    if (!currentModalItem) return;
    const addonsSum = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const saucesSum = selectedSauces.reduce((sum, s) => sum + s.price, 0);
    const total = Number(currentModalItem.price) + addonsSum + saucesSum;

    const totalEl = document.getElementById('modal-total-calc');
    if (totalEl) {
      totalEl.textContent = `${total} ج.م`;
    }
  }

  function confirmAddToCart() {
    if (!currentModalItem) return;
    const notesInput = document.getElementById('modal-notes');
    const notes = notesInput ? notesInput.value.trim() : '';

    if (window.HeshamFouadCart) {
      window.HeshamFouadCart.addToCart(
        currentModalItem,
        1,
        [...selectedAddons],
        [...selectedSauces],
        notes
      );
    }

    closeModal();
    if (notesInput) notesInput.value = '';
  }

  // Global App Namespace
  window.HeshamFouadApp = {
    openCustomizer,
    closeModal,
    onAddonToggle,
    onSauceToggle,
    confirmAddToCart,
    switchCategory: (catId) => {
      activeCategoryId = catId;
      renderCategoryAccordion(catId);
    },
    toggleCat: (catId) => {
      // Optional toggle
    }
  };
});
