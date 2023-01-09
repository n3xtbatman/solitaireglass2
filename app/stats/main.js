define(
[
    'common/Storage',
    'common/EventBus',
    'view/board',
    'UI/Modal',
    'common/Utils',
    'underscore'
],

function(Storage, channel, board, Modal, $, _){

    var defaults = {
        total: 0,
        wins: 0,
        bestTime: "N/A",
        worstTime: "N/A",
        bestScore: "N/A",
        worstScore: "N/A"
    },

    stats = {},

    incrementTotal = _.bind(increment, null, 'total'),
    incrementWins  = _.bind(increment, null, 'wins');

    channel.on('game.initialized', readStatsFromLocalStorage);
    channel.on('game.finish', incrementWins);
    channel.on('game.finish', saveTime);
    channel.on('game.first.move', incrementTotal);
    channel.on('reset-stats', resetStats);

    channel.on('show-stats', showStats);

    function showStats(){
        var data = _.clone(stats);
        data.winPercentage = (Math.round(stats.wins / stats.total * 100) || 0) + "%";
        data.bestTime = $.format(stats.bestTime);
        data.worstTime = $.format(stats.worstTime);
        Modal.open('stats', {stats: data});
    }

    function resetStats() {
        _.each(defaults, function(value, key){
            Storage.save(key, null);
            stats[key] = defaults[key];
        });
        showStats();
    }

    function readStatsFromLocalStorage() {
        _.each(defaults, function(value, key){
            var savedValue = Storage.get(key);
            stats[key] = savedValue !== null ? savedValue : defaults[key];
        });
    }

    function increment(key) {
        Storage.increment(key);
        stats[key] = stats[key] + 1;
    }

    function saveTime(score) {
        var bestTime = Storage.get('bestTime') || Infinity,
            worstTime = Storage.get('worstTime') || -Infinity,
            bestScore = Storage.get('bestScore') || -Infinity,
            worstScore = Storage.get("worstScore") || Infinity;

        if (score.time < bestTime) {
            Storage.save('bestTime', score.time);
            stats.bestTime = score.time;
        }

        if (score.time > worstTime) {
            Storage.save('worstTime', score.time);
            stats.worstTime = score.time;
        }

        if (score.score > bestScore) {
            Storage.save('bestScore', score.score);
            stats.bestScore = score.score;
        }

        if (score.score < worstScore) {
            Storage.save('worstScore', score.score);
            stats.worstScore = score.score;
        }
    }


});