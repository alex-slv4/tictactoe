var globals = {app: null, game: null};

globals.app = new PIXI.Application({backgroundColor: 0xffffff});
document.body.appendChild(globals.app.view);

// window resize logic
(function () {
    var app = globals.app;
    var theGame = globals.game;

    function resize() {
        app.renderer.resize(app.view.clientWidth, app.view.clientHeight);
        // if (theGame) {
        //     theGame.resize()
        // }
    }

    window.addEventListener("resize", resize.bind(this));
    resize();
})();

// model
function CellModel(owner, posX, posY) {
    this.owner = owner;
    this.posX = posX;
    this.posY = posY;
    this.opened = false;

    this.toString = function () {
        return "[" + this.owner + ": " + this.posX + "," + this.posY + "]";
    };
}

CellModel.PLAYER_NONE = "";
CellModel.PLAYER_X = "X";
CellModel.PLAYER_O = "O";

function GameModel(column, rows) {
    this.rows = rows;
    this.column = column;
    this.field = [];
    this.openedCells = 0;
    this.totalCells = rows * column;

    for (var i = 0; i < rows; i++) {
        this.field[i] = [];
        for (var j = 0; j < column; j++) {
            this.field[i][j] = new CellModel(CellModel.PLAYER_NONE, i, j);
        }
    }
}

GameModel.prototype.hasCells = function () {
    return this.totalCells > this.openedCells;
};

// view
function CellView(model) {
    PIXI.Container.call(this);
    this.model = model;
    this.hit = new PIXI.Graphics().beginFill(0, 0).drawRect(0, 0, CellView.CELL_WIDTH, CellView.CELL_HEIGHT).endFill();
    var signColor = 0x999999;
    var w = CellView.CELL_WIDTH * 0.65;
    var h = CellView.CELL_HEIGHT * 0.65;
    var px = (CellView.CELL_WIDTH - w) * 0.5;
    var py = (CellView.CELL_HEIGHT - h) * 0.5;
    this.crossSign = new PIXI.Graphics().lineStyle(3, signColor).moveTo(0, 0)
        .lineTo(w, h)
        .moveTo(w, 0)
        .lineTo(0, h);
    this.crossSign.position.set(px, py);

    const zeroR = Math.min(w, h) * 0.5;
    this.zeroSign = new PIXI.Graphics().lineStyle(3, signColor).drawCircle(zeroR, zeroR, zeroR).endFill();
    this.zeroSign.position.set(px, py);
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

CellView.CELL_WIDTH = 100; // TODO: check different size for cells
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
    this.addChild(this.cellsContainer, this.linesContainer);
    this.draw();
}

GameView.prototype = new PIXI.Container();

GameView.prototype.drawLines = function () {
    var rows = this.gameFacade.model.rows;
    var column = this.gameFacade.model.column;

    var verticalLine = function () {
        return new PIXI.Graphics().lineStyle(2, 0xeeeeee).moveTo(0, 0).lineTo(0, CellView.CELL_HEIGHT * rows)
    };
    var horizontalLine = function () {
        return new PIXI.Graphics().lineStyle(2, 0xeeeeee).moveTo(0, 0).lineTo(CellView.CELL_WIDTH * column, 0);
    };
    var i, theLine;

    for (i = 1; i < rows; i++) {
        theLine = horizontalLine();
        theLine.position.set(0, CellView.CELL_HEIGHT * i);
        this.linesContainer.addChild(theLine);
    }

    for (i = 1; i < column; i++) {
        theLine = verticalLine();
        theLine.position.set(CellView.CELL_WIDTH * i, 0);
        this.linesContainer.addChild(theLine);
    }
};
GameView.prototype.clear = function () {
    this.linesContainer.removeChildren();
    this.cellsContainer.removeChildren();
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
    this.drawLines();
};

// the Game Facade
function Game(rows, column, winCount) {
    this.activePlayer = CellModel.PLAYER_X;
    this.model = new GameModel(rows, column);
    this.view = new GameView(this);
    this.winCount = isNaN(winCount) ? Math.min(rows, column) : winCount;
}

Game.prototype.getWinLine = function (centerCell, dx, dy) {
    var field = this.model.field;
    var result = [centerCell];
    var el;

    function getOwnedCellAt(x, y) {
        if (field[x]) {
            var cell = field[x][y];
            if (cell && cell.owner === centerCell.owner) {
                return cell;
            }
        }
        return undefined;
    }

    function next(origin) {
        var sx = origin.posX + dx;
        var sy = origin.posY + dy;
        return getOwnedCellAt(sx, sy);
    }

    function previous(origin) {
        var sx = origin.posX - dx;
        var sy = origin.posY - dy;
        return getOwnedCellAt(sx, sy);
    }

    el = centerCell;
    while (el = next(el)) {
        result.push(el);
    }
    el = centerCell;
    while (el = previous(el)) {
        result.push(el);
    }
    return result;
};
Game.prototype.hasWon = function (startCell) {
    // set the owner of the cell
    startCell.owner = this.activePlayer;
    startCell.opened = true;
    this.model.openedCells++;

    var horizontal = this.getWinLine(startCell, 1, 0); // horizontal
    var vertical = this.getWinLine(startCell, 0, 1); // vertical

    var left_down = this.getWinLine(startCell, -1, 1); // left-down diagonal
    var down_right = this.getWinLine(startCell, -1, -1); // down-right diagonal

    if (horizontal.length >= this.winCount) {
        console.log("horizontal", horizontal.join(", "));
    }
    if (vertical.length >= this.winCount) {
        console.log("vertical", vertical.join(", "));
    }
    if (left_down.length >= this.winCount) {
        console.log("left_down", left_down.join(", "));
    }
    if (down_right.length >= this.winCount) {
        console.log("down_right", down_right.join(", "));
    }

    if (this.model.hasCells()) {
        // cat game case
    }
};
Game.prototype.hitCell = function (cellModel, cellView) {
    if (cellModel.opened) {
        // do nothing in case if the cell already opened
        return;
    }

    if (this.hasWon(cellModel)) {
        debugger;
    } else {
        // switch the player's turn
        switch (this.activePlayer) {
            case CellModel.PLAYER_X:
                this.activePlayer = CellModel.PLAYER_O;
                break;
            case CellModel.PLAYER_O:
                this.activePlayer = CellModel.PLAYER_X;
                break;
        }
    }

    if (cellView) {
        cellView.draw();
    }
};

// create and run the game
globals.game = new Game(7, 7, 3);
globals.app.stage.addChild(globals.game.view);
globals.app.start();