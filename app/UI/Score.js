define(
[
    'common/Utils'
],

function($){
    'use strict';

    var uuid = 0;

    return {
        initialize: function(opts) {
            opts = opts || {};
            this.opts = opts;
            this.every = typeof opts.every === "number" ? opts.every * 1000 : null;
            this.points = 0;
            this.e_clock = $.$(opts.timer);
            this.e_point = $.$(opts.score);
            
            if (this.e_point) {
                this.layout = this.e_point.innerHTML || '%d points';
            }

            this.updatePoints();
            return this;
        },
        
        now: function() { return new Date().getTime(); },

        reset: function() {
            this.stop();
            this.start = this.stopTime = this.last = this.now();
            this.points = _.isNumber(this.opts.startPoint) ? this.opts.startPoint : 0;
            this.updatePoints();
            this.updateTime();
            this._start = false;
        },

        restart: function() {
            if (this._start) return;

            this.reset();
            this.startTimer();
            this._start = true;
        },
        
        updatePoints: function(){
            if (this.e_point)
                this.e_point.innerHTML = this.layout.replace('%d', this.points);
        },

        updateTime: function() {
            if (this.e_clock)
                this.e_clock.innerHTML = this.time();
        },
        
        startTimer: function() {
            var self = this;
            this.uuid = uuid;
            
            ;(function F(){
                if (self.uuid !== uuid)
                    return;

                var now = self.stopTime = self.now();

                self.updateTime();

                if (now - self.last > (self.every || 10000)) {
                    self.last = now;
                    self.down(-(self.opts.deduct || 2));
                }

                setTimeout(F, 1000);
            }());
        },
        
        // stops timer
        stop: function() { ++uuid; },
        
        up: function(n) {
            if (_.isNumber(n) && n > 0) {
                this.points += n;
                this.updatePoints();
            }
        },
        
        down: function(n) {
            if (_.isNumber(n) && n < 0) {
                this.points += n;
                this.updatePoints();
            }
        },

        getTime: function() { return this.stopTime - this.start; },

        // returns actual score
        getScore: function() { return this.points; },

        time: function() {
            return $.format(this.stopTime - this.start);
        }
    }
});
