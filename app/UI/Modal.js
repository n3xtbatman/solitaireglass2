define(
[
    'common/Utils',
    'common/EventBus',
    'underscore',
    'i18n!nls/solitaire',
    'text!./modal-template.html'
],
function($, channel, _, i18n, template) {
    'use strict';

    var $modal,
        $msg,
        $close,
        $overlay,
        templateCache = {};

    var initialize = _.once(function () {
        $modal   = $.$('html5-solitaire-dialog');
        $msg     = $.$('html5-solitaire-dialog-message');
        $close   = $.$('html5-solitaire-dialog-close');
        $overlay = $.$('html5-solitaire-overlay');

        $.on($modal, "click", function(event) {
            event.preventDefault();
            if (event.target.hasAttribute("data-close-button"))
                closeModal();
            else if (event.target.hasAttribute('data-reset-stats'))
                channel.emit('reset-stats');
            return false;
        });
    });

    function showModal(id, data) {
        initialize();

        var style = $modal.style,
            elem  = $.$('html5-solitaire-template-'+id),
            tmpl  = templateCache[id] || _.template(template) || _.template(elem.innerHTML);

        data._e = function(key) { return i18n[key] || key; }

        templateCache[id] = tmpl;
        
        $msg.innerHTML = tmpl(data);
        $.addClass(document.body, "html5-solitaire-show-modal");
    }

    function closeModal(e) {
        $.removeClass(document.body, "html5-solitaire-show-modal");
    }

    return {
        open: showModal,
        close: closeModal
    };
});