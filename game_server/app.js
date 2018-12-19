/**
 * 牛牛
*/
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
http.listen(3000);
console.log('nn server is listen 3000');
const myDB = require('./utils/db');

var Player = require('./nn/player');
var Room = require('./nn/room');
var PokerManager = require('./nn/manage');
var pm = new PokerManager();

var roomMap = {};

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

//连接数据库
myDB.init();

//时间，
var RoomStageTime = {
	"room_ready":10,
	"room_qiang":10,
	"room_beishu":10,
    "room_fanpai":10,
    "room_arrang":5,
}

io.on('connection', function(socket){
    console.log('a  user connection',socket.id);
    //当前会话的玩家
    var currentUid = null;
    var currentRoomNum = null;
    //心跳
    socket.on('game_ping',function(data){
		socket.emit('game_pong');
	});
    //验证参数
    socket.on('check_args',function(args){
        console.log('check_args: '+args);
        args = JSON.parse(args);
        //1.判断玩家是否存在
        myDB.get_user_data(args.uid,function(userInfo){
            console.log('userInfo:'+JSON.stringify(userInfo));
            if(userInfo){
                if(userInfo.status){
                    //2.检查房间是否存在 状态
                    myDB.get_room_data(args.roomNum,function(roomInfo){
                        //console.log('roomInfo:'+JSON.stringify(roomInfo));
                        //roomInfo:{"id":100008,"conf":"{\"wanfa\":0,\"difen\":1,\"guize\":1,\"paixing\":[],\"beishu\":[1,3,5,8],\"shijian\":[10,10,10,10],\"jushu\":1,\"shangzhuang\":0}","status":0,"type":"nn","max_player":6,"code":"nn6"}
                        if(roomInfo){
                            if(roomInfo.status == 2){
                                socket.emit('check_args_error',JSON.stringify({'code':1,'msg':'房间已经结束'}));
                            }else{
                                currentUid = userInfo.uid;
                                currentRoomNum = roomInfo.id;
                                RoomStageTime.room_ready = JSON.parse(roomInfo.conf).shijian[0];
                                RoomStageTime.room_qiang = JSON.parse(roomInfo.conf).shijian[1];
                                RoomStageTime.room_beishu = JSON.parse(roomInfo.conf).shijian[2];
                                RoomStageTime.room_fanpai = JSON.parse(roomInfo.conf).shijian[3];
                                //1.返回玩家和房间详情
                                //myDB.get_config(userInfo.agent,function(res){
                                    //console.log('config = '+JSON.stringify(res));
                                    //config = {"url":"http://zh.iwuxb.com/","agent":1}
                                    //if(res){
                                        socket.emit('check_args_success',JSON.stringify({'code':0,'msg':'check args success','data':{userInfo:userInfo,roomInfo:roomInfo}}));
                                    //}else{
                                        //socket.emit('check_args_error',JSON.stringify({'code':1,'msg':'配置加载失败,请重新进入'}));
                                    //}
                                //})
                            }
                        }else{
                            socket.emit('check_args_error',JSON.stringify({'code':1,'msg':'房间不存在'}));
                        }
                    })
                }else{
                    socket.emit('check_args_error',JSON.stringify({'code':1,'msg':'玩家已被封号'}));
                }
            }else{
                socket.emit('check_args_error',JSON.stringify({'code':1,'msg':'玩家不存在'}));
            }
        })
    })

    //玩家进入房间
    socket.on('joinRoom',function(data){
        //保存在线玩家信息
        setPlayerLine(currentUid,currentRoomNum,1);
        //加入socket分组
        socket.join(currentRoomNum);
        var room = roomMap[currentRoomNum];
        if(room == undefined){
            creatorRoom();
        }else{
            enterRoom();
        }
        //创建房间
        function creatorRoom(){
            //1.通知玩家加入房间
            socket.emit('joinRoom');
            //2.创建房间实例
            myDB.get_room_data(currentRoomNum,function(roomInfo){
                //console.log('roomInfo = '+JSON.stringify(roomInfo));
                //roomInfo = {"id":100007,"conf":"{\"wanfa\":0,\"difen\":10,\"guize\":1,\"paixing\":[\"wxn\",\"zdn\",\"wxn\"],\"beishu\":[1,2,4,8],\"shijian\":[10,10,10,10],\"jushu\":1,\"shangzhuang\":0}","status":1,"create_time":1543383546,"type":"nn","max_player":9,"code":"nn9"}
                var room = new Room(roomInfo);
                roomMap[currentRoomNum] = room;
                myDB.get_user_data(currentUid,function(userInfo){
                    //3.创建玩家实例
                    var player = new Player(userInfo);
                    player.setStatus("standup");
                    room.join(player);
                    //4.通知其他玩家有新玩家加入
                    socket.emit(currentRoomNum+'joinRoom', JSON.stringify(room));
                })
                
            })
            
        }
        //进入房间
        function enterRoom(){
            //1.查看房间状态
            if(room.getRoomStage() == "room_finish"){
                socket.emit('joinRoom');
                io.sockets.in(currentRoomNum).emit(currentRoomNum+'joinRoom', JSON.stringify(room));
                return;
            }
            //2.玩家是否存在房间内
            if(room.isExistPlayer(currentUid)){
                //断线重连情况
                socket.emit('joinRoom');
                var player = room.getPlayer(currentUid);
                //设置玩家在线状态
                player.setIsOnline(true);
                var info = GetRoomWithoutCard(room);
				socket.emit(currentRoomNum+'joinRoom', JSON.stringify(info));
				io.sockets.in(currentRoomNum).emit(currentRoomNum+'state_changed', JSON.stringify(info));
            }else{
                //第一次进入房间情况
                //1.判断房间是否满员
                if(room.getPlayerList().length > (room.getPlayerNum() -1 )){
                    socket.emit('joinRoom_error', JSON.stringify("房间已满！"));
                    return;
                }
                socket.emit('joinRoom');
                myDB.get_user_data(currentUid,function(userInfo){
                    var player = new Player(userInfo);
                    player.setIsOnline(true);
                    player.setStatus("standup");
                    room.join(player);
                    var info = GetRoomWithoutCard(room);
                    io.sockets.in(currentRoomNum).emit(currentRoomNum+'joinRoom', JSON.stringify(info));
                })
            }
        }
    })

    //玩家准备
    socket.on('ready',function(msg){
        var msg = JSON.parse(msg);
        console.log('ready msg = '+JSON.stringify(msg));
        //ready msg = {"uid":100044,"roomNum":100008}
        var room = roomMap[currentRoomNum];
		if(room == undefined){
			var data ={};
			data['info']="获取数据出错，请重试";
			socket.emit(currentRoomNum+'show_tips', JSON.stringify(data));
			return;
        }
        if(room!=undefined && room!=null){
            var player = room.getPlayer(currentUid);
			if(player==undefined||player==null){
				socket.emit('joinRoom_error', JSON.stringify("未知错误,请重新进入游戏！"));
				return;
            }
            //游戏结束 而且最后一局 不能准备
            if(room.getRoomStage()=="room_finish"&&room.getNumOfGame()==room.getMaxOfGame()){
                var data = {};
                data.playerList = room.getPlayerList();
                data.playerList.sort(compare("score")).reverse();
                io.sockets.in(currentRoomNum).emit(currentRoomNum+'gameFinish', JSON.stringify(data));
                return;
            }
            //最后一局 不能准备
            if(room.getNumOfGame()==room.getMaxOfGame()){
                return;
            }
            //玩家装备不是standup 和ready不能准备
            if(player.getStatus() !== "standup"&&player.getStatus() !== "ready"){
                return;
            }
            //设置玩家准备状态
            player.setStatus("ready");
            //房间玩家变化 提示
            io.sockets.in(currentRoomNum).emit(currentRoomNum+'room_player_changed', JSON.stringify(room.getPlayerList()));
            //玩家状态变化显示
            var data = {};
			data.uid = currentUid;
			data.state = "ready";
            io.sockets.in(currentRoomNum).emit(currentRoomNum+'play_state_change',JSON.stringify(data));
            //准备倒计时时间
            var dealyTime = RoomStageTime["room_ready"];
            if(room.getZhuangType() == "fix" || room.getZhuangType() == "nnsz"){ //固定庄家 牛牛上庄
                if(room.getNumOfGame()>0){      //第二把开始不抢庄
                    var zhuang = room.getPlayer(room.getZhuangUser());
                    if(zhuang.getStatus()!="ready"){
                        //如果庄家未准备 换庄 ??
                        console.log('zhuang_:'+zhuang+'_offline_');
                    }else{
                        if(room.getPlayerStatusCount("ready") >= 2 && room.getOnlineCount() > 2 && room.getRoomStage() == "room_wait"){
                            room.setRoomStage("room_ready");
                            room.setStageTime(Date.parse(new Date())/1000);
                            var timeID = setTimeout(function(){
                                beginGame(currentRoomNum);
                            },dealyTime * 1000 );
                            UpdateRoomTime(room,timeID);
                        }
                    }
                }else{
                    if(room.getPlayerStatusCount("ready") >= 2 && room.getOnlineCount() > 2 && room.getRoomStage() == "room_wait"){
                        room.setRoomStage("room_ready");
                        room.setStageTime(Date.parse(new Date())/1000)
                        var timeID = setTimeout(function(){
                            beginGame(currentRoomNum);
                        },dealyTime * 1000 );
                        UpdateRoomTime(room,timeID);
                    }
                }
            }else{  //明牌抢庄 自由抢庄
                if(room.getPlayerStatusCount("ready") >= 2 && room.getOnlineCount() > 2 && room.getRoomStage() == "room_wait"){
                    room.setRoomStage("room_ready");
                    room.setStageTime(Date.parse(new Date())/1000);
                    var timeID = setTimeout(function(){
                        beginGame(currentRoomNum);
                    },dealyTime * 1000 );
                    UpdateRoomTime(room,timeID);
                }
            }
            //准备人数大于2人 且全部准备直接开始游戏
            if(room.getPlayerStatusCount("ready") >=2 && room.getPlayerStatusCount("ready") == room.getOnlineCount()){
                beginGame(currentRoomNum);
            }
        }
    })

    //抢庄
    socket.on('qiangzhuang',function(msg){
        console.log('qiangzhuang = '+JSON.stringify(msg));
        var msgBean = JSON.parse(msg);
        var qiangzhuang = msgBean.qiangzhuang;
        var room = roomMap[currentRoomNum];
        if(room == undefined){
            var data ={};
            data['info']="获取数据出错，请重试";
            socket.emit(currentRoomNum+'show_tips', JSON.stringify(data));
            return;
        }
        var player = room.getPlayer(currentUid);
        if(player.getStatus() !== "qiang"){
            var data ={};
            data['info']="已抢庄";
            socket.emit(currentRoomNum+'show_tips', JSON.stringify(data));
            return;
        }
        if(room.getRoomStage() !== "room_qiang"){
            var data ={};
            data['info']="抢庄时间已过";
            socket.emit(currentRoomNum+'show_tips', JSON.stringify(data));
            return
        }
        player.setQiangNum(qiangzhuang);
		player.setStatus("qianged");
		var data = {};
		data.uid = currentUid;
		data.state = "qiangzhuang";
		data.value = msgBean.qiangzhuang;
		io.sockets.in(currentRoomNum).emit(currentRoomNum+'play_state_change',JSON.stringify(data))
        socket.emit('qiangzhuang_done');
        //全部都抢庄
		if(room.getPlayCount() == room.getPlayerStatusCount("qianged")){
			clearTimeout(room.getTimeId());
			EndQiang(currentRoomNum);
		}
    })

    //下注
    socket.on('dealbaserate', function(msg){
        var msgBean = JSON.parse(msg);
        console.log('dealbaserate = '+JSON.stringify(msgBean));
		var room = roomMap[currentRoomNum];
		if(room == undefined){
			var data ={};
			data['info']="获取数据出错，请重试";
			socket.emit(currentRoomNum+'show_tips', JSON.stringify(data));
			return;
		}
		var player = room.getPlayer(currentUid);
        console.log('_player status_:'+player.getStatus());
		if(player.getStatus() !== "beishu"){
			var data ={};
			data['info']="已设置倍数";
			socket.emit(currentRoomNum+'show_tips', JSON.stringify(data));
			return;
        }
        console.log('_room status_:'+room.getRoomStage());
        if(room.getRoomStage() !== "room_beishu"){
            var data ={};
            data['info']="设置倍数时间已过";
            socket.emit(currentRoomNum+'show_tips', JSON.stringify(data));
            return;
        }

        player.setBaseRate(msgBean.rate);
		var data = {}
		data.uid = currentUid;
		data.state = "beishu";
		data.value = msgBean.rate;
		player.setStatus("beishued");
		io.sockets.in(currentRoomNum).emit(currentRoomNum+'play_state_change',JSON.stringify(data));
        socket.emit('dealbaserate_success');
        
        //确定除了庄家之外都下了注
        if(room.getPlayCount() == room.getPlayerStatusCount("beishued") + 1 ){
            clearTimeout(room.getTimeId());
            var playerList = room.getPlayerList();
			for(var i = 0; i < playerList.length; i++){
			    var player = playerList[i];
				if(player.isGrab==true){
					player.setStatus("beishued");
				}
            }
            if(room.getPlayType() == "see"){	//看牌局
                var data = {}
                data.state = "kanpai";
                io.sockets.in(currentRoomNum).emit(currentRoomNum+'kanpai_state_change',JSON.stringify(data));
            }else{
                dealingCard5(room);
                var data = {}
                data.state = "kanpai";
                io.sockets.in(currentRoomNum).emit(currentRoomNum+'kanpai_state_change',JSON.stringify(data));
            }
            room.setRoomStage("room_fanpai");
			room.setStageTime(Date.parse(new Date())/1000);
			var	timeID = setTimeout(function(){
				AutoShowAllPokers(room.getRoomNum());
			},RoomStageTime["room_fanpai"] * 1000 );
			UpdateRoomTime(room,timeID);
        }
    })

    //展示4张牌
	socket.on('showFourPokers', function(msg){
		console.log("showFourPokers:msg"+msg)
		try{
			var room = roomMap[currentRoomNum];
			if(room == undefined){
				var data ={};
				data['info']="获取数据出错，请重试";
				socket.emit(currentRoom+'show_tips', JSON.stringify(data));
				return;
			}
			var player = room.getPlayer(currentUid);
			if(player.getStatus()=="beishued" && (room.getPlayerStatusCount("beishued")+room.getPlayerStatusCount("arranging")+room.getPlayerStatusCount("arranged"))==room.getPlayCount()) {
				dealingUserCardFour(room,currentUid);
			}
		}catch(err){
			console.log("ErrorInfo: "+err);
			console.log("ErrorInfo: "+err.stack);
		}
    });
    
    //展示所有牌
	socket.on('showAllPokers', function(msg){
		//console.log("showAllPokers:msg"+msg)
		try{
			var room = roomMap[currentRoomNum];
			if(room == undefined){
				var data ={};
				data['info']="获取数据出错，请重试";
				socket.emit(currentRoomNum+'show_tips', JSON.stringify(data));
				return;
			}
			if(room!=undefined){
				if(room.getRoomStage() !== "room_fanpai"){
					return;
				}
				var player = room.getPlayer(currentUid);
				if(player.getStatus()=="beishued" && (room.getPlayerStatusCount("beishued")+room.getPlayerStatusCount("arranging")+room.getPlayerStatusCount("arranged"))==room.getPlayCount()) {
					dealingUserCardAll(room,currentUid)
                }
                //
				if((room.getPlayerStatusCount("arranging")+room.getPlayerStatusCount("arranged"))==room.getPlayCount()) {
					room.setRoomStage("room_arrang");
					clearTimeout(room.getTimeId());
					room.setStageTime(Date.parse(new Date())/1000);
					var	timeID = setTimeout(function(){
						AutoDeal(room.getRoomNum());
					},RoomStageTime["room_arrang"] * 1000 );
					UpdateRoomTime(room,timeID);
				}
			}
		}catch(err){
			console.log("ErrorInfo: "+err);
			console.log("ErrorInfo: "+err.stack);
		}
	});

    //摊牌
    socket.on('dealpoker', function(msg){
        var room = roomMap[currentRoomNum];
		if(room == undefined){
			var data ={};
			data['info']="获取数据出错，请重试";
			socket.emit(currentRoomNum+'show_tips', JSON.stringify(data));
			return;
		}
		var player = room.getPlayer(currentUid);
		if(player.getStatus() !== "arranging"){
			return;
		}
		if(room.getRoomStage() !== "room_arrang"&&room.getRoomStage() !== "room_fanpai"){
			return;
        }
        player.setStatus("arranged");
		socket.emit('dealpoker_done');
		var data = {};
		data.uid = player.getUid();
		data.cards = player.getPokerList();
		data.value = pm.cal(data.cards,room.conf);
		io.sockets.in(currentRoomNum).emit(currentRoomNum+'user_deal_poker_done',JSON.stringify(data));
		if(room.getPlayCount() == room.getPlayerStatusCount("arranged") ) {
			ComparePoker(room);
		}
    })

    //离开
    socket.on('disconnect',function(msg){
        try{
            //保存玩家离线信息
            setPlayerLine(currentUid,currentRoomNum,0);
            var room = roomMap[currentRoomNum];
            if(room==undefined){ return }
            var player = room.getPlayer(currentUid);
            console.log('disconnect：' + currentUid +"_roomNum:"+room.getRoomNum());
            if(player!=undefined)
            {
                player.setIsOnline(false);
                if(room!=undefined)
                {
                    var roomNum = room.getRoomNum();
                    if(player.IsJoinin() == true){
                        var info = GetRoomWithoutCard(room);
                        socket.broadcast.to(roomNum).emit(roomNum+'state_changed', JSON.stringify(info));	
                    }else{
                        //没有加入游戏的，从房间删除
                        room.leave(player);
                        var info = GetRoomWithoutCard(room);
                        socket.broadcast.to(roomNum).emit(roomNum+'state_changed', JSON.stringify(info));
                    }
                }
                io.sockets.in(room.getRoomNum()).emit(currentUid+"disconnect_server");
                socket.leave(currentRoomNum);
            }
        }catch(err){
			console.log("ErrorInfo: "+err);
			console.log("ErrorInfo: "+err.stack);
		} 
    })

    //检测玩家状态
    socket.on('checkPlayerStatus',function(msg){
        var msg = JSON.parse(msg);
        //console.log('checkPlayerStatus msg = '+JSON.stringify(msg));
        //checkPlayerStatus msg = {"roomNum":100008}
        var room = roomMap[msg.roomNum];
        if(room == undefined){
            //console.log(data.roomNum+"_checkPlayerStatus_room_undefined");
            var dataInfo ={};
            dataInfo['info']="获取数据出错，请重试";
            socket.emit(data.roomNum+'show_tips', JSON.stringify(dataInfo));
            return;
        }
        var player = room.getPlayer(currentUid);
		if(room.getRoomStage() == "room_finish"&&room.getNumOfGame()==room.getMaxOfGame()){
			var data = {}
			data.playerList = room.getPlayerList();
			data.playerList.sort(compare("score")).reverse();
			socket.emit(currentRoomNum+'gameFinish', JSON.stringify(data));
			return
        }
        if(room.getIsPlaying() && player){
            if(player.getStatus()=="standup"||player.getStatus()=="ready"){
                if(room.getRoomStage()!="room_ready"&&room.getRoomStage()!="room_wait"){
                    var msgBean = {};
                    msgBean.pokerList = new Array();
                    var info = GetRoomWithoutCard(room);
                    msgBean.playerList = info.playerList;
                    socket.emit(player.getUid() + 'dealingCards', JSON.stringify(msgBean));
                }
            }else if(player.getStatus()=="qiang"){
                //整理牌中
                if(room.getPlayType()=="see"){
                    var msgBean = {};
                    msgBean.pokerList = new Array();
                    for(var j=0;j<4;j++){
                        msgBean.pokerList.push(player.getPokerList()[j])
                    }
                    if(msgBean.pokerList.length <= 0){
                        
                    }
                    var info = GetRoomWithoutCard(room);
                    msgBean.playerList = info.playerList;
                    socket.emit(player.getUid() + 'dealingCards', JSON.stringify(msgBean));
                }
                socket.emit(currentRoomNum+'startGrab');
            }else if(player.getStatus()=="qianged"){
                //整理牌中
                if(room.getPlayType()=="see"){
                    var msgBean = {};
                    msgBean.pokerList = new Array();
                    for(var j=0;j<4;j++){
                        msgBean.pokerList.push(player.getPokerList()[j])
                    }
                    if(msgBean.pokerList.length <= 0){
                    }
                    var info = GetRoomWithoutCard(room);
                    msgBean.playerList = info.playerList;
                    socket.emit(player.getUid() + 'dealingCards', JSON.stringify(msgBean));
                }
                socket.emit(currentRoomNum+'startGrab');
                var data = {}
                data.uid = currentName;
                data.state = "qiangzhuang";
                data.value = player.getIsQiang();
                socket.emit(currentRoomNum+'play_state_change',JSON.stringify(data));
                socket.emit('qiangzhuang_done');
            }else if(player.getStatus()=="beishu"){
                //整理牌中
                if(room.getPlayType()=="see"){
                    var msgBean = {};
                    msgBean.pokerList = new Array();
                    for(var j=0;j<4;j++){
                        msgBean.pokerList.push(player.getPokerList()[j])
                    }
                    if(msgBean.pokerList.length <= 0){
                    }
                    msgBean.playerList = room.getPlayerList();
                    socket.emit(player.getUid() + 'dealingCards', JSON.stringify(msgBean));
                }
                socket.emit(currentRoomNum+'selectrate');
            }else if(player.getStatus()=="beishued"){
                //整理牌中
                if(room.getPlayType()=="see"){
                    var msgBean = {};
                    msgBean.pokerList = new Array();
                    for(var j=0;j<4;j++){
                        msgBean.pokerList.push(player.getPokerList()[j])
                    }
                    if(msgBean.pokerList.length <= 0){
                    }
                    var info = GetRoomWithoutCard(room);
                    msgBean.playerList = info.playerList;
                    socket.emit(player.getUid() + 'dealingCards', JSON.stringify(msgBean));
                }
                socket.emit(currentRoomNum+'selectrate');
                var data = {}
                data.uid = currentUid;
                data.state = "beishu";
                data.value = player.getBaseRate();
                socket.emit(currentRoomNum+'play_state_change',JSON.stringify(data));
                socket.emit('dealbaserate_success');
            }else if(player.getStatus()=="arranging"){
                //整理牌中
                var msgBean = {};
                msgBean.pokerList = player.getPokerList();
                if(msgBean.pokerList.length <= 0){
                }
                player.setPokerPlayList(null);
                socket.emit(player.getUid() + 'dealingTheFiveCards', JSON.stringify(msgBean));
            }else if(player.getStatus()=="arranged"){
                //整理好牌
                var data = {}
                data.uid = currentUid;
                data.state = "dealpoker";
                data.value = true;
                socket.emit(currentRoomNum+ 'play_state_change', JSON.stringify(data));
            }
        }
        var info = GetRoomWithoutCard(room);
		socket.emit('checkPlayerStatus_success',JSON.stringify(info));
    })

    //快捷语音
    socket.on('quick_chat',function(data){
		try{
			if(currentUid == null){return;}
			var chatId = data;
			io.sockets.in(currentRoomNum).emit('quick_chat_push',{sender:currentUid,content:chatId});
		}catch(err){
			console.log("ErrorInfo: "+err);
			console.log("ErrorInfo: "+err.stack);
		}
	});
})

//获取没有牌的房间数据 
function GetRoomWithoutCard(room){
	try{
		var obj = JSON.stringify(room, function(key, val){
			if(key == "timeID"){
				val = null;
			}
			return val;
		});
		var info = JSON.parse( obj )	//clone(room);
		for(var i = 0; i < info.playerList.length; i++){
			var p = info.playerList[i];
			p.pokerList = new Array();
		}
		return info;
	}catch(err){
		console.log("ErrorInfo: "+err);
		console.log("ErrorInfo: "+err.stack);
	}
}
//更新房间时间
function UpdateRoomTime(room,timeID){
	var data = {};
	data.roomNum = room.getRoomNum();
	data.roomStage = room.getRoomStage();
	data.stagetime = room.getStageTime();
	data.lasttime = RoomStageTime[data.roomStage];
	data.servertime = Date.parse(new Date())/1000;
	room.setTimeId(timeID); //先不保存
	io.sockets.in(data.roomNum).emit(data.roomNum+'room_time_update', JSON.stringify(data));
}
//开始游戏
function beginGame(roomNum){
    var room = roomMap[roomNum];
    console.log("_beginGame_:"+roomNum+"_jushu_:"+room.getNumOfGame()+"_stage_"+room.getRoomStage()+"_ready_count_:"+room.getPlayerStatusCount("ready"));
    //beginGame:100008_Num:0_stage_room_wait
    if(room.getPlayerStatusCount("ready") > 1){
        room.setRoomStage("room_qiang");
        clearTimeout(room.getTimeId());
        if( room.getNumOfGame() < room.getMaxOfGame() ){
            room.setNumOfGame(room.getNumOfGame()+1);
            //通知客户端更新当前局数
            io.sockets.in(roomNum).emit(roomNum+'startGame', JSON.stringify(room.getNumOfGame()));
            room.setIsPlaying(true);    //房间游戏开始

            //更新数据库房间状态
            updateRoomStatus(roomNum,1);
            for(var i = 0; i < room.getPlayerList().length; i++){
                var player =  room.getPlayerList()[i];
                if(player.getStatus() == "ready"){
                    player.setStatus("qiang");	//只有这边设置过这个状态，保证唯一，qiang的这个状态。。除非断线的神奇bug
                    player.Joinin();
                }
            }
            if(room.getPlayType() == "see"){	//看牌局 先发四张
                dealingCard4(room);
            }

            if(room.getZhuangType() == "turn"){	//抢庄局，通知抢庄
                for(var i = 0; i < room.getPlayerList().length; i++){
                    var player =  room.getPlayerList()[i];
                    player.setQiangNum(0);
                }
                room.setStageTime(Date.parse(new Date())/1000)
                var	timeID = setTimeout(function(){
                    AutoQiang(roomNum);
                },RoomStageTime["room_qiang"] * 1000 );
                UpdateRoomTime(room,timeID);
            }else if(room.getZhuangType() == "fix"){
                if(room.getNumOfGame()==1){
                    for(var i = 0; i < room.getPlayerList().length; i++){
                        var player =  room.getPlayerList()[i];
                        player.setQiangNum(0);
                    }
                    room.setStageTime(Date.parse(new Date())/1000)
                    var	timeID = setTimeout(function(){
                        AutoQiang(roomNum);
                    },RoomStageTime["room_qiang"] * 1000 );
                    UpdateRoomTime(room,timeID);
                }else{
                    for(var i = 0; i < room.getPlayerList().length; i++){
                        var player =  room.getPlayerList()[i];
                        if(player.getStatus() == "qiang"){
                            player.setStatus("beishu");
                            player.Joinin();
                        }
                    }
                    room.setStageTime(Date.parse(new Date())/1000)
                    var	timeID = setTimeout(function(){
                        AutoBaserate(roomNum);
                    },RoomStageTime["room_beishu"] * 1000 );
                    UpdateRoomTime(room,timeID);
                    var data = {}
                    data.user = new Array();
                    data.user.push(room.getZhuangUser());
                    data.zhuang = room.getZhuangUid();
                    io.sockets.in(roomNum).emit(roomNum+'deal_zhuang',JSON.stringify(data));
                    room.setRoomStage("room_beishu");
                }
            }else if(room.getZhuangType() == "nnsz"){
                if(room.getNumOfGame()==1){
                    console.log('_nnsz_'+room.getNumOfGame());
                    for(var i = 0; i < room.getPlayerList().length; i++){
                        var player =  room.getPlayerList()[i];
                        player.setQiangNum(0);
                    }
                    room.setStageTime(Date.parse(new Date())/1000)
                    var	timeID = setTimeout(function(){
                        AutoQiang(roomNum);
                    },RoomStageTime["room_qiang"] * 1000 );
                    UpdateRoomTime(room,timeID);
                }else{
                    console.log('_nnsz_'+room.getNumOfGame()+'_player status_'+player.getStatus()+'_room status_'+room.getRoomStage());
                    for(var i = 0; i < room.getPlayerList().length; i++){
                        var player =  room.getPlayerList()[i];
                        if(player.getStatus() == "qiang"){
                            player.setStatus("beishu");
                            player.Joinin();
                        }
                    }
                    room.setStageTime(Date.parse(new Date())/1000)
                    var	timeID = setTimeout(function(){
                        AutoBaserate(roomNum);
                    },RoomStageTime["room_beishu"] * 1000 );
                    UpdateRoomTime(room,timeID);
                    var data = {}
                    data.user = new Array();
                    data.user.push(room.getZhuangUser());
                    data.zhuang = room.getZhuangUid();
                    io.sockets.in(roomNum).emit(roomNum+'deal_zhuang',JSON.stringify(data));
                    room.setRoomStage("room_beishu");
                }
            }
            var data = {}
            data.playerList = room.getPlayerList();
            if(room.getZhuangType() == "turn"){
                io.sockets.in(roomNum).emit(roomNum+'startGrab', JSON.stringify(data));
            }else{
                if(room.getNumOfGame()==1&&(room.getZhuangType() == "fix"||room.getZhuangType() == "nnsz")){
                    io.sockets.in(roomNum).emit(roomNum+'startGrab', JSON.stringify(data));
                }else{
                    io.sockets.in(roomNum).emit(roomNum+'selectrate',JSON.stringify(data));
                }
            }
            var info = GetRoomWithoutCard(room);
            io.sockets.in(room.getRoomNum()).emit(room.getRoomNum()+'state_changed', JSON.stringify(info));
        }else{
            room.setRoomStage("room_finish");
			var data = {};
			data.playerList = room.getPlayerList();
			data.playerList.sort(compare("score")).reverse();
			io.sockets.in(roomNum).emit(roomNum+'gameFinish', JSON.stringify(data));
        }
    }else{
        room.setRoomStage("room_wait");
    }
}

//发牌4张
function dealingCard4(room){
    console.log('发牌4张')
	try{
		if(room.getPlayerNum == 12){
			var pokerMap = pm.genAllPokers12();
		}else{
			var pokerMap = pm.genAllPokers();
		}
		//console.log("[socket/dealingCard4]list:" + pokerMap)
		var playerList = room.getPlayerList();
		for(var i = 0; i < playerList.length; i++){
			var player = playerList[i];
			if(player.getIsPlayCurrent()){
				var msgBean = {};
				msgBean.pokerList = new Array();
				var pokerList = pokerMap[i];
                player.setPokerList(pokerList.slice());
                //console.log('pokerList = '+JSON.stringify(pokerList));
                //pokerList = [{"colourType":"fangkuai","num":10,"name":"fangkuai_10","value":0,"sortValue":0.1},{"colourType":"heitao","num":7,"name":"heitao_7","value":7,"sortValue":7.4},{"colourType":"hongtao","num":6,"name":"hongtao_6","value":6,"sortValue":6.3},{"colourType":"fangkuai","num":5,"name":"fangkuai_5","value":5,"sortValue":5.1},{"colourType":"meihua","num":5,"name":"meihua_5","value":5,"sortValue":5.2}]
				for(var j=0;j<4;j++){
					msgBean.pokerList.push(pokerList[j])
				}
				msgBean.playerList = room.getPlayerList();
				io.sockets.in(room.getRoomNum()).emit(player.getUid() + 'dealingCards', JSON.stringify(msgBean));
			}else{
				var msgBean = {};
				msgBean.pokerList = new Array();
				msgBean.playerList = room.getPlayerList();
				io.sockets.in(room.getRoomNum()).emit(player.getUid() + 'dealingCards', JSON.stringify(msgBean));
			}
		}
	}catch(err){
		console.log("ErrorInfo: "+err);
		console.log("ErrorInfo: "+err.stack);
	}
}
//发牌5张
function dealingCard5(room){
    console.log('发牌5张');
    if(room.getPlayerNum == 12){
        var pokerMap = pm.genAllPokers12();
    }else{
        var pokerMap = pm.genAllPokers();
    }
    var playerList = room.getPlayerList();
	for(var i = 0; i < playerList.length; i++){
		var player = playerList[i];
		if(player.getIsPlayCurrent()){
			var msgBean = {};
			msgBean.pokerList = new Array();
			var pokerList = pokerMap[i];
			// 保存牌到玩家对象中
			player.setPokerList(pokerList.slice());
			for(var j=0;j<3;j++){
				msgBean.pokerList.push(pokerList[j]);
			}
			//清空上一局的临时存储的牌，用户排好的牌
			player.setPokerPlayList(null);
			//修改用户当前状态
			if(msgBean.pokerList.length <= 0){
			}
			msgBean.playerList = room.getPlayerList();
			io.sockets.in(room.getRoomNum()).emit(player.getUid() + 'dealingCards', JSON.stringify(msgBean));
		}
	}
}
//自动抢庄
function AutoQiang(roomNum){
    try{
        var room = roomMap[roomNum];
        console.log("AutoQiang_"+roomNum +"_GameNum_:"+room.getNumOfGame() + "_"+room.getRoomStage());
        if(room.getRoomStage() !== "room_qiang"){
            return
        }
        clearTimeout(room.getTimeId());
        var playerList = room.getPlayerList();
        var num = 0;
        for(var i = 0; i < playerList.length; i++){
            var player = playerList[i];
            if(player.getStatus() == "qiang"){		
                player.QiangNum = 0;
                player.setStatus("qianged");
                var data = {}
                data.uid = player.getUid();
                data.state = "qiangzhuang";
                data.value = 0;
                io.sockets.in(roomNum).emit(roomNum+'play_state_change',JSON.stringify(data));
                num = num + 1;
            }
        }
        for(var m=0;m<playerList.length;m++){
            var player = playerList[m];
            if(player.getStatus() !== "qianged" && player.getStatus() !== "ready" && player.getStatus() !== "standup"){
                player.QiangNum = 0;
                console.log("error:qiang"+ roomNum + "_强制修改状态_"+player.getUid()+player.getStatus());
                player.setStatus("qianged");
            }
        }
        if(room.getRoomStage() == "room_qiang"){
            io.sockets.in(roomNum).emit('qiangzhuang_done');
            EndQiang(roomNum);
        }
    }catch(err){
		console.log("ErrorInfo: "+err);
		console.log("ErrorInfo: "+err.stack);
	}
}

//定庄
function EndQiang(roomNum){
    var room = roomMap[roomNum];
	var playerList = room.getPlayerList();
	//if(room.getPlayCount() == room.getPlayerStatusCount("qianged")){//设置了抢转状态的人数，和准备的人数一样
	var qiangNum4 = 0;          //4倍人数
	var qiangNum2 = 0;          //2倍人数
	var qiangNum1 = 0;          //1倍人数
	var lastQiangNum = 0;       //最大抢庄倍数的人数
    var turnBeishu = 0;         //最终倍数
    for(var i=0;i<playerList.length;i++){
        var p = playerList[i];
        if(p.getIsQiang() == 4){
            qiangNum4  = qiangNum4 + 1;
        }else if(p.getIsQiang() == 2){
            qiangNum2 = qiangNum2 + 1;
        }else if(p.getIsQiang() == 1){
            qiangNum1 = qiangNum1 + 1;
        }
    }
    if(qiangNum4 == 0 && qiangNum2 == 0 && qiangNum1 == 0){
        lastQiangNum = room.getPlayerStatusCount("qianged");
        turnBeishu = 0;
    };
    if(qiangNum4 !== 0 ){
        lastQiangNum = qiangNum4;
        turnBeishu = 4
    }
    if(qiangNum4 == 0 && qiangNum2 !== 0){
        lastQiangNum = qiangNum2;
        turnBeishu = 2
    }
    if(qiangNum4 == 0 && qiangNum2 == 0 && qiangNum1 !== 0){
        lastQiangNum = qiangNum1;
        turnBeishu = 1;
    }
    //随机庄家
    var zhuanIdx = Math.floor(Math.random()*lastQiangNum);
	var local = 0;
	var data = {};
    data.user = new Array();
    for(var i=0;i<playerList.length;i++){
        var p = playerList[i];
        if(p.getStatus() == "qianged"){
            if(p.getIsQiang() == turnBeishu  ){
                if(local == zhuanIdx){
                    room.setZhuangUser(p.getUid());
                    p.setIsGrab(true);
                    if(room.getZhuangType()=="fix"){
                        p.updateScore(room.getRoomConf().shangZhuang*1);
                    }
                    clearTimeout(room.getTimeId());
                    data.zhuang = p.getUid();
                    if(p.getIsQiang() == 0){
                        p.setQiangNum(1);
                    }
                }
                data.user.push(p.getUid());
                local = local + 1;
            }
            p.setStatus("beishu");
        }
    }
    var msgBean = {};
	var info = GetRoomWithoutCard(room);
	msgBean.playerList = info.playerList;
	msgBean.isdeal_zhuan = true;
	io.sockets.in(roomNum).emit(roomNum+'selectrate',JSON.stringify(msgBean));
	io.sockets.in(roomNum).emit(roomNum+'deal_zhuang',JSON.stringify(data));
	room.setRoomStage("room_beishu");
	clearTimeout(room.getTimeId());
	room.setStageTime(Date.parse(new Date())/1000)
	var	timeID = setTimeout(function(){
		AutoBaserate(roomNum);
	},RoomStageTime["room_beishu"] * 1000 );
	UpdateRoomTime(room,timeID);
}

//自动下注
function AutoBaserate(roomNum){
    var room = roomMap[roomNum];
	console.log("AutoBaserate_"+roomNum +"_GameNum_:"+room.getNumOfGame() + "_"+room.getRoomStage());
	if(room.getRoomStage() !== "room_beishu"){
		return
	}
	clearTimeout(room.getTimeId());
	var playerList = room.getPlayerList();
    for(var i = 0; i < playerList.length; i++){
        var player = playerList[i];
        if(player.isGrab==true){
            player.setStatus("beishued");
            continue
        }
    }
    if(player.getStatus() == "beishu"){		
        player.setBaseRate(1);
        player.setStatus("beishued");
        var data = {}
        data.uid = player.getUid();
        data.state = "beishu";
        data.value = 1;
        io.sockets.in(roomNum).emit(roomNum+'play_state_change',JSON.stringify(data));
    }
    for(var m=0;m<playerList.length;m++){
        var player = playerList[m];
        if(player.getStatus() !== "beishued" && player.getStatus() !== "ready" && player.getStatus() !== "standup"){
            player.setBaseRate(1);
            console.log("error:rate"+ roomNum + "_强制修改状态_"+player.getUid()+player.getStatus());
            player.setStatus("beishued");
        }
    }
    if(room.getRoomStage() == "room_beishu"){
        io.sockets.in(roomNum).emit('dealbaserate_success');
        if(room.getPlayType() == "see"){
            var data = {}
            data.state = "kanpai";
            io.sockets.in(roomNum).emit(roomNum+'kanpai_state_change',JSON.stringify(data));
        }else{
            dealingCard5(room);
            var data = {}
            data.state = "kanpai";
            io.sockets.in(roomNum).emit(roomNum+'kanpai_state_change',JSON.stringify(data));
        }
        room.setRoomStage("room_fanpai");
        clearTimeout(room.getTimeId());
        room.setStageTime(Date.parse(new Date())/1000)
        var	timeID = setTimeout(function(){
                AutoShowAllPokers(room.getRoomNum());
            },RoomStageTime["room_fanpai"] * 1000 );
        UpdateRoomTime(room,timeID);
    }
}

//自动看牌
function AutoShowAllPokers(roomNum){
    try{
		var room = roomMap[roomNum];
		if(room.getRoomStage() !== "room_fanpai"){
			return;
		}
		room.setRoomStage("room_arrang");
		for(var i=0;i<room.getPlayerList().length;i++){
			var player = room.getPlayerList()[i];
			if(player.getStatus()=="beishued" && (room.getPlayerStatusCount("beishued")+room.getPlayerStatusCount("arranging")+room.getPlayerStatusCount("arranged"))==room.getPlayCount()) {
				if(room.getPlayType() =="nor"){
					dealingUserCardFour(room,player.getUid());
				}
				dealingUserCardAll(room,player.getUid());
			}
		}
		clearTimeout(room.getTimeId());
		room.setStageTime(Date.parse(new Date())/1000)
		var	timeID = setTimeout(function(){
			AutoDeal(room.getRoomNum());
		},RoomStageTime["room_arrang"] * 1000 );
		UpdateRoomTime(room,timeID);
	}catch(err){
		console.log("ErrorInfo: "+err);
		console.log("ErrorInfo: "+err.stack);
	}
}

//展示第四张牌
function dealingUserCardFour(room,uid){
	try{
		var player = room.getPlayer(uid)
		if(player.getIsPlayCurrent()){
			var msgBean = {};
			msgBean.pokerList = new Array();
			for(var j=0;j<4;j++){
				msgBean.pokerList.push(player.getPokerList()[j])
			}
			player.setPokerPlayList(null);
			io.sockets.in(room.getRoomNum()).emit(player.getUid() + 'dealingTheFourCards', JSON.stringify(msgBean));
		}
	}catch(err){
		console.log("ErrorInfo: "+err);
		console.log("ErrorInfo: "+err.stack);
	}
}

//展示第五张牌
function dealingUserCardAll(room,uid){
	try{
		var player = room.getPlayer(uid)
		if(player.getIsPlayCurrent()){
			var msgBean = {};
			msgBean.pokerList = player.getPokerList();
			player.setStatus("arranging");
			player.setPokerPlayList(null);
			io.sockets.in(room.getRoomNum()).emit(player.getUid() + 'dealingTheFiveCards', JSON.stringify(msgBean));
		}
	}catch(err){
		console.log("ErrorInfo: "+err);
		console.log("ErrorInfo: "+err.stack);
	}
}
//自动摊牌
function AutoDeal(roomNum){
    //console.log('deal--');
    var room = roomMap[roomNum];
    clearTimeout(room.getTimeId());
	if(room.getRoomStage() == "room_arrang"){
		io.sockets.in(roomNum).emit('dealpoker_done');
		for(var i=0;i<room.getPlayerList().length;i++){
			var p = room.getPlayerList()[i];
			if(p.status=="arranging"){
				var data = {};
				data.uid = p.getUid();
				data.cards = p.getPokerList();
				data.value = pm.cal(data.cards,room.conf);
				io.sockets.in(roomNum).emit(roomNum+'user_deal_poker_done',JSON.stringify(data));
			}
		}
		ComparePoker(room);
	}
}
//牌型比较
function ComparePoker(room){
    if(room.getRoomStage() == "room_wait"){
        return
    }
    room.setRoomStage("room_wait");
    var playerList = room.getPlayerList();
    var result = pm.ComparePoker(room,room.getRoomConf());
    room.setScoreInfo(result);
    
    var post_data = {};
    var gameResult = new Array();
	var porkList = {}
	var zhuang = room.getPlayer(room.getZhuangUser());
	var isxiazhuang = false;
	var zhuangScore = 0;
	if(room.getZhuangType()=="fix" && room.getRoomConf().shangZhuang>0 && (result[zhuang.getUid()].score+zhuang.getScore())<=0){
		isxiazhuang = true;
		zhuangScore = zhuang.getScore();
	}
	var scoreTooLow = false;
	var resultinfo = new Array();
    var resultinfo2 = new Array();
    //下庄
	for(var k=0;k<playerList.length;k++){
		var player = playerList[k];
		if(player.getIsPlayCurrent()){
			var rs = {};
			rs.score = result[player.uid].score;
			rs.uid=player.uid;
			if(result[player.uid].score<=0){
				resultinfo.push(rs);
			}else{
				resultinfo2.push(rs);
			}
		}
    }

    if(isxiazhuang==true){
        resultinfo.sort(compare("score"));
        for (var i=0;i<resultinfo.length;i++) {
            var rs = resultinfo[i];
            if(rs.uid==zhuang.getUid()){
                result[rs.uid].score = -zhuang.getScore();
                continue;
            }
            zhuangScore = zhuangScore - rs.score;
        }
        resultinfo2.sort(compare("score")).reverse();
        for (var i=0;i<resultinfo2.length;i++) {
            var rs = resultinfo2[i];
            if(rs.uid==zhuang.getUid()){
                result[rs.uid].score = -zhuang.getScore();
                continue;
            }
            zhuangScore = zhuangScore - rs.score;
            if(scoreTooLow == false){
                if(zhuangScore<=0){
                    result[rs.uid].score = zhuangScore+rs.score;
                    scoreTooLow = true
                }
            }else{
                result[rs.uid].score = 0;
            }
        }   
    }

    for(var k=0;k<playerList.length;k++){
        var player = playerList[k];
        if(player.getIsPlayCurrent()){
            //更新玩家积分
            player.updateScore(result[player.getUid()].score);
            if(result[player.getUid()].value==10){
                player.setLastnn(true)
            }
            result[player.getUid()].totalScore =player.getScore();
            var oneResult={};
            oneResult['uid']=player.getUid();
            oneResult['score']=result[player.getUid()].score;
            oneResult["cards"]=result[player.getUid()].cards
            gameResult.push(oneResult);
            var pokers ={};
            for(var n=0;n<player.pokerList.length;n++){
                pokers[n]={}
                pokers[n]['name']=player.pokerList[n]['name'];
            }
            porkList[player.uid]={};
            porkList[player.uid]['porkList']= pokers
            if(player.isGrab==false||player.isGrab==null){
                porkList[player.uid]['rate']= player.baserate;
            }else{
                porkList[player.uid]['rate']= player.QiangNum==0?1:player.QiangNum;
            }
            porkList[player.uid]['niu']=result[player.getUid()].value;
            porkList[player.uid]['isbanker']= player.isGrab;
        }
    }
    io.sockets.in(room.getRoomNum()).emit(room.getRoomNum()+'game_score', JSON.stringify(result));
    clearTimeout(room.getTimeId());
    var fn1=function(){
        for(var k=0;k<playerList.length;k++){
            var player = playerList[k];
            if(player.getIsPlayCurrent()){
                player.setStatus("standup");
            }else{
                if(player.getStatus() !== "ready"){
                    player.setStatus("standup");
                }
            }
        }
        var info_temp = GetRoomWithoutCard(room);
        var info= JSON.stringify(info_temp)
        io.sockets.in(room.getRoomNum()).emit(room.getRoomNum()+'state_changed', info);
        room.restartGame();
    }
    setTimeout(fn1,3500);
    if(room.getNumOfGame()==room.getMaxOfGame()){
        room.setRoomStage("room_finish");
        //更新数据库房间状态
        updateRoomStatus(room.getRoomNum(),2);
    }

    var dtime=Date.parse(new Date())/1000;
    post_data['roomNum'] = room.getRoomNum();
    post_data['inningsNum'] = room.getNumOfGame();
    post_data['result'] = JSON.stringify(gameResult);
    post_data['time'] = dtime;
    post_data['extInfo'] = JSON.stringify(porkList);
    saveMatch(post_data);

    var info_temp = GetRoomWithoutCard(room);
    var info= JSON.stringify(info_temp)
    if(isxiazhuang==true){
        room.setRoomStage("room_finish");
        var fn=function(){
            var data = {}
            data.playerList = room.getPlayerList();
            data.playerList.sort(compare("score")).reverse();
            io.sockets.in(room.getRoomNum()).emit(room.getRoomNum()+'gameFinish', JSON.stringify(data));
        }
        setTimeout(fn,3000);
    }
    //牛牛上庄 确定上把牛牛玩家 本局为庄家
    if(room.getZhuangType()=="nnsz"){
        deal_shangZhuang(room);
    }
}
//牛牛上庄定庄
function deal_shangZhuang(room){
	try{
		var lastnnNum=room.getLastnnCount();
		var playerList = room.getPlayerList();
		var lastzhuang =0;
		if(lastnnNum>0){
			var zhuanIdx = Math.floor(Math.random()*lastnnNum)
			var local = 0;
			var data = {};
			data.user = new Array();
			for(var i=0;i<playerList.length;i++){
				var p = playerList[i];
				if(p.isGrab == true){
					lastzhuang = p;
					p.setIsGrab(false);
				}
				if(p.getLastnn() == true){
					if(local == zhuanIdx){
						room.setZhuangUser(p.getUid());
						p.setIsGrab(true);
						data.zhuang = p.getUid();
						p.setQiangNum(lastzhuang.getIsQiang());
						lastzhuang.setQiangNum(0);
					}
					data.user.push(p.getUid());
					local = local + 1;
				}
			}
		}
	}catch(err){
		console.log("ErrorInfo: "+err);
		console.log("ErrorInfo: "+err.stack);
	}
}
//排行
function compare(propertyName) {
	try{
		return function(object1, object2) {
		var value1 = object1[propertyName];
		var value2 = object2[propertyName];
		if (value2 < value1) {
			return 1;
		} else if (value2 > value1) {
			return -1;
		} else {
			return 0;
		}
		}
	}catch(err){
		console.log("ErrorInfo: "+err);
		console.log("ErrorInfo: "+err.stack);
	}
}
//更新数据库房间状态 1=开始 2=结束
function updateRoomStatus(roomNum,status){
    myDB.update_room_status(roomNum,status);
};
//设置玩家在线离线状态
function setPlayerLine(uid,roomId,status){
    myDB.get_player_line_info(uid,function(data){
        if(data){
            //更新在线信息
            myDB.update_player_online(uid,roomId,status,data.login_num+1);
        }else{
            //添加在线信息
            myDB.insert_player_online(uid,roomId,status);
        }
    })
}
//超时删除数据库房间
function deleteRoom(roomId){
    myDB.delete_room(roomId);
}
//保存战绩
function saveMatch(data){
    //console.log('data = '+JSON.stringify(data));
    myDB.insert_match(data.roomNum,data.inningsNum,data.result,data.extInfo,data.time);
}


//1分钟后开始计时 如果房间90分钟后未开始
var oneSecond = 1000 * 60 * 1 ;
setInterval(function() {
	for (var k in roomMap) {
		var room = roomMap[k]
		if(room.isPass()){
            //退回玩家房卡
            myDB.get_room_data(room.getRoomNum(),function(res){
                myDB.get_user_data(res.create_uid,function(user){
                    if(room.getRoomConf().jushu == 1){
                        num = user.card + 1;
                    }else if(room.getRoomConf().jushu == 2){
                        num = user.card + 2;
                    }
                    myDB.update_user_card(res.create_uid,num,function(ret){
                        deleteRoom(room.getRoomNum());
                        console.log("TimePass_delRoom",room.getRoomNum());
                        delete roomMap[k];
                    })
                })
            })
		}
  	}
}, oneSecond);
//90分后自动设置房间为结束状态
var oneSecond2 = 1000 * 60 * 90 ;
setInterval(function() {
	for (var k in roomMap) {
		var room = roomMap[k]
		if(room.isFinish()){
            console.log("RoomFinish_delRoom",room.getRoomNum());
            updateRoomStatus(room.getRoomNum(),2);
			delete roomMap[k];
		}
  	}
}, oneSecond2);