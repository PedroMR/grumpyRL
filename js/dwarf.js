var DWARF_GOLD_VISIBILITY = 8;
var DWARF_PAIN_MEMORY = 4;
var DWARF_IDLE_AT_DISTANCE = 2;

var Dwarf = function(letter, name) {
    letter = letter || 'D';
	Being.call(this, {ch:letter, fg:"#5f5"});
    this.timeToIdleMove = ROT.RNG.getUniformInt(3, 7);
    this._fov = null;
    this._canDig = true;
    this._sufferedDamage = 0;
    this.name = name || "Dwarf";
    this._team = TEAM_PLAYER;
    this.debugPath = [];

};
Dwarf.extend(Being);

Dwarf.prototype.blocksMovementOf = function(ent) {
    return Being.prototype.blocksMovementOf.call(this, ent);
}
Dwarf.prototype.act = function() {
    var hasSufferedDamage = this._sufferedDamage > 0;
    if (this._sufferedDamage > 0) {
        this._sufferedDamage--;  
    } 
    this._visual.bg = "#000";
    this._visual.fg = "#5f5";
    
    var level = this._level;
    var myPos = this._xy;
    
    if (this._goldTarget) {
        var wall = level._map[this._goldTarget];
        if (!wall || wall._goldChance <= 0 || wall._hp <= 0)
            this._goldTarget = null;
    }
    
    if (!this._goldTarget)
        this._goldTarget = this.findGoldNear(myPos);
    
    var gold = this._goldTarget;
    var me = this;
//	Game.textBuffer.write("Dwarf at "+this._xy+" sees gold at "+gold);
    var passableCallback = level._dwarfMayMoveCb.bind(this, this);
    if (gold && !hasSufferedDamage) {
        this._visual.fg = "#FF0";
        var nav = new ROT.Path.AStar(gold.x, gold.y, passableCallback, {topology:8});
        var count = 0;
        this.debugPath.length = 0;
        nav.compute(myPos.x, myPos.y, function(x,y) {
        	me.debugPath.push(new XY(x,y));

            count++;
            if (count == 2) {
                var newPos = new XY(x, y);
                me.moveOrDigTo(newPos);
            }
        });

    } else {
        var playerPos = this._level.getPlayerEntity().getXY();
        if (playerPos.dist8(myPos) > DWARF_IDLE_AT_DISTANCE || hasSufferedDamage) {
            this._visual.fg = "#5FD";
            var nav = new ROT.Path.AStar(playerPos.x, playerPos.y, passableCallback, {topology:8});
            var count = 0;
            nav.compute(myPos.x, myPos.y, function(x,y) {
                count++;
                if (count == 2) {
                    var newPos = new XY(x, y);
                    me.moveOrDigTo(newPos);
                }
            });
        } else {
            this.timeToIdleMove--;
            if (this.timeToIdleMove <= 0) {
                this.timeToIdleMove = ROT.RNG.getUniformInt(1, 4);;
                var newPos = new XY(myPos.x, myPos.y);
                newPos.x += ROT.RNG.getUniformInt(-1, 1);
                newPos.y += ROT.RNG.getUniformInt(-1, 1);
                me.moveOrDigTo(newPos);
            }
        }
    }    
}

Dwarf.prototype.debugRender = function() {
	for (var i = 0; i < this.debugPath.length; i++) {	
		var pos = this.debugPath[i];
		var dx = pos.x + Game.viewportSize.x/2 - Game.viewportCenter.x;
	    var dy = pos.y + Game.viewportSize.y/2 - Game.viewportCenter.y;
	    // console.log("draw ", Game.viewportCenter, Game.viewportSize, pos, dx, dy);
	    var entity = this._level.getEntityAt(pos);
	    var ch = entity.getVisual().ch;
	    Game.display.draw(dx, dy, ch, '#000', '#800');
	}
}

Dwarf.prototype.sufferDamage = function (amount) {
    this._sufferedDamage = DWARF_PAIN_MEMORY;
    this._visual.bg = "#F55";
    
    Being.prototype.sufferDamage.call(this, amount);    
}

Dwarf.prototype.findGoldNear = function(xy) {
    var level = this._level;
    
	if (!level.isWithinBounds(xy)) {
		return false;
	}
    
    if (!this._fov)
         this._fov = new ROT.FOV.PreciseShadowcasting(level._lightPassesCb, {topology:8});

    var theMap = level;
    var foundGoldAt = false;
    var fov = this._fov;
    fov.compute(xy.x, xy.y, DWARF_GOLD_VISIBILITY, function (x, y, r, visibility) {
		var key = new XY(x,y);
		if (key in theMap._map) {
            var wall = theMap._map[key];
            if (wall._goldChance > 0 && wall._hp > 0) {
                // oooh
                if (!foundGoldAt) {
                    foundGoldAt = key;                    
                } else {
                    if (key.dist4(xy) < foundGoldAt.dist4(xy))  // check which one is closer
                        foundGoldAt = key;
                }
            }
        }
    });
    
    return foundGoldAt;
}