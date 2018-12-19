cc.Class({
    extends: cc.Component,
    properties: {
        _args:null,
        info:cc.Node,
        share:cc.Button,
        close:cc.Button,
    },

    // use this for initialization
    onLoad: function () {
        this.info.active = false;
    },  

    init:function(args){
        this._args = args;
        this.initView();
    },

    initView:function(){
        var self = this
        this.info.active = true;
        var roominfo =self.info.getChildByName("roominfo");
        roominfo.getChildByName("roomnum").getComponent(cc.Label).string = Grobal.roomNum;
        roominfo.getChildByName("jushu").getComponent(cc.Label).string = Grobal.maxOfGame;

        var d=new Date(Grobal.startTime);
        roominfo.getChildByName("starttime").getComponent(cc.Label).string = (d.getMonth()+1)+"-"+(d.getDate())+" "+(d.getHours())+":"+(d.getMinutes());
        
        cc.vv.uitools.addClickEvent(self.share,this.node,"GameFinishUI","onShareClick"); 
        cc.vv.uitools.addClickEvent(self.close,this.node,"GameFinishUI","onCloseClick"); 
        self.ShowUserInfo();
    },

    ShowUserInfo:function(){
        var self = this;
        var user = self.info.getChildByName("user");
        var first = self._args.playerList[0];
        for(var i=0;i<self._args.playerList.length;i++){
            var name = "user" + (i+1);
            var userinfo = user.getChildByName(name);
            var player = self._args.playerList[i];
            userinfo.getChildByName("username").getComponent(cc.Label).string = player.nickname;
             userinfo.getChildByName("id").getComponent(cc.Label).string = player.uid;
            var score = player.score;
            userinfo.getChildByName("score").getComponent(cc.Label).string = score;
            userinfo.active = true;
            if(i == 0){
                userinfo.getChildByName("fangzhu").active = true;
            }
            else if(first.score == score){
                userinfo.getChildByName("fangzhu").active = true;
            }
            else{
                userinfo.getChildByName("fangzhu").active = false;
            }
            var index = cc.vv.gameNetMgr.getSeatIndexByID(player.uid);
            if(cc.vv.gameNetMgr.seats[index] !== undefined){
                userinfo.getChildByName("icon").getComponent(cc.Sprite).spriteFrame = cc.vv.gameNetMgr.seats[index].getUserIcon();
            }
            userinfo.active = true;
        }
    },


    onCloseClick: function () {
         window.location.href = Grobal.hallUrl;
    },

    onShareClick: function () {
        window.location.href = Grobal.hallUrl+'index.php/index/roomList/info?id='+Grobal.roomNum;
    }

});
