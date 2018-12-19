module.exports = Room;

function Room(roomInfo){
    //roomInfo:{"id":100008,"conf":"{\"wanfa\":0,\"difen\":1,\"guize\":1,\"paixing\":[],\"beishu\":[1,2,4,6],\"shijian\":[10,10,10,10],\"jushu\":1,\"shangzhuang\":0}","status":0,"type":"nn","max_player":6,"code":"nn6"}
	this.roomNum = roomInfo.id;				//房号
	this.conf = JSON.parse(roomInfo.conf); //规则
	this.playerNum = roomInfo.max_player;  //最大人数
	this.playerList = new Array();			//玩家列表
	this.isPlaying = false;					//是否开始
    this.numOfGame = 0;						//当前局数
    if(this.conf.jushu == 1){
        this.maxOfGame = 12;				//总局数
    }else if(this.conf.jushu == 2){
        this.maxOfGame = 24;				//总局数
    }
	this.zhuangUser = null; 				//庄家uid
	this.scoreInfo = {};					//每局比牌结束后的分数信息
	
	if(this.conf.wanfa == 0){
		this.playType = "see";				//发牌玩法
		this.zhuangType = "turn";			//抢庄玩法
	}else if(this.conf.wanfa == 1){
		this.playType = "nor";
		this.zhuangType = "nnsz";
	}else if(this.conf.wanfa == 2){
		this.playType = "nor";
		this.zhuangType = "turn";
	}else if(this.conf.wanfa == 3){
		this.playType = "nor";
		this.zhuangType = "fix";
	}
	this.roomStage = "room_wait";		//room_wait room_ready	room_qiang	room_beishu	room_fanpai	room_arrang	arranging	arranged
	this.stagetime = Date.parse(new Date())/1000;
	this.startTime = roomInfo.create_time*1000;	//房间创建时间
	this.timeID = null;			//计时器id
}

//设置属性
Room.prototype.join = function(player){
	this.playerList.push(player);
};
Room.prototype.setZhuangUser=function(uid){
	return this.zhuangUser = uid;
};
Room.prototype.setTimeId=function(timeid){
	this.timeID = timeid;
};
Room.prototype.setRoomStage=function(roomStage){
	this.roomStage = roomStage;
};
Room.prototype.setStageTime=function(time){
	this.stagetime = time;
};
Room.prototype.setNumOfGame=function(numOfGame){
	this.numOfGame = numOfGame;
};
Room.prototype.setIsPlaying=function(isPlaying){
	this.isPlaying = isPlaying;
};
Room.prototype.setScoreInfo=function(scoreInfo){
	this.scoreInfo = scoreInfo;
};

//获取属性
Room.prototype.getRoomStage=function(){
	return this.roomStage;
};
Room.prototype.getPlayer = function(uid){
	for(var k = 0; k < this.playerList.length; k++){
		var p = this.playerList[k];
		if(p.uid == uid){
			return p
		}
	}
	return null;
};
Room.prototype.getPlayerList=function(){
	return this.playerList;
};
Room.prototype.getNumOfGame=function(){
	return this.numOfGame;
};
Room.prototype.getMaxOfGame=function(){
	return this.maxOfGame;
};
Room.prototype.getZhuangType=function(){
	return this.zhuangType;
};
Room.prototype.getZhuangUser=function(){
	return this.zhuangUser;
};
Room.prototype.getPlayerStatusCount = function(status){
	var num = 0
	for(var k = 0; k < this.playerList.length; k++){
		var p = this.playerList[k]
		if(p.getStatus() == status){
			num = num + 1;
		}
	}
	return num;
};
Room.prototype.getOnlineCount=function(){
	var num = 0
	for(var k = 0; k < this.playerList.length; k++){
		var p = this.playerList[k]
		if(p.getIsOnline()){
			num = num + 1;
		}
	}
	return num;
};
Room.prototype.getRoomNum=function(){
	return this.roomNum;
};
Room.prototype.getStageTime=function(){
	return this.stagetime;
};
Room.prototype.getTimeId=function(){
	return this.timeID;
};
Room.prototype.getPlayType = function(){
	return this.playType;
}
Room.prototype.getZhuangUid = function(){
	for(var i = 0; i < this.playerList.length; i++){
		if(this.playerList[i].getIsGrab()){
			return this.playerList[i].getUid();
		}
	}
	return 0
};
Room.prototype.getPlayerNum = function(){
	return this.playerNum;
}
Room.prototype.getPlayCount=function(){
	var num = 0
	for(var k = 0; k < this.playerList.length; k++){
		var p = this.playerList[k]
		if(p.getStatus() != "standup" && p.getStatus() != "ready"){
			num = num + 1;
		}
	}
	return num;
};
Room.prototype.getRoomConf=function(){
	return this.conf;
};
Room.prototype.getLastnnCount=function(){
	var num = 0
	for(var k = 0; k < this.playerList.length; k++){
		var p = this.playerList[k]
		if(p.getLastnn()==true){
			num = num + 1;
		}
	}
	return num;
};
Room.prototype.getIsPlaying=function(){
	return this.isPlaying;
};

//判断
Room.prototype.isExistPlayer = function(uid){
	for(var k in this.playerList) {
		var p = this.playerList[k]
		if(p.uid == uid){
			return true
		}
	}
	return false
};
Room.prototype.isPass = function(){
	if(this.isPlaying){
		return false
	}else{
		if(Date.now() - this.startTime > 1000 * 60 * 90){
			return true
		}
	}
	return false
};
Room.prototype.isFinish = function(){
	if(this.roomStage == "room_finish"){
		return true;
	}
	return false
};

Room.prototype.restartGame = function(){
	for(var k in this.playerList) {
		var p = this.playerList[k];
		p.pokerList = new Array();
		p.pokerPlayList = new Array();
		if(this.zhuangType=="turn"){
			p.isGrab = null;
		}
		p.baserate = 0;
	}
};

Room.prototype.leave = function(player){
	var index = 0;
	for(var i = 0; i < this.playerList.length; i++){
		if(this.playerList[i].getUid() == player.getUid()){
			index = i
		}
	}
	this.playerList.splice(index, 1);
};