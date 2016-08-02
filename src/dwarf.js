var Dwarf = function(letter) {
    letter = letter || 'D';
    this.timeToIdleMove = 2;
	Being.call(this, {ch:letter, fg:"#5f5"});
};

Dwarf.extend(Being);

Dwarf.prototype.act = function() {
    
    var level = this._level;
    var myPos = this._xy;
    
//    if (!this._goldTarget)
        this._goldTarget = this.findGoldNear(myPos);
    
    var gold = this._goldTarget;
    var me = this;
	Game.textBuffer.write("Dwarf at "+this._xy+" sees gold at "+gold);
    if (gold) {
        var passableCallback = level._dwarfMayMoveCb;
        var nav = new ROT.Path.AStar(gold.x, gold.y, passableCallback, {topology:8});
        var count = 0;
        nav.compute(myPos.x, myPos.y, function(x,y) {
            count++;
            if (count == 2) {
                var newPos = new XY(x, y);
                Game.textBuffer.write("Moving to "+newPos);
                me.moveOrDigTo(newPos);
//                level.setEntity(me, newPos);
//                me.setPosition(, level);
            }
        });

    } else {
        this.timeToIdleMove--;
        if (this.timeToIdleMove <= 0) {
            this.timeToIdleMove = 2;
            var newPos = new XY(myPos.x, myPos.y);
            newPos.x += ROT.RNG.getUniformInt(-1, 1);
            newPos.y += ROT.RNG.getUniformInt(-1, 1);
            me.moveOrDigTo(newPos);
        }
    }
    
    
    
    
}

Dwarf.prototype.findGoldNear = function(xy) {
    var level = this._level;
    
	if (!level.isWithinBounds(xy)) {
		return false;
	}

    var theMap = level;
    var foundGoldAt = false;
    var fov = new ROT.FOV.PreciseShadowcasting(level._lightPassesCb, {topology:8});
    fov.compute(xy.x, xy.y, 10, function (x, y, r, visibility) {
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