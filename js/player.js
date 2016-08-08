var Player = function() {
	Being.call(this, {ch:"@", fg:"#fff"});
	
    this._speed = 100;
    this._canDig = true;
    this._canAttack = true;
    this.name = "Grumpy";
    this._damage = 5;
    this._canPush = true;
    this._hp = 100;
    this._team = TEAM_PLAYER;
    
	this._keys = {};
	this._keys[ROT.VK_K] = 0;
	this._keys[ROT.VK_UP] = 0;
	this._keys[ROT.VK_NUMPAD8] = 0;
	this._keys[ROT.VK_W] = 0;
	this._keys[ROT.VK_U] = 1;
	this._keys[ROT.VK_E] = 1;
	this._keys[ROT.VK_NUMPAD9] = 1;
	this._keys[ROT.VK_L] = 2;
	this._keys[ROT.VK_RIGHT] = 2;
	this._keys[ROT.VK_D] = 2;
	this._keys[ROT.VK_NUMPAD6] = 2;
	this._keys[ROT.VK_N] = 3;
	this._keys[ROT.VK_C] = 3;
	this._keys[ROT.VK_NUMPAD3] = 3;
	this._keys[ROT.VK_J] = 4;
	this._keys[ROT.VK_DOWN] = 4;
	this._keys[ROT.VK_NUMPAD2] = 4;
	this._keys[ROT.VK_X] = 4;
	this._keys[ROT.VK_B] = 5;
	this._keys[ROT.VK_NUMPAD1] = 5;
	this._keys[ROT.VK_Z] = 5;
	this._keys[ROT.VK_H] = 6;
	this._keys[ROT.VK_LEFT] = 6;
	this._keys[ROT.VK_NUMPAD4] = 6;
	this._keys[ROT.VK_A] = 6;
	this._keys[ROT.VK_Y] = 7;
	this._keys[ROT.VK_NUMPAD7] = 7;
	this._keys[ROT.VK_Q] = 7;

	this._keys[ROT.VK_PERIOD] = -1;
	this._keys[ROT.VK_CLEAR] = -1;
	this._keys[ROT.VK_NUMPAD5] = -1;
	
	this._keys[ROT.VK_O] = -1;	
	this._keys[ROT.VK_S] = -1;	
	this._keys[ROT.VK_T] = -1;	
	this._keys[ROT.VK_SPACE] = -1;	
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
	if (entityThere && entityThere instanceof Treasure) {
        Game.gotGold(1); //FIXME amounts
        level.removeThing(entityThere);
	}
	
	Being.prototype.setPosition.call(this, xy, level);
}

Player.prototype._handleKey = function(code) {
	if (code in this._keys) {
		Game.textBuffer.clear();

		var direction = this._keys[code];
		if (direction == -1) { /* noop */
			/* FIXME show something? */
            switch(code) {
                case ROT.VK_O:
                    OMNISCIENT = !OMNISCIENT;
                    break;
                case ROT.VK_T:
                	Game.debugSelectNextDwarf();
                	break;
                case ROT.VK_SPACE:
                	Game.tryTriggerYell();
                	break;
//                case ROT.VK_W:
//                    Game.display.scroll(0,-1);
//                    break;
//                case ROT.VK_S:
//                    Game.display.scroll(0, 1);
//                    break;
//                case ROT.VK_A:
//                    Game.display.scroll(-1,0);
//                    break;
//                case ROT.VK_D:
//                    Game.display.scroll( 1,0);
//                    break;
            }			
			return true;
		}

		var dir = ROT.DIRS[8][direction];
		var targetXY = this._xy.plus(new XY(dir[0], dir[1]));

		var redrawNeeded = false;
		
        this.moveOrDigTo(targetXY);
		
        Game.viewportCenter = this.getXY();
        
		return true;
	}

	return false; /* unknown key */
}

