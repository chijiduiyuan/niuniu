/**
 * 加载扑克 注册准备 
 */
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    if (obj instanceof Date) {
      var copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }
    if (obj instanceof Array) {
      var copy = [];
      for (var i = 0; i < obj.length; ++i) {
        copy[i] = clone(obj[i]);
      }
      return copy;
    }
    if (obj instanceof Object) {
      var copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
      }
      return copy;
    }
    throw new Error("Unable to copy obj! Its type isn't supported.");
}

cc.Class({
    extends: cc.Component,

    properties: {
        poker: cc.Prefab,
        myNode: cc.Node,
        readyBtn: cc.Node,
        backPrefab: cc.Prefab,
        _backPrefabPool: null,
        _clickTimeArray: null,
        _voiceMsgQueue:[],
        _lastPlayTime:null,
        _voice_btn:cc.Button,
        _playingSeat:null,
    },

    onLoad: function () {
        //cc.view.setDesignResolutionSize(750, 1334, 0);
        this._backPrefabPool = new cc.NodePool();
        this._pokerSpriteFrameMap = {};
        this._clickTimeArray = new Array();
        var _pokerSpriteFrameMap = this._pokerSpriteFrameMap;
        var self = this;
        this.myNode.active = true;
        //准备按钮注册
        this.readyBtn.on(cc.Node.EventType.TOUCH_START, this.readyCallBack, this);
        //加载扑克牌
        cc.loader.loadRes("comm/pokers", cc.SpriteAtlas, function (err, assets) {
            var sflist = assets.getSpriteFrames();
            for(var i = 0; i < sflist.length; i++){
                var sf = sflist[i];
                _pokerSpriteFrameMap[sf._name] = sf;
                Grobal.pokerSpriteFrameMap = _pokerSpriteFrameMap
            }
            self.init(); 
        });
        cc.vv.audioMgr.playBGM("bgm_room_1.mp3");
    },

    init: function(){
        //重连
        cc.vv.netRoot.on('reconnect_update',function(msg){
            cc.vv.userMgr.enterRoom();
            self.checkPlayerStatus(); 
        },this);
        //通知场景初始化完成
        cc.vv.gameNetMgr.dispatchEvent('game_play_init_over',true);
        this.myNode.active = false;
        var self = this;

        if(cc.vv.gameNetMgr.getIsOpen()){
            self.readyBtn.active = false;
        }

        if(Grobal.status!="standup" || Grobal.status!="ready"){
            self.checkPlayerStatus();
        }
        
        //发牌
        cc.vv.netRoot.on('user_state_dealingCards',function(msgBean){
            cc.find("Canvas/room_bg/roomjushu").getComponent(cc.Label).string=""+Grobal.numOfGame+" / "+Grobal.maxOfGame+" 局";
            self.readyBtn.active = false;
			if(Grobal.allPokers.length>0){
				var myNodeScript = self.myNode.getComponent('Control');
				myNodeScript.displayAndClickPokers(clone(Grobal.allPokers));
				self.myNode.active = true;
			}
        },this);
        //抢庄
        cc.vv.netRoot.on('start_qiang_zhuang',function(msgBean){
            if(Grobal.status == "standup" ||Grobal.status == "ready"){
                self.readyBtn.active = false;
                cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"请等待下一局");
                return;
            }
            self.readyBtn.active = false;
            var myNodeScript = self.myNode.getComponent('Control');
            myNodeScript.showQiangZhuan();
            cc.vv.audioMgr.playSFX('effect/room_start_compare.mp3');
            self.myNode.active = true;
            cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"抢庄");
        },this);
        //设置抢庄倍数
        cc.vv.netRoot.on('shezhi_beishu',function(msgBean){
            if(Grobal.status == "standup" ||Grobal.status == "ready"){return}
            self.readyBtn.active = false;
			if(Grobal.isGrab == true){
				cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"等待闲家下注");
			}else{
				cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"请下注");
			}
        },this);
        //展示第四张牌
        cc.vv.netRoot.on('user_dealingTheFourCards',function(msgBean){
            self.readyBtn.active = false;
			if(Grobal.allPokers.length>0){
				var myNodeScript = self.myNode.getComponent('Control');
				myNodeScript.displayPokers(clone(Grobal.allPokers),false);
				self.myNode.active = true;
			}
        },this);
        //展示第五张牌
        cc.vv.netRoot.on('user_dealingTheFiveCards',function(msgBean){
            self.readyBtn.active = false;
			if(Grobal.allPokers.length>0){
				var myNodeScript = self.myNode.getComponent('Control');
				myNodeScript.showSelectNiu();
				myNodeScript.displayPokers(clone(Grobal.allPokers),false);
				self.myNode.active = true;
			}
        },this);
        //重新开始
        cc.vv.netRoot.on('game_restart',function(msgBean){
            self.readyBtn.active = true;
            if(Grobal.numOfGame==Grobal.maxOfGame){
                self.readyCallBack();
            }
            cc.vv.uitools.ClearTime(cc.director.getScene());
        },this);
        //观战状态
        cc.vv.netRoot.on('guanzhan',function(msgBean){
            if(Grobal.status == "standup" ||Grobal.status == "ready"){
                self.readyBtn.active = false;
                return;
            }
        },this);

        //游戏结束
        cc.vv.netRoot.on('single_game_finish',function(msg){
            cc.vv.uitools.ShowLayer("GameFinishUI",self.node,msg);
        },this);

        //游戏状态检查完毕玩家准备状态
        cc.vv.netRoot.on('game_restart_notice',function(msgBean){
            self.readyBtn.active = true;
       },this); 
  
    },
    //检测玩家状态
    checkPlayerStatus: function(){
        cc.vv.socket.send('checkPlayerStatus', {roomNum:Grobal.roomNum});
    },

    //准备
    readyCallBack: function(){
        var time = this.node.getChildByName("Time");
        if(time!=undefined&&time!=null){
            time.removeFromParent();
        }
        cc.vv.socket.send('ready',{uid:Grobal.uid,roomNum:Grobal.roomNum});
        var myNodeScript = this.myNode.getComponent('Control');
        myNodeScript.reset();
        this.readyBtn.active = false;
    },

    update: function (dt) {
        
    },
});
