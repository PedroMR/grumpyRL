var VISIBILITY_RANGE = 20;
var CHANCE_GOLD_FLOOR = 0;
var CAVE_WIDTH = 50;
var CAVE_HEIGHT = 50;
var CAVE_FILL = 0.6 ; // 0.35; //0.52;

var Level = function () {
	/* FIXME data structure for storing entities */
	this._beings = {};
    this._things = {};

	/* FIXME map data */
	this._size = new XY(CAVE_WIDTH, CAVE_HEIGHT);
	this._map = {};
	this._fovRange = {};

	this._empty = new Entity({ch:".", fg:"#aaa", bg:null});
    this._empty.blocksMovementOf = function (e) { return false };
	this._wall = new Entity({ch:"#", fg:"#aaa", bg:null});	
}

Level.prototype.createMap = function() {
	var generator = new ROT.Map.Cellular(this._size.x, this._size.y);
	generator.randomize(CAVE_FILL);
	var theMap = this;
	generator.create(function (x,y,value) {
		if (value == 1) {
			var xy = new XY(x,y);
			var wall = new Wall();
			theMap._map[xy] = wall;
			wall.setPosition(xy, theMap);
		}
	});
	
	generator.randomize(0.4);
	generator.create(function (x,y,ore) {
		if (ore == 1) {
			var xy = new XY(x,y);
			var wall = theMap._map[xy];
			if (wall) {
				wall._goldChance = Math.min(1, Math.max(0, ROT.RNG.getNormal(0.7, 0.3)));
				wall._updateVisual();
			} else {
				if (ROT.RNG.getUniform() < CHANCE_GOLD_FLOOR) {
					var gold = new Treasure("%");
					theMap.addThing(gold, xy);
				}
			}
		}
	});
	
    this._lightPassesCb = function(x, y) {
		var key = new XY(x,y);
		if (key in theMap._map) { return (theMap._map == theMap._empty); }
		return true;
    }

    this._dwarfMayMoveCb = function(x, y) {
		var key = new XY(x,y);
		if (key in theMap._map) { return theMap.canWalkOn(key); }
		return true;
    }

    this._goblinMayMoveCb = function(x, y) {
		var key = new XY(x,y);
		if (key in theMap._map) { return theMap.canWalkOn(key); }
		return true;
    }

    this._fov = new ROT.FOV.PreciseShadowcasting(this._lightPassesCb, {topology:8});	    
}

Level.prototype.getSize = function() {
	return this._size;
}

Level.prototype.findOpenSpot = function() {
	var xy = new XY();
	for (k=0; k < 1000; k++) {
		xy.x = Math.floor(ROT.RNG.getUniform() * this._size.x);
		xy.y = Math.floor(ROT.RNG.getUniform() * this._size.y);
		
		if (this.isEmpty(xy) && this.getEntityAt(xy) == this._empty) {
			return xy;
		}
	}
	console.log("Failed to find an open spot!");
	return undefined;
}

Level.prototype.removeEntity = function (entity) {
	if (entity.getLevel() == this) {
		var oldXY = entity.getXY();
		if (this._beings[oldXY] == entity) {
			delete this._beings[oldXY];
		}
		if (this._map[oldXY] == entity) {
			delete this._map[oldXY];
		}
        
        Game.scheduler.remove(entity);
	}
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
		//Game.textBuffer.write("An entity moves to " + xy + ".");
	}
}

Level.prototype.setPlayerEntity = function(player) {
    this._player = player;
}

Level.prototype.getPlayerEntity = function() {
    return this._player;
}

Level.prototype.computeFOV = function() {				
	/* output callback */
    var xy = this._player._xy;
	var fovRange = {};
	this._fovRange = fovRange;
	this._fov.compute(xy.x, xy.y, VISIBILITY_RANGE, function(x, y, r, visibility) {
		fovRange[new XY(x,y)] = r;
	});
}

Level.prototype.isVisible = function (xy) {
	return this._fovRange[xy];
}

Level.prototype.getEntityAt = function(xy) {
    if (!this.isWithinBounds(xy)) return this._wall;
    var thingsAt = this.getThingsAt(xy);
    var thing = (thingsAt != null && thingsAt.length > 0) ? thingsAt[0] : null;
	return this._beings[xy] || thing || this._map[xy] || this._empty;
}

Level.prototype.getBeings = function() {
	/* FIXME list of all beings */
	return this._beings;
}

Level.prototype.isEmpty = function(xy) {
	return !this._map[xy] && !this._beings[xy];
}

Level.prototype.isWithinBounds = function(xy) {
	return xy.x >= 0 && xy.x < this._size.x && xy.y >= 0 && xy.y < this._size.y;
}

Level.prototype.canWalkOn = function(xy, entity) {
    var otherEntity = this.getEntityAt(xy);
    if (otherEntity) {
//        console.log("entity "+(entity?entity.name:"(null)")+" found "+otherEntity.getVisual().ch+". Blocks: "+otherEntity.blocksMovementOf(entity));
    }
    if (otherEntity && otherEntity.blocksMovementOf(entity))
        return false;
    
	return !this._map[xy] && this.isWithinBounds(xy);
}

Level.prototype.canDigAt = function(xy, entity) {
	if (!this.isWithinBounds(xy)) {
		return false;
	}
    var otherEntity = this.getEntityAt(xy);
    if (otherEntity && otherEntity.blocksMovementOf(entity))
        return false;
    
    var wall = this._map[xy];
	return wall;
}

Level.prototype.addThing = function(thing, xy) {
	if (!this.isWithinBounds(xy)) {
		return false;
	}
    var things = this.getThingsAt(xy);
    if (!things) {
        things = [];
        this._things[xy] = things;
    }
    things.push(thing);
    thing.setPosition(xy, this);
}

Level.prototype.getThingsAt = function(xy) {
	if (!this.isWithinBounds(xy)) {
		return false;
	}
    
    return this._things[xy];
}

Level.prototype.removeThing = function(thing) {
    var pos = thing.getXY();
    var things = this.getThingsAt(pos);
    if (things) {
        var index = things.indexOf(thing);
        if (index >= 0)
            things.splice(index,1);
    }
    else {
        console.warn("No things found at "+pos);
    }
}

