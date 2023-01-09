Configuration
=============

Below is an example with all available options and their defaults values:

.. code-block:: js

    Solitaire({
        // Deduct N points every t seconds
        every: 10, // seconds
        deduct: 2, // points

        allowedDraws: 3, // times you can pass through the deck of cards
        draw3: true, // Draw three cards at once
        points: {
            // see below
        }
    });

You can specify the width and height in the <solitaire> tag

.. code-block:: html 

    <solitaire width="500" height="700"></solitaire>

Setting the game score
----------------------

By default the points are given as follow (see :doc:`terminology`).

    * move card to foundation: 10
    * turn a card: 5
    * move a card from waste to tableau: 5
    * move a card from foundation to tableau: -15
    * every 10 seconds 2 point are discounted

You can change this behavior through the `points` option:

.. code-block:: js

    Solitaire({
        // ... More options
        points: {
            move_to_foundation: 10,
            waste_to_tableau: 5,
            foundation_to_tableau: -15,
            turn_card: 5
        }
    }); 