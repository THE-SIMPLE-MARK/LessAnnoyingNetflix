const NETFLIX_DOMAIN = "netflix.com";
const WATCH_PATH = "/watch/";
const watchTabs = new Set();

// blocks any verification requests when watching

async function addBlockRule(tabId) {
    try {
        await browser.declarativeNetRequest.updateSessionRules({
            addRules: [{
                id: tabId,
                priority: 1,
                action: { type: "block" },
                condition: {
                    urlFilter: "||web.prod.cloud.netflix.com/graphql",
                    resourceTypes: ["xmlhttprequest"],
                    tabIds: [tabId]
                }
            }]
        });
    } catch (error) {
        console.error(`[Network] Error adding rule for tab ${tabId}:`, error);
    }
}

async function removeBlockRule(tabId) {
    try {
        await browser.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [tabId]
        });
    } catch (error) {
        console.error(`[Network] Error removing rule for tab ${tabId}:`, error);
    }
}

async function handleNavigation(tabId, url) {
    if (!url?.includes(NETFLIX_DOMAIN) && watchTabs.has(tabId)) {
        watchTabs.delete(tabId);
        await removeBlockRule(tabId);
        return;
    }

    const isOnWatchPage = url?.includes(WATCH_PATH);
    const wasOnWatchPage = watchTabs.has(tabId);

    if (isOnWatchPage && !wasOnWatchPage) {
        watchTabs.add(tabId);
        await addBlockRule(tabId);
    } else if (!isOnWatchPage && wasOnWatchPage) {
        watchTabs.delete(tabId);
        await removeBlockRule(tabId);
    }
}

browser.tabs.onUpdated.addListener((tabId, _, tab) => {
    handleNavigation(tabId, tab.url);
});

browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "urlChanged") {
        handleNavigation(sender.tab.id, message.url);
    }
});

browser.tabs.onRemoved.addListener(async (tabId) => {
    if (watchTabs.has(tabId)) {
        watchTabs.delete(tabId);
        await removeBlockRule(tabId);
    }
});

