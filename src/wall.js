var CHARS = ["x","X"];

var Wall = function() {
	Entity.call(this, {ch:"#",fg:"#bbb"});

	this._hp = 2;
	this._goldChance = 0;//Math.max(0, ROT.RNG.getNormal(0, 0.3));
	this._updateVisual();
}
Wall.extend(Entity);

Wall.prototype.dig = function() {
	if (this._hp > 0) {		
		this._hp--;
		
		if (this._hp <= 0) {
			//console.log("deleting wall");
			this._level.removeEntity(this);
			
			if (ROT.RNG.getUniform() < this._goldChance) {
				var ore = new Entity({ch:"*", fg:"#fe0"});
				this._level.setEntity(ore, this.getXY());
			}
		}
		this._updateVisual();
	}
}

Wall.prototype._updateVisual = function() {
	this._visual.ch = CHARS[this._hp - 1];
	this._visual.fg = "#FF" + Math.round(15*(1-this._goldChance)).toString(16);
	//console.log(this._visual.fg+" from "+this._goldChance);
}
