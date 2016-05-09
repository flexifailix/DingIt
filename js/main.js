var context = null;
var canvasHeight = null;
var canvasWidth = null;

var background = null;
var controller = null;
var playBall = null;

var frameRate = 120;

var controllerSpeed = 8;

var keysPressed = [];
var keyLeftPlayer1 = 37;
var keyRightPlayer1 = 39;

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
        this.posX = pX;
        this.posY = pY;
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
}
PlayBall.prototype = new Drawable();

function Controller() {

    this.init = function () {
        this.initDrawable(imageRepo.controller);
        this.setPos((canvasWidth / 2) - (this.width / 2), canvasHeight - (this.height + 5));
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
        if (keysPressed[eachIndex] === event.keyCode) {
            keysPressed.splice(eachIndex, 1);
        }
    }
}

init();
function init() {
    var canvasElement = document.getElementById('gameStage');
    context = canvasElement.getContext('2d');

    canvasHeight = parseInt(canvasElement.height);
    canvasWidth = parseInt(canvasElement.width);

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
    context.clearRect(0,0, canvasHeight, canvasWidth);

    background.draw();
    playBall.draw();
    controller.draw();

    window.setTimeout(loop, 1000 / frameRate);
}
