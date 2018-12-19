var globals = {app: null, game: null};

/**
 * GameModel. Contains rows, column and the game state information.
 * @param column
 * @param rows
 * @constructor
 */
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

/**
 * Do we have cells yet.
 * @returns {boolean}
 */
GameModel.prototype.hasCells = function () {
    return this.totalCells > this.openedCells;
};
/**
 * Clear the field. Reset state.
 */
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
}

CellModel.prototype.reset = function() {
    this.owner = CellModel.PLAYER_NONE;
    this.opened = false;
};
CellModel.prototype.toString = function() {
    return "[" + this.owner + ": " + this.posX + "," + this.posY + "]";
};

CellModel.PLAYER_NONE = "";
CellModel.PLAYER_X = "X";
CellModel.PLAYER_O = "O";

/**
 * GameFacade
 * @constructor
 */
function Game() {}

/**
 * Creates the game
 * @param rows
 * @param column
 * @param winCount – min length of winning line
 * @returns {Game}
 */
Game.prototype.create = function (rows, column, winCount) {
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
    // FIXME: remove nested functions?
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
        // return the line array in it natural order
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
        }
    }
    return false;
};
/**
 * Open the cell and check winnings.
 * @param cellModel – model of the cell
 * @param cellView – the view of the cell (optional)
 */
Game.prototype.hitCell = function (cellModel, cellView) {
    if (this.model.state !== GameModel.STATE_IN_GAME) {
        this.reset();
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
        cellView.update();
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
Game.prototype.resize = function (width, height) {
    var center = new PIXI.Point((width - this.view.width) * 0.5, (height - this.view.height) * 0.5);
    this.view.position.copy(center);
};
/**
 * Recreate the game. Clears the views and models.
 */
Game.prototype.reset = function () {
    this.activePlayer = CellModel.PLAYER_X;
    this.model.reset();
    this.view.redrawField();
};
// Resize logic
globals.onWindowResize = function () {
    var width = this.app.view.clientWidth;
    var height = this.app.view.clientHeight;
    this.app.renderer.resize(width, height);
    this.game.resize(width, height);
};
// init PIXI app
globals.app = new PIXI.Application({backgroundColor: 0xffffff});
document.body.appendChild(globals.app.view);

(function (assets) {
    // preload assets and start the game after that
    for (var i = 0; i < assets.length; i++) {
        PIXI.loader.add(assets[i], "img/" + assets[i]);
    }
    PIXI.loader.load(function () {
        startTheGame();
    });
})([
    "cross-black.svg",
    "cross-red.svg",
    "nought-black.svg",
    "nought-red.svg",
    "line-black.svg",
    "line-red.svg"
]);

function startTheGame() {
    // create and run the game
    globals.game = new Game().create(6, 6, 4); // field size and min wincount TODO: get the game preferences from urlParams
    globals.app.stage.addChild(globals.game.view);
    window.addEventListener("resize", globals.onWindowResize.bind(globals));
    globals.onWindowResize();
}