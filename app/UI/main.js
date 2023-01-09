define(
[
    'common/Utils',
    'common/EventBus',
    'common/Storage',
    './Sound',
    './Score',
    'text!./template.html',
    'underscore',
    'i18n!nls/solitaire',
    'view'
],
function($, channel, Storage, Sound, Score, template, _, i18n, View) {
    'use strict';

    var _class = {
        'icon-volume-up': 'icon-volume-off',
        'icon-volume-off': 'icon-volume-up',
        'icon-check-empty': 'icon-check-sign',
        'icon-check-sign': 'icon-check-empty'
    },

    ieMsg = [
    '<h2>Ups! This game only works in modern browsers</h2>',
    '<p>Please update your browser quickly</p>',
    '<ul>',
    '    <li><a href="http://www.google.com/chrome" title="Google Chrome">Google Chrome</a></li>',
    '    <li><a href="http://www.mozilla.org/" title="Mozilla Firefox">Firefox</a></li>',
    '    <li><a href="http://www.opera.com/download" title="Opera">Opera</a></li>',
    '</ul>'
    ],

    // Default points
    WASTE_TO_TABLEAU = 5,
    FOUNDATION_TO_TABLEAU = -15,
    MOVE_TO_FOUNDATION = 10,
    IS_IOS = /iphone|ipod|ipad/i.test(navigator.userAgent),
    TURN_CARD = 5;

    // ie hack
    document.createElement('solitaire');

    function initSound(options, callback) {
        var parts = /android (\d\.\d)/i.exec(navigator.userAgent),
            isAndroid = !!parts,
            version   = parts ? parseFloat(parts[1]) : 0;

        if (isAndroid && version <= 2.3)
            return;

        var sound  = new Sound("sound/click", 10, callback);
        sound.play = _.bind(sound.play, sound);
        sound.setEnabled = _.bind(sound.setEnabled, sound);

        channel.on('pile.deal.start', sound.play)
        channel.on("card.flip", sound.play);
        channel.on('switch-sound', sound.setEnabled);
        channel.on('switch-sound', function(){
            Storage.save('sound', sound.enabled);
        });
        
        sound.enabled = !IS_IOS;
        
        if (IS_IOS) {
            channel.on('switch-sound', function() {
                sound.load();
            }).once();
        }

        if (Storage.get('sound') !== null && !IS_IOS)
            sound.enabled = Storage.get('sound');
        if (! sound.enabled)
            $.$("solitaire-sound-icon").className = "icon-volume-off";
    }

    function initDraw3(options) {
        var draw3 = options.draw3;

        if (Storage.get('draw3') !== null) {
            draw3 = options.draw3 = Storage.get('draw3');
        }

        channel.on('draw3', function() {
            draw3 = !draw3;
            Storage.save('draw3', draw3);
        });

        if (draw3)
            $.$('solitaire-draw3-icon').className = 'icon-check-sign';
    }

    function initScore(options) {
        var points = options.score || {},
            score  = Score.initialize({
                timer: 'html5-solitaire-timer',
                score: 'html5-solitaire-score',
                every: options.every,
                deduct: options.deduct
            });

        _.bindAll(score);

        channel.on('game.start', score.reset);

        channel.on('game.first.move', score.restart);

        channel.on('__game.finish', function(){
            score.stop();
            channel.emit('game.finish', {
                time: score.getTime(),
                score: score.getScore(),
                pretyTime: score.time()
            });
        });

        var scoreHistory = [];

        function changeScore(type, s) {
            scoreHistory.push(s);
            score[type](s);
        }

        channel.on("__undo.score", function(){
            var s = -scoreHistory.pop();
            if (s > 0)
                score.up(s);
            else
                score.down(s);
        });

        channel.on("foundation.to.foundation", _.bind(changeScore, null, "up", 0));

        channel.on('waste.to.foundation', function() {
            changeScore("up", points.move_to_foundation || MOVE_TO_FOUNDATION);
        });

        channel.on('tableau.to.foundation', function() {
            changeScore("up", points.move_to_foundation || MOVE_TO_FOUNDATION);
        });

        channel.on('waste.to.tableau', function(){
            changeScore("up", points.waste_to_tableau || WASTE_TO_TABLEAU);
        });

        channel.on('foundation.to.tableau', function(){
            changeScore("down", -Math.abs(points.foundation_to_tableau) || FOUNDATION_TO_TABLEAU);
        });

        channel.on('card.turn', function(){
            changeScore("up", points.turn_card || TURN_CARD);
        });
    }

    
    function initUiEvents() {
        var sidebarIsVisible = false;

        $.on('html5-solitaire-sidebar', 'click', emitUiEvents);

        $.on('html5-solitaire-options', 'click', function() {
            $.addClass(document.body, 'html5-solitaire-show-sidebar');
            sidebarIsVisible = true;
        });

        $.on('html5-solitaire-board-overlay', 'click', function(){
            $.removeClass(document.body, 'html5-solitaire-show-sidebar');
            sidebarIsVisible = false;
        })

        $.on('html5-solitaire-undo', 'click', function() {
            channel.emit("__do.undo");
        });
    }

    function emitUiEvents(event) {
        var button = event.target.nodeName === 'BUTTON' ? event.target : event.target.parentNode,
            action = button.getAttribute('data-sol-action'),

            icon   = button.children[0],
            className = icon.className;

        if (action) {
            channel.emit(action);
            icon.className = _class[className] || className;
        }
    }

    function getCorrectSize(size) {
        return size.indexOf('%') !== -1 ? size : size.replace('px', '') + 'px';
    }

    return {
        initialize: function(options) {
            var solitaire;

            if ('string' === typeof options.container)
                solitaire = document.getElementById(options.container);
            else
                solitaire = document.getElementsByTagName('solitaire')[0];

            try {
                document.createElement("canvas").getContext("2d");
            } catch(e) {
                var div = document.createElement("div");
                div.innerHTML = ieMsg.join("");
                solitaire.parentNode.replaceChild(div, solitaire);
                throw e;
            }

            options = options || {};

            if (! solitaire)
                throw new Error('No Element was provided');

            if (solitaire.hasAttribute("draw3"))
                options.draw3 = true;

            var allowedDraws = parseInt(solitaire.getAttribute("allowedDraws"), 10);

            if (allowedDraws > 0)
                options.allowedDraws = allowedDraws;

            var width  = solitaire.getAttribute('width') || "100%",
                height = solitaire.getAttribute('height') || "100%";

            this.solitaire = solitaire;
            solitaire.style.width  = getCorrectSize(width);
            solitaire.style.height = getCorrectSize(height);
            solitaire.innerHTML = _.template(template)({_e: function(s){return i18n[s]||s}});

            function startGame() {
                View.initialize(document.getElementById("html5-solitaire-canvas"), options);
            }

            initSound(options, startGame);
            initDraw3(options);
            initScore(options);
            initUiEvents(options);
        }
    }
});
