console.log("paper-plane-devtools loaded.");

const inspectedWindow = chrome.devtools.inspectedWindow;

chrome.devtools.panels.create("PaperPlane", "images/paper-plane.png", "Panel.html", function (panel) {
    inspectedWindow.eval('console.log("paper plane extension panel created.");');
});

chrome.devtools.panels.elements.createSidebarPane("PaperPlane", function (sidebar) {
    sidebar.setObject({some_data: "Some data to show"});
});

const backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});

backgroundPageConnection.onMessage.addListener(function (message) {
    // Handle responses from the background page, if any
});

chrome.runtime.sendMessage({
    tabId: inspectedWindow.tabId
});