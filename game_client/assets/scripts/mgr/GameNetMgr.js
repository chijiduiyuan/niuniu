window.Grobal = {
    uid:null,               //玩家uid
    socket:null,            //玩家socket
    roomNum:null,           //房间号
    difen:0,                //底分
    beishu:0,               //倍数
    playerNum:null,         //最大人数
    hallUrl:'http://zh.iwuxb.com/',

    playType:'',            //玩法
    zhuangType:'',          //抢庄玩法
    numOfGame:null,         //当前局数
    maxOfGame:null,         //最大局数
    startTime:null,         //房间开始时间

    seatIndex:-1,           //玩家座位
    isReady:false,          //是否准备
    //isPass: false,          //是否点了不出
    status:"standup",       //玩家状态
    isGrab:false,           //是否庄家
    //roomStatus:"ready",    
    pokerSpriteFrameMap:null,   //所有扑克牌
    allPokers:new Array(),         //发出的牌
    selectPokers: new Array(),//选择的牌
}

Grobal.reset = function(){
    Grobal.allPokers= new Array();
    Grobal.selectPokers= new Array();
    //Grobal.isPass = false;
    Grobal.isReady = false;
	Grobal.status = "standup";
	//Grobal.dealInfo = null;
}

cc.Class({
    extends: cc.Component,
    properties: {
        dataEventHandler:null,
        readyCount:0,
        playerList:new Array(),     //玩家列表
        seats:null,                 //全部座位
        chatVoices:null,
    },

    dispatchEvent(event,data){
        if(this.dataEventHandler){
            this.dataEventHandler.emit(event,data);
        }    
    },

    //连接服务器
    connectGameServer:function(callback){
        cc.vv.socket.connect(callback);
        Grobal.socket = cc.vv.socket;
    },

    onRoomJoin:function(){
        var self = this;
        //监听新玩家进入
        cc.vv.socket.addHandler(Grobal.roomNum +'joinRoom', function(msg){
            //console.log('joinRoom='+JSON.stringify(msg));
            //joinRoom={"roomNum":100008,"code":"nn6","conf":{"wanfa":0,"difen":1,"guize":1,"paixing":[],"beishu":[1,3,5,8],"shijian":[10,10,10,10],"jushu":1,"shangzhuang":0},"playerNum":6,
            //"playerList":[{"uid":100044,"nickname":"张行","avatar":"","houseCard":196,"pokerList":[],"pokerPlayList":null,"onlineTime":1543979260814,"isOnline":true,"isReady":false,"isGrab":null,"status":"standup","joinin":false,"baserate":0,"score":0,"lastnn":false,"QiangNum":0}],
            //"isPlaying":false,"numOfGame":0,"maxOfGame":1,"zhuangUser":null,"scoreInfo":{},"playType":"see","zhuangType":"turn","roomStage":"room_wait","stagetime":1543979260,"startTime":1543979260813,"timeID":null}
            Grobal.maxOfGame = msg.maxOfGame;
            Grobal.startTime = msg.startTime;
            Grobal.numOfGame = msg.numOfGame;
            Grobal.playType = msg.playType;
            Grobal.zhuangType = msg.zhuangType;

            self.playerList = msg.playerList;
            self.SetSeatInfo();
            self.dispatchEvent('new_user_comes_push');
        });

        //监听玩家状态变化
        cc.vv.socket.addHandler(Grobal.roomNum + 'state_changed', function (msg) {
            if (msg && msg.playerList) {
                cc.vv.gameNetMgr.playerList = msg.playerList;
                cc.vv.gameNetMgr.SetSeatInfo();
                self.dispatchEvent('user_state_changed');
            }
            if(msg.roomStage !== 'room_wait'){
                cc.vv.gameNetMgr.dispatchEvent('guanzhan');
            }
        });

        //监听房间提示消息
        cc.vv.socket.addHandler(Grobal.roomNum + 'show_tips', function(msg){
            cc.vv.gameNetMgr.dispatchEvent('show_tips_message',msg.info);
        });

        //监听房间准备状态更新
        cc.vv.socket.addHandler(Grobal.roomNum +'room_player_changed', function(msg){
            var messagestr="";
            var messagestr2="";
            for(var i=0;i<msg.length;++i){
                var p = msg[i];
                if(p.uid==Grobal.uid && p.status=="ready"){
                    messagestr = "你已准备";
                }else if(p.status=="ready"){
                    if(messagestr2==""){
                        messagestr2 = "已准备的用户有:"+p.nickname;
                    }else{
                        messagestr2 = messagestr2+"、"+p.nickname;
                    }
                }
            }
            if(messagestr!=""&&messagestr2==""){
                messagestr2 = "还没有其他用户准备";
            }
        });

        //监听用户状态更新，打牌，抢庄，倍数
        cc.vv.socket.addHandler(Grobal.roomNum +'play_state_change', function(msg){
            self.dispatchEvent("play_state_change",msg);
       });

       //监听房间时间变化
       cc.vv.socket.addHandler(Grobal.roomNum + 'room_time_update', function(msg){
            var event = msg.roomStage + "_event";
            var passTime = msg.stagetime - msg.servertime;
            var time = msg.lasttime - passTime;
            //获取视图的大小，以点为单位。 
            //let winSize=cc.director.getWinSize();
            //console.log('winSize',winSize.width,winSize.height);
            //获取运行场景的可见大小。
            //let winSizePixels=cc.director.getWinSizeInPixels();
            //console.log('winSizePixels',winSizePixels);
            cc.vv.uitools.ShowTime("Time",cc.director.getScene(),{time:time,x:375,y:850,eventName:event});
        });

        //游戏开始 更新局数
        cc.vv.socket.addHandler(Grobal.roomNum +'startGame', function(msg){
            Grobal.numOfGame = msg;
        });
        //发牌
        cc.vv.socket.addHandler(Grobal.uid + 'dealingCards', function(msg){
            console.log('dealingCards = '+JSON.stringify(msg));
            Grobal.allPokers = msg.pokerList;
            if(msg && msg.playerList){
                cc.vv.gameNetMgr.playerList = msg.playerList;
            }
            self.dispatchEvent('user_state_dealingCards',msg);
            cc.vv.gameNetMgr.dispatchEvent('show_tips_message');
        });

        //抢庄
        cc.vv.socket.addHandler(Grobal.roomNum +'startGrab', function(msg){
            //console.log('startGrab = '+JSON.stringify(msg));
            if(msg && msg.playerList){
                cc.vv.gameNetMgr.playerList = msg.playerList;
                cc.vv.gameNetMgr.SetSeatInfo();
            }
            self.dispatchEvent('start_qiang_zhuang');
        });

        //抢庄结束
        cc.vv.socket.addHandler('qiangzhuang_done', function(msg){
            if(Grobal.status == "standup" ||Grobal.status == "ready"){return}
            Grobal.status = "qianged";
            self.dispatchEvent('qiangzhuang_done');
            cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"等待其他玩家选择");
        });

        //设置倍数
        cc.vv.socket.addHandler(Grobal.roomNum +'selectrate', function(msg){
            //console.log('selectrate = ' +JSON.stringify(msg));
            if(msg && msg.playerList){
                cc.vv.gameNetMgr.playerList = msg.playerList;
                cc.vv.gameNetMgr.SetSeatInfo();
            }
            
            if(msg && msg.isdeal_zhuan == true){

            }else{
                self.dispatchEvent('shezhi_beishu');
            }
        });

        //定庄
        cc.vv.socket.addHandler(Grobal.roomNum +"deal_zhuang",function(data){
            if(data.zhuang == Grobal.uid){   
                Grobal.isGrab = true
            }else{
                Grobal.isGrab = false;
            }
            //cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"等待系统决定庄家");
            self.dispatchEvent("deal_zhuang",data);
        });

        //下注成功
        cc.vv.socket.addHandler('dealbaserate_success', function(msg){
            if(Grobal.status == "standup" ||Grobal.status == "ready"){return}
            Grobal.status = "beishu";
            self.dispatchEvent('dealbaserate_success');
            cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"等待闲家下注");
        });
        //通知用户看牌
        cc.vv.socket.addHandler(Grobal.roomNum +'kanpai_state_change', function(msg){
            cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"点击牌面看牌");
       });

       //第四张牌展示
       cc.vv.socket.addHandler(Grobal.uid + 'dealingTheFourCards', function(msg){
            Grobal.allPokers = msg.pokerList;
            self.dispatchEvent('user_dealingTheFourCards',msg);
        });

        //看牌结束
        cc.vv.socket.addHandler(Grobal.uid + 'dealingTheFiveCards', function(msg){
            Grobal.allPokers = msg.pokerList;
            self.dispatchEvent('user_dealingTheFiveCards',msg);
            cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"请摊牌");
        });
        
        //摊牌
        cc.vv.socket.addHandler('dealpoker_done', function(msg){
            if(Grobal.status == "standup" ||Grobal.status == "ready"){return}
            Grobal.status = "arranged";
            self.dispatchEvent('dealpoker_done');
            cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"等待摊牌");
        });

        //摊牌结束
        cc.vv.socket.addHandler(Grobal.roomNum + 'user_deal_poker_done', function(msg){
            console.log('msg = '+JSON.stringify(msg));
            //msg = {"uid":100043,"cards":[{"colourType":"meihua","num":4,"name":"meihua_4","value":4,"sortValue":4.2},{"colourType":"hongtao","num":10,"name":"hongtao_10","value":0,"sortValue":0.3},{"colourType":"heitao","num":2,"name":"heitao_2","value":2,"sortValue":2.4},{"colourType":"hongtao","num":2,"name":"hongtao_2","value":2,"sortValue":2.3},{"colourType":"heitao","num":1,"name":"heitao_1","value":1,"sortValue":1.4}],"value":0}

            //msg = {"uid":100044,"cards":[{"colourType":"meihua","num":11,"name":"meihua_11","value":0,"sortValue":0.2},{"colourType":"meihua","num":6,"name":"meihua_6","value":6,"sortValue":6.2},{"colourType":"hongtao","num":11,"name":"hongtao_11","value":0,"sortValue":0.3},{"colourType":"meihua","num":10,"name":"meihua_10","value":0,"sortValue":0.2},{"colourType":"hongtao","num":5,"name":"hongtao_5","value":5,"sortValue":5.3}],"value":1}
            self.dispatchEvent('user_deal_poker_done',msg);
        });

        //结算积分
        cc.vv.socket.addHandler(Grobal.roomNum + 'game_score', function(msg){
			Grobal.dealInfo = msg;
            self.dispatchEvent('card_start_play',msg);
            cc.vv.gameNetMgr.dispatchEvent('show_tips_message');
            cc.vv.uitools.ClearTime(cc.director.getScene());
        });

        //游戏结束
        cc.vv.socket.addHandler(Grobal.roomNum + 'gameFinish', function(msg){
            //console.log('111---'+JSON.stringify(Grobal.allPokers));
            //console.log('222---'+JSON.stringify(Grobal.selectPokers));
            //Grobal.allPokers.splice(0, Grobal.allPokers.length);
            //Grobal.selectPokers.splice(0, Grobal.selectPokers.length);
            self.dispatchEvent('single_game_finish',msg);
        });
        //重连
        cc.vv.socket.addHandler(Grobal.uid +'disconnect_server', function(msg){
            cc.vv.userMgr.login();
        });
        //检查状态
        cc.vv.socket.addHandler('checkPlayerStatus_success', function(msg){
            cc.vv.gameNetMgr.playerList = msg.playerList;
            self.dispatchEvent('checkPlayerStatus_success');
        });
        //快捷语音
        cc.vv.socket.addHandler("quick_chat_push",function(data){
            self.dispatchEvent("quick_chat_push",data);
        });
    },

    //设置玩家座位
    SetSeatInfo:function(){
        for(var i=0;i<this.playerList.length;++i){
            var s = this.playerList[i];
            if(s !== null && s.uid == Grobal.uid){
                Grobal.seatIndex = i;
                Grobal.isReady = s.isReady;
                Grobal.status = s.status;
                Grobal.isGrab = s.isGrab;
            }
        }
    },

    //玩家是否已经开始
    getIsOpen:function(){
        for(var i=0;i<this.playerList.length;i++){
            var p = this.playerList[i];
            if(p.status!="standup"&&p.status!="ready"){
                return true;
            }
        }
        return false;
    },

    //获取玩家座位
    getLocalIndex:function(index){
        var playerNum = Grobal.playerNum*1;
        var ret = ( Grobal.seatIndex  + playerNum - index) % playerNum;
        return ret;
    },

    //获取玩家座位
    getSeatIndexByID:function(uid){
        //console.log('player list = '+JSON.stringify(this.playerList));
        for(var i=0;i<this.playerList.length;++i){
            var s = this.playerList[i];
            if(s !== null && s.uid == uid){
                return i;
            }
        }
        return -1;
    },
    //获取位置节点
    getSeatNodeByUid:function(userid){
        var localIndex = -1;
        if(this.seats == null){
            return localIndex;
        }
        var index = cc.vv.gameNetMgr.getSeatIndexByID(userid);
        localIndex = cc.vv.gameNetMgr.getLocalIndex(index)
        return localIndex
    },
});