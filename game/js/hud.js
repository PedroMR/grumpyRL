var HUD = {
    _goldDisplay: null,
    _dwarfCount: null,
    
    init: function() {
        HUD._goldDisplay = document.getElementById("gold");
        HUD._dwarfCount = document.getElementById("dwarves");

    },
    
    setGold: function(amount) {
        HUD._goldDisplay.innerHTML = "Gold: "+amount;
    },
    
    setDwarves: function(amount) {
        HUD._dwarfCount.innerHTML = "Dwarves: "+amount;
    }    
};