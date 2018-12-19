module.exports = Player;

function Player(userInfo){
	this.uid = userInfo.uid; //uid	
	this.nickname = userInfo.nickname; //昵称
    this.avatar = userInfo.avatar;      //头像
    this.houseCard = userInfo.card;     //房卡
	this.pokerList = new Array();       //牌组
	this.pokerPlayList = null;	        //摆好的牌
	this.onlineTime = Date.now();
    this.isOnline = true;               //是否在线
    this.isReady = false;               //是否准备
	this.isGrab = null;	                //是否庄家
	this.status = "standup";            //玩家状态			standup ready qiang qianged beishu beishued arranging arranged
	this.joinin = false				//是否加入当前局
	this.baserate = 0;				//下注倍数
	this.score = 0;					//分数
	this.lastnn = false;
	this.QiangNum = 0;				//抢庄倍数
}
//设置属性
Player.prototype.setStatus=function(status){
	this.status = status;
};
Player.prototype.setIsOnline=function(isOnline){
	this.isOnline = isOnline;
};
Player.prototype.Joinin=function(){
	this.joinin = true;
};
Player.prototype.setQiangNum=function(beishu){
	this.QiangNum = beishu;
};
Player.prototype.setPokerList=function(pokerList){
	if(pokerList == null){
		this.pokerList = new Array()
	}else{
		this.pokerList = pokerList;
	}
};
Player.prototype.setIsGrab=function(isGrab){
	this.isGrab = isGrab;
};
Player.prototype.updateScore=function(score){
	this.score = this.score + score;
};
Player.prototype.setBaseRate=function(rate){
	this.baserate = rate
};
Player.prototype.setPokerPlayList=function(pokerPlayList){
	this.pokerPlayList = pokerPlayList;
};
Player.prototype.setLastnn=function(lastnn){
	this.lastnn = lastnn;
};

//获取属性
Player.prototype.getStatus=function(){
	return this.status;
};
Player.prototype.getIsOnline=function(){
	return this.isOnline;
};
Player.prototype.getIsGrab=function(){
	return this.isGrab;
};
Player.prototype.getUid=function(){
	return this.uid;
};
Player.prototype.getIsPlayCurrent=function(status){
	if(this.status =="standup" || this.status == "ready"){
		return false;
	}
	return true;
};
Player.prototype.getIsQiang=function(){
	return this.QiangNum
};
Player.prototype.getPokerList=function(){
	return this.pokerList;
};
Player.prototype.getBaseRate=function(){
	return this.baserate;
};
Player.prototype.getScore=function(){
	return this.score;
};
Player.prototype.getLastnn=function(){
	return this.lastnn;
};

Player.prototype.IsJoinin=function(){
	return this.joinin;
};