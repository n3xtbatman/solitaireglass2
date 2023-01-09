define(
[
    'common/EventBus',
    'view/board',
    'underscore',
    'UI/Score',
    'Solitaire/utils',
    'common/Utils'
],
function(channel, board, _, score, $, $$){
    function CommandManager(maxUndo) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndo = maxUndo || 20;
    }

    CommandManager.prototype = {
        reset: function() {
            this.undoStack.length = 0;
            this.redoStack.length = 0;
        },

        exec: function(cmd) {
            if (this.undoStack.length >= this.maxUndo) {
                this.undoStack.shift();
            }
            this.undoStack.push(cmd);
            this.redoStack.splice(0, this.redoStack.length);
        },

        undo: function() {
            if (!this.undoStack.length || board.inAnimation) { return; }

            var cmd = this.undoStack.pop();
            cmd.undo();
            return this.redoStack.unshift(cmd);
        },

        redo: function() {}
    };

    function MoveCommand(actions) {
        this.lastCard = actions.from.original.last();
        this.to       = actions.from.original;
        this.from     = actions.to;
        this.actions  = actions;
        this.cardsToMove = actions.from.size();

        if (this.lastCard && this.to.type !== "waste")
            this.isLastCardDown = !this.lastCard.faceup;
    }

    MoveCommand.prototype = {
        undo: function() {
            if (this.isLastCardDown) {
                this.lastCard.faceup = false;
                channel.emit("__undo.score");
            }

            var selection = this.from.getSelection(this.cardsToMove);
            channel.emit("__undo.score");

            channel.emit('__undo.move', {
                to: this.to,
                from: selection,
                turnLastCard: this.isLastCardDown
            });
        }
    }

    function StockCommand(Solitaire) {
        this.stock = Solitaire.getPile('stock');
        this.waste = Solitaire.getPile('waste');
    }

    StockCommand.prototype = {
        undo: function() {
            var stock = _.select(board.piles, {type: "stock"}).pop();
            var waste = _.select(board.piles, {type: "waste"}).pop();

            if (!this.stock.length && this.waste.length) {
                channel.emit("__restore.draw");
            }

            stock.cards = $.clone(this.stock);
            waste.cards = $.clone(this.waste);
            channel.emit('__undo.stock', {
                stock: this.stock,
                waste: this.waste
            });
            board.drawAll();
        }
    }

$$.on(document, "keydown", function(event){
    if (event.keyCode === 90 && event.ctrlKey)
        command.undo();
});

var command = new CommandManager(Infinity);

channel.on('restart', function(){
    command.reset()
});

channel.on("__do.undo", function(){
    command.undo();
})

channel.on('__game.finish', function(){
    command.reset();
})
    return {
        manager: command,
        command: MoveCommand,
        stockAction: StockCommand
    };
});