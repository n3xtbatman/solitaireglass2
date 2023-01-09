define(
[
    'underscore'
],

function(eventBus){
    "use strict";

    var undefined,
        eventsMap = {
            click:     "touchstart",
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup:   "touchend"
        };
        
    /**********************************
     * cross browser addEventListener *
     **********************************/
    function normalizeEvent(e) {
        e = e || event;
        if (!e.preventDefault)
            e.preventDefault = function() { this.returnValue = false; };

        if (!e.stopPropagation)
            e.stopPropagation = function() { this.cancelBubble = true; };

        return e;
    }

    var addEvent = (function() {
        if (document.addEventListener) {
            return function F(elem, type, callback) {
                if (! elem) { return; }
                elem = typeof(elem) === 'string' ? $(elem) : elem;

                callback = touchEventHandler(callback, type, elem);
                
                if (eventsMap[type])
                    elem.addEventListener(eventsMap[type], callback, true);

                elem.addEventListener(type, callback, true);
            }
        } else {
            return function F(elem, type, callback) {
                if (!elem) return;
                elem = typeof(elem) === 'string' ? $(elem) : elem;
                elem.attachEvent("on"+type, function(e) {
                    e = normalizeEvent(e);
                    return callback.call(e.target || e.srcElement, e);
                });
            }
        }
    }());

    var alreadyHandledByTouchEvent;
    
    function touchEventHandler(callback, type, elem) {
        var touchevent = eventsMap[type];

        if (! touchevent) return callback;

        return function (event) {
            var isTouchEvent = event.type === touchevent;
            if (alreadyHandledByTouchEvent && ! isTouchEvent) {
                return (alreadyHandledByTouchEvent = false);
            }

            alreadyHandledByTouchEvent = isTouchEvent;

            return callback.call(this, event);
        }
    }

    var requestAnimationFrame = (function(){
      return window.requestAnimationFrame        || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(callback, rate){
                window.setTimeout(callback, rate||(1000/60));
              };
    })();

    // getElementById wrapper
    function $(id) {
        return document.getElementById(id);
    }

    /* find element position in the page */
    function findPosition(element) {
        var curleft = 0, curtop = 0;

        if (element.offsetParent) {
            do {
                curleft += element.offsetLeft;
                curtop  += element.offsetTop;
            } while (element = element.offsetParent);
        }

        return { x: curleft, y: curtop };
    }

    function trim(string) {
        return string.replace(/^\s+|\s+$/g, "");
    }

    function addClass(element, klass) {
        if (! hasClass(element, klass))
            element.className = trim(element.className + " " + klass);
    }

    function hasClass(element, klass) {
        return (" "+element.className + " ").indexOf(" "+klass+" ") !== -1;
    }

    function removeClass(element, klass) {
        element.className = trim((" "+element.className+" ").replace(" "+klass+" ", " "))
    }

    function format(t) {
        if (typeof t !== 'number') return "--:--";

        t = ~~(t/1000);
        var s = t%60,
            m = ~~(t/60),
            h = ~~(m/60);
            m %= 60;

    return (h ? (h > 9 ? h : '0' + h) + ':' : '') +
           (m > 9 ? m : '0' + m%60) + ':' +
           (s > 9 ? s : '0' + s)
    }

return {
    $: $,
    on: addEvent,
    position: findPosition,
    addClass: addClass,
    removeClass: removeClass,
    requestAnimationFrame: _.bind(requestAnimationFrame, window),
    format: format
};

})
