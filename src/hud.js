var HUD = {
    _goldDisplay: null,
    
    init: function() {
        HUD._goldDisplay = document.getElementById("gold");

    },
    
    setGold: function(amount) {
        HUD._goldDisplay.innerHTML = "Gold: "+amount;
    }
};