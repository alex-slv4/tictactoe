// view
function CellView(model) {
    PIXI.Container.call(this);
    this.model = model;
    this.hit = new PIXI.Graphics().beginFill(0, 0).drawRect(0, 0, CellView.CELL_WIDTH, CellView.CELL_HEIGHT).endFill();

    this.crossSign = new PIXI.Sprite(PIXI.Texture.EMPTY);
    this.zeroSign = new PIXI.Sprite(PIXI.Texture.EMPTY);

    this.addChild(this.hit);
    this.addChild(this.zeroSign);
    this.addChild(this.crossSign);
    this.zeroSign.alpha = this.crossSign.alpha = 0.7;
    this.zeroSign.visible = this.crossSign.visible = false;
    this.hit.interactive = this.hit.buttonMode = true;

    this.onDown = function () {
        globals.game.hitCell(this.model, this);
    };
    this.select(false);
    this.hit.on("pointerdown", this.onDown.bind(this)) // TODO: call the off after destroy
}

CellView.CELL_WIDTH = 80;
CellView.CELL_HEIGHT = 90;
CellView.prototype = new PIXI.Container();
CellView.prototype.select = function (selected) {
    var suffix = selected ? "red" : "black";

    this.crossSign.texture = PIXI.utils.TextureCache["cross-" + suffix + ".svg"];
    this.zeroSign.texture = PIXI.utils.TextureCache["nought-" + suffix + ".svg"];

    this.crossSign.anchor.set(0.5);
    this.zeroSign.anchor.set(0.5);
    this.crossSign.position.set(CellView.CELL_WIDTH * 0.5, CellView.CELL_HEIGHT * 0.5);
    this.zeroSign.position.set(CellView.CELL_WIDTH * 0.5, CellView.CELL_HEIGHT * 0.5);
};
CellView.prototype.draw = function () {
    this.zeroSign.visible = this.crossSign.visible = false;
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
        var line = new PIXI.Sprite(PIXI.utils.TextureCache["line-black.svg"]);
        line.width = CellView.CELL_HEIGHT * rows;
        line.rotation = Math.PI / 2;
        line.alpha = 0.1;
        return line;
        //return new PIXI.Graphics().lineStyle(1.5, 0xeeeeee).moveTo(0, 0).lineTo(0, CellView.CELL_HEIGHT * rows)
    };
    var horizontalLine = function () {
        var line = new PIXI.Sprite(PIXI.utils.TextureCache["line-black.svg"]);
        line.width = CellView.CELL_WIDTH * column;
        line.alpha = 0.1;
        return line;
        // return new PIXI.Graphics().lineStyle(1.5, 0xeeeeee).moveTo(0, 0).lineTo(CellView.CELL_WIDTH * column, 0);
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
    var p1 = new PIXI.Point(from.x + CellView.CELL_WIDTH * 0.5, from.y + CellView.CELL_HEIGHT * 0.5);
    var p2 = new PIXI.Point(to.x + CellView.CELL_WIDTH * 0.5, to.y + CellView.CELL_HEIGHT * 0.5);

    var line = new PIXI.Sprite(PIXI.utils.TextureCache["line-red.svg"]);
    line.position.copy(p1);
    line.width = Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2)); // distance between points
    line.rotation = Math.atan2(p2.y - p1.y, p2.x - p1.x); // angle between points
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
            cell.select(true);
        }
    }
};