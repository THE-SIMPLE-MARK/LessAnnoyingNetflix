// blocks the household & "activate extra account" modals

(function () {
    if (window.netflixBypassLoaded) return;
    window.netflixBypassLoaded = true;

    const MODAL_SELECTOR = ".nf-modal.interstitial-full-screen, .nf-modal.uma-modal.two-section-uma";
    const BACKGROUND_SELECTOR = ".nf-modal-background[data-uia=\"nf-modal-background\"]";

    function hideModal(node) {
        // if the added node is a modal, hide it and its background
        if (node.matches?.(MODAL_SELECTOR)) {
            node.style.display = "none";
            document.querySelector(BACKGROUND_SELECTOR)?.style.setProperty("display", "none", "important");
            return;
        }

        // if the added node contains modals, hide them
        if (!node.querySelectorAll) return;

        node.querySelectorAll(MODAL_SELECTOR).forEach(modal => {
            modal.style.display = "none";
        });

        const background = node.querySelector(BACKGROUND_SELECTOR);
        if (background) background.style.setProperty("display", "none", "important");
    }

    function startObserving() {
        if (!document.body) return;

        // hide any modals present on page load
        document.querySelectorAll(MODAL_SELECTOR).forEach(modal => {
            hideModal(modal);
        });

        // catch modals added after page load
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type !== "childList") continue;

                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        hideModal(node);
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // DOM might not be loaded yet
    if (document.body) {
        startObserving();
    } else {
        document.addEventListener("DOMContentLoaded", startObserving);
    }

    // notify background of URL changes (SPA navigation)
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            browser.runtime.sendMessage({
                type: "urlChanged",
                url: window.location.href
            })
        }
    });

    urlObserver.observe(document, { subtree: true, childList: true });

    window.addEventListener("popstate", () => {
        browser.runtime.sendMessage({
            type: "urlChanged",
            url: window.location.href
        })
    });
})();
