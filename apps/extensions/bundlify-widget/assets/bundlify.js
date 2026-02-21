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
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */

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
    var showSavings = container.dataset.showSavings !== 'false';
    var layout = container.dataset.layout || 'vertical';

    if (layout === 'horizontal') {
      wrapper.classList.add('bundlify-bundles--horizontal');
    } else {
      wrapper.classList.remove('bundlify-bundles--horizontal');
    }

    var html = bundles
      .map(function (bundle) {
        if (bundle.type === 'VOLUME' && bundle.volumeTiers && bundle.volumeTiers.length) {
          return renderVolumeTable(bundle, buttonText, showSavings);
        }
        return renderBundleCard(bundle, buttonText, showSavings);
      })
      .join('');

    wrapper.innerHTML = html;

    // Track VIEWED impressions for every bundle
    bundles.forEach(function (b) {
      trackEvent(shop, b.bundleId, 'VIEWED', trigger);
    });

    // Attach add-to-cart handlers for standard bundles
    wrapper.querySelectorAll('.bundlify-card__btn:not(.bundlify-volume-tier__btn)').forEach(function (btn) {
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
   * Render a standard bundle card (FIXED, CROSS_SELL, DEAD_STOCK, MIX_MATCH).
   */
  function renderBundleCard(bundle, buttonText, showSavings) {
    var badgeHtml = showSavings
      ? '    <span class="bundlify-card__badge">Save ' + Math.round(bundle.savingsPct) + '%</span>'
      : '';

    return (
      '<div class="bundlify-card" data-bundle-id="' +
      escapeAttr(bundle.bundleId) +
      '">' +
      '  <div class="bundlify-card__header">' +
      '    <h3 class="bundlify-card__title">' +
      escapeHtml(bundle.name) +
      '</h3>' +
      badgeHtml +
      '  </div>' +
      '  <div class="bundlify-card__items">' +
      bundle.items.map(renderItem).join('') +
      '  </div>' +
      '  <div class="bundlify-card__footer">' +
      '    <div class="bundlify-card__pricing">' +
      '      <span class="bundlify-card__original">$' +
      bundle.individualTotal.toFixed(2) +
      '</span>' +
      '      <span class="bundlify-card__bundle-price">$' +
      bundle.bundlePrice.toFixed(2) +
      '</span>' +
      '    </div>' +
      '    <button class="bundlify-card__btn" data-bundle-id="' +
      escapeAttr(bundle.bundleId) +
      '">' +
      escapeHtml(buttonText) +
      '    </button>' +
      '  </div>' +
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
        '<span class="bundlify-volume-tier__price">$' + pricePerUnit.toFixed(2) + ' each</span>' +
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
      var res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: quantity,
            properties: { _bundlify_bundle_id: bundleId },
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
  function renderItem(item) {
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

    var price = '$' + item.price.toFixed(2);
    if (item.quantity > 1) {
      price += ' &times; ' + item.quantity;
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
        return {
          id: parseInt(item.shopifyVariantId, 10),
          quantity: item.quantity,
          properties: { _bundlify_bundle_id: bundleId },
        };
      });

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

  function renderCartDrawer(cart, drawerData, shop, container) {
    var upsellHeading = container.dataset.upsellHeading || 'Complete your order';
    var showShippingProgress = container.dataset.showShippingProgress !== 'false';
    var cartTotal = cart.total_price / 100;
    var threshold = drawerData.freeShippingThreshold;

    // Build shipping progress bar
    var shippingHtml = '';
    if (showShippingProgress && threshold && threshold > 0) {
      var remaining = Math.max(0, threshold - cartTotal);
      var pct = Math.min(100, (cartTotal / threshold) * 100);
      var progressText = remaining > 0
        ? 'Add $' + remaining.toFixed(2) + ' for free shipping!'
        : 'You qualify for free shipping!';

      shippingHtml =
        '<div class="bundlify-drawer__shipping">' +
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
        '  <span class="bundlify-drawer__item-meta">' + item.quantity + ' x $' + (item.price / 100).toFixed(2) + '</span>' +
        '</div>' +
        '</div>'
      );
    }).join('');

    // Build upsell bundles
    var upsellHtml = '';
    if (drawerData.bundles && drawerData.bundles.length > 0) {
      upsellHtml =
        '<div class="bundlify-drawer__upsell">' +
        '  <h3 class="bundlify-drawer__upsell-heading">' + escapeHtml(upsellHeading) + '</h3>' +
        '  <div class="bundlify-bundles" data-button-text="' + escapeAttr(container.dataset.buttonText || 'Add Bundle to Cart') + '" data-show-savings="' + escapeAttr(container.dataset.showSavings || 'true') + '"></div>' +
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
      shippingHtml +
      '  <div class="bundlify-drawer__body">' +
      '    <div class="bundlify-drawer__items">' + itemsHtml + '</div>' +
      upsellHtml +
      '  </div>' +
      '  <div class="bundlify-drawer__footer">' +
      '    <div class="bundlify-drawer__subtotal">' +
      '      <span>Subtotal</span>' +
      '      <span class="bundlify-drawer__subtotal-price">$' + cartTotal.toFixed(2) + '</span>' +
      '    </div>' +
      '    <a href="/checkout" class="bundlify-drawer__checkout">Checkout</a>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Force reflow then animate in
    overlay.offsetHeight;
    overlay.classList.add('bundlify-drawer-overlay--active');

    // Render upsell bundles inside the drawer
    if (drawerData.bundles && drawerData.bundles.length > 0) {
      var drawerEl = overlay.querySelector('.bundlify-drawer');
      var upsellWrapper = drawerEl.querySelector('.bundlify-drawer__upsell');
      if (upsellWrapper) {
        renderBundles(upsellWrapper, drawerData.bundles, 'cart_page', shop);
      }
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
    overlay.classList.remove('bundlify-drawer-overlay--active');
    setTimeout(function () {
      overlay.remove();
      drawerOpen = false;
    }, 300);
  }

  /* ------------------------------------------------------------------ */
  /*  Theme                                                              */
  /* ------------------------------------------------------------------ */

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
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Initialization                                                     */
  /* ------------------------------------------------------------------ */

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

    applyTheme(shop);

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
