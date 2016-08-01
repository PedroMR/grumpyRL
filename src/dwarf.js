var Dwarf = function(letter) {
    letter = letter || 'D';
	Being.call(this, {ch:letter, fg:"#5f5"});
}
Dwarf.extend(Being);

Dwarf.prototype.act = function() {
	Game.textBuffer.write("Sir, yes sir! "+Math.random());
}
