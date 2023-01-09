define(
[
    'Q',
    './utils',
    'common/EventBus',
    'view/undoredo'
],

function(Q, _, channel, undo){
    'use strict';
    Q.stopUnhandledRejectionTracking();
    var currentBoard = null;

    channel.on('__undo.move', function(actions){
        var from = getPile(actions.from),
            to   = getPile(actions.to),
            lastCard = _.last(to);

        if (actions.turnLastCard)
            lastCard.faceup = false;

        to.push.apply(to, from.splice(-actions.from.size()));
    });

    channel.on('__undo.stock', function(piles){
        currentBoard.stock = piles.stock;
        currentBoard.waste = piles.waste;
    });

    function getPile(opts) {
        var pile = currentBoard[opts.type] || currentBoard[opts.type + 's'];

        return _.isArray(pile[opts.pos]) ? pile[opts.pos] : pile;
    }

    function has13Card(pile) {
        return pile.length === 13;
    }

    function isFaceup(card) {
        return !!(card && card.faceup)
    }

    function canGetMoreThanOneCard(pile) {
        return pile.type === 'tableau';
    }

    // API
    // canGet({cards: Number, from: String})
    // move({cards: Number, from: String, to: String})

    return {

        initialize: function initialize() {
            currentBoard = _.createBoard();

            return _.clone(currentBoard);
        },

        /**
         * Determina si es legal sacar un grupo de cartas de una pila.
         * @param  {Object} options - {cards: Number, from: Pile}
         * @return {Boolean}          Es posible mover las cartas?
         */
        canGet: function canGet(options) {
            if (!arguments.length) return false;

            if (! canGetMoreThanOneCard(options.from) && options.cards > 1)
                return false;

            var pile, card;

            pile = getPile(options.from);
            
            card = _.last(pile, options.cards);

            return card && card.faceup;
        },

        /**
         * Determina si es posible mover un grupo de cartas entre dos pilas
         * @param  {Object} move - {cards: <Number>, from: <Pile>, to: <Pile>}
         * @return {Boolean}
         */
        canMove: function canMove(_move) {
            var move = _move;
            var canGetCards  = this.canGet(move),
                isFoundation = move.to && move.to.type === "foundation",
                isTableau    = move.to && move.to.type === "tableau",
                isValidPile = isTableau || isFoundation;

            if (! canGetCards || ! isValidPile || (isFoundation && move.cards > 1) )
                return false;

            var card1    = _.last(getPile(move.from), move.cards),
                destCard = _.last(getPile(move.to));

            if (isFoundation)
                return this.testFoundation(card1, destCard);
            else
                return this.testTableau(card1, destCard);
        },

        testTableau: function testTableau(card1, destCard) {
            if (! destCard && card1.rank == 12)
                return true;

            return isFaceup(destCard) &&
                   _.getColor(card1) !== _.getColor(destCard) &&
                   card1.rank - destCard.rank == -1;
        },

        testFoundation: function testFoundation(card1, destCard) {
            if (! destCard && card1.rank === 0) return true;

            return isFaceup(destCard) &&
                   card1.suit === destCard.suit &&
                   card1.rank - destCard.rank == 1;
        },

        /**
         * Mueve cartas entre dos pilas
         * @param  {Object} move - {cards: <Number>, from: <Pile>, to: <Pile>}
         * @return {Object}        promesa
         */
        move: function move(_move) {
            var move = _move;
            if (! arguments.length || ! this.canMove(move)) 
                return Q.reject(move);

            // publish that something happens
            channel.emit(move.from.type + '.to.' + move.to.type);

            var actions = {from: move.from, to: move.to},
                from    = getPile(move.from),
                to      = getPile(move.to),
                newLastCard = _.last(from, move.cards + 1);

            to.push.apply(to, from.splice(-move.cards));

            if (newLastCard && ! isFaceup(newLastCard)) {
                channel.emit('card.turn');
                newLastCard.faceup = true;
                actions.turn = true;
            }

            // evento interno, por favor no suscribirse a él
            if (_.every(currentBoard.foundations, has13Card))
                _.delay(channel.emit, 400, '__game.finish');

            undo.manager.exec(new undo.command(actions));

            return new Q(actions);
        },

        canGetCardFromStock: function canGetCardFromStock() {
            return !!currentBoard.stock.length;
        },

        getCardFromStock: function getCardFromStock() {
            if (! this.canGetCardFromStock())
                return;

            channel.emit('draw.card');

            var card = currentBoard.stock.pop();
            card.faceup = true;
            currentBoard.waste.push(card);
            return _.clone(card);
        },

        fillStock: function fillStock() {
            if (this.canGetCardFromStock())
                return;

            channel.emit('draw.card');

            var waste = currentBoard.waste,
                stock = currentBoard.stock,
                i, l;

            for (i = 0, l = waste.length; i < l; i++) {
                waste[i].faceup = false;
            }

            stock.push.apply(stock, waste.splice(0).reverse());
        },

        areAllUpside: function areAllUpside() {
            return _.all(currentBoard.tableaus, function(tableau){
                return _.every(tableau, function(card){
                    return card.faceup;
                });
            });
        },

        getPile: function getPile(pile) {
            return _.clone(currentBoard[pile]);
        }
    }
});
