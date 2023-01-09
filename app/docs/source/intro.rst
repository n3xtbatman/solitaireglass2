Getting started
===============

To insert the game in your page you should follow these simple steps:

1. Load the stylesheet in the document <head>
2. Include the <solitaire> tag in your document
3. Load the game script before the </body>

.. code-block:: html
    
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <!-- 1) Load the stylesheet -->
            <link rel="stylesheet" type="text/css" href="style/style.css">
        </head>
        <body>

        <!-- ...more content here -->

        <!-- 2) the <solitaire> tag -->
        <solitaire width="500" height="700"></solitaire>

        <!-- 3) Load the game script -->
        <script src="build/require.min.js" data-main="build/app"></script>
        </body>
    </html>

You can see the available options :doc:`here </configuration>`.
