Translating the game
====================

Translate the game is incredibly easy.
Just edit the file `build/nls/solitaire.js` and add your locale (say es):

.. code-block:: js
    
    define([],{
        root: {
            ...
        },

        es: true
    });

Now make a copy of the folder `build/nls/template` with your locale name,
in this case `build/nls/es` and you can start translating the file
`build/nls/es/solitaire.js`:

.. code-block:: js

    define({
        stats: "Statistics",
        wins: "Games won",
        total: "Games played",
        bestTime: "Shortest time",
        worstTime: "Longest time",
        bestScore: "High score",
        worstScore: "Lowest score",
        winPercentage: "Win percentage",
        newGame: "New Game",
        sound: "Sound",
        draw3: "Draw 3",
        pointsTemplate: "%d points",
        resetStats: "Reset stats",
        modalCloseButton: "Ok, I get It."
    });


That's all, now you have the game in your language.
thanks to `requirejs i18n plugin <http://requirejs.org/docs/api.html#i18n>`_ the translation will automatically load
whenever a user with the same locale plays the game.