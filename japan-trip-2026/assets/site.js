/* Local-only enhancements. No fetch, imports or remote dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  var themeButton = document.querySelector('.theme-toggle');
  var themeKey = 'night-paper-theme-2026';
  function setTheme(theme) {
    root.classList.add('theme-changing');
    root.dataset.theme = theme;
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('theme-changing'); }); });
    var light = theme === 'light';
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(light));
      themeButton.setAttribute('aria-label', light ? '切換為夜行模式' : '切換為日光模式');
      themeButton.querySelector('.theme-label').textContent = light ? '夜行' : '日光';
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? '#f3efe6' : '#0c0e10';
  }
  var savedTheme;
  try { savedTheme = localStorage.getItem(themeKey); } catch (_) {}
  setTheme(savedTheme === 'light' ? 'light' : 'dark');
  if (themeButton) themeButton.addEventListener('click', function () {
    var theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(theme);
    try { localStorage.setItem(themeKey, theme); } catch (_) {}
  });

  // Larger type can grow the sticky header and date strip. Keep anchors clear.
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    function measureHeader() { root.style.setProperty('--header-h', siteHeader.offsetHeight + 'px'); }
    if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(siteHeader);
    window.addEventListener('resize', measureHeader);
    if (document.fonts) document.fonts.ready.then(measureHeader);
    measureHeader();
  }
  var dayRail = document.querySelector('.day-index');
  if (dayRail) {
    function measureDayRail() {
      var height = window.matchMedia('(max-width:850px)').matches ? dayRail.offsetHeight : 0;
      root.style.setProperty('--day-rail-h', height + 'px');
    }
    if ('ResizeObserver' in window) new ResizeObserver(measureDayRail).observe(dayRail);
    window.addEventListener('resize', measureDayRail);
    if (document.fonts) document.fonts.ready.then(measureDayRail);
    measureDayRail();
  }

  window.copyTravelText = async function (text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch (_) {}
    var previous = document.activeElement;
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('aria-label', '複製講稿');
    field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
    // Put the fallback inside the active sheet so it remains outside inert content.
    var target = document.querySelector('.sheet-bg.show .sheet-body') || document.querySelector('.place-sheet-bg.show .place-sheet-body') || document.body;
    target.appendChild(field);
    field.focus({ preventScroll: true });
    field.select();
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (_) {}
    field.remove();
    if (previous && previous.isConnected) previous.focus({ preventScroll: true });
    if (!copied) throw new Error('手動複製');
  };

  var toast = document.createElement('div');
  toast.className = 'site-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  var toastTimer;
  function announce(text) {
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add('show');
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  // Observe only the two dialog wrappers. Existing itinerary handlers still own content.
  var dialogs = Array.from(document.querySelectorAll('.place-sheet-bg, .sheet-bg'));
  if (dialogs.length) {
    var lastTrigger = null;
    var returnFocus = new Map();
    var activeDialog = null;
    var focusable = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),summary,[tabindex="0"]';
    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('button, [role="button"]');
      if (trigger) lastTrigger = trigger;
    }, true);
    document.addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('button,[role="button"]')) lastTrigger = event.target;
    }, true);
    function visibleDialogs() { return dialogs.filter(function (dialog) { return dialog.classList.contains('show'); }); }
    function recoverTrigger(trigger) {
      if (!trigger) return null;
      if (trigger.isConnected) return trigger;
      for (var key of ['idx', 'day', 'place', 'card']) {
        if (trigger.dataset[key] !== undefined) return document.querySelector('[data-' + key + '="' + trigger.dataset[key] + '"]');
      }
      return null;
    }
    function syncDialogs(records) {
      var opened = visibleDialogs();
      var next = opened[opened.length - 1] || null;
      records.forEach(function (record) {
        var dialog = record.target;
        if (dialog.classList.contains('show') && !(record.oldValue || '').split(' ').includes('show')) returnFocus.set(dialog, lastTrigger || document.activeElement);
      });
      document.body.classList.toggle('dialog-open', opened.length > 0);
      var app = document.querySelector('.app');
      var header = document.querySelector('.site-header');
      if (app) app.inert = opened.length > 0;
      if (header) header.inert = opened.length > 0;
      dialogs.forEach(function (dialog) { dialog.inert = dialog !== next; });
      if (next !== activeDialog) {
        var previous = activeDialog;
        activeDialog = next;
        if (next) {
          if (!previous || !opened.includes(previous)) {
            var restored = previous && recoverTrigger(returnFocus.get(previous));
            if (restored && next.contains(restored)) restored.focus({ preventScroll: true });
            else next.querySelector('.close').focus({ preventScroll: true });
          } else next.querySelector('.close').focus({ preventScroll: true });
        } else if (previous) {
          var trigger = recoverTrigger(returnFocus.get(previous));
          if (trigger) trigger.focus({ preventScroll: true });
        }
      }
    }
    var observer = new MutationObserver(syncDialogs);
    dialogs.forEach(function (dialog) {
      dialog.inert = !dialog.classList.contains('show');
      observer.observe(dialog, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    });
    document.addEventListener('keydown', function (event) {
      if (!activeDialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        activeDialog.querySelector('.close').click();
      } else if (event.key === 'Tab') {
        var nodes = Array.from(activeDialog.querySelectorAll(focusable)).filter(function (node) { return node.getClientRects().length > 0; });
        var first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && (document.activeElement === first || !activeDialog.contains(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !activeDialog.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
    }, true);
  }

  var dock = document.querySelector('.trip-dock');
  if (dock) {
    dock.querySelectorAll('[data-dock-action]').forEach(function (button) {
      button.dataset.reset = button.textContent;
      button.addEventListener('click', function () {
        if (button.dataset.dockAction === 'veg') openCat('eat', 'veg');
        else if (button.dataset.dockAction === 'taxi') copyPlain(taxiPhrase(), button);
        else openCat('move', 'guide');
      });
    });
    var dockPending = false;
    function showDock() {
      dockPending = false;
      var headerHeight = parseFloat(getComputedStyle(root).getPropertyValue('--header-h'));
      dock.classList.toggle('is-visible', document.querySelector('.page-trip .topbar').getBoundingClientRect().bottom <= headerHeight);
    }
    window.addEventListener('scroll', function () {
      if (!dockPending) { dockPending = true; requestAnimationFrame(showDock); }
    }, { passive: true });
    showDock();
  }

  // A catalogue check is independent of dietary badges: those retain their original text.
  var shoppingRoot = document.querySelector('.page-shopping main');
  if (shoppingRoot) {
    var cards = Array.from(shoppingRoot.querySelectorAll('article.card'));
    var sections = Array.from(shoppingRoot.querySelectorAll('.section'));
    var search = document.getElementById('shoppingSearch');
    var filterButtons = Array.from(document.querySelectorAll('[data-shop-filter]'));
    var storageKey = 'japan-trip-shopping-2026-v1';
    var purchases = {};
    var currentFilter = 'all';
    var storageNote = document.getElementById('shoppingStorageNote');
    try {
      var parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) purchases = parsed;
    } catch (_) {}
    cards.forEach(function (card, index) {
      var name = card.querySelector('.jp').textContent.trim();
      card.dataset.search = card.textContent.toLocaleLowerCase();
      card.dataset.itemKey = name;
      card.querySelector('.thumb').dataset.itemNumber = String(index + 1).padStart(2, '0');
      var label = document.createElement('label');
      label.className = 'shop-check';
      var span = document.createElement('span');
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = purchases[name] === true;
      checkbox.setAttribute('aria-label', name + '：已買');
      span.appendChild(checkbox);
      span.appendChild(document.createTextNode('採買記錄'));
      label.appendChild(span);
      card.appendChild(label);
      checkbox.addEventListener('change', function () {
        purchases[name] = checkbox.checked;
        try {
          localStorage.setItem(storageKey, JSON.stringify(purchases));
          storageNote.textContent = '已存到此裝置，可離線繼續勾選。';
        } catch (_) { storageNote.textContent = '此瀏覽器無法保存；勾選仍可使用，關閉頁面後會重設。'; }
        updateShopping();
        announce(checkbox.checked ? '已記下：' + card.querySelector('.zh').textContent : '已改回未買');
        // Keep keyboard focus usable when the selected filter hides this product.
        if (card.hidden) document.querySelector('[data-shop-filter="' + currentFilter + '"]').focus({ preventScroll: true });
      });
    });
    sections.forEach(function (section, index) {
      section.querySelector('.section-head').dataset.number = String(index + 1).padStart(2, '0');
      section.dataset.originalCount = section.querySelector('.count').textContent;
    });
    function updateShopping() {
      var query = search.value.trim().toLocaleLowerCase();
      var done = 0, visible = 0;
      cards.forEach(function (card) {
        var bought = card.querySelector('input[type="checkbox"]').checked;
        card.classList.toggle('is-bought', bought);
        if (bought) done++;
        var show = card.dataset.search.includes(query) && (currentFilter === 'all' || (currentFilter === 'bought' ? bought : !bought));
        card.hidden = !show;
        if (show) visible++;
      });
      sections.forEach(function (section) {
        var count = Array.from(section.querySelectorAll('article.card')).filter(function (card) { return !card.hidden; }).length;
        section.hidden = count === 0;
        section.querySelector('.count').textContent = query || currentFilter !== 'all' ? count + ' 項符合' : section.dataset.originalCount;
      });
      document.getElementById('shoppingProgress').textContent = done + ' / ' + cards.length + ' 已買';
      document.getElementById('shoppingFill').style.width = (done / cards.length * 100) + '%';
      document.getElementById('shoppingEmpty').hidden = visible !== 0;
      filterButtons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.shopFilter === currentFilter)); });
      if (categoryLinks) markCategory();
    }
    search.addEventListener('input', updateShopping);
    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () { currentFilter = button.dataset.shopFilter; updateShopping(); });
    });
    updateShopping();

    // Use the viewport, rather than offsetTop, for the catalogue's chapter marks.
    var categoryLinks = Array.from(document.querySelectorAll('.page-shopping .nav a'));
    var previousCategory = '';
    var pending = false;
    function markCategory() {
      pending = false;
      var top = document.querySelector('.site-header').offsetHeight + document.querySelector('.page-shopping .nav').offsetHeight + 26;
      var current = '';
      var nearest = -Infinity;
      categoryLinks.forEach(function (link) {
        var section = document.querySelector(link.getAttribute('href'));
        if (!section || section.hidden) return;
        var position = section.getBoundingClientRect().top;
        if (position <= top && position > nearest) {
          nearest = position;
          current = link.getAttribute('href');
        }
      });
      categoryLinks.forEach(function (link) {
        if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      if (current && current !== previousCategory) {
        var activeLink = categoryLinks.find(function (link) { return link.getAttribute('href') === current; });
        var nav = activeLink.parentElement;
        var bounds = nav.getBoundingClientRect(), activeBounds = activeLink.getBoundingClientRect();
        if (activeBounds.right > bounds.right - 12) nav.scrollLeft += activeBounds.right - bounds.right + 12;
        else if (activeBounds.left < bounds.left + 12) nav.scrollLeft -= bounds.left + 12 - activeBounds.left;
      }
      previousCategory = current;
    }
    window.addEventListener('scroll', function () {
      if (!pending) { pending = true; requestAnimationFrame(markCategory); }
    }, { passive: true });
    window.addEventListener('resize', markCategory);
    markCategory();
  }
})();
