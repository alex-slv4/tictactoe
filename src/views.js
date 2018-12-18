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