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

  function lockButton() {
    const button = document.getElementById(BUTTON_ID);
    if (!button) return false;
    if (button.getAttribute("removable") !== "false") {
      button.setAttribute("removable", "false");
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
      if (button.getAttribute("removable") !== "false") {
        button.setAttribute("removable", "false");
      }
    });
    observer.observe(button, { attributes: true, attributeFilter: ["removable"] });
  }

  function apply() {
    if (!ensureButton()) return;
    const button = document.getElementById(BUTTON_ID);
    if (button) watchButton(button);
  }

  let attempts = 0;
  const timer = setInterval(() => {
    apply();
    if (document.getElementById(BUTTON_ID) || ++attempts > 40) {
      clearInterval(timer);
    }
  }, 250);

  window.addEventListener("customizationready", apply);
  window.addEventListener("aftercustomization", apply);
})();
