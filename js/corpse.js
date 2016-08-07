var Corpse = function(letter, name) {
    Entity.call(this, {ch: letter || 'C', fg: '#888'});
    
}
Corpse.extend(Entity);