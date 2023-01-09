define(
[
    'image!assets/images/sprite.png!rel'
],
function(sprite) {
    'use strict';

    var CARD_WIDTH  = sprite.width / 53,
        CARD_HEIGHT = sprite.height,

        SHADOW_BLUR = 4,

        BACKSIDE_X  = CARD_WIDTH  * 52,
        OFFSET      = CARD_HEIGHT * .07 | 0,
        OFFSET2     = CARD_HEIGHT * .3 | 0,

        selection   = document.createElement('canvas'),
        selectionCtx= getContext(selection),

        /**
         * Distancia de cada palo en el sprite
         * @type {Object}
         */
        SPRITE_OFFSETS     = {'♥': 0, '♣': 13, '♦': 26, '♠': 39};

    function getContext(canvas) {
        if (canvas.getContext)
            return canvas.getContext("2d");
        return null;
    }
    /**
     * Dibuja una carta
     * @param  {CanvasRenderingContext2D} ctx
     * @param  {Object} card - {suit: String, rank: Number, faceup: Boolean}
     * @param  {Number} x
     * @param  {Number} y
     */
    function drawCard(ctx, card, x, y, dest_width, dest_height) {
        var card_y = 0,
            card_x = BACKSIDE_X;

        if (!card) return;

        if (card.faceup)
            card_x = (SPRITE_OFFSETS[card.suit] + card.rank) * CARD_WIDTH;

        ctx.drawImage(sprite, 
                            card_x, card_y, CARD_WIDTH, CARD_HEIGHT, 
                                 x,      y, dest_width || CARD_WIDTH, dest_height || CARD_HEIGHT);

    }

    return {
        cardWidth:  CARD_WIDTH,
        cardHeight: CARD_HEIGHT,
        /**
         * Inicializa la pila copiando los atributos pasados
         * @param  {Object} attrs - atributos especificos de la pila
         * @return {Object}       - el objeto mismo
         */
        initialize: function initialize(attrs) {
            var attr;
            for (attr in attrs) {
                if (attrs.hasOwnProperty(attr))
                    this[attr] = attrs[attr];
            }

            this.originalX = this.x;
            this.originalY = this.y;

            return this;
        },

        /**
         * Determina si un punto se encuentra sobre la pila
         * @param  {Object} point - {x: Number, y: Number}
         * @return {Boolean}      - 
         */
        hitTest: function hitTest(point) {
            var offsetTop = 0;

            if (this.type == 'tableau')
                offsetTop = this.countCardsUpsidedown() * OFFSET;

            return point.x >= this.x && point.x <= this.x + this.getWidth() &&
                   point.y >= this.y + offsetTop && point.y <= this.y + this.getHeight();
        },

        getWidth: function getWidth() {
            return CARD_WIDTH;
        },

        getShadowBlur: function() {
            return SHADOW_BLUR;
        },

        getHeight: function getHeight() {
            if (this.type !== 'tableau')
                return CARD_HEIGHT;
            else
                return this.getOffsetTop() + CARD_HEIGHT;
        },

        getOffsetTop: function() {
            var cardsDown       = this.countCardsUpsidedown(),
                offsetCardsDown = cardsDown * OFFSET,
                offsetCardsUp   = (this.size() - cardsDown - 1) * OFFSET2;

            return offsetCardsDown + offsetCardsUp;
        },

        /**
         * Calcula la posición donde debe ser insertada la proxima carta
         * @return {Object} {x: Number, y: Number}
         */
        getNextCardPosition: function getNextCardPosition() {
            return {
                x: this.x,
                y: this.type !== 'tableau' ? this.y : this.y + this.getOffsetTop() + OFFSET2
            }
        },

        getCards: function getCards(point) {
            if (! this.hitTest(point) || ! this.size())
                return -1;

            if (this.type !== 'tableau')
                return 1;

            var cardsDown = this.countCardsUpsidedown(),
                total   = this.size() - cardsDown,
                offsetCardsDown = cardsDown * OFFSET,
                delta_y = point.y - this.y - offsetCardsDown,
                cards   = ~~(delta_y / OFFSET2);

            if (cards > total - 1)
                cards = total - 1;

            return total - cards;
        },

        /**
         * Remueve N cartas y crea una nueva pila con ellas
         * @param  {Number} n Cartas selecionadas
         * @return {Object}   Nueva pila
         */
        getSelection: function getSelection(n) {
            var selection  = Object.create(this),
                pos;

            selection.cards = this.cards.splice(-n);

            pos = this.getNextCardPosition();

            selection.lastX = selection.x = pos.x;
            selection.lastY = selection.y = pos.y;

            selection.original  = this;

            return selection
        },

        /**
         * Dibuja todas las cartas en la pila
         * @param  {CanvasRenderingContext2D} ctx
         */
        draw: function draw(ctx, isDrag) {
            if (! this.size())
                return this.drawPlaceholder(ctx);

            var i, l, cards = this.cards,
                offsetY = this.type == "tableau" ? OFFSET : 0,
                offsetX = this.draw3 && !this.original? 70 : 0,
                y = this.y;

            this.lastX = this.x;
            this.lastY = this.y;

            ctx.shadowColor = "#555";

            if (this.type === "tableau" && !isDrag) {
                ctx.shadowOffsetY = -1;
            } else if (this.type === "waste" && !isDrag) {
                ctx.shadowOffsetX = -1;
                ctx.shadowOffsetY = -1;
            }

            for (i = 0, l = this.size(); i < l; i++) {
                // FIXME: what the fuck is this?
                drawCard(ctx, cards[i], this.x - (i>=l-3 && this.draw3 ? offsetX * ( (2 - (i-(l-3))) %3):0), y);
                if (this.type == "tableau")
                    y += cards[i].faceup ? OFFSET2 : OFFSET;
            }
        },

        drawPlaceholder: function drawPlaceholder(ctx) {
            ctx.fillStyle = "rgba(0, 0, 0, .3)";
            ctx.shadowColor = "rgba(0,0,0,0)";
            ctx.fillRect(this.originalX, this.originalY, CARD_WIDTH, CARD_HEIGHT);
        },

        clear: function clear(ctx) {
            ctx.fillRect(this.lastX, this.lastY, this.getWidth(), this.getHeight());
        },

        turn: function turn(ctx, step, dir) {
            if (! this.size()) return;

            var y = this.y + (this.type !== "tableau" ? 0 : (this.size() - 1) * OFFSET),
                x = this.x,
                width = CARD_WIDTH * (1 - step * 2),
                card  = {},
                empty = this.type === "stock" ? this.cards[this.cards.length-2] : {};

            if (step > .5) {
                width = CARD_WIDTH * ((step - .5) * 2);
                width = Math.min(width, CARD_WIDTH)
                card  = this.cards[this.size() - 1];
                card.faceup = true;
            }

            width = ~~width || 1;

            ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT + 10);

            if (! empty)
                this.drawPlaceholder(ctx);
            else if (this.size() > 1)
                drawCard(ctx, empty, x, y - (this.type !== "tableau" ? 0 : OFFSET));

            if (dir === 'left')
                x = x - (step > .5 ? width : 0);
            else if (dir === 'right')
                x = x + (step > .5 ? CARD_WIDTH : CARD_WIDTH - width);
            else
                x = x + (CARD_WIDTH - width) / 2;

            drawCard(ctx, card, ~~x, ~~y, ~~width);
        },

        restorePosition: function restorePosition() {
            this.x = this.originalX;
            this.y = this.originalY;
        },

        countCardsUpsidedown: function countUpCard() {
            return _.filter(this.cards, function(c){ return !c.faceup }).length
        },

        pop: function pop() {
            return this.cards.pop();
        },

        push: function push() {
            return this.cards.push.apply(this.cards, arguments);
        },

        last: function last() {
            return this.cards[this.cards.length-1];
        },

        empty: function empty() {
            this.cards.length = 0;
        },

        size: function size() {
            return this.cards.length;
        },

        valueOf: function valueOf() {
            return (this.rank + 1) + this.suit
        }
    }
});