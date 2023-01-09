define(
[
    './Utils',
    'EventEmitter'
],

function($) {
    'use strict';

    var isMobil = /mobil|android|ios/ig.test(navigator.userAgent),
        MIN_SQR_DIST = 10;

    function DragTracker(element) {
        this.element  = element;
        this._loop = _.bind(moveLoop, this);

        $.on(element, 'mousedown', _.bind(onmousedown, this));
        $.on(element, 'mousemove', _.bind(_.throttle(onmousemove, 1000/(isMobil?10:50)), this));
        $.on(element, 'mouseup',   _.bind(onmouseup, this));
        $.on(element, 'mouseout',   _.bind(onmouseup, this));
        $.on(element, 'dblclick', _.bind(ondblclick, this));
    }

    EventEmitter.mixin(DragTracker);

    var proto = DragTracker.prototype;

    proto.getPosition = function(event) {
        var position = {};

        position.x = (event.pageX - this.pos.x) || event.offsetX || 0;
        position.y = (event.pageY - this.pos.y) || event.offsetY || 0;
        
        return position;
    };

    function getEvent(event) {
        return event.touches && event.touches.length ? event.touches[0] : event;
    }

    function ondblclick(event) {
        stopAndPrevent(event);
        event = getEvent(event);

        this.emit("tap", this.points_);
    }

    /* Event handlers */
    function onmousedown(event) {
        stopAndPrevent(event);
        event = getEvent(event);

        this.isMousedown = true;

        this.pos = $.position(this.element);

        var start = this.getPosition(event);

        this.points_ = {
            start: start,
            last:  start,
            current: start
        };
        
        this.emit('down', this.points_);
        this.start = start;
        return false;
    }

    function onmouseup(event) {
        var isTouch = event.type === "touchend";
        ticked++;
        stopAndPrevent(event);
        this.isMousedown = false;

        if (!this.mousemove || distanceSqr(this.points_.start, this.points_.current) < MIN_SQR_DIST)
            return isTouch && this.emit('tap', this.points_);

        this.mousemove = false;

        event = getEvent(event);

        this.emit('stop', this.points_);
    }

    var ticked = 0;

    function onmousemove(event) {
        stopAndPrevent(event);
        if (!this.isMousedown) {
            if (this.__ticked === ticked) ticked++;
            return;
        }

        event = getEvent(event);

        this.points_.last = this.points_.current;
        this.points_.current = this.getPosition(event);

        if (this.mousemove || distanceSqr(this.points_.start, this.points_.current) > MIN_SQR_DIST) {
            if (!this.mousemove)
                this.emit('start', this.points_);

        this.mousemove = true;

        if ( this.__ticked !== ticked) {
            this.__ticked = ticked;
            this._loop();
        }
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

    function moveLoop() {
        if ( this.__ticked === ticked ) {
            requestAnimationFrame(this._loop, 1000 / (isMobil?20:60));
            this.emit('move', this.points_);
            this.points_.last = this.points_.current;
        }
    }

    function distanceSqr(p1, p2) {
        var x = p1.x-p2.x,
            y = p1.y-p2.y;
        return x*x + y*y;
    }

    function stopAndPrevent(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    return DragTracker;
});	
