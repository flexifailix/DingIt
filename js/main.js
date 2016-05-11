var context = null;
var canvasElement = null;

var background = null;
var controller = null;
var playBall = null;

var isGameRunning = false;

var canvasWidth = 960;
var canvasHeight = 640;
var cssWidth = '480px';
var cssHeight = '320px';

var frameRate = 60;
var frameTime = frameRate/1000; 

var controllerSpeed = 8;
var controllerGamestageSpace = 10;

var ballMinSpeedX = 0;
var ballMaxSpeedX = 5;
var ballMinSpeedY = 2;
var ballMaxSpeedY = 5;

var keysPressed = [];
var keyLeftPlayer1 = 37;
var keyRightPlayer1 = 39;
var keySpace = 32;

// -------------------------------------------------------------------------------
// use requestAnimationFrame for main update loop 

( function () {
	
    var lastTime = 0;
 
	// get browser specific 'requestAnimationFrame' implementation
	var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
    for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++ x ) {
        window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }

	// fallback to setTimeout (used later on server!)
    if ( !window.requestAnimationFrame ) {
        window.requestAnimationFrame = function ( callback, element ) {
            var currTime = Date.now(), timeToCall = Math.max( 0, frameTime - ( currTime - lastTime ) );
            var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if ( !window.cancelAnimationFrame ) {
        window.cancelAnimationFrame = function ( id ) { clearTimeout( id ); };
    }

}() );

// -------------------------------------------------------------------------------

var imageRepo = new function() {
    this.background = new Image();
    this.background.src = "img/background.png";

    this.playBall = new Image();
    this.playBall.src = "img/playBall.png";

    this.controller = new Image();
    this.controller.src = "img/controller.png";
};

function Drawable() {
    this.initDrawable = function (pImage) {
        this.image = pImage;
        this.height = pImage.height;
        this.width = pImage.width;

        this.speedX = 0;
        this.speedY = 0;
    };

    this.setPos = function (pX, pY) {
        if (pX != null) {
            this.posX = pX;
        }

        if (pY != null) {
            this.posY = pY;
        }
    };

    this.setSpeed = function (pSpeedX, pSpeedY) {
        if (pSpeedX != null) {
            this.speedX = pSpeedX;
        }

        if (pSpeedY != null) {
            this.speedY = pSpeedY;
        }
    };

    this.calculateMovement = function() {
        this.setPos(this.posX + this.speedX, this.posY + this.speedY);
    };

    this.draw = function () {
        this.calculateMovement();
        context.drawImage(this.image, this.posX, this.posY);
    };
}

function Background() {
    this.init = function () {
        this.initDrawable(imageRepo.background);
        this.setPos(0,0);
    }
}
Background.prototype = new Drawable();

function PlayBall() {
    this.init = function () {
        this.initDrawable(imageRepo.playBall);
        this.setPos((canvasWidth / 2) - (this.width / 2), (canvasHeight / 2) - (this.height / 2));
    }

    this.initSpeed = function () {
        this.setSpeed(getRandomNumber(ballMinSpeedX, ballMaxSpeedX), getRandomNumber(ballMinSpeedY, ballMaxSpeedY));
        console.log(this.speedX + ' - ' + this.speedY);
    }

    this.calculateMovement = function () {
        var newPosX = this.posX + this.speedX;
        var newPosY = this.posY + this.speedY

        this.setPos(newPosX, newPosY);

        this.checkControllerCollision(newPosX, newPosY, controller);
        this.checkBorderCollision(newPosX, newPosY);
    }

    this.checkControllerCollision = function(pX, pY, pController) {
        var ballMiddle = pX + (this.width / 2);
        if (ballMiddle >= pController.posX && ballMiddle <= pController.posX + pController.width
                && pY + this.height > pController.posY && pY < pController.posY) {
            this.setSpeed(null, this.speedY * -1);
            this.setPos(null, pController.posY - this.height);

            var controllerMiddle = (pController.posX + (pController.width / 2));
            var multiplier = 1;
            if (ballMiddle < controllerMiddle) {
                multiplier = -1;
            }
            var maxDifference = controllerMiddle - pController.posX;
            var difference = (ballMiddle - (pController.posX + (pController.width / 2))) * multiplier;
            var acceleration = (difference / maxDifference + 1);
            var additionalSpeed = acceleration *  multiplier;
            this.setSpeed(this.speedX + additionalSpeed, null);
        }
    }

    this.checkBorderCollision = function (pX, pY) {
        if (pX <= 0) {
            this.setPos(this.width, null);
            this.setSpeed(this.speedX * -1, null);
        } if (pX >= canvasWidth - this.width) {
            this.setPos(canvasWidth - this.width, null);
            this.setSpeed(this.speedX * -1,null);
        }

        if (pY <= 0) {
            this.setPos(null, this.height);
            this.setSpeed(null, this.speedY * -1);
        } else if (pY > canvasHeight - this.height) {
            gameOver();
        }
    }
}
PlayBall.prototype = new Drawable();

function Controller() {
    this.init = function () {
        this.initDrawable(imageRepo.controller);
        this.setPos((canvasWidth / 2) - (this.width / 2), canvasHeight - (this.height + controllerGamestageSpace));
    };

    this.calculateMovement = function () {
        this.checkKeystrokes();
        var newPosX = this.posX + this.speedX;

        if (newPosX <= 0) {
            newPosX = 0;
        } else if (newPosX + this.width >= canvasWidth) {
            newPosX = canvasWidth - this.width;
        }

        this.setPos(newPosX, this.posY);
    };

    this.checkKeystrokes = function () {
        this.speedX = 0;
        for (var eachIndex in keysPressed) {
            if (keysPressed[eachIndex] === keyLeftPlayer1) {
                this.speedX = -1 * controllerSpeed;
            } else if (keysPressed[eachIndex] === keyRightPlayer1) {
                this.speedX = controllerSpeed;
            }
        }
    };
}
Controller.prototype = new Drawable();

function keyDownListener(event) {
    var keyFound = false;
    for (var eachIndex in keysPressed) {
        if (keysPressed[eachIndex] === event.keyCode) {
            keyFound = true;
            break;
        }
    }

    if (!keyFound) {
        keysPressed.push(event.keyCode);
    }
}

function keyUpListener(event) {
    for (var eachIndex in keysPressed) {
        if (event.keyCode === keysPressed[eachIndex]) {
            keysPressed.splice(eachIndex, 1);
        }
    }

    if (event.keyCode === keySpace && !isGameRunning) {
        runGame();
    }
}

function getRandomNumber(pMin, pMax) {
    var random;

    random = Math.floor(Math.random() * (pMax - pMin)) + pMin;

    if (Math.round(Math.random()) === 1) {
        random = random * -1;
    }

    return random;
}

function runGame() {
    playBall.initSpeed();
    isGameRunning = true;
}

function gameOver() {
    isGameRunning = false;
    playBall.init();
}

init();
function init() {
    canvasElement = document.getElementById('gameStage');
    canvasElement.width = canvasWidth;
    canvasElement.height = canvasHeight;
    canvasElement.style.width = cssWidth;
    canvasElement.style.height = cssHeight;

    context = canvasElement.getContext('2d');

    background = new Background();
    background.init();

    playBall = new PlayBall();
    playBall.init();

    controller = new Controller();
    controller.init();

    document.addEventListener("keydown", keyDownListener, false);
    document.addEventListener("keyup", keyUpListener, false);

    loop();
}

function loop() {
	context.clearRect(0,0, canvasWidth, canvasHeight);

    background.draw();
    controller.draw();
    playBall.draw();
	
	// use browser API for animations rather that setTimeout()
	window.requestAnimationFrame( loop, this.canvasElement );
}
