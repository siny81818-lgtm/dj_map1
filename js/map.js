/**
 * Map Module (Leaflet & MarkerCluster)
 */
class MapManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.clusterGroup = null;
    this.markersMap = new Map(); // id -> L.marker
    this.myLocationMarker = null;

    // Default Busan Center
    this.busanCenter = [35.1795543, 129.0756416];
    this.defaultZoom = 12;

    this.initMap();
  }

  initMap() {
    this.map = L.map(this.containerId, {
      center: this.busanCenter,
      zoom: this.defaultZoom,
      zoomControl: false // Custom control positioning
    });

    // Add Zoom Control to Bottom Right (Desktop friendly)
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // OpenStreetMap Tile Layer (Free & Open Source)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Marker Cluster Group
    this.clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let sizeClass = 'marker-cluster-small';
        if (count > 50) sizeClass = 'marker-cluster-large';
        else if (count > 20) sizeClass = 'marker-cluster-medium';

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${sizeClass}`,
          iconSize: L.point(40, 40)
        });
      }
    });

    this.map.addLayer(this.clusterGroup);
  }

  /**
   * Generate SVG custom pin icon with brand color
   */
  createPinIcon(color, brand) {
    const svgHtml = `
      <div class="custom-pin">
        <svg viewBox="0 0 30 38" width="30" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 23 15 23s15-12.5 15-23c0-8.284-6.716-15-15-15z" fill="${color}"/>
          <circle cx="15" cy="15" r="7" fill="#ffffff"/>
          <text x="15" y="18" font-size="8" font-weight="bold" fill="${color}" text-anchor="middle" font-family="sans-serif">${brand.slice(0, 2)}</text>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: svgHtml,
      className: 'store-pin-marker',
      iconSize: [30, 38],
      iconAnchor: [15, 38],
      popupAnchor: [0, -36]
    });
  }

  /**
   * Generate HTML Popup content for a store
   */
  createPopupContent(store) {
    const kakaoNavUrl = `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.lat},${store.lng}`;
    const naverNavUrl = `https://map.naver.com/v5/search/${encodeURIComponent(store.addr || store.name)}`;

    return `
      <div class="popup-container">
        <div class="popup-header">
          <span class="popup-badge" style="background-color: ${store.color}">${store.brandName}</span>
          <span style="font-size: 11px; color: #64748b;">${store.district}</span>
        </div>
        <div class="popup-name">${store.name} ${store.branch ? `<span style="font-weight: 500; font-size: 13px; color: #475569;">(${store.branch})</span>` : ''}</div>
        <div class="popup-addr">📍 ${store.addr || '주소 정보 없음'}</div>
        <div class="popup-actions">
          <a href="${kakaoNavUrl}" target="_blank" rel="noopener noreferrer" class="popup-nav-btn btn-kakao">카카오맵 길찾기</a>
          <a href="${naverNavUrl}" target="_blank" rel="noopener noreferrer" class="popup-nav-btn btn-naver">네이버지도</a>
        </div>
      </div>
    `;
  }

  /**
   * Render or update markers on the map
   */
  renderMarkers(stores, onMarkerClick) {
    this.clusterGroup.clearLayers();
    this.markersMap.clear();

    const markersToAdd = [];

    stores.forEach((store) => {
      const icon = this.createPinIcon(store.color, store.brand);
      const marker = L.marker([store.lat, store.lng], { icon });

      marker.bindPopup(this.createPopupContent(store));
      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(store);
      });

      this.markersMap.set(store.id, marker);
      markersToAdd.push(marker);
    });

    this.clusterGroup.addLayers(markersToAdd);
  }

  /**
   * Focus on a specific store and open its popup
   */
  focusStore(store) {
    const marker = this.markersMap.get(store.id);
    if (!marker) return;

    this.map.flyTo([store.lat, store.lng], 16, {
      duration: 0.8
    });

    // If marker is in a cluster, uncluster or open popup after animation
    setTimeout(() => {
      this.clusterGroup.zoomToShowLayer(marker, () => {
        marker.openPopup();
      });
    }, 400);
  }

  /**
   * Fit map view to bounds or district center
   */
  fitToDistrict(districtInfo) {
    if (!districtInfo) {
      this.resetView();
      return;
    }
    if (districtInfo.bounds) {
      this.map.fitBounds(districtInfo.bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (districtInfo.center) {
      this.map.flyTo(districtInfo.center, 13);
    }
  }

  /**
   * Reset to default Busan view
   */
  resetView() {
    this.map.flyTo(this.busanCenter, this.defaultZoom);
  }

  /**
   * Show current user location
   */
  setUserLocation(lat, lng) {
    if (this.myLocationMarker) {
      this.map.removeLayer(this.myLocationMarker);
    }

    const myIcon = L.divIcon({
      html: '<div class="my-location-marker"></div>',
      className: 'my-location-wrapper',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    this.myLocationMarker = L.marker([lat, lng], { icon: myIcon, zIndexOffset: 1000 }).addTo(this.map);
    this.myLocationMarker.bindPopup('<b>현재 내 위치</b>').openPopup();

    this.map.flyTo([lat, lng], 15, { duration: 1.0 });
  }
}
