var Goblin = function(letter) {
    letter = letter || 'g';
	Being.call(this, {ch:letter, fg:"#F00"});
    this.name = "Goblin";
    this.timeToIdleMove = ROT.RNG.getUniformInt(10,20);
    this._fov = null;
    this._canAttack = true;
    this._damage = 1;
    this._team = TEAM_ENEMY;
};

Goblin.extend(Being);

Goblin.prototype.act = function() {
    var target = null;
    var level = this._level;
    
    if (!this._fov)
         this._fov = new ROT.FOV.PreciseShadowcasting(level._lightPassesCb, {topology:8});
    
    var myPos = this.getXY();
    var targetR = 999;
    var level = this._level;
    var aXY = new XY(0,0);
    var me = this;
    
    this._fov.compute(myPos.x, myPos.y, 8, function(x, y, r, visibility) {
        aXY.x = x; aXY.y = y;
        var entity = level.getEntityAt(aXY);
        if (entity instanceof Dwarf && r < targetR) {
            target = entity.getXY();;
            targetR = r;
        }
    });
    
    if (target) {
        var passableCallback = level._goblinMayMoveCb;
        var nav = new ROT.Path.AStar(target.x, target.y, passableCallback, {topology:8});
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
            this.timeToIdleMove = ROT.RNG.getUniformInt(10,20);
            var myPos = this.getXY();
            var newPos = new XY(myPos.x, myPos.y);
            newPos.x += ROT.RNG.getUniformInt(-1, 1);
            newPos.y += ROT.RNG.getUniformInt(-1, 1);
            this.moveOrDigTo(newPos);
        }
    }
}