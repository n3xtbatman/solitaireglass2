define(
[
    './board',
    './animations',
    'Solitaire',
    'underscore',
    'common/EventBus',
    './undoredo',
    'Q'
],
function(Board, animations, Solitaire, _, channel, undo, Q) {
    'use strict';

    var board,
        stock,
        waste,
        selectedCards,
        initialized,
        alreadyMove = false,
        allowedDraws = 0;

    function initInternalEvents() {
        channel.on('pointer.down',    clearSelection);
        channel.on('stock.clicked',   drawCards);
        channel.on('stock.clicked',   checkFirstMove);
        channel.on('pile.drag.start', checkFirstMove);
        channel.on('pile.drag.start', getSelectedCards);
        channel.on('pile.drag.move',  dragSelectedCards);
        channel.on('pile.drag.end',   fireAnimations);
        channel.on('__undo.move', undoMove);
        channel.on('pile.tap', function(point){
            if (point.pile.type === "foundation") return;
            
            var n = point.pile.getCards(point.start),
                result;
            if (Solitaire.canGet({from: point.pile, cards: n}))
                result = testNCardsFromPile(n, point.pile, getAllPiles(point.pile));
            if (result)
                result.then(autoPlay);
        });
    }

    function autoPlay() {
        if (!Solitaire.areAllUpside() || board.inAnimation) return;

        var tableaus = _.select(board.piles, {type: "tableau"}),
            piles = tableaus.concat([waste]),
            moved = 0;

        _.reduce(piles, function(soFar, pile) {
            return soFar.then(function(){
                return findPosibleMove(pile).then(function(){
                    moved++;
                }).fail(function(){return Q()});
            });
        }, Q())
        .fin(function(){
            if (! moved)
                drawCards().then(autoPlay);
            else
                autoPlay();
        });
    }

    function getAllPiles(exclude) {
        var tableaus    = _.select(board.piles, {type: "tableau"}),
            foundations = _.select(board.piles, {type: "foundation"});

        return _.without(foundations.concat(tableaus), exclude);
    }

    function findPosibleMove(pile) {
        var piles      = getAllPiles(pile),
            curPile, n = 0, result;


        while (Solitaire.canGet({from: pile, cards: ++n})) {
            result = testNCardsFromPile(n, pile, piles);

            if (result) return result;
        }

        return Q.reject();
    }

    function testNCardsFromPile(n, pile, piles) {
        var i,
            dest,
            orig,
            curPile = pile.getSelection(n),
            lastCardHasSameRank;

        for (i = 0, length = piles.length; i < length; i++) {
            orig = pile.last();
            dest = piles[i].last();
            lastCardHasSameRank = orig && dest && orig.rank === dest.rank;

            // these cases don't change the state of the game
            // examples:
            //      move a K between two empty piles
            //      move a J♥ from Q♣ to Q♠
            if (!orig && !dest && piles[i].type === "tableau" && pile.type === "tableau")
                continue;

            if (lastCardHasSameRank && orig.faceup && pile.type === piles[i].type)
                continue;

            // the cards can't be moved between those piles
            if (!Solitaire.canMove({from: curPile, to: piles[i], cards: n}))
                continue;

            return Solitaire
            .move({from: curPile, to: piles[i], cards: curPile.size()})
            .then(animations.turnAndMoveCards);
        }

         // put cards in the pile
        pile.push.apply(pile, curPile.cards);
    }

    function undoMove(actions){
        animations.turnAndMoveCards(actions);
    }

    channel.on("__restore.draw", function(){
        allowedDraws++;
    });

    function checkFirstMove() {
        if (! alreadyMove) {
            alreadyMove = true;
            channel.emit('game.first.move');
        }
    }

    /**
     * Saca una carta de stock 
     * @return {undefined}
     */
    function drawCards() {
        if (Solitaire.canGetCardFromStock()) {
            undo.manager.exec( new undo.stockAction(Solitaire) );
            return drawNCards(waste.draw3 ? 3 : 1);
        } else if (allowedDraws > 1 && waste.size()) {
            --allowedDraws;
            undo.manager.exec( new undo.stockAction(Solitaire) );
            waste.last().faceup = false;
            board.drawAll();
            board.initializeDirtyRectangle(waste);
            return animations.move(waste, stock).then(fillStock);
        }
        Q.reject()
    }

    function drawNCards(n) {
        if (! n) return;

        return _.reduce(_.range(n), function(soFar) {
            return soFar.then(function(){
                return animations.turn(stock, 'left', 150).then(function(){
                    moveCardToWaste();
                });
            });
        }, Q())
    }

    /**
     * Mueve una carta de stock a waste
     * @return {undefined} 
     */
    function moveCardToWaste() {
        if (! stock.size()) return;
        stock.pop();
        waste.push(Solitaire.getCardFromStock());
        board.drawAll();
    }

    /**
     * Mueve todas las cartas de waste a stock
     * @return {undefined}
     */
    function fillStock() {

        waste.restorePosition();
        waste.empty();

        Solitaire.fillStock();
        stock.push.apply(stock, Solitaire.getPile('stock'));
        board.drawAll();
    }

    /**
     * Nulifica la selección actual
     * @return {undefined}
     */
    function clearSelection() {
        selectedCards = null;
    }

    /**
     * [getSelectedCards description]
     * @param  {[type]} event [description]
     * @return {[type]}       [description]
     */
    function getSelectedCards(event){
        var pile    = event.pile,
            canMove = Solitaire.canGet({
            from: { type: pile.type, pos: pile.pos },
            cards: pile.getCards(event.start)
        });

        if (canMove) {
            channel.emit('__move.start');
            selectedCards = pile.getSelection(pile.getCards(event.start));
            board.initializeDirtyRectangle(selectedCards);
        }
    }

    /**
     * Mueve las cartas seleccionadas
     * @param  {Evento} event {current: <point>, start: <point>, end: <point>}
     * @return {undefined}
     */
    function dragSelectedCards(event) {
        if (! selectedCards) { return; }

        selectedCards.x += event.current.x - event.last.x;
        selectedCards.y += event.current.y - event.last.y;
        board.draw(selectedCards);
    }


    /**
     * Determina que pila es la mas apropiada para mover las cartas seleccionadas
     * @param  {Pile} cp        - cartas seleccionadas
     * @return {Pile|undefined}
     */
    function getDestinationPile(cp) {
        var leftTop     = cp,
            rightTop    = {x: cp.x + cp.cardWidth, y: cp.y},
            bottomLeft  = {x: cp.x, y: cp.y + cp.cardHeight},
            bottomRight = {x: cp.x + cp.cardWidth, y: cp.y + cp.cardHeight},

            piles = [
                board.getPileUnderPoint(leftTop),
                board.getPileUnderPoint(rightTop),
                board.getPileUnderPoint(bottomLeft),
                board.getPileUnderPoint(bottomRight)
            ],

            cards  = cp.size();

        return _.find(piles, function(pile) {
            return Solitaire.canMove({from: cp, to: pile, cards: cards});
        });
    }

    /**
     * Ejecuta las animaciones apropiadas al terminar un movimiento
     * @return {undefined}
     */
    function fireAnimations() {
        if (! selectedCards ) { return; }

        var curPile = selectedCards,
            pile    = getDestinationPile(curPile);

        Solitaire
        .move({from: curPile, to: pile, cards: curPile.size()})
        .then(animations.turnAndMoveCards)
        .then(function(){
            if (Solitaire.areAllUpside())
                autoPlay();
        })
        .fail(function (actions) {
            var from = actions.from,
                to   = actions.from.original;

            return animations.move(from, to.getNextCardPosition()).then(function(){
                to.push.apply(to, from.cards);
                board.drawAll();
            });
        })
        .fin(function(){
            channel.emit("__move.end");
        });
    }

    return {
        initialize: function initialize(canvas, options) {
            if (Board.inAnimation) return;
            channel.emit('game.start');

            board = Board.initialize(canvas, Solitaire.initialize());
            stock = _.select(board.piles, {type: 'stock'}).pop();
            waste = _.select(board.piles, {type: 'waste'}).pop();
            alreadyMove = false;
            _.delay(animations.deal, 300);
            waste.draw3 = options.draw3;

            allowedDraws = options.allowedDraws || 3;

            if (! initialized) {
                channel.emit('game.initialized');
                initInternalEvents();
                initialized = true;
                channel.on('restart', _.bind(this.initialize, this, canvas, options));
                channel.on('draw3', _.bind(function(){
                    options.draw3 = waste.draw3 = !options.draw3;
                }, this));
            }
        }
    };
});
