/**
 * Hesham Fouad — King of Crepe
 * Main Application Logic & Interactivity (No Emojis)
 */
document.addEventListener('DOMContentLoaded', () => {
  const data = window.HeshamFouadData;
  if (!data) return;

  const { restaurantInfo, categories, menuItems, extraAddons, extraSauces, sweetSauces, galleryVideos } = data;

  let currentModalItem = null;
  let selectedAddons = [];
  let selectedSauces = [];

  initNavigation();
  initVideoReels();

  const menuContainer = document.getElementById('menu-items-grid');
  if (menuContainer) {
    renderMenuGrid(menuItems, 'signature');
    initCategoryTabs();
  }

  initModal();

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

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initVideoReels() {
    const reels = document.querySelectorAll('.reel-video-wrap video');
    reels.forEach(video => {
      video.parentElement.addEventListener('mouseenter', () => {
        video.play().catch(() => {});
      });
      video.parentElement.addEventListener('mouseleave', () => {
        video.pause();
      });

      const soundBtn = video.parentElement.parentElement.querySelector('.btn-play-sound');
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

  function renderMenuGrid(items, activeCatId = 'all') {
    if (!menuContainer) return;

    let filtered = items;
    if (activeCatId && activeCatId !== 'all') {
      filtered = items.filter(item => item.categoryId === activeCatId);
    }

    if (filtered.length === 0) {
      menuContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <i class="fas fa-search" style="font-size: 2.5rem; color: var(--primary); margin-bottom: 1rem;"></i>
          <h3 style="color: var(--text-white);">لا توجد أصناف مطابقة للبحث</h3>
          <p>يرجى تجربة اختيار قسم آخر أو تغيير كلمة البحث.</p>
        </div>
      `;
      return;
    }

    menuContainer.innerHTML = filtered.map(item => `
      <div class="menu-card" data-id="${item.id}" data-category="${item.categoryId}">
        <div>
          <div class="menu-card-header">
            <h3 class="menu-card-title">${item.name}</h3>
            <div class="menu-card-badges">
              <span class="badge-discount-tag">خصم 15%</span>
              ${item.isSignature ? `<span class="badge-signature-tag">المميز</span>` : ''}
            </div>
          </div>
          <p class="menu-card-desc">${item.description}</p>
          ${item.tags && item.tags.length ? `
            <div class="menu-card-tags">
              ${item.tags.map(t => `<span class="menu-tag-pill">${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="menu-card-footer">
          <div class="menu-price-wrap">
            <span class="menu-price">${item.price}</span>
            <span class="menu-currency">ج.م</span>
          </div>
          <button class="btn-add-cart" onclick="window.HeshamFouadApp.openCustomizer('${item.id}')">
            <i class="fas fa-shopping-bag"></i>
            <span>اطلب الآن</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  function initCategoryTabs() {
    const tabsContainer = document.querySelector('.category-tabs');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.cat-tab');
      if (!tab) return;

      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const catId = tab.dataset.category;
      renderMenuGrid(menuItems, catId);
    });
  }

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
    const modalImg = modal.querySelector('#modal-item-img');
    const addonsWrap = modal.querySelector('#modal-addons-list');
    const saucesWrap = modal.querySelector('#modal-sauces-list');

    if (modalTitle) modalTitle.textContent = item.name;
    if (modalDesc) modalDesc.textContent = item.description;
    if (modalPrice) modalPrice.textContent = `${item.price} ج.م`;
    if (modalImg) modalImg.src = item.image;

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

    window.HeshamFouadCart.addToCart(
      currentModalItem,
      1,
      [...selectedAddons],
      [...selectedSauces],
      notes
    );

    closeModal();
    if (notesInput) notesInput.value = '';
  }

  window.HeshamFouadApp = {
    openCustomizer,
    closeModal,
    onAddonToggle,
    onSauceToggle,
    confirmAddToCart
  };
});
