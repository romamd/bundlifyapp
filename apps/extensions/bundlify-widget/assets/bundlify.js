(function () {
  'use strict';

  var PROXY_BASE = '/apps/bundlify';
  var SESSION_KEY = 'bundlify_session_id';

  /**
   * Returns a stable session identifier for the current browser tab.
   * Persisted in sessionStorage so it survives soft navigations but
   * resets when the tab is closed.
   */
  function getSessionId() {
    var sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid =
        'bfy_' +
        Math.random().toString(36).substr(2, 9) +
        '_' +
        Date.now();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  /* ------------------------------------------------------------------ */
  /*  Data fetching                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Fetch bundles from the app proxy for a given container element.
   * The container must carry data-shop and data-trigger attributes.
   * An optional data-product-id narrows the query to a single product.
   */
  async function fetchBundles(container) {
    var shop = container.dataset.shop;
    var productId = container.dataset.productId || '';
    var trigger = container.dataset.trigger || 'product_page';

    var params = new URLSearchParams({ shop: shop, trigger: trigger });
    if (productId) {
      params.set('product_id', productId);
    }

    // Show the loading indicator while fetching
    var loader = container.querySelector('.bundlify-loading');
    if (loader) {
      loader.style.display = 'block';
    }

    // B2B exclusion: skip rendering if customer is tagged b2b/wholesale
    if (themeConfig.excludeB2B && window.Shopify && window.Shopify.customer && window.Shopify.customer.tags) {
      var tags = window.Shopify.customer.tags;
      if (tags.indexOf('b2b') >= 0 || tags.indexOf('B2B') >= 0 || tags.indexOf('wholesale') >= 0) {
        hideLoader(loader);
        return;
      }
    }

    try {
      var res = await fetch(PROXY_BASE + '/bundles?' + params.toString());
      if (!res.ok) {
        hideLoader(loader);
        return;
      }
      var bundles = await res.json();
      hideLoader(loader);
      renderBundles(container, bundles, trigger, shop);
    } catch (e) {
      console.error('Bundlify: Failed to load bundles', e);
      hideLoader(loader);
    }
  }

  function hideLoader(loader) {
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Locale detection & translation helper                              */
  /* ------------------------------------------------------------------ */

  var currentLocale = 'en';

  function detectLocale() {
    if (window.Shopify && window.Shopify.locale) {
      currentLocale = window.Shopify.locale;
    } else if (navigator.language) {
      currentLocale = navigator.language.split('-')[0];
    }
  }

  /**
   * Translate a bundle field. Looks for a per-locale override in
   * bundle.translations[currentLocale][key]; falls back to defaultValue.
   */
  function t(bundle, key, defaultValue) {
    if (bundle.translations && bundle.translations[currentLocale] && bundle.translations[currentLocale][key]) {
      return bundle.translations[currentLocale][key];
    }
    return defaultValue;
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Render a countdown timer bar above a bundle card.
   * Returns empty string if countdown is not enabled.
   */
  function renderCountdown(bundle) {
    if (!bundle.countdownEnabled) return '';

    var id = 'bundlify-countdown-' + bundle.bundleId;
    var title = t(bundle, 'countdownTitle', bundle.countdownTitle || 'Offer expires in {{timer}}');

    return '<div class="bundlify-countdown" id="' + id + '" ' +
      'style="background:' + (bundle.countdownBgColor || '#111827') + ';color:' + (bundle.countdownTextColor || '#ffffff') + ';" ' +
      'data-type="' + (bundle.countdownType || 'fixed') + '" ' +
      'data-duration="' + (bundle.countdownDuration || 15) + '" ' +
      'data-end-date="' + (bundle.countdownEndDate || '') + '" ' +
      'data-title-template="' + title.replace(/"/g, '&quot;') + '">' +
      '<span class="bundlify-countdown__text">' + title.replace('{{timer}}', '<span class="bundlify-countdown__timer">--:--</span>') + '</span>' +
      '</div>';
  }

  /**
   * Start all countdown timers on the page. Calculates end time
   * based on type (fixed duration, midnight, or specific end date)
   * and updates the timer span every second.
   */
  function startCountdowns() {
    var countdowns = document.querySelectorAll('.bundlify-countdown');
    countdowns.forEach(function(el) {
      var type = el.dataset.type;
      var template = el.dataset.titleTemplate;
      var endTime;

      if (type === 'fixed') {
        var duration = parseInt(el.dataset.duration, 10) || 15;
        var storageKey = 'bundlify_cd_' + el.id;
        var stored = sessionStorage.getItem(storageKey);
        if (stored) {
          endTime = parseInt(stored, 10);
        } else {
          endTime = Date.now() + duration * 60 * 1000;
          sessionStorage.setItem(storageKey, String(endTime));
        }
      } else if (type === 'midnight') {
        var now = new Date();
        endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime();
      } else if (type === 'end_date' && el.dataset.endDate) {
        endTime = new Date(el.dataset.endDate).getTime();
      } else {
        return;
      }

      var timerSpan = el.querySelector('.bundlify-countdown__timer');
      if (!timerSpan) return;

      function tick() {
        var remaining = endTime - Date.now();
        if (remaining <= 0) {
          timerSpan.textContent = '00:00';
          el.classList.add('bundlify-countdown--expired');
          return;
        }
        var hours = Math.floor(remaining / 3600000);
        var minutes = Math.floor((remaining % 3600000) / 60000);
        var seconds = Math.floor((remaining % 60000) / 1000);
        if (hours > 0) {
          timerSpan.textContent = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        } else {
          timerSpan.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        }
      }

      tick();
      setInterval(tick, 1000);
    });
  }

  /**
   * Build the HTML for every bundle card and inject it into the
   * container's .bundlify-bundles wrapper. Also wires up event
   * tracking and add-to-cart click handlers.
   */
  function renderBundles(container, bundles, trigger, shop) {
    var wrapper = container.querySelector('.bundlify-bundles');
    if (!wrapper) return;

    if (!bundles || !bundles.length) {
      wrapper.innerHTML = '';
      return;
    }

    // Read theming data attributes from container
    var buttonText = container.dataset.buttonText || 'Add Bundle to Cart';
    // Container data-attr wins (Liquid per-block override), else use API theme value
    var showSavings = container.dataset.showSavings != null
      ? container.dataset.showSavings !== 'false'
      : (themeConfig.showSavings !== false);
    var showCompareAtPrice = themeConfig.showCompareAtPrice !== false;
    var layout = container.dataset.layout || 'vertical';

    // Remove all layout classes first
    wrapper.classList.remove('bundlify-bundles--horizontal', 'bundlify-bundles--compact', 'bundlify-bundles--grid');
    if (layout === 'horizontal') {
      wrapper.classList.add('bundlify-bundles--horizontal');
    } else if (layout === 'compact') {
      wrapper.classList.add('bundlify-bundles--compact');
    } else if (layout === 'grid') {
      wrapper.classList.add('bundlify-bundles--grid');
    }

    // Collect multi-product volume bundles for post-render wiring
    var multiVolumeBundles = [];

    var html = bundles
      .map(function (bundle) {
        var countdown = renderCountdown(bundle);
        if (bundle.type === 'VOLUME' && bundle.volumeTiers && bundle.volumeTiers.length) {
          if (bundle.items && bundle.items.length > 1) {
            multiVolumeBundles.push(bundle);
            return countdown + '<div class="bundlify-volume-multi" data-bundle-id="' + escapeAttr(bundle.bundleId) + '"></div>';
          }
          return countdown + renderVolumeTable(bundle, buttonText, showSavings);
        }
        return countdown + renderBundleCard(bundle, buttonText, showSavings, showCompareAtPrice);
      })
      .join('');

    wrapper.innerHTML = html;

    // Render multi-product volume bundles (needs DOM container references)
    for (var mv = 0; mv < multiVolumeBundles.length; mv++) {
      var mvBundle = multiVolumeBundles[mv];
      var mvContainer = wrapper.querySelector('.bundlify-volume-multi[data-bundle-id="' + mvBundle.bundleId + '"]');
      if (mvContainer) {
        renderVolumeBundle(mvBundle, mvContainer, shop, trigger);
      }
    }

    // Inject per-deal custom CSS
    for (var d = 0; d < bundles.length; d++) {
      if (bundles[d].customCss) {
        var styleId = 'bundlify-deal-css-' + bundles[d].bundleId;
        var existingStyle = document.getElementById(styleId);
        if (existingStyle) existingStyle.remove();
        var styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = bundles[d].customCss;
        document.head.appendChild(styleEl);
      }
    }

    // Theme product price override
    if (themeConfig.updateThemePrice && bundles.length > 0) {
      try {
        var priceSelectors = ['.price', '.product-price', '[class*="price"]', '.product__price', '.price__regular', '.price-item--regular'];
        var priceEl = null;
        for (var ps = 0; ps < priceSelectors.length; ps++) {
          priceEl = document.querySelector(priceSelectors[ps]);
          if (priceEl && priceEl.closest('.bundlify-card, .bundlify-volume-widget, .bundlify-volume-multi, .bundlify-drawer')) {
            priceEl = null; // skip bundlify's own price elements
            continue;
          }
          if (priceEl) break;
        }
        if (priceEl) {
          var firstBundle = bundles[0];
          if (themeConfig.themePriceMode === 'bundle_price') {
            priceEl.textContent = formatPrice(firstBundle.bundlePrice);
          } else {
            // per_item: show discounted per-item price of first item
            var itemCount = firstBundle.items.reduce(function(sum, it) { return sum + it.quantity; }, 0);
            var perItemPrice = itemCount > 0 ? firstBundle.bundlePrice / itemCount : firstBundle.bundlePrice;
            priceEl.textContent = formatPrice(perItemPrice);
          }
        }
      } catch (e) {
        // Best-effort — theme selectors vary
      }
    }

    // Start any countdown timers that were just rendered
    startCountdowns();

    // Track VIEWED impressions for every bundle
    bundles.forEach(function (b) {
      trackEvent(shop, b.bundleId, 'VIEWED', trigger);
    });

    // Attach add-to-cart handlers for standard bundles
    wrapper.querySelectorAll('.bundlify-card__btn:not(.bundlify-volume-tier__btn):not(.bundlify-volume__add-btn)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addBundleToCart(btn, bundles, trigger, shop);
      });
    });

    // Attach add-to-cart handlers for volume tier buttons
    wrapper.querySelectorAll('.bundlify-volume-tier__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addVolumeBundleToCart(btn, bundles, trigger, shop);
      });
    });

    // Track card-level clicks (excluding the CTA button)
    wrapper.querySelectorAll('.bundlify-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.bundlify-card__btn')) return;
        trackEvent(shop, card.dataset.bundleId, 'CLICKED', trigger);
      });
    });
  }

  /**
   * Render checkbox upsell add-ons below a bundle card.
   * Returns empty string if the bundle has no upsells.
   */
  function renderUpsells(bundle) {
    if (!bundle.upsells || !bundle.upsells.length) return '';

    var html = '<div class="bundlify-upsells">';
    bundle.upsells.forEach(function(upsell, idx) {
      var discountLabel = '';
      if (upsell.discountType === 'FREE') {
        discountLabel = 'FREE';
      } else if (upsell.discountType === 'PERCENTAGE' && upsell.discountValue > 0) {
        discountLabel = upsell.discountValue + '% off';
      } else if (upsell.discountType === 'FIXED_AMOUNT' && upsell.discountValue > 0) {
        discountLabel = formatPrice(Number(upsell.discountValue)) + ' off';
      }

      var finalPrice = upsell.price;
      if (upsell.discountType === 'FREE') finalPrice = 0;
      else if (upsell.discountType === 'PERCENTAGE') finalPrice = upsell.price * (1 - upsell.discountValue / 100);
      else if (upsell.discountType === 'FIXED_AMOUNT') finalPrice = Math.max(0, upsell.price - upsell.discountValue);

      var checked = upsell.selectedByDefault ? ' checked' : '';
      var imgHtml = upsell.imageUrl ? '<img src="' + escapeAttr(upsell.imageUrl) + '" alt="" class="bundlify-upsell__img" />' : '';

      html += '<label class="bundlify-upsell" data-upsell-idx="' + idx + '" data-variant-id="' + escapeAttr(upsell.shopifyVariantId || '') + '">' +
        '<input type="checkbox" class="bundlify-upsell__checkbox"' + checked + ' />' +
        imgHtml +
        '<div class="bundlify-upsell__info">' +
          '<div class="bundlify-upsell__title">' + escapeHtml(upsell.title) + '</div>' +
          (upsell.subtitle ? '<div class="bundlify-upsell__subtitle">' + escapeHtml(upsell.subtitle) + '</div>' : '') +
        '</div>' +
        '<div class="bundlify-upsell__price">' +
          (discountLabel ? '<span class="bundlify-upsell__discount">' + discountLabel + '</span>' : '') +
          '<span class="bundlify-upsell__final-price">' + formatPrice(finalPrice) + '</span>' +
        '</div>' +
      '</label>';
    });
    html += '</div>';
    return html;
  }

  /**
   * Render progressive gift tiers below a bundle card.
   * Returns empty string if gifts are not enabled or there are none.
   */
  function renderGifts(bundle) {
    if (!bundle.giftsEnabled || !bundle.giftTiers || !bundle.giftTiers.length) return '';

    var html = '<div class="bundlify-gifts">';
    html += '<div class="bundlify-gifts__header">';
    html += '<div class="bundlify-gifts__title">' + escapeHtml(bundle.giftsTitle || 'Free gifts with your order') + '</div>';
    if (bundle.giftsSubtitle) {
      html += '<div class="bundlify-gifts__subtitle">' + escapeHtml(bundle.giftsSubtitle) + '</div>';
    }
    html += '</div>';
    html += '<div class="bundlify-gifts__grid">';

    bundle.giftTiers.forEach(function(gift) {
      var isLocked = true;
      var imgHtml = gift.imageUrl ? '<img src="' + escapeAttr(gift.imageUrl) + '" alt="" class="bundlify-gift__img" />' : '<div class="bundlify-gift__img bundlify-gift__img--placeholder"></div>';

      html += '<div class="bundlify-gift' + (isLocked ? ' bundlify-gift--locked' : '') + '" data-unlock-qty="' + gift.unlockQuantity + '">';
      html += imgHtml;
      html += '<div class="bundlify-gift__label">' + escapeHtml(gift.label || gift.productTitle || (gift.giftType === 'FREE_SHIPPING' ? 'Free Shipping' : 'Free Gift')) + '</div>';
      if (isLocked) {
        html += '<div class="bundlify-gift__locked">' + escapeHtml(gift.lockedTitle || 'Locked') + '</div>';
      }
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  /**
   * Render a standard bundle card (FIXED, CROSS_SELL, DEAD_STOCK, MIX_MATCH).
   */
  function renderBundleCard(bundle, buttonText, showSavings, showCompareAtPrice) {
    var badgeHtml = showSavings
      ? '    <span class="bundlify-card__badge">Save ' + Math.round(bundle.savingsPct) + '%</span>'
      : '';

    return (
      '<div class="bundlify-card" data-bundle-id="' +
      escapeAttr(bundle.bundleId) +
      '">' +
      '  <div class="bundlify-card__header">' +
      '    <h3 class="bundlify-card__title">' +
      escapeHtml(t(bundle, 'name', bundle.name)) +
      '</h3>' +
      badgeHtml +
      '  </div>' +
      '  <div class="bundlify-card__items">' +
      bundle.items.map(function (item) { return renderItem(item, showCompareAtPrice); }).join('') +
      '  </div>' +
      '  <div class="bundlify-card__footer">' +
      '    <div class="bundlify-card__pricing">' +
      '      <span class="bundlify-card__original">' +
      formatPrice(bundle.individualTotal) +
      '</span>' +
      '      <span class="bundlify-card__bundle-price">' +
      formatPrice(bundle.bundlePrice) +
      '</span>' +
      '    </div>' +
      '    <button class="bundlify-card__btn" data-bundle-id="' +
      escapeAttr(bundle.bundleId) +
      '">' +
      escapeHtml(t(bundle, 'buttonText', buttonText)) +
      '    </button>' +
      '  </div>' +
      renderUpsells(bundle) +
      renderGifts(bundle) +
      '</div>'
    );
  }

  /**
   * Render a volume discount table for VOLUME bundle type.
   */
  function renderVolumeTable(bundle, buttonText, showSavings) {
    var tiers = bundle.volumeTiers;
    var basePrice = bundle.items[0] ? bundle.items[0].price : 0;
    var lastIdx = tiers.length - 1;

    var tiersHtml = tiers.map(function (tier, idx) {
      var isBest = idx === lastIdx;
      var tierClass = 'bundlify-volume-tier' + (isBest ? ' bundlify-volume-tier--best' : '');
      var pricePerUnit = tier.pricePerUnit != null
        ? tier.pricePerUnit
        : basePrice * (1 - Number(tier.discountPct) / 100);
      var savingsText = showSavings
        ? '<span class="bundlify-volume-tier__savings">Save ' + Math.round(Number(tier.discountPct)) + '%</span>'
        : '';
      var bestBadge = isBest ? '<span class="bundlify-volume-tier__best-badge">BEST VALUE</span>' : '';
      var label = tier.label ? '<span class="bundlify-volume-tier__label">' + escapeHtml(tier.label) + '</span>' : '';
      var qtyText = tier.maxQuantity
        ? tier.minQuantity + '-' + tier.maxQuantity
        : tier.minQuantity + '+';
      var variantId = bundle.items[0] ? bundle.items[0].shopifyVariantId : '';

      return (
        '<div class="' + tierClass + '">' +
        bestBadge +
        label +
        '<span class="bundlify-volume-tier__qty">Buy ' + qtyText + '</span>' +
        '<span class="bundlify-volume-tier__price">' + formatPrice(pricePerUnit) + ' each</span>' +
        savingsText +
        '<button class="bundlify-card__btn bundlify-volume-tier__btn" ' +
        'data-bundle-id="' + escapeAttr(bundle.bundleId) + '" ' +
        'data-variant-id="' + escapeAttr(variantId) + '" ' +
        'data-quantity="' + tier.minQuantity + '">' +
        'Add ' + tier.minQuantity + ' to Cart' +
        '</button>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="bundlify-volume-widget" data-bundle-id="' + escapeAttr(bundle.bundleId) + '">' +
      '  <h3 class="bundlify-card__title">' + escapeHtml(bundle.name) + '</h3>' +
      '  <div class="bundlify-volume-tiers">' + tiersHtml + '</div>' +
      '</div>'
    );
  }

  /**
   * Render a multi-product volume bundle with per-product qty selectors.
   * Used when bundle.items.length > 1.
   */
  function renderVolumeBundle(bundle, container, shop, trigger) {
    var html = '';
    html += '<div class="bundlify-volume">';
    html += '<h3 class="bundlify-volume__title">' + escapeHtml(bundle.name) + '</h3>';

    // Product grid
    html += '<div class="bundlify-volume__products">';
    for (var i = 0; i < bundle.items.length; i++) {
      var item = bundle.items[i];
      html += '<div class="bundlify-volume__product" data-variant-id="' + escapeAttr(item.shopifyVariantId) + '">';
      if (item.imageUrl) {
        html += '<img src="' + escapeAttr(item.imageUrl) + '" alt="" class="bundlify-volume__product-img" />';
      }
      html += '<div class="bundlify-volume__product-info">';
      html += '<div class="bundlify-volume__product-title">' + escapeHtml(item.title) + '</div>';
      html += '<div class="bundlify-volume__product-price">' + formatPrice(item.price) + '</div>';
      html += '</div>';
      html += '<div class="bundlify-volume__product-qty">';
      html += '<button class="bundlify-volume__qty-btn" data-action="decrement">\u2212</button>';
      html += '<span class="bundlify-volume__qty-value">0</span>';
      html += '<button class="bundlify-volume__qty-btn" data-action="increment">+</button>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    // Volume tiers display
    html += '<div class="bundlify-volume__tiers">';
    for (var t = 0; t < (bundle.volumeTiers || []).length; t++) {
      var tier = bundle.volumeTiers[t];
      var tierLabel = tier.label || ('Buy ' + tier.minQuantity + '+');
      var isLast = t === bundle.volumeTiers.length - 1;
      html += '<div class="bundlify-volume__tier' + (isLast ? ' bundlify-volume__tier--best' : '') + '">';
      html += '<span class="bundlify-volume__tier-label">' + escapeHtml(tierLabel) + '</span>';
      html += '<span class="bundlify-volume__tier-discount">Save ' + Math.round(Number(tier.discountPct)) + '%</span>';
      html += '</div>';
    }
    html += '</div>';

    // Total + active tier summary
    html += '<div class="bundlify-volume__summary">';
    html += '<span class="bundlify-volume__total-qty">0 items selected</span>';
    html += '<span class="bundlify-volume__active-tier"></span>';
    html += '</div>';

    // Add to cart button
    html += '<button class="bundlify-card__btn bundlify-volume__add-btn" disabled>Select items to continue</button>';
    html += '</div>';

    container.innerHTML = html;

    // Wire up qty buttons
    var productEls = container.querySelectorAll('.bundlify-volume__product');
    var addBtn = container.querySelector('.bundlify-volume__add-btn');
    var totalQtyEl = container.querySelector('.bundlify-volume__total-qty');
    var activeTierEl = container.querySelector('.bundlify-volume__active-tier');

    function updateSummary() {
      var total = 0;
      for (var p = 0; p < productEls.length; p++) {
        total += parseInt(productEls[p].querySelector('.bundlify-volume__qty-value').textContent) || 0;
      }
      totalQtyEl.textContent = total + ' item' + (total !== 1 ? 's' : '') + ' selected';

      // Find active tier
      var activeTier = null;
      for (var at = 0; at < (bundle.volumeTiers || []).length; at++) {
        if (total >= bundle.volumeTiers[at].minQuantity) {
          activeTier = bundle.volumeTiers[at];
        }
      }

      if (activeTier) {
        activeTierEl.textContent = 'Saving ' + Math.round(Number(activeTier.discountPct)) + '%!';
        activeTierEl.style.color = '#166534';
        addBtn.disabled = false;
        addBtn.textContent = 'Add Bundle to Cart \u2014 Save ' + Math.round(Number(activeTier.discountPct)) + '%';
      } else {
        var minNeeded = bundle.volumeTiers && bundle.volumeTiers.length ? bundle.volumeTiers[0].minQuantity : 1;
        activeTierEl.textContent = 'Add ' + (minNeeded - total) + ' more to unlock discount';
        activeTierEl.style.color = '#6b7280';
        addBtn.disabled = total === 0;
        addBtn.textContent = total > 0 ? 'Add ' + total + ' Items to Cart' : 'Select items to continue';
      }

      // Highlight active tier in tier display
      var tierEls = container.querySelectorAll('.bundlify-volume__tier');
      for (var te = 0; te < tierEls.length; te++) {
        if (bundle.volumeTiers[te] && total >= bundle.volumeTiers[te].minQuantity) {
          tierEls[te].classList.add('bundlify-volume__tier--active');
        } else {
          tierEls[te].classList.remove('bundlify-volume__tier--active');
        }
      }
    }

    for (var pe = 0; pe < productEls.length; pe++) {
      (function(productEl) {
        var btns = productEl.querySelectorAll('.bundlify-volume__qty-btn');
        var qtyEl = productEl.querySelector('.bundlify-volume__qty-value');
        btns[0].addEventListener('click', function() {
          var val = parseInt(qtyEl.textContent) || 0;
          if (val > 0) { qtyEl.textContent = val - 1; updateSummary(); }
        });
        btns[1].addEventListener('click', function() {
          var val = parseInt(qtyEl.textContent) || 0;
          qtyEl.textContent = val + 1;
          updateSummary();
        });
      })(productEls[pe]);
    }

    // Add to cart handler
    addBtn.addEventListener('click', function() {
      if (addBtn.disabled) return;
      var items = [];
      for (var ci = 0; ci < productEls.length; ci++) {
        var qty = parseInt(productEls[ci].querySelector('.bundlify-volume__qty-value').textContent) || 0;
        var variantId = productEls[ci].getAttribute('data-variant-id');
        if (qty > 0 && variantId) {
          var mvProps = { _bundlify_bundle_id: bundle.bundleId };
          if (themeConfig.discountOnlyViaWidget) {
            mvProps._bundlify_widget_sale = 'true';
          }
          items.push({ id: parseInt(variantId, 10), quantity: qty, properties: mvProps });
        }
      }
      if (!items.length) return;

      addBtn.disabled = true;
      addBtn.textContent = 'Adding...';

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items })
      })
      .then(function(res) { return res.json(); })
      .catch(function() { return null; })
      .then(function() {
        addBtn.textContent = 'Added!';
        setTimeout(function() {
          addBtn.disabled = false;
          updateSummary();
        }, 2500);
      });

      // Track conversion
      trackEvent(shop, bundle.bundleId, 'ADDED_TO_CART', trigger);
    });

    updateSummary();
  }

  /**
   * Add a volume tier's quantity to cart using the AJAX Cart API.
   */
  async function addVolumeBundleToCart(btn, bundles, trigger, shop) {
    var bundleId = btn.dataset.bundleId;
    var variantId = parseInt(btn.dataset.variantId, 10);
    var quantity = parseInt(btn.dataset.quantity, 10);
    if (!variantId || !quantity) return;

    btn.disabled = true;
    var origText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.classList.add('bundlify-card__btn--loading');

    try {
      var volumeProps = { _bundlify_bundle_id: bundleId };
      if (themeConfig.discountOnlyViaWidget) {
        volumeProps._bundlify_widget_sale = 'true';
      }

      var res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: quantity,
            properties: volumeProps,
          }],
        }),
      });

      if (res.ok) {
        btn.textContent = 'Added!';
        btn.classList.remove('bundlify-card__btn--loading');
        btn.classList.add('bundlify-card__btn--success');
        trackEvent(shop, bundleId, 'ADDED_TO_CART', trigger);

        document.dispatchEvent(
          new CustomEvent('bundlify:added-to-cart', {
            detail: { bundleId: bundleId, quantity: quantity },
          })
        );

        setTimeout(function () {
          btn.textContent = origText;
          btn.disabled = false;
          btn.classList.remove('bundlify-card__btn--success');
        }, 2500);
      } else {
        handleCartError(btn);
      }
    } catch (e) {
      console.error('Bundlify: Failed to add volume bundle to cart', e);
      handleCartError(btn);
    }
  }

  /**
   * Render a single item row inside a bundle card.
   */
  function renderItem(item, showCompareAtPrice) {
    var img = item.imageUrl
      ? '<img src="' +
        escapeAttr(item.imageUrl) +
        '" alt="' +
        escapeAttr(item.title) +
        '" class="bundlify-card__item-img" loading="lazy" />'
      : '<div class="bundlify-card__item-img bundlify-card__item-img--placeholder"></div>';

    var title = escapeHtml(item.title);
    if (item.variantTitle) {
      title += ' <span class="bundlify-card__variant">' + escapeHtml(item.variantTitle) + '</span>';
    }

    var price = formatPrice(item.price);
    if (item.quantity > 1) {
      price += ' &times; ' + item.quantity;
    }

    if (showCompareAtPrice && item.compareAtPrice && item.compareAtPrice > item.price) {
      price = '<span class="bundlify-card__item-compare-at">' + formatPrice(item.compareAtPrice) + '</span> ' + price;
    }

    return (
      '<div class="bundlify-card__item">' +
      img +
      '  <div class="bundlify-card__item-info">' +
      '    <span class="bundlify-card__item-title">' +
      title +
      '</span>' +
      '    <span class="bundlify-card__item-price">' +
      price +
      '</span>' +
      '  </div>' +
      '</div>'
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Cart operations                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Add every item from the selected bundle to the Shopify cart using
   * the AJAX Cart API (/cart/add.js). Each line item carries a
   * _bundlify_bundle_id property so downstream logic can identify
   * bundled items.
   */
  async function addBundleToCart(btn, bundles, trigger, shop) {
    var bundleId = btn.dataset.bundleId;
    var bundle = bundles.find(function (b) {
      return b.bundleId === bundleId;
    });
    if (!bundle) return;

    btn.disabled = true;
    btn.textContent = 'Adding...';
    btn.classList.add('bundlify-card__btn--loading');

    try {
      var items = bundle.items.map(function (item) {
        var props = { _bundlify_bundle_id: bundleId };
        if (themeConfig.discountOnlyViaWidget) {
          props._bundlify_widget_sale = 'true';
        }
        return {
          id: parseInt(item.shopifyVariantId, 10),
          quantity: item.quantity,
          properties: props,
        };
      });

      // Add checked upsell items to cart
      var card = btn.closest('.bundlify-card');
      if (card) {
        var upsellCheckboxes = card.querySelectorAll('.bundlify-upsell__checkbox:checked');
        upsellCheckboxes.forEach(function(cb) {
          var label = cb.closest('.bundlify-upsell');
          if (label && label.dataset.variantId) {
            items.push({
              id: parseInt(label.dataset.variantId, 10),
              quantity: 1,
              properties: { _bundlify_upsell: 'true', _bundlify_bundle_id: bundleId },
            });
          }
        });
      }

      var res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items }),
      });

      if (res.ok) {
        btn.textContent = 'Added!';
        btn.classList.remove('bundlify-card__btn--loading');
        btn.classList.add('bundlify-card__btn--success');
        trackEvent(shop, bundleId, 'ADDED_TO_CART', trigger);

        // Trigger Shopify theme cart refresh if available
        if (typeof window.Shopify !== 'undefined' && typeof window.Shopify.onCartUpdate === 'function') {
          try {
            var cartRes = await fetch('/cart.js');
            var cartData = await cartRes.json();
            window.Shopify.onCartUpdate(cartData);
          } catch (_) {
            // Best-effort; not all themes expose this
          }
        }

        // Dispatch a custom event so themes can react
        document.dispatchEvent(
          new CustomEvent('bundlify:added-to-cart', {
            detail: { bundleId: bundleId, items: items },
          })
        );

        setTimeout(function () {
          btn.textContent = 'Add Bundle to Cart';
          btn.disabled = false;
          btn.classList.remove('bundlify-card__btn--success');
        }, 2500);
      } else {
        handleCartError(btn);
      }
    } catch (e) {
      console.error('Bundlify: Failed to add to cart', e);
      handleCartError(btn);
    }
  }

  function handleCartError(btn) {
    btn.textContent = 'Error - Try Again';
    btn.disabled = false;
    btn.classList.remove('bundlify-card__btn--loading');
    btn.classList.add('bundlify-card__btn--error');
    setTimeout(function () {
      btn.classList.remove('bundlify-card__btn--error');
    }, 3000);
  }

  /* ------------------------------------------------------------------ */
  /*  Analytics                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Fire-and-forget event tracking via the app proxy.
   */
  function trackEvent(shop, bundleId, event, trigger) {
    var body = {
      bundleId: bundleId,
      event: event,
      sessionId: getSessionId(),
      triggerType: trigger.toUpperCase(),
      pageUrl: window.location.href,
    };

    // Include cart value if available on the page
    var cartContainer = document.getElementById('bundlify-cart-upsell');
    if (cartContainer && cartContainer.dataset.cartValue) {
      body.cartValue = parseFloat(cartContainer.dataset.cartValue) || 0;
    }

    fetch(
      PROXY_BASE +
        '/events?shop=' +
        encodeURIComponent(shop),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    ).catch(function () {
      // Silently swallow tracking errors so they never break the UX
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Utility helpers                                                    */
  /* ------------------------------------------------------------------ */

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ------------------------------------------------------------------ */
  /*  Exit-Intent Detection                                              */
  /* ------------------------------------------------------------------ */

  var EXIT_SHOWN_KEY = 'bundlify_exit_shown';
  var exitIntentArmed = false;
  var exitIntentEnabled = false;
  var exitIntentShop = '';

  /**
   * Initialize exit-intent detection if the Liquid block is present
   * and the merchant has enabled it.
   */
  function initExitIntent() {
    var container = document.getElementById('bundlify-exit-intent');
    if (!container) return;

    exitIntentShop = container.dataset.shop || (window.Shopify && window.Shopify.shop) || '';
    var enabled = container.dataset.enabled;

    if (enabled !== 'true' || !exitIntentShop) return;

    // Don't show if already shown this session
    if (sessionStorage.getItem(EXIT_SHOWN_KEY)) return;

    exitIntentEnabled = true;

    // Arm after a 3-second delay so we don't trigger immediately
    setTimeout(function () {
      exitIntentArmed = true;
    }, 3000);

    // Desktop: detect mouse leaving through the top of the viewport
    if (window.innerWidth > 768) {
      document.addEventListener('mouseleave', onMouseLeave);
    } else {
      // Mobile: detect back-button (popstate) and rapid scroll-up
      window.addEventListener('popstate', onMobileExit);
      initMobileScrollDetection();
    }
  }

  function onMouseLeave(e) {
    if (!exitIntentArmed || !exitIntentEnabled) return;
    if (e.clientY < 0) {
      triggerExitIntent();
    }
  }

  function onMobileExit() {
    if (!exitIntentArmed || !exitIntentEnabled) return;
    triggerExitIntent();
  }

  /**
   * Mobile scroll-up detection: if the user scrolls upward rapidly
   * (more than 100px in under 300ms), treat it as exit intent.
   */
  function initMobileScrollDetection() {
    var lastScrollY = window.scrollY;
    var lastScrollTime = Date.now();

    window.addEventListener('scroll', function () {
      if (!exitIntentArmed || !exitIntentEnabled) return;

      var currentY = window.scrollY;
      var currentTime = Date.now();
      var deltaY = lastScrollY - currentY; // positive = scrolling up
      var deltaTime = currentTime - lastScrollTime;

      if (deltaY > 100 && deltaTime < 300 && currentY < 50) {
        triggerExitIntent();
      }

      lastScrollY = currentY;
      lastScrollTime = currentTime;
    }, { passive: true });
  }

  function triggerExitIntent() {
    // Prevent further triggers
    exitIntentEnabled = false;
    sessionStorage.setItem(EXIT_SHOWN_KEY, '1');

    // Remove listeners
    document.removeEventListener('mouseleave', onMouseLeave);
    window.removeEventListener('popstate', onMobileExit);

    showExitIntentModal(exitIntentShop);
  }

  /**
   * Fetch exit-intent bundles and render them in a full-screen overlay modal.
   */
  async function showExitIntentModal(shop) {
    var params = new URLSearchParams({ shop: shop, trigger: 'exit_intent' });

    try {
      var res = await fetch(PROXY_BASE + '/bundles?' + params.toString());
      if (!res.ok) return;

      var bundles = await res.json();
      if (!bundles || !bundles.length) return;

      // Build modal HTML
      var overlay = document.createElement('div');
      overlay.className = 'bundlify-exit-overlay';
      overlay.innerHTML =
        '<div class="bundlify-exit-modal">' +
        '  <button class="bundlify-exit-close" aria-label="Close">&times;</button>' +
        '  <h2 class="bundlify-exit-title">Wait! Check out these deals</h2>' +
        '  <div class="bundlify-bundles"></div>' +
        '  <button class="bundlify-exit-dismiss">No thanks</button>' +
        '</div>';

      document.body.appendChild(overlay);

      // Render bundles inside the modal using the shared renderer
      var modalContainer = overlay.querySelector('.bundlify-exit-modal');
      renderBundles(modalContainer, bundles, 'exit_intent', shop);

      // Track VIEWED for all bundles
      bundles.forEach(function (b) {
        trackEvent(shop, b.bundleId, 'VIEWED', 'exit_intent');
      });

      // Close handlers
      var closeBtn = overlay.querySelector('.bundlify-exit-close');
      var dismissBtn = overlay.querySelector('.bundlify-exit-dismiss');

      function closeModal() {
        bundles.forEach(function (b) {
          trackEvent(shop, b.bundleId, 'DISMISSED', 'exit_intent');
        });
        overlay.remove();
      }

      closeBtn.addEventListener('click', closeModal);
      dismissBtn.addEventListener('click', closeModal);

      // Close on overlay background click
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          closeModal();
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', function onEsc(e) {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', onEsc);
        }
      });
    } catch (e) {
      console.error('Bundlify: Failed to load exit-intent bundles', e);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Cart Drawer                                                        */
  /* ------------------------------------------------------------------ */

  var drawerOpen = false;

  function initCartDrawer() {
    var container = document.getElementById('bundlify-cart-drawer');
    if (!container) return;

    var enabled = container.dataset.enabled;
    if (enabled !== 'true') return;

    var shop = container.dataset.shop || (window.Shopify && window.Shopify.shop) || '';
    if (!shop) return;

    interceptCartAdd(shop, container);
  }

  function interceptCartAdd(shop, container) {
    // Monkey-patch window.fetch to detect /cart/add calls
    var origFetch = window.fetch;
    window.fetch = function () {
      var url = arguments[0];
      var urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : '');
      var result = origFetch.apply(this, arguments);

      if (urlStr.indexOf('/cart/add') !== -1) {
        result.then(function (res) {
          if (res.ok) {
            setTimeout(function () {
              openCartDrawer(shop, container);
            }, 300);
          }
        }).catch(function () {});
      }

      return result;
    };

    // Monkey-patch XMLHttpRequest to detect /cart/add calls
    var origXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      if (typeof url === 'string' && url.indexOf('/cart/add') !== -1) {
        this.addEventListener('load', function () {
          if (this.status >= 200 && this.status < 300) {
            setTimeout(function () {
              openCartDrawer(shop, container);
            }, 300);
          }
        });
      }
      return origXHROpen.apply(this, arguments);
    };
  }

  async function openCartDrawer(shop, container) {
    if (drawerOpen) return;
    drawerOpen = true;

    try {
      // Fetch cart state
      var cartRes = await fetch('/cart.js');
      var cart = await cartRes.json();

      // Fetch upsell data from app proxy
      var productIds = cart.items.map(function (item) { return String(item.product_id); });
      var params = new URLSearchParams({
        shop: shop,
        cart_value: String((cart.total_price / 100).toFixed(2)),
        product_ids: productIds.join(','),
        session_id: getSessionId(),
      });

      var drawerRes = await fetch(PROXY_BASE + '/cart-drawer?' + params.toString());
      var drawerData = await drawerRes.json();

      if (!drawerData.enabled) {
        drawerOpen = false;
        return;
      }

      renderCartDrawer(cart, drawerData, shop, container);
    } catch (e) {
      console.error('Bundlify: Failed to open cart drawer', e);
      drawerOpen = false;
    }
  }

  var CART_TIMER_KEY = 'bundlify_cart_timer_start';
  var cartTimerInterval = null;

  function startCartTimer(timerEl, minutes, textTemplate) {
    var startStr = sessionStorage.getItem(CART_TIMER_KEY);
    var startTime;
    if (startStr) {
      startTime = parseInt(startStr, 10);
    } else {
      startTime = Date.now();
      sessionStorage.setItem(CART_TIMER_KEY, String(startTime));
    }

    var endTime = startTime + minutes * 60 * 1000;

    function tickTimer() {
      var remaining = endTime - Date.now();
      if (remaining <= 0) {
        timerEl.className = 'bundlify-drawer__timer bundlify-drawer__timer--expired';
        timerEl.textContent = 'Cart expired';
        if (cartTimerInterval) {
          clearInterval(cartTimerInterval);
          cartTimerInterval = null;
        }
        return;
      }
      var mins = Math.floor(remaining / 60000);
      var secs = Math.floor((remaining % 60000) / 1000);
      var mStr = mins < 10 ? '0' + mins : '' + mins;
      var sStr = secs < 10 ? '0' + secs : '' + secs;
      var timerStr = mStr + ':' + sStr;
      timerEl.textContent = textTemplate.replace('{{timer}}', timerStr);
    }

    tickTimer();
    cartTimerInterval = setInterval(tickTimer, 1000);
  }

  function renderCartDrawer(cart, drawerData, shop, container) {
    var upsellHeading = container.dataset.upsellHeading || 'Complete your order';
    var showShippingProgress = container.dataset.showShippingProgress !== 'false';
    var cartTotal = cart.total_price / 100;
    var threshold = drawerData.freeShippingThreshold;

    // Build urgency timer
    var timerHtml = '';
    var cartTimerMinutes = drawerData.cartTimerMinutes || 0;
    var cartTimerText = drawerData.cartTimerText || 'Your cart will expire in {{timer}}';
    if (cartTimerMinutes > 0) {
      timerHtml = '<div class="bundlify-drawer__timer" id="bundlify-cart-timer"></div>';
    }

    // Build shipping progress bar with milestone markers
    var shippingHtml = '';
    if (showShippingProgress && threshold && threshold > 0) {
      var remaining = Math.max(0, threshold - cartTotal);
      var pct = Math.min(100, (cartTotal / threshold) * 100);
      var unlocked = remaining <= 0;
      var shippingClass = 'bundlify-drawer__shipping' + (unlocked ? ' bundlify-drawer__shipping--unlocked' : '');
      var progressText = unlocked
        ? '\u2713 Free shipping unlocked!'
        : 'Add ' + formatPrice(remaining) + ' for free shipping!';

      shippingHtml =
        '<div class="' + shippingClass + '">' +
        '  <p class="bundlify-drawer__shipping-text">' + progressText + '</p>' +
        '  <div class="bundlify-drawer__shipping-bar">' +
        '    <div class="bundlify-drawer__shipping-fill" style="width: ' + pct + '%"></div>' +
        '  </div>' +
        '</div>';
    }

    // Build cart items HTML
    var itemsHtml = cart.items.map(function (item) {
      var imgSrc = item.featured_image && item.featured_image.url ? item.featured_image.url : '';
      var imgTag = imgSrc
        ? '<img src="' + escapeAttr(imgSrc) + '" alt="' + escapeAttr(item.title) + '" class="bundlify-drawer__item-img" loading="lazy" />'
        : '<div class="bundlify-drawer__item-img bundlify-drawer__item-img--placeholder"></div>';

      return (
        '<div class="bundlify-drawer__item">' +
        imgTag +
        '<div class="bundlify-drawer__item-info">' +
        '  <span class="bundlify-drawer__item-title">' + escapeHtml(item.title) + '</span>' +
        '  <span class="bundlify-drawer__item-meta">' + item.quantity + ' x ' + formatPrice(item.price / 100) + '</span>' +
        '</div>' +
        '</div>'
      );
    }).join('');

    // Build upsell carousel
    var upsellHtml = '';
    if (drawerData.bundles && drawerData.bundles.length > 0) {
      var carouselCards = '';
      for (var i = 0; i < drawerData.bundles.length; i++) {
        var b = drawerData.bundles[i];
        carouselCards +=
          '<div class="bundlify-drawer__upsell-card" data-bundle-id="' + escapeAttr(b.bundleId) + '">' +
          '  <div class="bundlify-drawer__upsell-card__title">' + escapeHtml(b.name) + '</div>' +
          '  <div class="bundlify-drawer__upsell-card__price">' + formatPrice(Number(b.bundlePrice)) + '</div>' +
          '  <button class="bundlify-drawer__upsell-card__btn" data-bundle-id="' + escapeAttr(b.bundleId) + '">Add to Cart</button>' +
          '</div>';
      }

      upsellHtml =
        '<div class="bundlify-drawer__upsell">' +
        '  <h3 class="bundlify-drawer__upsell-heading">' + escapeHtml(upsellHeading) + '</h3>' +
        '  <div class="bundlify-drawer__upsells-carousel">' + carouselCards + '</div>' +
        '</div>';
    }

    // Build overlay + drawer
    var overlay = document.createElement('div');
    overlay.className = 'bundlify-drawer-overlay';
    overlay.innerHTML =
      '<div class="bundlify-drawer">' +
      '  <div class="bundlify-drawer__header">' +
      '    <h2 class="bundlify-drawer__title">Your Cart (' + cart.item_count + ')</h2>' +
      '    <button class="bundlify-drawer__close" aria-label="Close">&times;</button>' +
      '  </div>' +
      timerHtml +
      shippingHtml +
      '  <div class="bundlify-drawer__body">' +
      '    <div class="bundlify-drawer__items">' + itemsHtml + '</div>' +
      upsellHtml +
      '  </div>' +
      '  <div class="bundlify-drawer__footer">' +
      '    <div class="bundlify-drawer__subtotal">' +
      '      <span>Subtotal</span>' +
      '      <span class="bundlify-drawer__subtotal-price">' + formatPrice(cartTotal) + '</span>' +
      '    </div>' +
      '    <a href="/checkout" class="bundlify-drawer__checkout">Checkout</a>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Force reflow then animate in
    overlay.offsetHeight;
    overlay.classList.add('bundlify-drawer-overlay--active');

    // Start urgency timer if enabled
    if (cartTimerMinutes > 0) {
      var timerEl = overlay.querySelector('#bundlify-cart-timer');
      if (timerEl) {
        startCartTimer(timerEl, cartTimerMinutes, cartTimerText);
      }
    }

    // Attach upsell carousel add-to-cart handlers
    if (drawerData.bundles && drawerData.bundles.length > 0) {
      var carouselBtns = overlay.querySelectorAll('.bundlify-drawer__upsell-card__btn');
      carouselBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var bundleId = btn.dataset.bundleId;
          var bundle = drawerData.bundles.find(function (b) { return b.bundleId === bundleId; });
          if (!bundle) return;

          btn.disabled = true;
          btn.textContent = 'Adding...';

          var items = bundle.items.map(function (item) {
            var drawerProps = { _bundlify_bundle_id: bundleId };
            if (themeConfig.discountOnlyViaWidget) {
              drawerProps._bundlify_widget_sale = 'true';
            }
            return {
              id: parseInt(item.shopifyVariantId, 10),
              quantity: item.quantity,
              properties: drawerProps,
            };
          });

          fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: items }),
          }).then(function (res) {
            if (res.ok) {
              btn.textContent = 'Added!';
              trackEvent(shop, bundleId, 'ADDED_TO_CART', 'cart_page');
              setTimeout(function () {
                btn.textContent = 'Add to Cart';
                btn.disabled = false;
              }, 2500);
            } else {
              btn.textContent = 'Error';
              btn.disabled = false;
            }
          }).catch(function () {
            btn.textContent = 'Error';
            btn.disabled = false;
          });
        });
      });

      // Track VIEWED for upsell bundles
      drawerData.bundles.forEach(function (b) {
        trackEvent(shop, b.bundleId, 'VIEWED', 'cart_page');
      });
    }

    // Close handlers
    var closeBtn = overlay.querySelector('.bundlify-drawer__close');
    closeBtn.addEventListener('click', function () { closeCartDrawer(overlay); });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { closeCartDrawer(overlay); }
    });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        closeCartDrawer(overlay);
        document.removeEventListener('keydown', onEsc);
      }
    });
  }

  function closeCartDrawer(overlay) {
    if (cartTimerInterval) {
      clearInterval(cartTimerInterval);
      cartTimerInterval = null;
    }
    overlay.classList.remove('bundlify-drawer-overlay--active');
    setTimeout(function () {
      overlay.remove();
      drawerOpen = false;
    }, 300);
  }

  /* ------------------------------------------------------------------ */
  /*  Theme                                                              */
  /* ------------------------------------------------------------------ */

  var SHADOW_MAP = {
    none: { normal: 'none', hover: 'none' },
    subtle: { normal: '0 1px 3px rgba(0,0,0,0.08)', hover: '0 4px 12px rgba(0,0,0,0.12)' },
    medium: { normal: '0 2px 8px rgba(0,0,0,0.12)', hover: '0 8px 24px rgba(0,0,0,0.16)' },
    strong: { normal: '0 4px 16px rgba(0,0,0,0.18)', hover: '0 12px 32px rgba(0,0,0,0.22)' },
  };

  var themeConfig = {
    showSavings: true,
    showCompareAtPrice: true,
    priceRounding: false,
    updateThemePrice: false,
    themePriceMode: 'per_item',
    excludeB2B: false,
    discountOnlyViaWidget: false,
  };

  /**
   * Format a numeric price amount into a display string,
   * respecting the priceRounding setting.
   */
  function formatPrice(amount) {
    if (themeConfig.priceRounding) {
      return '$' + Math.round(amount);
    }
    return '$' + amount.toFixed(2);
  }

  var THEME_CACHE_KEY = 'bundlify_theme';

  /**
   * Fetch theme settings from the app proxy and apply CSS custom
   * properties to every bundlify container element. We apply to
   * each container directly (inline style) so the values override
   * the Liquid <style> block that also targets #container-id.
   * Cached in sessionStorage to avoid repeated fetches.
   */
  async function applyTheme(shop) {
    if (!shop) return;

    var cached = sessionStorage.getItem(THEME_CACHE_KEY);
    if (cached) {
      try {
        setThemeVars(JSON.parse(cached));
        return;
      } catch (_) {
        // bad cache — re-fetch
      }
    }

    try {
      var res = await fetch(
        PROXY_BASE + '/theme?shop=' + encodeURIComponent(shop)
      );
      if (!res.ok) return;
      var theme = await res.json();
      sessionStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme));
      setThemeVars(theme);
    } catch (e) {
      console.error('Bundlify: Failed to load theme', e);
    }
  }

  var CONTAINER_IDS = [
    'bundlify-product-bundles',
    'bundlify-cart-upsell',
    'bundlify-exit-intent',
    'bundlify-cart-drawer',
  ];

  function setThemeVars(theme) {
    var targets = [];
    for (var i = 0; i < CONTAINER_IDS.length; i++) {
      var el = document.getElementById(CONTAINER_IDS[i]);
      if (el) targets.push(el);
    }

    // Fallback: if no containers found yet, apply to :root so
    // dynamically created elements (exit-intent modal) still inherit.
    if (targets.length === 0) {
      targets.push(document.documentElement);
    }

    for (var t = 0; t < targets.length; t++) {
      var s = targets[t].style;
      if (theme.primaryColor) s.setProperty('--bundlify-accent', theme.primaryColor);
      if (theme.primaryColorHover) s.setProperty('--bundlify-accent-hover', theme.primaryColorHover);
      if (theme.textColor) s.setProperty('--bundlify-text-primary', theme.textColor);
      if (theme.cardBackground) s.setProperty('--bundlify-card-bg', theme.cardBackground);
      if (theme.badgeBackground) s.setProperty('--bundlify-badge-bg', theme.badgeBackground);
      if (theme.badgeTextColor) s.setProperty('--bundlify-badge-text', theme.badgeTextColor);
      if (theme.borderRadius != null) s.setProperty('--bundlify-radius', theme.borderRadius + 'px');
      if (theme.borderColor) s.setProperty('--bundlify-card-border', theme.borderColor);
      if (theme.secondaryTextColor) s.setProperty('--bundlify-text-secondary', theme.secondaryTextColor);
      if (theme.fontSize != null) s.setProperty('--bundlify-font-size', theme.fontSize + 'px');
      if (theme.fontWeight) s.setProperty('--bundlify-font-weight', theme.fontWeight);
      if (theme.cardShadow && SHADOW_MAP[theme.cardShadow]) {
        var shadow = SHADOW_MAP[theme.cardShadow];
        s.setProperty('--bundlify-card-shadow', shadow.normal);
        s.setProperty('--bundlify-card-shadow-hover', shadow.hover);
      }

      // Per-element typography
      if (theme.blockTitleFontSize != null) s.setProperty('--bundlify-block-title-font-size', theme.blockTitleFontSize + 'px');
      if (theme.blockTitleFontWeight) s.setProperty('--bundlify-block-title-font-weight', theme.blockTitleFontWeight);
      if (theme.itemTitleFontSize != null) s.setProperty('--bundlify-item-title-font-size', theme.itemTitleFontSize + 'px');
      if (theme.itemTitleFontWeight) s.setProperty('--bundlify-item-title-font-weight', theme.itemTitleFontWeight);
      if (theme.subtitleFontSize != null) s.setProperty('--bundlify-subtitle-font-size', theme.subtitleFontSize + 'px');
      if (theme.subtitleFontWeight) s.setProperty('--bundlify-subtitle-font-weight', theme.subtitleFontWeight);
      if (theme.priceFontSize != null) s.setProperty('--bundlify-price-font-size', theme.priceFontSize + 'px');
      if (theme.priceFontWeight) s.setProperty('--bundlify-price-font-weight', theme.priceFontWeight);
      if (theme.badgeFontSize != null) s.setProperty('--bundlify-badge-font-size', theme.badgeFontSize + 'px');
      if (theme.badgeFontWeight) s.setProperty('--bundlify-badge-font-weight', theme.badgeFontWeight);
      if (theme.buttonFontSize != null) s.setProperty('--bundlify-button-font-size', theme.buttonFontSize + 'px');
      if (theme.buttonFontWeight) s.setProperty('--bundlify-button-font-weight', theme.buttonFontWeight);

      // Extended color controls
      if (theme.selectedBgColor) s.setProperty('--bundlify-selected-bg', theme.selectedBgColor);
      if (theme.blockTitleColor) s.setProperty('--bundlify-block-title-color', theme.blockTitleColor);
      if (theme.titleColor) s.setProperty('--bundlify-title-color', theme.titleColor);
      if (theme.subtitleColor) s.setProperty('--bundlify-subtitle-color', theme.subtitleColor);
      if (theme.priceColor) s.setProperty('--bundlify-price-color', theme.priceColor);
      if (theme.originalPriceColor) s.setProperty('--bundlify-original-price-color', theme.originalPriceColor);
      if (theme.labelBgColor) s.setProperty('--bundlify-label-bg', theme.labelBgColor);
      if (theme.labelTextColor) s.setProperty('--bundlify-label-text', theme.labelTextColor);
      if (theme.buttonTextColor) s.setProperty('--bundlify-button-text', theme.buttonTextColor);
      if (theme.savingsBadgeBgColor) s.setProperty('--bundlify-savings-badge-bg', theme.savingsBadgeBgColor);
      if (theme.savingsBadgeTextColor) s.setProperty('--bundlify-savings-badge-text', theme.savingsBadgeTextColor);
      if (theme.cardHoverBgColor) s.setProperty('--bundlify-card-hover-bg', theme.cardHoverBgColor);
    }

    // Inject custom CSS
    if (theme.customCss) {
      var existing = document.getElementById('bundlify-custom-css');
      if (existing) existing.remove();
      var style = document.createElement('style');
      style.id = 'bundlify-custom-css';
      style.textContent = theme.customCss;
      document.head.appendChild(style);
    }

    // Store toggle config for rendering
    themeConfig.showSavings = theme.showSavings !== false;
    themeConfig.showCompareAtPrice = theme.showCompareAtPrice !== false;

    // Store sticky bar settings
    themeConfig.stickyBarEnabled = theme.stickyBarEnabled || false;
    themeConfig.stickyBarBgColor = theme.stickyBarBgColor || '#ffffff';
    themeConfig.stickyBarTextColor = theme.stickyBarTextColor || '#111827';
    themeConfig.stickyBarButtonBgColor = theme.stickyBarButtonBgColor || '#2563eb';
    themeConfig.stickyBarButtonTextColor = theme.stickyBarButtonTextColor || '#ffffff';

    // Phase 4 polish settings
    themeConfig.priceRounding = theme.priceRounding || false;
    themeConfig.updateThemePrice = theme.updateThemePrice || false;
    themeConfig.themePriceMode = theme.themePriceMode || 'per_item';
    themeConfig.excludeB2B = theme.excludeB2B || false;
    themeConfig.discountOnlyViaWidget = theme.discountOnlyViaWidget || false;
  }

  /* ------------------------------------------------------------------ */
  /*  Initialization                                                     */
  /* ------------------------------------------------------------------ */

  function initStickyBar(shop) {
    if (!themeConfig.stickyBarEnabled) return;

    var containers = document.querySelectorAll('#bundlify-product-bundles');
    if (!containers.length) return;
    var container = containers[0];

    // Create sticky bar element
    var bar = document.createElement('div');
    bar.id = 'bundlify-sticky-bar';
    bar.className = 'bundlify-sticky-bar';
    bar.style.cssText = 'background:' + (themeConfig.stickyBarBgColor || '#ffffff') + ';color:' + (themeConfig.stickyBarTextColor || '#111827') + ';';

    var headingEl = document.querySelector('h1');
    var productTitle = headingEl ? headingEl.textContent : 'This product';

    bar.innerHTML = '<div class="bundlify-sticky-bar__content">' +
      '<span class="bundlify-sticky-bar__title">' + escapeHtml(productTitle) + '</span>' +
      '<button class="bundlify-sticky-bar__btn" style="background:' + (themeConfig.stickyBarButtonBgColor || '#2563eb') + ';color:' + (themeConfig.stickyBarButtonTextColor || '#ffffff') + ';">Choose Bundle</button>' +
      '</div>';

    document.body.appendChild(bar);

    // Show/hide based on scroll position
    var visible = false;
    function checkScroll() {
      var rect = container.getBoundingClientRect();
      var shouldShow = rect.bottom < 0;
      if (shouldShow && !visible) {
        bar.classList.add('bundlify-sticky-bar--visible');
        visible = true;
      } else if (!shouldShow && visible) {
        bar.classList.remove('bundlify-sticky-bar--visible');
        visible = false;
      }
    }

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

    // Click scrolls to bundle widget
    bar.querySelector('.bundlify-sticky-bar__btn').addEventListener('click', function() {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function init() {
    var containers = document.querySelectorAll(
      '#bundlify-product-bundles, #bundlify-cart-upsell'
    );

    // Determine shop domain from any container or Shopify global
    var shop = '';
    if (containers.length > 0) {
      shop = containers[0].dataset.shop || '';
    }
    if (!shop && window.Shopify) {
      shop = window.Shopify.shop || '';
    }

    detectLocale();
    applyTheme(shop);
    initStickyBar(shop);

    containers.forEach(fetchBundles);
    initExitIntent();
    initCartDrawer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
