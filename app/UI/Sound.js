define([], 

function() {
    'use strict';

    var support = false,
        IS_IOS = /iphone|ipod|ipad/i.test(navigator.userAgent);

    try { support = !!(new Audio).canPlayType; } catch(e){}

    // Sound manager
    // create n audio objects
    function Sound(path, n, callback) {
        if (!support) { return; }
        var i;
        
        this.__path = path;
        this.currentAudio = 0;
        this.TOTAL = n || 1;
        this.enabled = true;

        this.audio = [];
        this._loaded = [];
        var self = this,
            timeout;

        this.onload = function(e) {
            clearTimeout(timeout);
            self._loaded.push(this);
            this.oncanplaythrough = null;
            this.removeEventListener("canplaythrough", self._loaded);
            if (self._loaded.length > n*.3 && callback) {
                callback();
                callback = null;
            }
        }
        
        if (IS_IOS) {
            timeout = setTimeout(function() {
                callback();
                callback = null;
            });
        }

        for (i = 0; i < n; i++) {
            this.audio[i] = new Audio();
        }

        if (!IS_IOS)
            this.load(path);
    }

    Sound.prototype.load = function(file) {
        file = file || this.__path;
        if (!support) { return; }
        var ext = this.audio[0].canPlayType('audio/mp3') ? '.mp3' : '.ogg',
            i;

        for (i = 0; i < this.TOTAL; i++) {
            this.audio[i].addEventListener("canplaythrough", this.onload, true);
            this.audio[i].src = require.toUrl("assets/"+file + ext);
        }
    }
    
    Sound.prototype.setEnabled = function() {
        this.enabled = !this.enabled;
    }

    // iterate over the available audio objects
    Sound.prototype.play = function() {
        if (!support || !this.enabled || !this._loaded.length) { return; }
        if (this._loaded[this.currentAudio-1])
            this._loaded[this.currentAudio-1].currentTime = 0;
        this._loaded[this.currentAudio].play();
        this.currentAudio = (this.currentAudio + 1) % this._loaded.length;
    }

    Sound.prototype.stop = function() {
        this._loaded[this.currentAudio].pause();
        this._loaded[this.currentAudio].currentTime = 0;
    }

    return Sound;
});
