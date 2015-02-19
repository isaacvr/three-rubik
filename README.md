# three-rubik
Rubik's cube like puzzle simulator based on Three.js

##Rubik's movement notation
For this text, I'm using what I think is the most extended notation. There are 6 letters (there are
more, but I'm not using them) to identify each of the 6 faces every cuboid has. They are:
* **F**ront
* **B**ack
* **U**p
* **D**own
* **R**ight
* **L**eft

In this simulator, F face is white, B is yellow, R is red, L is orange, U is blue and D is green. Doing a
F move means moving the white face clockwise (while looking at it) and so on, which means that F and B
are done in opposite directions.

In case we want to turn a face counter-clockwise, then we add a ' after the letter (F' means turning the
white face counter-clockwise). If we want to turn twice the same face (180º turn) we use a 2 after the letter
(F2 and F'2 are the same move, we use the former).

When we have more than 2 layers, we need something else to identify the inner layers. In a classic
3x3 cube, the layer between L and R is called **M**iddle, in a 4x4 we can use small letters to identify
inner layers (f would be the inner layer between F and B which is closer to F and b would be the other one).
To avoid this problem I decided to use a notation which states first the depth, then the move and finally the
direction.

Having a 3x3 cube, 1L would be L, 2L would be the middle layer and 3L would be R' (L and R are opposite so
clockwise turns into counter-clockwise).

##Movement syntax
For better geometric understanding and uniqueness, I'm not using traditional notation within the code but
movement syntax is based on it. I have 3 variables to control movement, _movingType_, _layer_ and _inverted_.

_movingType_ can be _x_, _y_ or _z_, depending on the normal of the face. This way, 
moving red or orange faces would be _x_ moves (which are respectively R and L moves),
white and yellow are _z_ move (F and B), blue and green are _y_ (U and D).

Positive axis directions are through F, R and U faces, so doing a R (or L') move is the same
as rotating -90 degrees the face and doing L (R') means turning 90 degrees the face. This
is indicated by _inverted_ variable. U, D', F' and B are also not "inverted" moves (they turn
the corresponding face 90 degrees according to its normal).

_layer_ controls which layer are we turning, is zero based and layer 0 are L, D and B, respectively.

Transformation table for 3x3x3 cube:

|Move|_movingType_|_layer_|_inverted_|
|----|:----------:|:-----:|----------|
|F   |      z     |   2   |yes       |
|F'  |      z     |   2   |no        |
|B   |      z     |   0   |no        |
|B'  |      z     |   0   |yes       |
|U   |      y     |   2   |no        |
|U'  |      y     |   2   |yes       |
|D   |      y     |   0   |yes       |
|D'  |      y     |   0   |no        |
|R   |      x     |   2   |yes       |
|R'  |      x     |   2   |no        |
|L   |      x     |   0   |no        |
|L'  |      x     |   0   |yes       |