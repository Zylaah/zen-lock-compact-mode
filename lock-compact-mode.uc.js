// ==UserScript==
// @include   main
// @loadOrder 10
// @ignorecache
// ==/UserScript==

(function () {
  "use strict";

  if (location.href !== "chrome://browser/content/browser.xhtml") return;
  if (document.documentElement.getAttribute("windowtype") !== "navigator:browser") {
    return;
  }

  const BUTTON_ID = "zen-toggle-compact-mode";
  const AREA_ID = "zen-sidebar-top-buttons";
  /** Zen's Windows floor is 152px, or 117px plus caption buttons. */
  const WINDOWS_MIN_EXTRA_PX = 30;

  function isWindows() {
    try {
      if (window.AppConstants?.platform) return window.AppConstants.platform === "win";
    } catch (_) {}
    try {
      return Services.appinfo.OS === "WINNT";
    } catch (_) {}
    return /Win/.test(navigator.platform || "");
  }

  function raiseSidebarMin() {
    if (!isWindows()) return;
    const base = window.gZenVerticalTabsManager?.getSidebarMinWidth?.();
    const toolbox = document.getElementById("navigator-toolbox");
    if (typeof base !== "number" || !toolbox) return;

    const next = base + WINDOWS_MIN_EXTRA_PX;
    const declared = parseFloat(toolbox.style.getPropertyValue("--zen-toolbox-min-width"));
    if (declared !== next) {
      toolbox.style.setProperty("--zen-toolbox-min-width", `${next}px`);
    }

    const width = parseFloat(toolbox.style.width || toolbox.getAttribute("width"));
    if (Number.isFinite(width) && width < next) {
      const value = `${next}px`;
      toolbox.style.width = value;
      toolbox.style.setProperty("--zen-sidebar-width", value);
      toolbox.setAttribute("width", value);
    }
  }

  function lockButton() {
    const button = document.getElementById(BUTTON_ID);
    if (!button) return false;
    if (button.getAttribute("removable") !== "false") {
      button.setAttribute("removable", "false");
    }
    if (button.getAttribute("overflows") !== "false") {
      button.setAttribute("overflows", "false");
    }
    return true;
  }

  function ensureButton() {
    try {
      if (typeof CustomizableUI !== "undefined") {
        const placement = CustomizableUI.getPlacementOfWidget(BUTTON_ID);
        if (!placement) {
          CustomizableUI.addWidgetToArea(BUTTON_ID, AREA_ID, 0);
        }
      }
    } catch (_) {}
    return lockButton();
  }

  function watchButton(button) {
    if (button._zenLockCompactModeWatching) return;
    button._zenLockCompactModeWatching = true;
    const observer = new MutationObserver(() => {
      lockButton();
    });
    observer.observe(button, {
      attributes: true,
      attributeFilter: ["removable", "overflows"],
    });
  }

  function apply() {
    raiseSidebarMin();
    if (!ensureButton()) return;
    const button = document.getElementById(BUTTON_ID);
    if (button) watchButton(button);
  }

  function watchSidebarMin() {
    const toolbox = document.getElementById("navigator-toolbox");
    if (!toolbox || toolbox._zenLockCompactMinWatching) return;
    toolbox._zenLockCompactMinWatching = true;
    const observer = new MutationObserver(() => raiseSidebarMin());
    observer.observe(toolbox, { attributes: true, attributeFilter: ["style"] });
  }

  let attempts = 0;
  const timer = setInterval(() => {
    apply();
    watchSidebarMin();
    if (document.getElementById(BUTTON_ID) || ++attempts > 40) {
      clearInterval(timer);
    }
  }, 250);

  window.addEventListener("customizationready", apply);
  window.addEventListener("aftercustomization", apply);
})();
