/**
 * Filter & Search Module
 */
class FilterManager {
  constructor(stores, districts) {
    this.allStores = stores;
    this.districts = districts;
    this.filteredStores = [...stores];

    this.selectedDistrict = 'ALL';
    this.selectedBrands = new Set(['ALL']); // 'ALL' or set of 'CU', 'GS25', etc.
    this.searchKeyword = '';

    this.onFilterChangeCallback = null;
    this.onStoreSelectCallback = null;

    this.renderLimit = 150; // Performance optimization for large list
  }

  setDistrict(district) {
    this.selectedDistrict = district;
    this.applyFilters();
  }

  toggleBrand(brand) {
    if (brand === 'ALL') {
      this.selectedBrands.clear();
      this.selectedBrands.add('ALL');
    } else {
      if (this.selectedBrands.has('ALL')) {
        this.selectedBrands.delete('ALL');
      }

      if (this.selectedBrands.has(brand)) {
        this.selectedBrands.delete(brand);
        if (this.selectedBrands.size === 0) {
          this.selectedBrands.add('ALL');
        }
      } else {
        this.selectedBrands.add(brand);
      }
    }

    this.applyFilters();
  }

  resetBrands() {
    this.selectedBrands.clear();
    this.selectedBrands.add('ALL');
    this.applyFilters();
  }

  setKeyword(keyword) {
    this.searchKeyword = keyword.trim().toLowerCase();
    this.applyFilters();
  }

  resetAllFilters() {
    this.selectedDistrict = 'ALL';
    this.selectedBrands.clear();
    this.selectedBrands.add('ALL');
    this.searchKeyword = '';
    this.applyFilters();
  }

  applyFilters() {
    const isAllBrands = this.selectedBrands.has('ALL');
    const isAllDistricts = this.selectedDistrict === 'ALL';
    const hasKeyword = this.searchKeyword.length > 0;

    this.filteredStores = this.allStores.filter((store) => {
      // 1. District match
      if (!isAllDistricts && store.district !== this.selectedDistrict) {
        return false;
      }

      // 2. Brand match
      if (!isAllBrands && !this.selectedBrands.has(store.brand)) {
        return false;
      }

      // 3. Keyword match
      if (hasKeyword) {
        const targetText = `${store.name} ${store.branch} ${store.addr} ${store.dong}`.toLowerCase();
        if (!targetText.includes(this.searchKeyword)) {
          return false;
        }
      }

      return true;
    });

    if (this.onFilterChangeCallback) {
      this.onFilterChangeCallback(this.filteredStores);
    }
  }

  /**
   * Render store cards into a container element
   */
  renderList(containerElement, onCardClick) {
    if (!containerElement) return;

    if (this.filteredStores.length === 0) {
      containerElement.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <p>조건에 맞는 편의점을 찾을 수 없습니다.</p>
          <span style="font-size: 12px; color: #94a3b8; margin-top: 4px; display: block;">검색어나 필터 조건을 변경해 보세요.</span>
        </div>
      `;
      return;
    }

    const visibleStores = this.filteredStores.slice(0, this.renderLimit);
    let html = '';

    visibleStores.forEach((store) => {
      html += `
        <div class="store-card" data-id="${store.id}">
          <div class="card-top">
            <span class="card-brand-badge" style="background-color: ${store.color}">${store.brandName}</span>
            <span class="card-district">${store.district} · ${store.dong || ''}</span>
          </div>
          <div class="card-name">${store.name} ${store.branch ? `<span style="font-weight: 500; font-size: 13px; color: #64748b;">(${store.branch})</span>` : ''}</div>
          <div class="card-addr">
            <span>📍</span>
            <span>${store.addr || '주소 정보 없음'}</span>
          </div>
        </div>
      `;
    });

    if (this.filteredStores.length > this.renderLimit) {
      html += `
        <div style="text-align: center; padding: 12px; font-size: 12px; color: #64748b;">
          검색 결과 중 상위 ${this.renderLimit}개 매장을 표시하고 있습니다. 지도에서 자세히 확인하세요.
        </div>
      `;
    }

    containerElement.innerHTML = html;

    // Attach click events
    const cards = containerElement.querySelectorAll('.store-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const selected = this.allStores.find((s) => s.id === id);
        if (selected) {
          // Highlight card
          cards.forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');

          if (onCardClick) onCardClick(selected);
        }
      });
    });
  }
}
