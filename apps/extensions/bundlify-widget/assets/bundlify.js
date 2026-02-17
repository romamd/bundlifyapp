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

    var html = bundles
      .map(function (bundle) {
        return (
          '<div class="bundlify-card" data-bundle-id="' +
          escapeAttr(bundle.bundleId) +
          '">' +
          '  <div class="bundlify-card__header">' +
          '    <h3 class="bundlify-card__title">' +
          escapeHtml(bundle.name) +
          '</h3>' +
          '    <span class="bundlify-card__badge">Save ' +
          Math.round(bundle.savingsPct) +
          '%</span>' +
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
          '      Add Bundle to Cart' +
          '    </button>' +
          '  </div>' +
          '</div>'
        );
      })
      .join('');

    wrapper.innerHTML = html;

    // Track VIEWED impressions for every bundle
    bundles.forEach(function (b) {
      trackEvent(shop, b.bundleId, 'VIEWED', trigger);
    });

    // Attach add-to-cart handlers
    wrapper.querySelectorAll('.bundlify-card__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addBundleToCart(btn, bundles, trigger, shop);
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

    exitIntentShop = container.dataset.shop || '';
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
  /*  Initialization                                                     */
  /* ------------------------------------------------------------------ */

  function init() {
    var containers = document.querySelectorAll(
      '#bundlify-product-bundles, #bundlify-cart-upsell'
    );
    containers.forEach(fetchBundles);
    initExitIntent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
