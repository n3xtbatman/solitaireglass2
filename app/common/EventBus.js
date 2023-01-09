define(
[
    'postal',
    'underscore'
],
function(postal, _) {
    'use strict';
    var channel = postal.channel();
    channel.on = _.bind(channel.subscribe, channel);
    channel.emit = _.bind(channel.publish, channel);
    return channel
});
