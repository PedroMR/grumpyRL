var Level = function() {
	/* FIXME data structure for storing entities */
	this._beings = {};

	/* FIXME map data */
	this._size = new XY(80, 25);
	this._map = {};
	this._fovRange = {};

	this._empty = new Entity({ch:".", fg:"#888", bg:null});
	this._wall = new Entity({ch:"#", fg:"#888", bg:null});	
}

Level.prototype.createMap = function() {
	var generator = new ROT.Map.Cellular(this._size.x, this._size.y);
	generator.randomize(0.5);
	var theMap = this;
	generator.create(function (x,y,value) {
		if (value == 1) {
			theMap._map[new XY(x,y)] = theMap._wall;
		}
	});
	
	var lightPasses = function(x, y) {
		var key = new XY(x,y);
		if (key in theMap._map) { return (theMap._map == theMap._empty); }
		return true;
	    }

console.log("new fov");	    
	    this._fov = new ROT.FOV.PreciseShadowcasting(lightPasses);	    
}

Level.prototype.getSize = function() {
	return this._size;
}

Level.prototype.findOpenSpot = function() {
	var xy = new XY();
	for (k=0; k < 1000; k++) {
		xy.x = Math.round(ROT.RNG.getUniform() * this._size.x);
		xy.y = Math.round(ROT.RNG.getUniform() * this._size.y);
		
		if (this.isEmpty(xy)) {
			return xy;
		}
	}
	console.log("Failed to find an open spot!");
	return undefined;
}

Level.prototype.setEntity = function(entity, xy) {
	/* FIXME remove from old position, draw */
	if (entity.getLevel() == this) {
		var oldXY = entity.getXY();
		delete this._beings[oldXY];
		if (Game.level == this) { Game.draw(oldXY); }
	}

	entity.setPosition(xy, this); /* propagate position data to the entity itself */

	/* FIXME set new position, draw */
	this._beings[xy] = entity;
	if (Game.level == this) { 
		Game.draw(xy); 
		Game.textBuffer.write("An entity moves to " + xy + ".");
	}
}

Level.prototype.computeFOV = function(xy) {				
	/* output callback */
	var fovRange = {};
	this._fovRange = fovRange;
	this._fov.compute(xy.x, xy.y, 10, function(x, y, r, visibility) {
		fovRange[new XY(x,y)] = r;
	});
}

Level.prototype.isVisible = function (xy) {
	return this._fovRange[xy];
}

Level.prototype.getEntityAt = function(xy) {
	return this._beings[xy] || this._map[xy] || this._empty;
}

Level.prototype.getBeings = function() {
	/* FIXME list of all beings */
	return this._beings;
}

Level.prototype.isEmpty = function(xy) {
	return !this._map[xy];
}
