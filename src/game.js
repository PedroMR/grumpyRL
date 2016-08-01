var OMNISCIENT = false;

var Game = {
	scheduler: null,
	engine: null,
	player: null,
	level: null,
	display: null,
	textBuffer: null,
	hasSeen: null,
	gold: 0,
	
	init: function() {
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
//				var playerXY = new XY(Math.round(size.x/2), Math.round(size.y/2));
				this.level.setEntity(this.player, playerXY);
				
                var dwarf = new Dwarf("S");
                var pos = level.findOpenSpot();
                this.level.setEntity(dwarf, pos);
                
				level.computeFOV(playerXY);
				this._drawLevel();
				
				this.engine.start();
			break;
		}
	},

	draw: function(xy) {
		var entity = this.level.getEntityAt(xy);
		var visual = entity.getVisual();
		var canSeeIt = this.level.isVisible(xy) || entity == this.player || OMNISCIENT == true;
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
			this.display.draw(xy.x, xy.y, visual.ch, fgColor, bgColor);
		}
	},
	
	over: function() {
		this.engine.lock();
		/* FIXME show something */
	},
	
	_drawLevel: function() {
		var size = this.level.getSize();
		/* FIXME draw a level */
		var xy = new XY();
		for (var i=0;i<size.x;i++) {
			xy.x = i;
			for (var j=0;j<size.y;j++) {
				xy.y = j;
				this.draw(xy);
			}
		}

	},
	
	_switchLevel: function(level) {
		/* remove old beings from the scheduler */
		this.scheduler.clear(); 

		this.level = level;
		var size = this.level.getSize();

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
    }
}

Game.init();
