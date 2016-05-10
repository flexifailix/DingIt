var context = null;
var canvasHeight = null;
var canvasWidth = null;

var background = null;
var controller = null;
var playBall = null;

var canvasWidth = 800;
var canvasHeight = 500;

var frameRate = 120;

var controllerSpeed = 8;
var controllerGamestageSpace = 10;

var ballMaxSpeedX = 5;
var ballMaxSpeedY = 5;

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
        this.setSpeed(Math.floor(Math.random()* ballMaxSpeedX), Math.floor(Math.random()* ballMaxSpeedY));
    }

    this.calculateMovement = function () {
        var newPosX = this.posX + this.speedX;
        var newPosY = this.posY + this.speedY;

        this.checkControllerCollision(newPosX, newPosY, controller);
        this.checkBorderCollision(newPosX, newPosY);
    }

    this.checkControllerCollision = function(pX, pY, pController) {
        if (pX >= pController.posX && pX <= pController.posX + pController.width
                && pY + this.height >= pController.posY) {

            this.setSpeed(null, this.speedY * -1);
            this.setPos(null, pController.posY - this.height);
        }
    }

    this.checkBorderCollision = function (pX, pY) {
        if (pX <= 0) {
            this.setPos(this.width, null);
            this.setSpeed(this.speedX * -1, null);
        } if (pX >= canvasWidth - this.width) {
            this.setPos(canvasWidth - this.width, null);
            this.setSpeed(this.speedX * -1,null);
        } else {
            this.setPos(pX, null);
        }

        if (pY <= 0) {
            this.setPos(null, this.height);
            this.setSpeed(null, this.speedY * -1);
        } else if (pY >= canvasHeight - this.height) {
            this.setPos(null, canvasHeight - this.height);
            this.setSpeed(null ,this.speedY * -1);
        } else {
            this.setPos(null, pY);
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
        if (keysPressed[eachIndex] === event.keyCode) {
            keysPressed.splice(eachIndex, 1);
        }
    }
}

init();
function init() {
    var canvasElement = document.getElementById('gameStage');
    canvasElement.width = canvasWidth;
    canvasElement.height = canvasHeight;
    canvasElement.style.width =  canvasWidth + 'px';
    canvasElement.style.height = canvasHeight + 'px';

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
    playBall.draw();
    controller.draw();

    window.setTimeout(loop, 1000 / frameRate);
}
