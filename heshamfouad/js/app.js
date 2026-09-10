/**
 * Hesham Fouad — King of Crepe (هشام فؤاد — ملك الكريب)
 * Main Application Logic (Zero Crepe Photos - Pure Luxury Bistro)
 */
document.addEventListener('DOMContentLoaded', () => {
  const data = window.HeshamFouadData;
  if (!data) return;

  const { restaurantInfo, categories, menuItems, extraAddons, extraSauces, sweetSauces } = data;

  // Application State
  const state = {
    activeCategory: 'all',
    searchQuery: '',
    currentModalItem: null,
    modalQty: 1,
    selectedAddons: [],
    selectedSauces: [],
    chefNotes: ''
  };

  // DOM Elements
  const menuGrid = document.getElementById('menuItemsGrid');
  const itemsCounterText = document.getElementById('itemsCounterText');
  const searchInput = document.getElementById('menuSearchInput');
  const searchClearBtn = document.getElementById('menuSearchClear');
  const zeroResultsBox = document.getElementById('zeroResultsBox');
  const categoryNavBar = document.getElementById('categoryNavBar');
  const btnResetSearch = document.getElementById('btnResetSearch');

  // Modal Elements
  const modal = document.getElementById('itemCustomizerModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalItemCat = document.getElementById('modalItemCat');
  const modalItemName = document.getElementById('modalItemName');
  const modalItemDesc = document.getElementById('modalItemDesc');
  const modalAddonsSection = document.getElementById('modalAddonsSection');
  const modalAddonsList = document.getElementById('modalAddonsList');
  const modalSaucesSection = document.getElementById('modalSaucesSection');
  const modalSaucesList = document.getElementById('modalSaucesList');
  const modalChefNotes = document.getElementById('modalChefNotes');
  const modalQtyDigit = document.getElementById('modalQtyDigit');
  const modalTotalSum = document.getElementById('modalTotalSum');
  const btnQtyMinus = document.getElementById('btnQtyMinus');
  const btnQtyPlus = document.getElementById('btnQtyPlus');
  const btnConfirmAddToCart = document.getElementById('btnConfirmAddToCart');

  // Mouse Spotlight Tracking
  window.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  });

  // Initialize
  initVideoReels();
  renderMenuItems();
  setupEventListeners();
  initNavAuthState();

  /* ==========================================================================
     1. Live Video Reels (3 Side-by-Side Videos at top of Menu + Tap to Play)
     ========================================================================== */
  function initVideoReels() {
    const reelCards = document.querySelectorAll('.reel-item-card');
    reelCards.forEach(card => {
      const video = card.querySelector('video');
      const videoBox = card.querySelector('.reel-video-box');
      const audioBtn = card.querySelector('.btn-reel-audio-toggle');
      const playBtn = card.querySelector('.btn-reel-play-pause');
      if (!video || !videoBox) return;

      // Ensure muted by default for autoplay compliance
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      // Video state event synchronization
      video.addEventListener('play', () => {
        videoBox.classList.add('playing');
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      });

      video.addEventListener('pause', () => {
        videoBox.classList.remove('playing');
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
      });

      video.addEventListener('ended', () => {
        videoBox.classList.remove('playing');
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
      });

      // Tap anywhere on video box to toggle play/pause
      videoBox.addEventListener('click', (e) => {
        if (e.target.closest('.btn-reel-audio-toggle')) return;
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });

      // Mouse hover play preview for desktop
      card.addEventListener('mouseenter', () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      });

      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (video.paused) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }

      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Mute all other videos
          document.querySelectorAll('.reel-item-card video').forEach(v => {
            if (v !== video) {
              v.muted = true;
              const b = v.parentElement.querySelector('.btn-reel-audio-toggle');
              if (b) {
                b.innerHTML = '<i class="fas fa-volume-mute"></i>';
                b.classList.remove('active');
              }
            }
          });

          video.muted = !video.muted;
          if (!video.muted) {
            video.play().catch(() => {});
            audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            audioBtn.classList.add('active');
          } else {
            audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            audioBtn.classList.remove('active');
          }
        });
      }

      // Try autoplay on load
      video.play().catch(() => {});
    });

    // Intersection observer for viewport autoplay
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const video = entry.target.querySelector('video');
          if (!video) return;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.4 });

      reelCards.forEach(card => observer.observe(card));
    }
  }

  /* ==========================================================================
     2. Render Menu Items Grid (NO FOOD PHOTOS - PURE LUXURY TYPOGRAPHY)
     ========================================================================== */
  function renderMenuItems() {
    if (!menuGrid) return;

    let filtered = menuItems;

    // 1. Filter by category
    if (state.activeCategory && state.activeCategory !== 'all') {
      filtered = filtered.filter(item => item.categoryId === state.activeCategory);
    }

    // 2. Filter by search query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(item => {
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const tagsMatch = (item.tags || []).some(t => t.toLowerCase().includes(q));
        return nameMatch || descMatch || tagsMatch;
      });
    }

    // Update Counter
    if (itemsCounterText) {
      const catName = categories.find(c => c.id === state.activeCategory)?.name || 'الأصناف';
      itemsCounterText.textContent = `عرض ${catName} (${filtered.length} صنف)`;
    }

    // Handle Zero Results
    if (filtered.length === 0) {
      menuGrid.innerHTML = '';
      if (zeroResultsBox) zeroResultsBox.style.display = 'block';
      return;
    } else {
      if (zeroResultsBox) zeroResultsBox.style.display = 'none';
    }

    // Category fallback images
    const fallbackCategoryImages = {
      signature: 'assets/images/hesham-holding-crepe.png',
      chicken: 'assets/images/crunchy-chicken-cheese.png',
      meat: 'assets/images/trio-crepe.png',
      fries: 'assets/images/crepe-cross-section.png',
      sweet: 'assets/images/crepe-varieties.png',
      sauces: 'assets/images/crepe-cone-loaded.png'
    };

    // Category dictionary for badges
    const catMap = {
      signature: { name: 'ميكس الوحش', icon: 'fa-crown', color: '#F5A623' },
      chicken: { name: 'دجاج بلدي', icon: 'fa-drumstick-bite', color: '#10B981' },
      meat: { name: 'لحوم بلدي', icon: 'fa-bacon', color: '#EF4444' },
      fries: { name: 'بطاطس وجبن', icon: 'fa-cheese', color: '#F5A623' },
      sweet: { name: 'كريب حلو', icon: 'fa-cookie-bite', color: '#EC4899' },
      sauces: { name: 'صوصات وإكسترا', icon: 'fa-pepper-hot', color: '#8B5CF6' }
    };

    // Render Cards
    menuGrid.innerHTML = filtered.map(item => {
      const catInfo = catMap[item.categoryId] || { name: 'كريب فاخر', icon: 'fa-utensils', color: '#0A748A' };
      const isSignature = item.isSignature || item.popular;
      const cardImage = item.image || fallbackCategoryImages[item.categoryId] || 'assets/images/crispy-chicken-crepe.png';

      return `
        <div class="menu-bistro-card ${isSignature ? 'is-signature-card' : ''}" data-item-id="${item.id}">
          
          <!-- Food Image Showcase with Floating Badges -->
          <div class="bistro-card-media" onclick="window.HeshamFouadApp.openCustomizer('${item.id}')" title="اضغط للتفاصيل والإضافة">
            <img src="${cardImage}" alt="${item.name}" loading="lazy" class="bistro-card-img" onerror="this.onerror=null;this.src='assets/images/crispy-chicken-crepe.png';">
            <div class="bistro-card-media-overlay"></div>
            <div class="bistro-card-badges-float">
              <span class="bistro-card-badge" style="border-color: ${catInfo.color}; color: ${catInfo.color};">
                <i class="fas ${catInfo.icon}"></i> ${catInfo.name}
              </span>
              ${item.tags && item.tags.length > 0 ? `<span class="bistro-mini-tag">${item.tags[0]}</span>` : ''}
            </div>
            ${isSignature ? `<div class="bistro-signature-crown"><i class="fas fa-crown"></i> <span>الأكثر طلباً</span></div>` : ''}
          </div>

          <!-- Title & Description -->
          <div class="bistro-card-body">
            <h3 class="bistro-card-title">${item.name}</h3>
            <p class="bistro-card-desc">${item.description}</p>
          </div>

          <!-- Footer: Price & Add Button -->
          <div class="bistro-card-footer">
            <div class="bistro-price-wrap">
              <span class="bistro-price-val">${item.price}</span>
              <span class="bistro-price-curr">ج.م</span>
            </div>

            <button type="button" class="btn-bistro-add" onclick="window.HeshamFouadApp.openCustomizer('${item.id}')" title="أضف للطلب">
              <i class="fas fa-shopping-bag"></i>
              <span>أضف للطلب</span>
            </button>
          </div>

        </div>
      `;
    }).join('');
  }

  /* ==========================================================================
     3. Item Customization Modal (Addons, Sauces, Chef Notes, Quantity)
     ========================================================================== */
  function openCustomizer(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    state.currentModalItem = item;
    state.modalQty = 1;
    state.selectedAddons = [];
    state.selectedSauces = [];
    state.chefNotes = '';

    if (modalItemName) modalItemName.textContent = item.name;
    if (modalItemDesc) modalItemDesc.textContent = item.description;
    if (modalQtyDigit) modalQtyDigit.textContent = '1';
    if (modalChefNotes) modalChefNotes.value = '';

    const catObj = categories.find(c => c.id === item.categoryId);
    if (modalItemCat) modalItemCat.textContent = catObj ? catObj.name : 'كريب فاخر';

    const isSweet = item.categoryId === 'sweet';

    // 1. Extra Cheese & Addons
    if (modalAddonsSection && modalAddonsList) {
      if (isSweet) {
        modalAddonsSection.style.display = 'none';
      } else {
        modalAddonsSection.style.display = 'block';
        modalAddonsList.innerHTML = extraAddons.map(addon => `
          <label class="modal-addon-checkbox-row">
            <input type="checkbox" value="${addon.id}" data-type="addon" data-price="${addon.price}" data-name="${addon.name}" onchange="window.HeshamFouadApp.onAddonCheck(this)">
            <span class="modal-addon-name">${addon.name}</span>
            <span class="modal-addon-price">+${addon.price} ج</span>
          </label>
        `).join('');
      }
    }

    // 2. Extra Sauces
    if (modalSaucesSection && modalSaucesList) {
      const relevantSauces = isSweet ? sweetSauces : extraSauces;
      modalSaucesSection.style.display = 'block';
      modalSaucesList.innerHTML = relevantSauces.map(sauce => `
        <label class="modal-addon-checkbox-row">
          <input type="checkbox" value="${sauce.id}" data-type="sauce" data-price="${sauce.price}" data-name="${sauce.name}" onchange="window.HeshamFouadApp.onSauceCheck(this)">
          <span class="modal-addon-name">${sauce.name}</span>
          <span class="modal-addon-price">+${sauce.price} ج</span>
        </label>
      `).join('');
    }

    updateModalTotal();
    if (modal) modal.style.display = 'flex';
  }

  function closeModal() {
    if (modal) modal.style.display = 'none';
    state.currentModalItem = null;
  }

  function updateModalTotal() {
    if (!state.currentModalItem) return;
    const base = Number(state.currentModalItem.price) || 0;
    const addonsSum = state.selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const saucesSum = state.selectedSauces.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const unitPrice = base + addonsSum + saucesSum;
    const finalTotal = unitPrice * state.modalQty;

    if (modalTotalSum) modalTotalSum.textContent = finalTotal;
  }

  function onAddonCheck(checkbox) {
    const addon = {
      id: checkbox.value,
      name: checkbox.dataset.name,
      price: Number(checkbox.dataset.price)
    };
    if (checkbox.checked) {
      state.selectedAddons.push(addon);
    } else {
      state.selectedAddons = state.selectedAddons.filter(a => a.id !== addon.id);
    }
    updateModalTotal();
  }

  function onSauceCheck(checkbox) {
    const sauce = {
      id: checkbox.value,
      name: checkbox.dataset.name,
      price: Number(checkbox.dataset.price)
    };
    if (checkbox.checked) {
      state.selectedSauces.push(sauce);
    } else {
      state.selectedSauces = state.selectedSauces.filter(s => s.id !== sauce.id);
    }
    updateModalTotal();
  }

  function confirmAddToCart() {
    if (!state.currentModalItem) return;

    const notes = modalChefNotes ? modalChefNotes.value.trim() : '';

    if (window.HeshamFouadCart) {
      window.HeshamFouadCart.addToCart(
        state.currentModalItem,
        state.modalQty,
        state.selectedAddons,
        state.selectedSauces,
        notes
      );
    }

    closeModal();
  }

  /* ==========================================================================
     4. Event Listeners Setup
     ========================================================================== */
  function setupEventListeners() {
    // Category pills click
    if (categoryNavBar) {
      categoryNavBar.addEventListener('click', (e) => {
        const pill = e.target.closest('.cat-pill');
        if (!pill) return;

        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        state.activeCategory = pill.dataset.cat || 'all';
        renderMenuItems();
      });
    }

    // Live search input
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.searchQuery = searchInput.value;
        if (searchClearBtn) {
          searchClearBtn.style.display = searchInput.value ? 'inline-flex' : 'none';
        }
        renderMenuItems();
      });
    }

    // Clear search button
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        searchClearBtn.style.display = 'none';
        renderMenuItems();
        searchInput.focus();
      });
    }

    // Reset search from empty state
    if (btnResetSearch) {
      btnResetSearch.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.searchQuery = '';
        state.activeCategory = 'all';
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        document.querySelector('.cat-pill[data-cat="all"]')?.classList.add('active');
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        renderMenuItems();
      });
    }

    // Modal close handlers
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
        closeModal();
      }
    });

    // Quantity buttons
    if (btnQtyMinus) {
      btnQtyMinus.addEventListener('click', () => {
        if (state.modalQty > 1) {
          state.modalQty--;
          if (modalQtyDigit) modalQtyDigit.textContent = state.modalQty;
          updateModalTotal();
        }
      });
    }

    if (btnQtyPlus) {
      btnQtyPlus.addEventListener('click', () => {
        if (state.modalQty < 20) {
          state.modalQty++;
          if (modalQtyDigit) modalQtyDigit.textContent = state.modalQty;
          updateModalTotal();
        }
      });
    }

    // Confirm add to cart
    if (btnConfirmAddToCart) {
      btnConfirmAddToCart.addEventListener('click', confirmAddToCart);
    }
  }

  /* ==========================================================================
     Navbar User Dropdown State
     ========================================================================== */
  function initNavAuthState() {
    if (typeof window.HeshamFouadAPI === 'undefined') return;
    const authContainer = document.getElementById('navAuthContainer');
    if (!authContainer) return;

    if (window.HeshamFouadAPI.isLoggedIn()) {
      const user = window.HeshamFouadAPI.getUser();
      const displayName = user ? (user.displayName || user.username) : 'حسابي';

      authContainer.innerHTML = `
        <div class="nav-user-dropdown" id="navUserDropdownWrap">
          <button type="button" class="nav-auth-btn" id="navUserBtn" aria-label="قائمة الحساب">
            <i class="fas fa-crown" style="color:var(--accent-gold);"></i>
            <span>${displayName}</span>
            <i class="fas fa-chevron-down" style="font-size:0.75rem;"></i>
          </button>
          <div class="user-dropdown-menu" id="userDropdownMenu">
            <a href="orders.html" class="dropdown-item">
              <i class="fas fa-receipt" style="color:var(--accent-gold);"></i>
              <span>طلباتي</span>
            </a>
            <button type="button" class="dropdown-item" id="btnChangePwModal">
              <i class="fas fa-key" style="color:var(--primary-light);"></i>
              <span>تغيير كلمة المرور</span>
            </button>
            <button type="button" class="dropdown-item logout-item" id="btnLogoutCustomer">
              <i class="fas fa-sign-out-alt"></i>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      `;

      const userBtn = document.getElementById('navUserBtn');
      const menu = document.getElementById('userDropdownMenu');
      const wrap = document.getElementById('navUserDropdownWrap');

      if (userBtn && menu) {
        userBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          menu.classList.toggle('show');
        });

        document.getElementById('btnChangePwModal')?.addEventListener('click', () => {
          menu.classList.remove('show');
          window.HeshamFouadAPI.openChangePasswordModal();
        });

        document.getElementById('btnLogoutCustomer')?.addEventListener('click', () => {
          window.HeshamFouadAPI.logout();
        });

        document.addEventListener('click', (e) => {
          if (wrap && !wrap.contains(e.target)) {
            menu.classList.remove('show');
          }
        });
      }
    } else {
      authContainer.innerHTML = `
        <a href="auth.html?returnTo=menu.html" class="nav-auth-btn" id="navAuthBtn" aria-label="تسجيل الدخول">
          <i class="fas fa-user"></i>
          <span>دخول</span>
        </a>
      `;
    }
  }

  // Export to Global Window
  window.HeshamFouadApp = {
    openCustomizer,
    closeModal,
    onAddonCheck,
    onSauceCheck,
    confirmAddToCart,
    renderMenuItems
  };
});
