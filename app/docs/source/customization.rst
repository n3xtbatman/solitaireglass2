Customization
=============

So you want to change the game appearance, here are the selectors you should use:

* #html5-solitaire: **background**
* #html5-solitaire .toolbar: **font**, **background**
* #html5-solitaire .toolbar a: **text**

In order to override the default style you should add the game container id
to add weight

.. code-block:: css

    #my-game-container #html5-solitaire {
        background: red;
    }

    #my-game-container #html5-solitaire .toolbar {
        font-family: Arial;
        color: #333;
        background: rgba(124, 124, 124, .5);
    }

    #my-game-container #html5-solitaire .toolbar a {
        text-decoration: line-through;
    }