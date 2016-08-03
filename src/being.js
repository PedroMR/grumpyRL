var TEAM_ENEMY = "enemy";
var TEAM_PLAYER = "player";

var Being = function(visual) {
	Entity.call(this, visual);

	this._speed = 100;
	this._hp = 10;
    this._canDig = false;
    this._canAttack = false;
};
Being.extend(Entity);

/**
 * Called by the Scheduler
 */
Being.prototype.getSpeed = function() {
	return this._speed;
}

Being.prototype.damage = function(damage) {
	this._hp -= damage;
	if (this._hp <= 0) { this.die(); }
}

Being.prototype.act = function() {
	/* FIXME */
}

Being.prototype.die = function() {
	Game.scheduler.remove(this);
}

Being.prototype.setPosition = function(xy, level) {
	/* came to a currently active level; add self to the scheduler */
	if (level != this._level && level == Game.level) {
		Game.scheduler.add(this, true);
	}

	return Entity.prototype.setPosition.call(this, xy, level);
}

Being.prototype.moveOrDigTo = function(targetXY) {
    var redrawNeeded = false;
    var level = this._level;
    
    if (level.canWalkOn(targetXY)) {
        level.setEntity(this, targetXY); /* FIXME collision detection */
        redrawNeeded = true;
    } else if (level.canDigAt(targetXY) && this._canDig) {
        var wall = level.getEntityAt(targetXY);
        wall.dig();
        redrawNeeded = true;
    } else {
        var entity = level.getEntityAt(targetXY);
//        console.log("checking attack against "+entity.getVisual().ch);
//        if (entity instanceof Dwarf) console.log("DWARF! "+this._canAttack+" hp "+entity._hp);
        
        if (entity instanceof Being && entity._hp > 0) {
            var sameTeam = entity._team == this._team;
            if (this._canAttack && !sameTeam) {
                var dmg = this._damage;
                Game.textBuffer.write(this.name+" attacks "+entity.name+" for "+dmg+" damage!");
                entity.sufferDamage(dmg);
                console.log("attack!");
                redrawNeeded = true;            
            } else if (this._canPush && sameTeam) {
                var delta = targetXY.minus(this.getXY());
                var finalPos = targetXY.plus(delta);
                if (level.isEmpty(finalPos) && level.isWithinBounds(finalPos)) {
                    level.setEntity(entity, finalPos);
                    level.setEntity(this, targetXY);
                    redrawNeeded = true;
                }
            }    
        }
        
        
        
    }

    if (redrawNeeded) {
        this._level.computeFOV();
        Game._drawLevel();
    }
    
}

Being.prototype.sufferDamage = function(amount) {
	if (this._hp > 0) {		
		this._hp -= amount;
		
		if (this._hp <= 0) {
            //died!
            Game.textBuffer.write(this.name+" dies!");
            Game.onDeath(this);
        }
    }
}

Being.prototype.blocksMovementOf = function(otherEntity) {
    return true;
}