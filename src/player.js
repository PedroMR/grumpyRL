var Player = function() {
	Being.call(this, {ch:"@", fg:"#fff"});
	
	this._keys = {};
	this._keys[ROT.VK_K] = 0;
	this._keys[ROT.VK_UP] = 0;
	this._keys[ROT.VK_NUMPAD8] = 0;
	this._keys[ROT.VK_U] = 1;
	this._keys[ROT.VK_NUMPAD9] = 1;
	this._keys[ROT.VK_L] = 2;
	this._keys[ROT.VK_RIGHT] = 2;
	this._keys[ROT.VK_NUMPAD6] = 2;
	this._keys[ROT.VK_N] = 3;
	this._keys[ROT.VK_NUMPAD3] = 3;
	this._keys[ROT.VK_J] = 4;
	this._keys[ROT.VK_DOWN] = 4;
	this._keys[ROT.VK_NUMPAD2] = 4;
	this._keys[ROT.VK_B] = 5;
	this._keys[ROT.VK_NUMPAD1] = 5;
	this._keys[ROT.VK_H] = 6;
	this._keys[ROT.VK_LEFT] = 6;
	this._keys[ROT.VK_NUMPAD4] = 6;
	this._keys[ROT.VK_Y] = 7;
	this._keys[ROT.VK_NUMPAD7] = 7;

	this._keys[ROT.VK_PERIOD] = -1;
	this._keys[ROT.VK_CLEAR] = -1;
	this._keys[ROT.VK_NUMPAD5] = -1;
	
	this._keys[ROT.VK_O] = -1;	
}
Player.extend(Being);

Player.prototype.act = function() {
	//Game.textBuffer.write("It is your turn, press any relevant key.");
	Game.textBuffer.flush();
	Game.engine.lock();
	window.addEventListener("keydown", this);
}

Player.prototype.die = function() {
	Being.prototype.die.call(this);
	Game.over();
}

Player.prototype.handleEvent = function(e) {
	var code = e.keyCode;

	var keyHandled = this._handleKey(e.keyCode);

	if (keyHandled) {
		window.removeEventListener("keydown", this);
		Game.engine.unlock();
	}
}

Player.prototype.setPosition = function(xy, level) {
	var entityThere = level.getEntityAt(xy);
	if (entityThere && entityThere != level._empty) {
		Game.gold++;
		Game.textBuffer.write("Found "+entityThere._visual.ch+". Now "+Game.gold+" gold.");
	}
	
	Being.prototype.setPosition.call(this, xy, level);
}

Player.prototype._handleKey = function(code) {
	if (code in this._keys) {
		Game.textBuffer.clear();

		var direction = this._keys[code];
		if (direction == -1) { /* noop */
			/* FIXME show something? */
			if (code == ROT.VK_O) {
				OMNISCIENT = true;
			}
			
			return true;
		}

		var dir = ROT.DIRS[8][direction];
		var targetXY = this._xy.plus(new XY(dir[0], dir[1]));

		var redrawNeeded = false;
		
		if (this._level.canWalkOn(targetXY)) {
			//var entity = this._level.getEntityAt(targetXY);
			//if (entity.canBePickedUp()) {
			//	Game.textBuffer.write("It is your turn, press any relevant key.");
			//	Game.textBuffer.flush();
			//}
			
			this._level.setEntity(this, targetXY); /* FIXME collision detection */
			redrawNeeded = true;
		} else if (this._level.canDigAt(targetXY)) {
			var wall = this._level.getEntityAt(targetXY);
			wall.dig();
			redrawNeeded = true;
		}
		
		if (redrawNeeded) {
			this._level.computeFOV(this.getXY());
			Game._drawLevel();
		}
		
		return true;
	}

	return false; /* unknown key */
}
