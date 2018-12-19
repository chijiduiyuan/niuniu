cc.Class({
    extends: cc.Component,

    properties: {
        uid:null,       //玩家uid
        nickname:null,  //玩家昵称
        avatar:null,    //玩家头像
        houseCard:null, //玩家房卡
        roomId:null,    //玩家所在房间id
        scene:null,     //游戏场景
    },

    login:function(){
        var self = this;
        //1.连接socket服务器
        cc.vv.gameNetMgr.connectGameServer();
        //2.连接服务器成功
        cc.vv.netRoot.on('conect_success',function(msg){
            //3.验证参数 uid roomNum
            cc.vv.socket.send('check_args',cc.args);
        },this);
        //4.验证参数成功
        cc.vv.socket.addHandler('check_args_success', function(msg){
            console.log('msg:'+JSON.stringify(msg));
            //msg:{"code":0,"msg":"check args success","data":{"userInfo":{"uid":100044,"agent":5,"username":"oS5kT5gpJ-kpdNZay8HCRm0Vfco4","nickname":"张行","avatar":"http://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKd71LHQvz0UOOIkoLzkdia4Hb1j559GfGdEO4Mtlm9YyWYibaYTzibzd27ciaBXgB5ngPJcSSl3WNPcg/132","card":196,"phone":"15070924883","status":1,"password":"96e79218965eb72c92a549dd5a330112","intro":"武功再高，也怕菜刀。","create_time":1542941232,"login_time":1543372411},"roomInfo":{"id":100008,"conf":"{\"wanfa\":0,\"difen\":1,\"guize\":1,\"paixing\":[],\"beishu\":[1,3,5,8],\"shijian\":[10,10,10,10],\"jushu\":1,\"shangzhuang\":0}","status":0,"type":"nn","max_player":6,"code":"nn6"},"url":"http://zh.iwuxb.com/"}}
            Grobal.uid = msg.data.userInfo.uid;
            Grobal.roomNum = msg.data.roomInfo.id;
            var conf = JSON.parse(msg.data.roomInfo.conf);
            Grobal.difen = conf.difen;
            Grobal.beishu = conf.beishu;
            Grobal.playerNum = msg.data.roomInfo.max_player;
            //Grobal.hallUrl = msg.url;
            self.uid = msg.data.userInfo.uid;
            self.nickname = msg.data.userInfo.nickname;
            self.avatar = msg.data.userInfo.avatar;
            self.houseCard = msg.data.userInfo.card;
            self.roomId = msg.data.roomInfo.id;
            self.scene = msg.data.roomInfo.code;
            //5.玩家进入房间
            cc.vv.userMgr.enterRoom();
         });
         //参数验证错误
         cc.vv.socket.addHandler('check_args_error', function(msg){
            cc.vv.uitools.ShowAlert(cc.director.getScene(),msg.msg,function(){
                window.parent.location=Grobal.hallUrl;
            },false);
        });

        //2.玩家加入房间结束
        cc.vv.socket.addHandler('joinRoom', function(){
            cc.director.loadScene(self.scene);
        });
        //加入房间报错
        cc.vv.socket.addHandler('joinRoom_error', function(msg){
            cc.vv.uitools.ShowAlert(cc.director.getScene(),msg,function(){
                window.parent.location=Grobal.hallUrl;
            },false);       
        });
    },

    enterRoom:function(){
        cc.vv.gameNetMgr.onRoomJoin();
        cc.vv.socket.send('joinRoom');
    }
});
