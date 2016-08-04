/*jslint node: true */
"use strict";

var OMNISCIENT = false;

var Game = {
	scheduler: null,
	engine: null,
	player: null,
	level: null,
	display: null,
	textBuffer: null,
	hasSeen: null,
    viewportCenter: null,
    viewportSize: null,
    dwarves: 6,
	gold: 0,
	
	init: function () {
		window.addEventListener("load", this);
		document.onkeydown = function(evt) {
			evt = evt || window.event;
			var keyCode = evt.keyCode;
			if (keyCode >= 37 && keyCode <= 40) {
			    return false;
			}
			return true;
		    };
	},

	handleEvent: function(e) {
		switch (e.type) {
			case "load":
				window.removeEventListener("load", this);
                
                HUD.init();

                this.viewportSize = new XY(80, 25);
                this.viewportCenter = new XY(0, 0);

				this.scheduler = new ROT.Scheduler.Speed();
				this.engine = new ROT.Engine(this.scheduler);
				this.display = new ScrollDisplay({fontSize:14});
				this.textBuffer = new TextBuffer(this.display);
				document.body.appendChild(this.display.getContainer());
				this.player = new Player();
				this.hasSeen = {};

				/* FIXME build a level and position a player */
				var level = new Level();
				level.createMap();
				var size = level.getSize();
				this._switchLevel(level);
                
				var playerXY = level.findOpenSpot();
                
                this.level.setPlayerEntity(this.player);
				this.level.setEntity(this.player, playerXY);
                this.viewportCenter = playerXY;
				
                level.addThing(playerXY, new Corpse("p", "Ppppp"));
                
                var names = ["Sleepy", "Dopey", "Doc", "Bashful", "Sneezy", "Happy"];
                var letters = "SODBNH";
                for (var n=0; n < this.dwarves; n++) {
                    var dwarf = new Dwarf(letters[n], names[n]);
                    var pos = level.findOpenSpot();
                    var tries = 1000;
                    while (pos.dist4(playerXY) > 8 && tries-- > 0)
                        pos = level.findOpenSpot();
                    this.level.setEntity(dwarf, pos);
                }
                HUD.setDwarves(this.dwarves);
                
                for (var n=0; n <= 16; n++) {
                    var goblin = new Goblin();
                    var pos = level.findOpenSpot();
                    var tries = 1000;
                    while (pos.dist4(playerXY) < 8 && tries-- > 0)
                        pos = level.findOpenSpot();
                    this.level.setEntity(goblin, pos);
                }
                
				level.computeFOV();
				this._drawLevel();
				
				this.engine.start();
			break;
		}
	},

	draw: function(xy) {
        var drawX = xy.x + this.viewportSize.x/2 - this.viewportCenter.x; 
        var drawY = xy.y + this.viewportSize.y/2 - this.viewportCenter.y; 
        
		var entity = this.level.getEntityAt(xy);
		var visual = entity.getVisual();
		var canSeeIt = this.level.isVisible(xy) || entity == this.player || OMNISCIENT == true || entity instanceof Dwarf;
		this.hasSeen[xy] = this.hasSeen[xy] || canSeeIt;
		if (!this.hasSeen[xy] && canSeeIt) {
			console.log("eh?");
		}
		var hasSeenIt = this.hasSeen[xy];
		if (hasSeenIt) {
			var fgColor = visual.fg;
			//var fgColor = canSeeIt ? visual.fg : "#666";
			if (!canSeeIt)
			{
				var rgb1 = ROT.Color.fromString(fgColor);
				var hsl = ROT.Color.rgb2hsl(rgb1);
				hsl[1] = (0.5 * hsl[1]);
				hsl[2] = (0.5 * hsl[2]);
				var rgb2 = ROT.Color.hsl2rgb(hsl);
				fgColor = ROT.Color.toHex(rgb2);
			}
			var bgColor = visual.bg;
			this.display.draw(drawX, drawY, visual.ch, fgColor, bgColor);
		} else {
            this.display.draw(drawX, drawY, " ");
        }
	},
	
	over: function() {
		this.engine.lock();
		/* FIXME show something */
	},
	
	_drawLevel: function() {
		var size = this.viewportSize;

        var xy = new XY();
		for (var i=0;i<size.x;i++) {
			xy.x = i + this.viewportCenter.x - Math.floor(this.viewportSize.x/2);
			for (var j=0;j<size.y;j++) {
				xy.y = j + this.viewportCenter.y - Math.floor(this.viewportSize.y/2);
				this.draw(xy);
			}
		}

	},
	
	_switchLevel: function(level) {
		/* remove old beings from the scheduler */
		this.scheduler.clear(); 

		this.level = level;
		var size = this.viewportSize;

		var bufferSize = 3;
		this.display.setOptions({width:size.x, height:size.y + bufferSize});
		this.textBuffer.configure({
			display: this.display,
			position: new XY(0, size.y),
			size: new XY(size.x, bufferSize)
		});
		this.textBuffer.clear();
		
		/* add new beings to the scheduler */
		var beings = this.level.getBeings();
		for (var p in beings) {
			this.scheduler.add(beings[p], true);
		}
	},
    
    gotGold: function(amount) {
        Game.gold += amount;
		Game.textBuffer.write("Found gold! Now "+Game.gold+" gold.");
        HUD.setGold(Game.gold);
    },
    
    onDeath: function(entity) {
        var corpse = new Corpse(entity._visual.ch, entity.name);
        this.level.addThing(corpse, entity.getXY());
        this.level.removeEntity(entity);

        if (entity instanceof Dwarf) {        
            this.dwarves--;
            HUD.setDwarves(this.dwarves);
            
            if (this.dwarves == 0) {
                this.textBuffer.write("\nGAME OVER!");
            }
        }

    }
}

Game.init();
