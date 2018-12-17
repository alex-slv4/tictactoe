var globals = {app: null, game: null};

globals.app = new PIXI.Application();
document.body.appendChild(globals.app.view);

// window resize logic
(function(app){
    function resize(){
        app.renderer.resize(app.view.clientWidth, app.view.clientHeight);
    }
    window.addEventListener("resize", resize.bind(this));
    resize();
})(globals.app);

// model
function GameModel(rows, column) {

    function CellModel(owner) {
        this.owner = owner;
        this.toString = function() {
            return "[CellModel" + this.owner + "]";
        }
    }
    CellModel.OWNER_NONE = "";
    CellModel.OWNER_X = "X";
    CellModel.OWNER_O = "O";

    this.field = [];
    for (var i = 0; i < rows; i++) {
        this.field[i] = [];
        for (var j = 0; j < column; j++) {
            this.field[i][j] = new CellModel(CellModel.OWNER_NONE);
        }
    }
}

// view
function GameView(gameFacade) {

    function CellView() {
        PIXI.Container.call(this);

        var circle = new PIXI.Graphics().beginFill(0xff0000).drawCircle(0, 0, 20).endFill();
        this.addChild(circle);

        this.on("pointerdown", this.onDown.bind(this)) // TODO: call the off after destroy

    }
    CellView.CELL_WIDTH = 100;
    CellView.CELL_HEIGHT = 100;
    CellView.prototype = new PIXI.Container();

    this.gameFacade = gameFacade;
    this.draw = function() {
        var field = this.gameFacade.model.field;
        for (var i = 0; i < field.length; i++) {
            for (var j = 0; j < field[i].length; j++) {
                var cell = new CellView(field[i][j]);
                cell.position.set(i * CellView.CELL_WIDTH, j * CellView.CELL_HEIGHT);
                this.addChild(cell);
            }
        }
    }
}
GameView.prototype = new PIXI.Container();

// the Game Facade
function Game(rows, column) {
    this.model = new GameModel(rows, column);
    this.view = new GameView(this);
}
globals.app.start();

globals.game = new Game(5, 5);
globals.app.stage.addChild(globals.game.view);
globals.game.view.draw();
console.log(globals.game);