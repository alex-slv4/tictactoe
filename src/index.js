var globals = {app: null, game: null};
// ------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------
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
CellView.prototype.select = function () {
    // TODO: draw in red
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
    this.cells = [];
    this.linesContainer = new PIXI.Container();
    this.cellsContainer = new PIXI.Container();
    this.addChild(this.cellsContainer, this.linesContainer);
    this.draw();
}

GameView.prototype = new PIXI.Container();
GameView.prototype.drawGridLines = function () {
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
/**
 * Getting the cell view from CellModel.
 * @param cell – CellModel
 * @returns {*} – CellView
 */
GameView.prototype.getCellView = function (cell) {
    return this.cells[cell.posX][cell.posY];
};
/**
 * Draw the view.
 */
GameView.prototype.draw = function () {

    this.clear();

    var field = this.gameFacade.model.field;

    for (var i = 0; i < field.length; i++) {
        this.cells[i] = [];
        for (var j = 0; j < field[i].length; j++) {
            var cell = new CellView(field[i][j]);
            cell.draw();
            cell.position.set(i * CellView.CELL_WIDTH, j * CellView.CELL_HEIGHT);
            this.cellsContainer.addChild(cell);
            this.cells[i].push(cell);
        }
    }
    this.drawGridLines();
};
/**
 * Draw the line from cell to cell.
 * @param from – the cell
 * @param to – the cell
 */
GameView.prototype.drawCrossLine = function (from, to) {
    var halfCellX = CellView.CELL_WIDTH * 0.5;
    var halfCellY = CellView.CELL_HEIGHT * 0.5;
    var line = new PIXI.Graphics().lineStyle(10, 0xff0000).moveTo(from.x + halfCellX, from.y + halfCellY).lineTo(to.x + halfCellX, to.y + halfCellY);
    this.linesContainer.addChild(line);
};
GameView.prototype.displayWinning = function (winlines) {

    for (var i = 0; i < winlines.length; i++) {
        var winline = winlines[i];
        var firstCell = this.getCellView(winline[0]);
        var lastCell = this.getCellView(winline[winline.length - 1]);
        this.drawCrossLine(firstCell, lastCell);

        for (var j = 0; j < winline.length; j++) {
            var cell = this.getCellView(winline[j]);
            cell.select();
        }
    }
};
// ------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------
// model
function GameModel(column, rows) {
    this.rows = rows;
    this.column = column;
    this.field = [];
    this.openedCells = 0;
    this.totalCells = rows * column;
    this.state = GameModel.STATE_IN_GAME;

    for (var i = 0; i < rows; i++) {
        this.field[i] = [];
        for (var j = 0; j < column; j++) {
            this.field[i][j] = new CellModel(i, j);
        }
    }
}

GameModel.prototype.hasCells = function () {
    return this.totalCells > this.openedCells;
};
GameModel.prototype.reset = function () {
    this.openedCells = 0;
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.column; j++) {
            this.field[i][j].reset();
        }
    }
    this.state = GameModel.STATE_IN_GAME;
};
GameModel.STATE_IN_GAME = "STATE_IN_GAME";
GameModel.STATE_USER_WON = "STATE_USER_WON";
GameModel.STATE_CAT_GAME = "STATE_CAT_GAME";

function CellModel(posX, posY) {
    this.owner = CellModel.PLAYER_NONE;
    this.posX = posX;
    this.posY = posY;
    this.opened = false;

    this.toString = function () {
        return "[" + this.owner + ": " + this.posX + "," + this.posY + "]";
    };
    this.reset = function() {
        this.owner = CellModel.PLAYER_NONE;
        this.opened = false;
    }
}

CellModel.PLAYER_NONE = "";
CellModel.PLAYER_X = "X";
CellModel.PLAYER_O = "O";

// the Game Facade
// nothing here, use create() function
function Game() {}

/**
 * Creates the game
 * @param rows
 * @param column
 * @param winCount – min length of winning line
 * @returns {Game}
 */
Game.prototype.create = function(rows, column, winCount) {
    this.activePlayer = CellModel.PLAYER_X;
    this.model = new GameModel(rows, column);
    this.view = new GameView(this);
    this.winCount = isNaN(winCount) ? Math.min(rows, column) : winCount;

    return this;
};
/**
 * Get the winning line with direction. dx, dy is a delta shift. 0,1 – vertical line, 1,0 – horizontal line. -1,-1 – diogonal line etc...
 * @param centerCell – the cell from which we start checks
 * @param dx – delta x
 * @param dy – delta y
 * @returns {*[]} – the line, array of CellModels
 */
Game.prototype.getWinLine = function (centerCell, dx, dy) {
    var field = this.model.field;
    var prevCells = [];
    var nextCells = [];
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
        nextCells.push(el);
    }
    el = centerCell;
    while (el = previous(el)) {
        prevCells.push(el);
    }
    var lineLength = prevCells.length + 1 + nextCells.length;
    if (lineLength >= this.winCount) {
        // return the line array in natural order
        return prevCells.reverse().concat([centerCell]).concat(nextCells);
    }
};
/**
 * Check if cell has winnings. Set game model state depending on the case
 * @param startCell
 * @returns {boolean}
 */
Game.prototype.hasWon = function (startCell) {

    var horizontal = this.getWinLine(startCell, 1, 0); // horizontal
    var vertical = this.getWinLine(startCell, 0, 1); // vertical

    var left_down = this.getWinLine(startCell, -1, 1); // left-down diagonal
    var down_right = this.getWinLine(startCell, -1, -1); // down-right diagonal

    var winLines = [];

    if (horizontal) {
        winLines.push(horizontal);
    }
    if (vertical) {
        winLines.push(vertical);
    }
    if (left_down) {
        winLines.push(left_down);
    }
    if (down_right) {
        winLines.push(down_right);
    }
    if (winLines.length) {
        // have winlines, store them and change the game state
        this.model.winLines = winLines;
        this.model.state = GameModel.STATE_USER_WON;
        return true;
    } else {
        // check the cat game case!
        if (!this.model.hasCells()) {
            this.model.state = GameModel.STATE_CAT_GAME;
            return false;
        }
    }
};
/**
 * Open the cell and check winnings.
 * @param cellModel – model of the cell
 * @param cellView – the view of the cell (optional)
 */
Game.prototype.hitCell = function (cellModel, cellView) {
    if (this.model.state !== GameModel.STATE_IN_GAME) {
        this.restart();
        return;
    }
    if (cellModel.opened) {
        // do nothing in case if the cell already opened
        return;
    }
    this.model.openedCells++;
    // set the owner of the cell
    cellModel.owner = this.activePlayer;
    cellModel.opened = true;
    if (cellView) {
        cellView.draw();
    }

    if (this.hasWon(cellModel)) {
        this.view.displayWinning(this.model.winLines);
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
};
/**
 * Resize the game, align the views.
 * @param width
 * @param height
 */
Game.prototype.resize = function(width, height) {
    var center = new PIXI.Point((width - this.view.width) * 0.5, (height - this.view.height) * 0.5);
    this.view.position.copy(center);
};
/**
 * Recreate the game. Clears the views and models.
 */
Game.prototype.restart = function() {
    this.activePlayer = CellModel.PLAYER_X;
    this.model.reset();
    this.view.draw();
};
// Resize logic
globals.onWindowResize = function() {
    var width = this.app.view.clientWidth;
    var height = this.app.view.clientHeight;
    this.app.renderer.resize(width, height);
    this.game.resize(width, height);
};
window.addEventListener("resize", globals.onWindowResize.bind(globals));
// init PIXI app
globals.app = new PIXI.Application({backgroundColor: 0xffffff});
document.body.appendChild(globals.app.view);

// create and run the game
globals.game = new Game().create(7, 7, 3);
globals.app.stage.addChild(globals.game.view);
globals.onWindowResize();
globals.app.start();