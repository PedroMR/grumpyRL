var Dwarf = function(letter) {
    letter = letter || 'D';
	Being.call(this, {ch:letter, fg:"#5f5"});
};

Dwarf.extend(Being);

Dwarf.prototype.act = function() {
    
    var level = this._level;
    var gold = this.findGoldNear(this._xy);
    
	Game.textBuffer.write("Dwarf at "+this._xy+" sees gold at "+gold);
    
    
    
}

Dwarf.prototype.findGoldNear = function(xy) {
    var level = this._level;
    
	if (!level.isWithinBounds(xy)) {
		return false;
	}

    var theMap = level;
    var foundGoldAt = false;
    var fov = new ROT.FOV.PreciseShadowcasting(level._lightPassesCb);
    fov.compute(xy.x, xy.y, 10, function (x, y, r, visibility) {
		var key = new XY(x,y);
		if (key in theMap._map) {
            var wall = theMap._map[key];
            if (wall._goldChance > 0) {
                // oooh
                if (!foundGoldAt) {
                    foundGoldAt = key;                    
                } else {
                    ; // check which one is closer
                }
            }
        }
    });
    
    return foundGoldAt;
}