var Treasure = function(letter) {
    letter = letter || '*';
    Entity.call(this, {ch:letter, fg:"#fe0"});
    this._speed = 0;
};

Treasure.extend(Being);

Treasure.prototype.blocksMovementOf = function(otherEntity) {
    return false;
}

