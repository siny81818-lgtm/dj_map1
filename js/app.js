/**
 * Main Application Orchestrator
 */
document.addEventListener('DOMContentLoaded', async () => {
  const brandList = [
    { code: 'ALL', name: '전체', color: '#1e293b' },
    { code: 'CU', name: 'CU', color: '#652D90' },
    { code: 'GS25', name: 'GS25', color: '#007BC4' },
    { code: '7-ELEVEN', name: '세븐일레븐', color: '#008060' },
    { code: 'EMART24', name: '이마트24', color: '#F59E0B' },
    { code: 'MINISTOP', name: '미니스톱', color: '#005BAC' },
    { code: 'OTHER', name: '기타', color: '#64748b' }
  ];

  let mapManager = null;
  let filterManager = null;
  let storeData = null;

  // UI Elements
  const districtSelect = document.getElementById('district-select');
  const mobileDistrictSelect = document.getElementById('mobile-district-select');
  const keywordInput = document.getElementById('keyword-input');
  const mobileKeywordInput = document.getElementById('mobile-keyword-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const resetFilterBtn = document.getElementById('reset-filter-btn');
  const brandChipsContainer = document.getElementById('brand-chips');
  const mobileBrandChipsContainer = document.getElementById('mobile-brand-chips');
  const resultCountEl = document.getElementById('result-count');
  const totalCountEl = document.getElementById('total-count');
  const mobileResultCountEl = document.getElementById('mobile-result-count');
  const storeListEl = document.getElementById('store-list');
  const mobileStoreListEl = document.getElementById('mobile-store-list');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const resetViewBtn = document.getElementById('reset-view-btn');
  const myLocationBtn = document.getElementById('my-location-btn');
  const mobileMyLocationBtn = document.getElementById('mobile-my-location-btn');

  // Mobile Bottom Sheet & Modal Elements
  const bottomSheet = document.getElementById('bottom-sheet');
  const sheetHandle = document.getElementById('sheet-handle');
  const sheetToggleBtn = document.getElementById('sheet-toggle-btn');
  const mobileFilterOpenBtn = document.getElementById('mobile-filter-open-btn');
  const mobileFilterModal = document.getElementById('mobile-filter-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const mobileFilterResetBtn = document.getElementById('mobile-filter-reset-btn');
  const mobileFilterApplyBtn = document.getElementById('mobile-filter-apply-btn');

  try {
    // 1. Load stores data (support both direct file access and web server fetch)
    if (window.STORE_DATA) {
      storeData = window.STORE_DATA;
    } else {
      const response = await fetch('data/stores.json');
      if (!response.ok) throw new Error('Failed to load store data');
      storeData = await response.json();
    }

    // 2. Initialize Managers
    mapManager = new MapManager('map');
    filterManager = new FilterManager(storeData.stores, storeData.districts);

    // 3. Populate District Selects
    initDistricts(storeData.districts);

    // 4. Render Brand Chips
    renderBrandChips(brandChipsContainer);
    renderBrandChips(mobileBrandChipsContainer);

    // 5. Update counts
    totalCountEl.textContent = storeData.totalCount.toLocaleString();

    // 6. Connect filter change callback
    filterManager.onFilterChangeCallback = (filtered) => {
      // Update counts
      const countStr = filtered.length.toLocaleString();
      resultCountEl.textContent = countStr;
      if (mobileResultCountEl) mobileResultCountEl.textContent = `${countStr}개`;

      // Update map markers
      mapManager.renderMarkers(filtered, (selectedStore) => {
        highlightStoreCard(selectedStore.id);
      });

      // Update lists
      filterManager.renderList(storeListEl, (store) => {
        mapManager.focusStore(store);
      });

      filterManager.renderList(mobileStoreListEl, (store) => {
        mapManager.focusStore(store);
        collapseBottomSheet();
      });
    };

    // 7. Initial render
    filterManager.applyFilters();

    // 8. Bind Events
    bindEvents();

  } catch (err) {
    console.error('App initialization failed:', err);
    if (storeListEl) {
      storeListEl.innerHTML = `<div class="empty-state"><p>데이터를 불러오지 못했습니다.</p></div>`;
    }
  }

  /* -------------------------------------------------------------
     Helper Functions
  ------------------------------------------------------------- */
  function initDistricts(districts) {
    const sortedDistricts = Object.keys(districts).sort((a, b) => a.localeCompare(b, 'ko'));

    sortedDistricts.forEach((dist) => {
      const opt1 = document.createElement('option');
      opt1.value = dist;
      opt1.textContent = `${dist} (${districts[dist].count}개)`;
      districtSelect.appendChild(opt1);

      if (mobileDistrictSelect) {
        const opt2 = document.createElement('option');
        opt2.value = dist;
        opt2.textContent = `${dist} (${districts[dist].count}개)`;
        mobileDistrictSelect.appendChild(opt2);
      }
    });
  }

  function renderBrandChips(container) {
    if (!container) return;
    container.innerHTML = '';

    brandList.forEach((brand) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `brand-chip ${brand.code === 'ALL' ? 'active' : ''}`;
      chip.setAttribute('data-brand', brand.code);

      const dot = `<span class="chip-dot" style="background-color: ${brand.color}"></span>`;
      chip.innerHTML = `${dot} <span>${brand.name}</span>`;

      chip.addEventListener('click', () => {
        filterManager.toggleBrand(brand.code);
        syncBrandChipsUI();
      });

      container.appendChild(chip);
    });
  }

  function syncBrandChipsUI() {
    const selected = filterManager.selectedBrands;
    document.querySelectorAll('.brand-chip').forEach((chip) => {
      const b = chip.getAttribute('data-brand');
      if (selected.has(b)) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function highlightStoreCard(storeId) {
    document.querySelectorAll('.store-card').forEach((card) => {
      if (card.getAttribute('data-id') === storeId) {
        card.classList.add('selected');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        card.classList.remove('selected');
      }
    });
  }

  function collapseBottomSheet() {
    if (bottomSheet) {
      bottomSheet.classList.remove('half', 'full');
    }
  }

  /* -------------------------------------------------------------
     Event Listeners
  ------------------------------------------------------------- */
  function bindEvents() {
    // District Select change
    districtSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (mobileDistrictSelect) mobileDistrictSelect.value = val;
      filterManager.setDistrict(val);
      if (val === 'ALL') {
        mapManager.resetView();
      } else {
        mapManager.fitToDistrict(storeData.districts[val]);
      }
    });

    if (mobileDistrictSelect) {
      mobileDistrictSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        districtSelect.value = val;
      });
    }

    // Debounced Keyword Search
    let debounceTimer;
    const handleSearchInput = (value) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        filterManager.setKeyword(value);
        if (value.trim()) {
          clearSearchBtn.style.display = 'flex';
        } else {
          clearSearchBtn.style.display = 'none';
        }
      }, 250);
    };

    keywordInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (mobileKeywordInput) mobileKeywordInput.value = val;
      handleSearchInput(val);
    });

    if (mobileKeywordInput) {
      mobileKeywordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        keywordInput.value = val;
        handleSearchInput(val);
      });
    }

    clearSearchBtn.addEventListener('click', () => {
      keywordInput.value = '';
      if (mobileKeywordInput) mobileKeywordInput.value = '';
      clearSearchBtn.style.display = 'none';
      filterManager.setKeyword('');
      keywordInput.focus();
    });

    // Reset Filters
    resetFilterBtn.addEventListener('click', () => {
      filterManager.resetAllFilters();
      districtSelect.value = 'ALL';
      if (mobileDistrictSelect) mobileDistrictSelect.value = 'ALL';
      keywordInput.value = '';
      if (mobileKeywordInput) mobileKeywordInput.value = '';
      clearSearchBtn.style.display = 'none';
      syncBrandChipsUI();
      mapManager.resetView();
    });

    // Reset Map View
    resetViewBtn.addEventListener('click', () => {
      mapManager.resetView();
    });

    // Geolocation
    const handleMyLocation = () => {
      if (!navigator.geolocation) {
        alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapManager.setUserLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          alert('현재 위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    myLocationBtn.addEventListener('click', handleMyLocation);
    if (mobileMyLocationBtn) mobileMyLocationBtn.addEventListener('click', handleMyLocation);

    // Sidebar Toggle
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    // Mobile Bottom Sheet Interactions
    if (bottomSheet) {
      sheetToggleBtn.addEventListener('click', () => {
        if (bottomSheet.classList.contains('half') || bottomSheet.classList.contains('full')) {
          bottomSheet.classList.remove('half', 'full');
        } else {
          bottomSheet.classList.add('half');
        }
      });

      sheetHandle.addEventListener('click', () => {
        if (!bottomSheet.classList.contains('half') && !bottomSheet.classList.contains('full')) {
          bottomSheet.classList.add('half');
        } else if (bottomSheet.classList.contains('half')) {
          bottomSheet.classList.remove('half');
          bottomSheet.classList.add('full');
        } else {
          bottomSheet.classList.remove('full');
        }
      });
    }

    // Mobile Filter Modal
    if (mobileFilterOpenBtn && mobileFilterModal) {
      mobileFilterOpenBtn.addEventListener('click', () => {
        mobileFilterModal.classList.add('open');
      });

      modalCloseBtn.addEventListener('click', () => {
        mobileFilterModal.classList.remove('open');
      });

      mobileFilterModal.addEventListener('click', (e) => {
        if (e.target === mobileFilterModal) {
          mobileFilterModal.classList.remove('open');
        }
      });

      mobileFilterResetBtn.addEventListener('click', () => {
        filterManager.resetAllFilters();
        districtSelect.value = 'ALL';
        if (mobileDistrictSelect) mobileDistrictSelect.value = 'ALL';
        keywordInput.value = '';
        if (mobileKeywordInput) mobileKeywordInput.value = '';
        syncBrandChipsUI();
        mapManager.resetView();
        mobileFilterModal.classList.remove('open');
      });

      mobileFilterApplyBtn.addEventListener('click', () => {
        if (mobileDistrictSelect) {
          const val = mobileDistrictSelect.value;
          districtSelect.value = val;
          filterManager.setDistrict(val);
          if (val === 'ALL') {
            mapManager.resetView();
          } else {
            mapManager.fitToDistrict(storeData.districts[val]);
          }
        }
        mobileFilterModal.classList.remove('open');
      });
    }
  }
});
