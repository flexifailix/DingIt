var context = null;
var canvasElement = null;

var background = null;
var controller1 = null;
var controller2 = null;
var playBall = null;

var pointsToWin = 6;
var isGameRunning = false;
var isGameOver = false;

var canvasWidth = 960;
var canvasHeight = 640;
var cssWidth = '480px';
var cssHeight = '320px';

var frameRate = 60;
var frameTime = frameRate / 1000;

var controllerSpeed = 16;
var controllerGamestageSpace = 10;

var ballMinSpeedX = 0;
var ballMaxSpeedX = 18;
var ballMinSpeedY = 4;
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
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    // fallback to setTimeout (used later on server!)
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = Date.now(), timeToCall = Math.max(0, frameTime - ( currTime - lastTime ));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }

}() );

// -------------------------------------------------------------------------------


var imageRepo = new function () {
    this.background = new Image();
    this.playBall = new Image();
    this.controller = new Image();

    var imagesLoaded = 0;
    var imagesCount = 3;

    function imageLoad() {
        imagesLoaded++;
        if (imagesLoaded === imagesCount) {
            init();
        }
    }

    this.background.onload = imageLoad;
    this.playBall.onload = imageLoad;
    this.controller.onload = imageLoad();

    this.background.src = "img/background.png";
    this.playBall.src = "img/playBall.png";
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

        this.minX = this.posX;
        this.maxX = this.posX + this.width;
        this.middleX = this.posX + (this.width / 2);
        this.minY = this.posY;
        this.maxY = this.posY + this.height;
        this.middleY = this.posY + (this.height / 2);
    };

    this.setSpeed = function (pSpeedX, pSpeedY) {
        if (pSpeedX != null) {
            this.speedX = pSpeedX;
        }

        if (pSpeedY != null) {
            this.speedY = pSpeedY;
        }
    };

    this.calculateMovement = function () {
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
        this.setPos(0, 0);
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
    }

    this.setSpeed = function (pSpeedX, pSpeedY) {
        if (pSpeedX != null) {
            if (pSpeedX > ballMaxSpeedX) {
                this.speedX = ballMaxSpeedX;
            } else if (pSpeedX < ballMaxSpeedX * -1) {
                this.speedX = ballMaxSpeedX * -1;
            } else {
                this.speedX = pSpeedX;
            }
        }

        if (pSpeedY != null) {
            this.speedY = pSpeedY;
        }
    };

    this.calculateMovement = function () {
        var newPosX = this.posX + this.speedX;
        var newPosY = this.posY + this.speedY;

        this.setPos(newPosX, newPosY);

        this.checkControllerCollision(newPosX, newPosY, controller1);
        this.checkControllerCollision(newPosX, newPosY, controller2);
        this.checkBorderCollision(newPosX, newPosY);
    }

    this.checkControllerCollision = function (pX, pY, pController) {
        if (this.middleX >= pController.minX && this.middleX <= pController.maxX
            && ((this.minY >= pController.minY && this.minY <= pController.maxY)
            || (this.maxY >= pController.minY && this.maxY <= pController.maxY))) {

            if (this.speedY > 0) {
                this.setPos(null, pController.minY - this.height);
            } else {
                this.setPos(null, pController.maxY);
            }


            this.setSpeed(null, this.speedY * -1);

            var multiplier = 1;
            if (this.middleX < pController.middleX) {
                multiplier = -1;
            }
            var maxDifference = pController.middleX - pController.minX;
            var difference = (this.middleX - pController.middleX) * multiplier;
            var acceleration = (difference / maxDifference + 1);


            this.setSpeed(this.speedX + (pController.speedX / 2 * acceleration), null);
        }
    }

    this.checkBorderCollision = function (pX, pY) {
        if (pX <= 0) {
            this.setPos(this.width, null);
            this.setSpeed(this.speedX * -1, null);
        }
        if (pX >= canvasWidth - this.width) {
            this.setPos(canvasWidth - this.width, null);
            this.setSpeed(this.speedX * -1, null);
        }

        if (pY <= 0){
            controller1.points++;
            roundOver();
        }

        if (pY > canvasHeight - this.height) {
            controller2.points++;
            roundOver();
        }

        if (controller1.points === pointsToWin || controller2.points === pointsToWin) {
            isGameOver = true;
        }
    }
}
PlayBall.prototype = new Drawable();

function Controller() {
    this.points = 0;

    var reactedTime = 0;
    var reactionTimeMin = 1;
    var reactionTimeMax = 10;
    var reactionTime = getRandomNumber(reactionTimeMin, reactionTimeMax);


    this.init = function (pIsPlayer, pName) {
        this.initDrawable(imageRepo.controller);
        this.isPlayer = pIsPlayer;
        this.name = pName;
    };

    this.setStartPos = function (pPosY) {
        this.setPos(canvasWidth / 2 - (this.width / 2), pPosY);
    };

    this.calculateMovement = function () {
        if (this.isPlayer) {
            this.checkKeystrokes();
        } else {
            this.calculateAIMovement();
        }

        var newPosX = this.posX + this.speedX;
        if (newPosX <= 0) {
            newPosX = 0;
        } else if (newPosX + this.width >= canvasWidth) {
            newPosX = canvasWidth - this.width;
        }

        this.setPos(newPosX, this.posY);
    };

    this.calculateAIMovement = function () {
        var changeSpeed;

        changeSpeed = getDifference(playBall.middleX, this.middleX);
        if (changeSpeed > controllerSpeed) {
            changeSpeed = controllerSpeed;
        }

        if (playBall.middleX < this.middleX ) {
            changeSpeed = -1 * changeSpeed;
        }

        if ((this.speedX > 0 && changeSpeed < 0) || (this.speedX < 0 && changeSpeed > 0)) {
            reactedTime++;
            if (reactedTime > reactionTime) {
                this.speedX = changeSpeed;
                reactionTime = getRandomNumber(reactionTimeMin, reactionTimeMax);
                reactedTime = 0;
            }
        } else {
            this.speedX = changeSpeed;
        }
    }

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
        startRound();
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

function startRound() {
    playBall.initSpeed();
    isGameRunning = true;

    if (isGameOver) {
        isGameOver = false;
        controller1.points = 0;
        controller2.points = 0;
    }
}

function roundOver() {
    isGameRunning = false;
    playBall.init();
}

function gameOver() {
    var winningPlayer;
    if (controller1.points === pointsToWin) {
        winningPlayer = controller1.name;
    }

    if (controller2.points === pointsToWin) {
        winningPlayer = controller2.name;
    }

    context.fillStyle = "black";
    context.font = "bold 30px Arial";
    context.textAlign = "center";
    var winningText = winningPlayer + " won the Game!";
    context.fillText(winningText, canvasWidth / 2, canvasHeight / 2 - 20);
}

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

    controller1 = new Controller();
    controller1.init(true, "Jens");
    controller1.setStartPos(canvasHeight - (controller1.height + controllerGamestageSpace));

    controller2 = new Controller();
    controller2.init(false, "AI");
    controller2.setStartPos(controllerGamestageSpace);

    document.addEventListener("keydown", keyDownListener, false);
    document.addEventListener("keyup", keyUpListener, false);

    loop();
}

function loop() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    background.draw();

    context.textAlign = "left";
    context.fillStyle = "black";
    context.font = "bold 18px Arial";

    context.fillText(controller2.name + ": " + controller2.points, 10, canvasHeight / 2 - 10);
    context.fillStyle = "black";
    context.font = "bold 18px Arial";

    context.fillText(controller1.name + ": " + controller1.points, 10, canvasHeight / 2 + 10);
    controller1.draw();
    controller2.draw();

    playBall.draw();

    if (isGameOver) {
        gameOver();
    }

    // use browser API for animations rather that setTimeout()
    window.requestAnimationFrame(loop, this.canvasElement);
}

function getDifference(pA, pB) {
    var result;
    if (pA > pB) {
        result = pA - pB;
    } else {
        result = pB - pA;
    }
    return result;
}
