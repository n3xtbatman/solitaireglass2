define(
[
    'Q',
    'underscore',
    'common/EventBus',
    './board',
    'common/Utils'
],
function(Q, _, channel, board, $) {
    'use strict';

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

function animate(animation, t) {

    var defer = Q.defer(),
        time  = t || 150,
        start = (new Date).getTime(),
        current, delta;

    requestAnimationFrame(function F(){
        current = Date.now() - start;

        delta = Math.min(Math.max(0, current / time), 1);

        if (delta !== 1)
            requestAnimationFrame(F, 1000/60);

        animation(delta);

        if (delta === 1) {
            defer.resolve();
        }
    });

    return defer.promise;
}

function turn(pile, direction) {
    return function(delta) {
        board.ctx.save();
        board.ctx.translate(board.marginLeft, board.marginTop);
        board.ctx.scale(board.scale, board.scale);

        pile.turn(board.ctx, delta, direction);

        board.ctx.restore();
    };
}

function noop() {}

function moveCardsInSequense(options) {
    var from = options.from,
        to   = options.to,
        N    = options.total,
        time = 100,
        forEachCard = options.forEachCard || noop;

    function animateCard(pile, i) {
        var card = pile.getSelection(1);

        board.clearDirty();
        board.initializeDirtyRectangle(card);

        
        return animate(move(card, to.getNextCardPosition()), time).then(function(){
            channel.emit("pile.deal.start");
            forEachCard(to, card);
            to.push.apply(to, card.cards);
            board.draw(card);
        }).then(function(){
            channel.emit("pile.deal.end");
        });
    }

    return _.reduce(_.range(N), function(soFar, i){
        return soFar.then(_.bind(animateCard, null, from, i));
    }, Q());
}

// Move all cards from foundations to stock
function finalAnimation() {
    var foundations = _.select(board.piles, {type: 'foundation'}),
        stock       = _.select(board.piles, {type: 'stock'}).pop();

    function forEachCard(pile, card) {
        card.cards[0].faceup = false;
    }

    return _.reduce(foundations, function(soFar, foundation){
        return soFar.then(_.bind(moveCardsInSequense, null, {
            from: foundation,
            to: stock,
            total: 13,
            time: 60,
            forEachCard: forEachCard
        }));
    }, Q());
}

  // move cards from stock to tableaus
  function deal() {
    var stock    = _.select(board.piles, {type: 'stock'}).pop(),
        tableaus = _.select(board.piles, {type: 'tableau'}),
        i = 0;

        channel.emit("animation.start");
        return _.reduce(tableaus, function(soFar, tableau) {
            return soFar.then(_.bind(moveCardsInSequense, null, {
                    from: stock,
                    to: tableau,
                    time: 60,
                    total: ++i
                }))
        }, Q()).then(function(){
            board.drawAll();
            channel.emit("animation.end");
        });
    }

  function move(selectedCards, position) {
        var deltaX = selectedCards.x - position.x,
            deltaY = selectedCards.y - position.y,
            x = selectedCards.x,
            y = selectedCards.y;

        return function(delta) {
            if (selectedCards.x !== position.x) {
                selectedCards.x = x - deltaX * delta;
            }

            if (selectedCards.y !== position.y) {
                selectedCards.y = y - deltaY * delta;
            }

            board.draw(selectedCards);
        };
    }

    function turnAndMoveCards(actions){
        var from = actions.from,
            to   = actions.to,
            toPos= to.getNextCardPosition();

        board.clearDirty();
        board.initializeDirtyRectangle(from);

        return animations.move(from, toPos).then(function(){
            if (actions.turn)
                return animations.turn(from.original, null, 0);
        })
        .then(function(){
            to.push.apply(to, from.cards);
            board.drawAll();
        });
    }

    channel.on('game.finish', finalAnimation);

    var animations =  {
      move: function(a, b, c) { 
        channel.emit("animation.start");
        return animate(move(a, b), c).then(function(q){
            channel.emit("animation.end");
        });
      },

      turn: function(a, b, c) {
            channel.emit("animation.start");
            channel.emit("card.flip"); 
            return animate(turn(a, b), c).then(function(q){
                channel.emit("animation.end");
            });
        },
      deal: deal,

      turnAndMoveCards: turnAndMoveCards
    };

    return animations;
});