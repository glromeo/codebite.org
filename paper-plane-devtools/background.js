chrome.runtime.onConnect.addListener(function (devToolsConnection) {

    const devToolsListener = function (message, sender, sendResponse) {
        console.log("background page received a message:", message, "from", sender);
        if (message.scriptToInject) {
            chrome.tabs.executeScript(message.tabId, {file: message.scriptToInject});
        }
    }

    devToolsConnection.onMessage.addListener(devToolsListener);

    devToolsConnection.onDisconnect.addListener(function () {
        devToolsConnection.onMessage.removeListener(devToolsListener);
    });
});