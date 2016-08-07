ScrollDisplay = function(options) {
	var o = options || {};
	ROT.Display.call(this, o);
    this._top = 0;
    this._left = 0;
}
ScrollDisplay.extend(ROT.Display);

ScrollDisplay.prototype.setCorner = function(left, top) {
	this._top = top;
    this._left = left;

    this._dirty = true;
}

ScrollDisplay.prototype.scroll = function(dx, dy) {
    this._top += dy;
    this._left += dx;
    
    //console.log("corner "+this._left+","+this._top);
    this._dirty = true;
}

ScrollDisplay.prototype._draw = function(key, clearBefore) {
    this._data[key][0] += this._left;
    this._data[key][1] += this._top;
    
	ROT.Display.prototype._draw.call(this, key, clearBefore);

    this._data[key][0] -= this._left;
    this._data[key][1] -= this._top;
}
