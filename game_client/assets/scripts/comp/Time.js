cc.Class({
    extends: cc.Component,
    properties: {
        _time:10,
		_args:null,
		_showtime:0,
		_eventName:null,
    },

     onLoad: function () {
        
    },  

    init:function(args){
		this.node.active = false;
        this._args = args;
		this._time = this._args.time;
		this._showtime =  Date.parse(new Date())/1000;
		this.node.x = this._args.x;
		this.node.y = this._args.y;
		this._eventName = this._args.eventName;
		this.node.getChildByName("timelabel").getComponent(cc.Label).string = this._time;
        this.initView();
    },
	initView:function(){
        this.node.active = true;
    },
	hide:function(){
		this.node.removeFromParent();
	},
	update: function () {
		if(this.node.active == true){
			if(this._showtime >0){
				if(this._time>0){
					if(Date.parse(new Date())/1000 >= this._showtime + 1){
						this._showtime =  Date.parse(new Date())/1000;
						this._time=this._time-1;
						if(this._time<10){
							this._time=this._time;	
						}
						this.node.getChildByName("timelabel").getComponent(cc.Label).string = this._time; 
					}
				}else{
					if(this.node.active == true){
						if(this._eventName!=null){
							cc.vv.gameNetMgr.dispatchEvent(this._eventName);
							this.hide();
						}
					}
				}
			}else{
				
			}
		}
    },
});
