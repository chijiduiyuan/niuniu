/**
 * 玩家操作按钮
 */
const POSITION_UP = 1;
const POSITION_DOWN = 2;
cc.Class({
    extends: cc.Component,
    properties: {
        pokerPrefab: cc.v2refab,
        cardList:cc.Node,   //牌父节点
        qiangzhuan: cc.Node,
        qiangzhuan2: cc.Node,
        beishu: cc.Node,
        selectniu: cc.Node,
        _selectList: null,
        _pokerSpriteList:null,
        _pokerList:null,   
        _beishuSprite0:null,
        _beishuSprite1:null,
        _beishuSprite2:null,
        _beishuSprite3:null
    },

    onLoad: function () {
        this._selectList = new Array();
        //抢庄结束
        cc.vv.netRoot.on('qiangzhuang_done',function(msgBean){
            if(Grobal.status == "standup"){return}
            this.qiangzhuan.active = false;
            this.qiangzhuan2.active = false;
            var nameList = ["buqiang","qiang1","qiang2","qiang4"];
            for(var i=0;i<4;i++){
                var btn = this.qiangzhuan2.getChildByName(nameList[i]).getComponent(cc.Button);
                btn._updateState(); 
            }
        },this);
        //设置倍数
        cc.vv.netRoot.on('shezhi_beishu',function(msgBean){
            if(Grobal.status == "standup" || Grobal.status == "ready"){return}
			this.node.active =true;
            if(Grobal.isGrab == true){
                this.qiangzhuan.active = false;
                this.qiangzhuan2.active = false;
                this.beishu.active = false;
                this.selectniu.active = false;
            }else{
                this.qiangzhuan.active = false;
                this.qiangzhuan2.active = false;
                this._beishuSprite0 = this.beishu.getChildByName('multiple0').getComponent(cc.Sprite);
                this._beishuSprite1 = this.beishu.getChildByName('multiple1').getComponent(cc.Sprite);
                this._beishuSprite2 = this.beishu.getChildByName('multiple2').getComponent(cc.Sprite);
                this._beishuSprite3 = this.beishu.getChildByName('multiple3').getComponent(cc.Sprite);
                var self = this;
                cc.loader.loadRes("comm/btn"+ Grobal.beishu[0], cc.SpriteFrame, function (err, spriteFrame) {
                    self._beishuSprite0.spriteFrame = spriteFrame;
                });
                cc.loader.loadRes("comm/btn"+ Grobal.beishu[1], cc.SpriteFrame, function (err, spriteFrame) {
                    self._beishuSprite1.spriteFrame = spriteFrame;
                });
                cc.loader.loadRes("comm/btn"+ Grobal.beishu[2], cc.SpriteFrame, function (err, spriteFrame) {
                    self._beishuSprite2.spriteFrame = spriteFrame;
                });
                cc.loader.loadRes("comm/btn"+ Grobal.beishu[3], cc.SpriteFrame, function (err, spriteFrame) {
                    self._beishuSprite3.spriteFrame = spriteFrame;
                });
                this.beishu.active = true;
                this.selectniu.active = false;
            }
            for(var j=0;j<10;j++){
                if(this.beishu.getChildByName("multiple"+j) !== null){
                    var btn = this.beishu.getChildByName("multiple"+j).getComponent(cc.Button);
                    btn._updateState();
                }
            }
        },this);
        //下注成功
        cc.vv.netRoot.on('dealbaserate_success',function(msgBean){
            if(Grobal.status == "standup" ||Grobal.status == "ready"){return}
            this.beishu.active = false;
        },this);
        //摊牌完成
        cc.vv.netRoot.on('dealpoker_done',function(msgBean){
            if(Grobal.status == "standup" ||Grobal.status == "ready"){return}
            this.selectniu.active = false;
            this.node.active = false;
        },this);
        //重新开始
        cc.vv.netRoot.on('card_start_play',function(msgBean){
            if(Grobal.status == "standup" ||Grobal.status == "ready"){return}
            this.selectniu.active = false;
            this.node.active = false;
        },this);

        //检查状态成功
        cc.vv.socket.addHandler('checkPlayerStatus_success', function(msg){
            cc.vv.gameNetMgr.playerList = msg.playerList;
            cc.vv.gameNetMgr.dispatchEvent('checkPlayerStatus_success');
        });

        //检查状态检查为准备状态
        cc.vv.netRoot.on('game_restart_notice',function(msgBean){
            this.qiangzhuan.active = false;
            this.qiangzhuan2.active = false;
            this.beishu.active = false;
            this.selectniu.active = false;
            this.cardList.removeAllChildren();
            this._pokerSpriteList = new Array();
            this._selectList = new Array();
        },this);
    },
    reset: function () {
        var self = this;
        self.cardList.removeAllChildren();
        self._pokerSpriteList = new Array();
        this._selectList = new Array();
		this.selectniu.active = false;
    },

    //发牌
    displayAndClickPokers: function(pokerList){
        console.log('card list = '+JSON.stringify(pokerList));
        //card list = [{"colourType":"heitao","num":10,"name":"heitao_10","value":0,"sortValue":0.4},{"colourType":"fangkuai","num":8,"name":"fangkuai_8","value":8,"sortValue":8.1},{"colourType":"heitao","num":8,"name":"heitao_8","value":8,"sortValue":8.4},{"colourType":"hongtao","num":6,"name":"hongtao_6","value":6,"sortValue":6.3}]
        var self = this;
        self.cardList.removeAllChildren();
        self._pokerSpriteList = new Array();
        var gap = 85; //牌间隙
        this._pokerList = pokerList;
        for(var i = 0; i < 5; i++){
            var pokerSprite = cc.instantiate(self.pokerPrefab);
            pokerSprite.status = POSITION_DOWN;
            pokerSprite.setScale(0.55);
            var poker = pokerList[i];
            pokerSprite.setPosition(375, 640);
            var pokerName  = null;
            if(poker != undefined){
                pokerName = poker.name; 
            }
            var actArr = new Array();
            var delay = cc.delayTime(0.05 + 0.05 * i);      //延迟指定的时间量
            if(Grobal.playerNum==6) {
                var ac0 = cc.moveTo(0.3,cc.v2(150 + i*gap,290));
            } else {
                var ac0 = cc.moveTo(0.3,cc.v2(220 + i*gap,180));
            }
            
            var ac1 = cc.scaleTo(0.2,0,0.55);
            var call = cc.callFunc(function(target){
                    if(target.poker !== null && target.poker !== undefined){
                        target.getComponent(cc.Sprite).spriteFrame = Grobal.pokerSpriteFrameMap[target.poker.name];
                    }
                });
            var ac2 = cc.scaleTo(0.2,0.55,0.55);
            actArr.push(delay);
            actArr.push(ac0);
            actArr.push(ac1);
            actArr.push(call);
            actArr.push(ac2);
            this.cardList.addChild(pokerSprite);
            self._pokerSpriteList.push(pokerSprite);
            if(poker != undefined){
                pokerSprite.poker = poker;
                if(this._pokerList.length == 5){
                    if(i< 3){
                        pokerSprite.runAction(cc.sequence( actArr )); 
                    }else{
                        if(i==3){
                            pokerSprite.on(cc.Node.EventType.TOUCH_START, self.fourPokerClick, this);
                        }else{
                            pokerSprite.on(cc.Node.EventType.TOUCH_START, self.lastPokerClick, this);
                        }
                        var delay = cc.delayTime(0.05 + 0.05 * i);
                        if(Grobal.playerNum==6) {
                            var ac0 = cc.moveTo(0.3,cc.v2(150 + i*gap,290));
                        } else {
                            var ac0 = cc.moveTo(0.3,cc.v2(220 + i*gap,180));
                        }
                        pokerSprite.runAction(cc.sequence( delay,ac0 ));
                    }
                }else{
                      pokerSprite.runAction(cc.sequence( actArr )); 
                }
            }else{
                pokerSprite.poker = {};
                var delay = cc.delayTime(0.05 + 0.05 * i);
                if(Grobal.playerNum==6) {
                    var ac0 = cc.moveTo(0.3,cc.v2(150 + i*gap,290));
                } else {
                    var ac0 = cc.moveTo(0.3,cc.v2(220 + i*gap,180));
                }
                pokerSprite.runAction(cc.sequence( delay,ac0 ));
                if(i==3){
                    pokerSprite.on(cc.Node.EventType.TOUCH_START, self.fourPokerClick, this);
                }else{
                    pokerSprite.on(cc.Node.EventType.TOUCH_START, self.lastPokerClick, this);
                }
            }
        }
        cc.vv.audioMgr.playSFX('effect/poker_deal.mp3');
    },
    //抢庄
    showQiangZhuan: function () {
        if(Grobal.playType == "see"){
            this.qiangzhuan.active = false;
            this.qiangzhuan2.active = true;
        }else if(Grobal.playType == "nor"){
            this.qiangzhuan.active = true;
            this.qiangzhuan2.active = false;
        }
        this.beishu.active = false;
        this.selectniu.active = false;
        var time = this.node.getChildByName("Time");
		if(time!=undefined&&time!=null){
			time.removeFromParent();
		}
    },
    //不抢
    onQiangClick:function(event){
        var str = event.target.name;
        str = str.slice(-1);
        var beishu = parseInt(str);
        cc.vv.socket.send('qiangzhuang',{qiangzhuang:beishu});
    },
    //抢庄
    onBuqiangClick:function(){
        cc.vv.socket.send('qiangzhuang',{qiangzhuang:0});
    },
    //下注
    sendRateClick:function(event){
        var index = event.target.name.slice(8);
        cc.vv.socket.send('dealbaserate',{rate:Grobal.beishu[index]});
        cc.vv.audioMgr.playSFX('effect/compare_bet.mp3');
    },
    //点击第四张牌
    fourPokerClick:function(){
        if(Grobal.status == "standup" ||Grobal.status == "ready"){return}
        cc.vv.socket.send('showFourPokers');
        cc.vv.audioMgr.playSFX('effect/poker_click.mp3');
    },
    //点击第五张牌
    lastPokerClick:function(){
        if(Grobal.status == "standup" ||Grobal.status == "ready"){return}
        cc.vv.socket.send('showAllPokers');
        cc.vv.audioMgr.playSFX('effect/poker_click.mp3');
    },
    //显示手中的牌 
    displayPokers: function(pokerList,isNeedAction){
        var self = this;
        self.cardList.removeAllChildren();
        self._pokerSpriteList = new Array();
        var gap = 85; //牌间隙
        this._pokerList = pokerList;
        var pokerAction = 0;
        for(var i = 0; i < 5; i++){
            var poker = pokerList[i];
            var pokerSprite = cc.instantiate(self.pokerPrefab);
            pokerSprite.status = POSITION_DOWN;
            pokerSprite.setScale(0.55);
            if(poker != undefined){
                var pokerName = poker.name;  
                if(isNeedAction == false && i == (pokerList.length-1)){
                    pokerAction = i;
                }else{
                    pokerSprite.getComponent(cc.Sprite).spriteFrame = Grobal.pokerSpriteFrameMap[pokerName];
                }
                pokerSprite.poker = poker;
            }else{
                pokerSprite.poker = {};
                if(i==3){
                    pokerSprite.on(cc.Node.EventType.TOUCH_START, self.fourPokerClick, this);
                }else{
                    pokerSprite.on(cc.Node.EventType.TOUCH_START, self.lastPokerClick, this);
                }
            }
            if(isNeedAction == false){
                if(Grobal.playerNum==6){
                    pokerSprite.setPosition(150 + i*gap, 290);
                }else{
                    pokerSprite.setPosition(220 + i*gap, 180);
                }
            }else{
                if(Grobal.playerNum==6){
                    pokerSprite.setPosition(150, 290);
                }else{
                    pokerSprite.setPosition(200, 160);
                }
                if(i > 0){
                    pokerSprite.runAction(cc.moveBy(0.5,cc.v2(i*gap,0))) 
                }
            }
            this.cardList.addChild(pokerSprite);
            self._pokerSpriteList.push(pokerSprite); 
        }
        if(pokerAction!=0){
            var pokerSprite = self._pokerSpriteList[pokerAction];
            var actArr = new Array();
            var ac1 = cc.scaleTo(0.2,0,0.55);
            var call = cc.callFunc(function(){
                pokerSprite.getComponent(cc.Sprite).spriteFrame = Grobal.pokerSpriteFrameMap[pokerName];
            });
            var ac2 = cc.scaleTo(0.2,0.55,0.55);
            actArr.push(ac1);
            actArr.push(call);
            actArr.push(ac2);
            pokerSprite.runAction(cc.sequence( actArr ));
        }
        cc.vv.audioMgr.playSFX('effect/poker_deal.mp3');
    },
    //显示摊牌按钮
    showSelectNiu: function () {
        this.qiangzhuan.active = false;
        this.qiangzhuan2.active = false;
        this.beishu.active = false;
        this.selectniu.active = true;
    },
    //摊牌
    onHasNiuClick:function(){
        cc.vv.socket.send('dealpoker');
    },
});


