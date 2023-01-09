define(
[
    './EventBus'
],

function(channe){

    var storageKey = "::html5-solitaire::",
        support;
        
    try {
        localStorage.getItem("test");
        support = true;
    } catch(e) {
        support = false;
    }

    function getData(key) {
        try {
            return JSON.parse(localStorage.getItem(storageKey + key))
        } catch(e) {
            return null;
        };
    }

    function saveData(key, data) {
        if (!support) return;
        localStorage.setItem(storageKey + key, JSON.stringify(data));
    }

    function increment(key) {
        var value = parseInt(getData(key), 10) || 0;
        saveData(key, value + 1);
    }

    return {
        save: saveData,
        get: getData,
        increment: increment
    };
});
