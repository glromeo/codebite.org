console.log("content script executed.");

(function () {
    const MSG_STYLE = 'color: blue;';
    const TIME_STYLE = 'color: green;';

    function getFormattedDate() {
        const date = new Date();
        const str = date.getFullYear()
            + "-" + (date.getMonth() + 1)
            + "-" + date.getDate()
            + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ':' + date.getMilliseconds();
        return str;
    }

    console.log('%cdocument started %c@ ' + getFormattedDate(), MSG_STYLE, TIME_STYLE);

    document.addEventListener('paper-plane:ready', function () {
        console.log('%cpaper-plane:ready %c@ ' + getFormattedDate(), MSG_STYLE, TIME_STYLE);
        chrome.runtime.sendMessage({name: 'paper-plane:ready'});
    });
})();