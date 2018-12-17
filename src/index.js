var globals = {app: null, game: null};

globals.app = new PIXI.Application();
document.body.appendChild(globals.app.view);

// window resize logic
(function (app) {
    function resize() {
        app.renderer.resize(app.view.clientWidth, app.view.clientHeight);
    }

    window.addEventListener("resize", resize.bind(this));
    resize();
})(globals.app);

// model
function CellModel(owner, posX, posY) {
    this.owner = owner;
    this.posX = posX;
    this.posY = posY;
    this.toString = function () {
        return "[CellModel" + this.owner + "]";
    }
}

CellModel.PLAYER_NONE = "";
CellModel.PLAYER_X = "X";
CellModel.PLAYER_O = "O";

function GameModel(rows, column) {
    this.rows = rows;
    this.column = column;
    this.field = [];
    for (var i = 0; i < rows; i++) {
        this.field[i] = [];
        for (var j = 0; j < column; j++) {
            this.field[i][j] = new CellModel(CellModel.PLAYER_NONE, i, j);
        }
    }
}

// view
function CellView(model) {
    PIXI.Container.call(this);
    this.model = model;
    this.hit = new PIXI.Graphics().beginFill().drawRect(0, 0, CellView.CELL_WIDTH, CellView.CELL_HEIGHT).endFill();

    var w = CellView.CELL_WIDTH * 0.65;
    var h = CellView.CELL_HEIGHT * 0.65;
    this.crossSign = new PIXI.Graphics().lineStyle(3, 0xffffff).moveTo(0, 0)
        .lineTo(w, h)
        .moveTo(w, 0)
        .lineTo(0, h);
    const zeroR = Math.min(w, h) * 0.5;
    this.zeroSign = new PIXI.Graphics().lineStyle(3, 0xffffff).drawCircle(zeroR, zeroR, zeroR).endFill();
    this.addChild(this.hit);
    this.addChild(this.zeroSign);
    this.addChild(this.crossSign);
    this.zeroSign.visible = this.crossSign.visible = false;
    this.hit.interactive = this.hit.buttonMode = true;

    this.onDown = function () {
        globals.game.hitCell(this.model, this);
    };
    this.hit.on("pointerdown", this.onDown.bind(this)) // TODO: call the off after destroy
}

CellView.CELL_WIDTH = 100;
CellView.CELL_HEIGHT = 100;
CellView.prototype = new PIXI.Container();
CellView.prototype.clear = function () {
    // this.zeroSign.visible = this.crossSign.visible = false;
};
CellView.prototype.draw = function () {
    this.clear();
    if (this.model.owner === CellModel.PLAYER_O) {
        this.zeroSign.visible = true;
    } else if (this.model.owner === CellModel.PLAYER_X) {
        this.crossSign.visible = true;
    }
};

function GameView(gameFacade) {
    PIXI.Container.call(this);
    this.gameFacade = gameFacade;

    this.linesContainer = new PIXI.Container();
    this.cellsContainer = new PIXI.Container();
    this.addChild(this.linesContainer, this.cellsContainer);
}

GameView.prototype = new PIXI.Container();
GameView.prototype.drawLines = function () {
    // this.gameFacade.model.rows
};
GameView.prototype.draw = function () {
    var field = this.gameFacade.model.field;

    for (var i = 0; i < field.length; i++) {
        for (var j = 0; j < field[i].length; j++) {
            var cell = new CellView(field[i][j]);
            cell.draw();
            cell.position.set(i * CellView.CELL_WIDTH, j * CellView.CELL_HEIGHT);
            this.cellsContainer.addChild(cell);
        }
    }
};

// the Game Facade
function Game(rows, column, winCount) {
    this.activePlayer = CellModel.PLAYER_X;
    this.model = new GameModel(rows, column);
    this.view = new GameView(this);
    this.winCount = isNaN(winCount) ? Math.min(rows, column) : winCount;
}

Game.prototype.hitCell = function (cellModel, cellView) {
    if (cellModel.owner !== CellModel.PLAYER_NONE) {
        // do nothing in case if the cell already owned
        return;
    }
    // set the owner of the cell
    cellModel.owner = this.activePlayer;
    // TODO: run the magic
    // switch the player's turn
    switch (this.activePlayer) {
        case CellModel.PLAYER_X:
            this.activePlayer = CellModel.PLAYER_O;
            break;
        case CellModel.PLAYER_O:
            this.activePlayer = CellModel.PLAYER_X;
            break;
    }

    if (cellView) {
        cellView.draw();
    }
};

globals.app.start();

globals.game = new Game(5, 5, 3);
globals.app.stage.addChild(globals.game.view);
globals.game.view.draw();