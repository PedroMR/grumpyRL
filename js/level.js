var VISIBILITY_RANGE = 20;
var CHANCE_GOLD_FLOOR = 0;
var CAVE_WIDTH = 120;
var CAVE_HEIGHT = 60;
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
    var width = this._size.x;
    var height = this._size.y - 3;
	var generator = new ROT.Map.Cellular(width, height);
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
    
    for (var i=0; i < 2; i++) {
        var x0 = Math.floor(i*width/2);
        var y0 = 0;
        var roomOptions = {
            roomWidth: [3, 7],
            roomHeight: [3, 5],
            corridorLength: [2, 10],
            dugPercentage: 0.2
        }
        var roomGen = new ROT.Map.Digger(Math.floor(width/3), height/2, roomOptions);
        roomGen.create(function (x, y, wall) {
            var xy = new XY(x + x0, y + y0);
            if (wall == 0) {
                delete theMap._map[xy];
            }
            else if (theMap._map[xy]) {
                theMap._map[xy]._visual.bg = '#226';
                theMap._map[xy]._visual.ch = '8';
            }
        });
    }
	
	generator.randomize(0.3);
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
        if (!theMap.isWithinBounds(key))
            return false;
		if (key in theMap._map) { return (theMap._map == theMap._empty); }
		return true;
    }

    this._dwarfMayMoveCb = function(me, x, y) {
        var pos = new XY(x,y);
        if (!theMap.isWithinBounds(pos))
            return false;
        var entity = theMap.getEntityAt(pos);
        var mayWalk = !entity.blocksMovementOf(me);
//        if (entity instanceof Dwarf && entity.name != me.name)
//            console.log(me.name+": entity "+entity.name+" blocks? "+entity.blocksMovementOf(me)+" may "+mayWalk);
        return mayWalk;
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

Level.prototype.getPlayerStart = function() {
    var width = this._size.x;
    var height = this._size.y;
    var margin = Math.floor(width / 8);
    var x0 = ROT.RNG.getUniformInt(margin, width-margin);
    var y0 = height - 5;
    
    this.openCaveMouth(x0, y0);
    
    return new XY(x0, y0);
}

Level.prototype.openCaveMouth = function(x0, y0) {
    var width = this._size.x;
    var height = this._size.y;
    var CAVE_MOUTH_RADIUS = 8;
    var bottom = new XY(x0, height-1);
    
    var i = 0;
    var pos = new XY(0,0);
    for (var v = height - 1; v >= y0 - 5; v--, i++) {
        for (var u = x0 - CAVE_MOUTH_RADIUS; u < x0 + CAVE_MOUTH_RADIUS; u++) {
            pos.x = u; pos.y = v;
            if (pos.dist(bottom) < CAVE_MOUTH_RADIUS) {                
                delete this._map[pos];
            }
        }        
    }
    
    delete this._map[new XY(x0, y0)];
    
    //return this.findOpenSpot();
}

