define(
[
    'underscore',
    './pile',
    'common/Utils',
    'common/Selector',
    'common/EventBus'
],
function(_, Pile, $, PointerTracker, channel) {
    'use strict';
    var piles = [],
        IS_IOS = /iphone|ipod|ipad/i.test(navigator.userAgent),
        BOARD_HEIGHT = (Pile.cardHeight + 10) * 5,
        BOARD_WIDTH  = (Pile.cardWidth + 10) * 7,

        _canvas = document.createElement("canvas"),
        _ctx    = getContext(_canvas);

    function getContext(canvas) {
        if (canvas.getContext)
            return canvas.getContext("2d");
        return null;
    }

    function createPile(type, cards, col) {
        return Object.create(Pile).initialize({
            cards: cards,
            type: type,
            pos: col,
            x: (Pile.cardWidth  + 10) * col,
            y: (Pile.cardHeight + 10) * (type === "tableau" ? 1 : 0)
        });
    }

    var initEvents = _.once(function(){
        var that = this,
            drag   = new PointerTracker(this.canvas),
            point  = {},
            inAnimation = false,
            inMove = false;

        channel.on("animation.start", function(){
            inAnimation = that.inAnimation = true;
        });
        channel.on('animation.end', function(){
            inAnimation = that.inAnimation = false;
        });
        channel.on("__move.start", function(){
            inMove = true;
        });
        channel.on('__move.end', function(){
            inMove = false;
        });
        drag.on('tap', function(e){
            if (inAnimation || !point.pile || inMove) return;
            channel.emit("pile.tap", point);
        });
        drag.on('down', _.bind(function(points){
            channel.emit("pointer.down", point);

            if (inAnimation) return;
            point.start = this.transformPoint(points.start);
            point.pile = this.getPileUnderPoint(point.start);

            if (!point.pile) return;

            _canvas.width = _canvas.width

            var event = point.pile.type === 'stock' ? 'stock.clicked' : 'pile.selected';
            
            channel.emit(event, point);
        }, this));

        drag.on('start', _.bind(function(){
            if (!inAnimation && point.pile)
                channel.emit('pile.drag.start', point);
        }, this));

        drag.on('move', _.bind(function(points) {
            if (inAnimation || !point.pile) return;
            
            point.current = this.transformPoint(points.current);
            point.last    = this.transformPoint(points.last);
            channel.emit('pile.drag.move', point);
        }, this));

        drag.on('stop', _.bind(function(points) {
            point.pile = this.getPileUnderPoint(this.transformPoint(points.current));
            channel.emit('pile.drag.end', point);
        }, this));

        $.on(window, 'resize', _.bind(this.resize, this));
    });

    return {
        initialize: function initialize(canvas, board) {
            this.canvas = canvas;
            this.ctx    = canvas.getContext("2d");

            var createTableau    = _.bind(createPile, null, "tableau"),
                createFoundation = _.bind(createPile, null, "foundation"),

                tableaus    = _.map([[],[],[],[],[],[],[]], createTableau),
                foundations = _.map(board.foundations, createFoundation),
                waste       = createPile("waste", board.waste, 5),
                stock       = createPile("stock", board.stock, 6);

            stock.push.apply(stock, [].concat.apply([], board.tableaus).reverse());

            piles = this.piles = [].concat(tableaus, foundations, waste, stock);

            this.resize();

            initEvents.call(this);
            return this;
        },

        resize: function resize() {
            var box = this.canvas.parentNode.getBoundingClientRect();

            this.canvas.width  = box.width;
            this.canvas.height = box.height;

            if (box.width > box.height)
                this.scale = box.height / BOARD_HEIGHT;
            else
                this.scale = box.width / (BOARD_WIDTH + Pile.cardWidth);
    
            if (IS_IOS)
                this.scale *= 1.1;
            this.marginLeft = parseInt((box.width - (BOARD_WIDTH * this.scale)) / 2);
            this.marginTop  = 50;
            this.drawAll();
        },

        drawAll: function drawAll(inDrag) {
            var ctx    = this.ctx,
                length = this.piles.length,
                i;

            ctx.fillStyle = "#003300";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.save();
            ctx.translate(this.marginLeft, this.marginTop);
            ctx.scale(this.scale, this.scale);

            for (i = 0; i < length; i += 1) {
                this.piles[i].draw(ctx);
            }

            ctx.restore();
        },

        /**
         * Mantiene value entre 0 y max
         * @param  {Numer} value - valor actual
         * @param  {Number} step - valor a aumentar
         * @param  {Numer} max   - valor maximo
         * @return {Number}        valor entre 0 y max
         */
        constrain: function constrain(value, step, max) {
            value = Math.max(value, 0);

            return value + step > max ? max - step : value;
        },

        initializeDirtyRectangle: function initializeDirtyRectangle(pile) {
            this.draw(pile, true);
        },

        clearDirty: function() {
            _canvas.width = _canvas.width;
            _canvas.height = _canvas.height;
        },

        draw: function draw(pile, isFirstDraw) {

            var canvasWidth  = this.canvas.width,
                canvasHeight = this.canvas.height,

                sb = 2,

                lastX = ((pile.lastX * this.scale) + this.marginLeft | 0)-sb,
                lastY = ((pile.lastY * this.scale) + this.marginTop | 0)-sb,

                x = ((pile.x * this.scale) + this.marginLeft | 0) - sb,
                y = ((pile.y * this.scale) + this.marginTop | 0) - sb,

                w = Math.ceil(pile.getWidth() * this.scale) + sb*2,
                h = Math.ceil(pile.getHeight() * this.scale) + sb*2,
                ctx = this.ctx;

            x     = this.constrain(x, w, canvasWidth);
            y     = this.constrain(y, h, canvasHeight);
            lastX = this.constrain(lastX, w, canvasWidth);
            lastY = this.constrain(lastY, h, canvasHeight);

            ctx.fillStyle = "#003300";
            pile.lastX = pile.x;
            pile.lastY = pile.y;

            if (isFirstDraw)
                this.drawAll(true);
            else
                ctx.fillRect(lastX, lastY, w, h);

            ctx.drawImage(_canvas, lastX, lastY);

            _canvas.width  = w;
            _canvas.height = h;

            _ctx.drawImage(this.canvas, x, y, w, h, 0, 0, w, h);

            ctx.save();
            ctx.translate(this.marginLeft, this.marginTop);
            ctx.scale(this.scale, this.scale);
            pile.draw(ctx, true);
            ctx.restore();
        },

        transformPoint: function transformPoint(point) {
            return {
                x: (point.x - this.marginLeft) / this.scale | 0,
                y: (point.y - this.marginTop) / this.scale | 0
            }
        },

        getPileUnderPoint: function getPileUnderPoint(point) {            
            return _.find(piles, function(pile){
                return pile.hitTest(point);
            });
        }
    };
});
