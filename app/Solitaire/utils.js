define(
[
    'underscore'
],
function() {
    'use strict';

    var SUITS    = '♥♣♦♠'.split(''),
        COLORS   = {'♥': 'red', '♣': 'black', '♦': 'red', '♠': 'black'},
        RANKS    = 13,
        TABLEAUS = 7,
        FOUNDATIONS = 4;

    /**
     * Shuffle an array in place
     * @param  {Array} array - array to shuffle
     * @return {Array}         Shuffled array
     */
    function shuffle(array) {
        var tmp, current, top = array.length;
        
        if (top) {
            while (--top) {
                current = ~~(Math.random() * (top + 1));
                
                tmp            = array[current];
                array[current] = array[top];
                array[top]     = tmp;
            }
        }
        return array;
    }

    /**
     * Crea una baraja de cartas
     * @return {Array} Array de cartas
     */
    function createCards() {
        var cards = [],
            i, suit, rank;

        for (i = 0; (suit = SUITS[i]); i++) {
            for (rank = 0; rank < RANKS; rank++) {
                cards.push({suit: suit, rank: rank});
            }
        }

        return cards;
    }

    /**
     * Fill the game board
     * @return {Object} the game board
     */
    function createBoard() {
        var deck  = createCards(),
            board = {};

        shuffle(deck);
        board.foundations = [[],[],[],[]];
        board.tableaus    = createTableaus(deck);;
        board.stock       = deck;
        board.waste       = [];

        return board;
    }

    function createTableaus(deck) {
        var tableaus = [],
            currentTableau, i;

        // cada tableau tiene 1, 2, 3, 5, 6, 7
        for (i = 0; i < TABLEAUS; i++) {
            currentTableau = deck.splice(0, i+1);
            // solo la ultima carta esta boca arriba
            currentTableau[currentTableau.length-1].faceup = true;
            tableaus.push(currentTableau);
        }

        return tableaus;
    }

    function clone(object) {
        var clon, i, l;

        if (Array.isArray(object)) {
            clon = [];

            for (i = 0, l = object.length; i < l; i++) {
                if (typeof object[i] === 'object')
                    clon[i] = clone(object[i]);
                else
                    clon[i] = object[i];
            }
        } else {
            clon = {};

            for (i in object) {
                if (! object.hasOwnProperty(i)) continue;

                if (typeof object[i] === 'object')
                    clon[i] = clone(object[i]);
                else
                    clon[i] = object[i];
            }
        }

        return clon;
    }
    
    return {
        createBoard: createBoard,

        getColor: function getColor(card) {
            return COLORS[card.suit];
        },

        last: function last(array, i) { return array[array.length - (i || 1)]; },

        clone: clone,

        every: _.every,

        all: _.all,

        delay: _.delay,

        isArray: function(a) {
            return ({}).toString.call(a) === '[object Array]';
        }
    }
});