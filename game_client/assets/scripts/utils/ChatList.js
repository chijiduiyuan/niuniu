cc.Class({
    extends: cc.Component,

    properties: {
        chatVoices:{
            default:[],
            type:[cc.Node],
        },
        chatNode:cc.Node,
    },

    onLoad: function () {
        var self = this
        this._quickChatInfo = {};
        this._quickChatInfo["item0"] = {index:0,content:"玩游戏，请先进群 ",sound:"fix_msg_1.m4a"};
        this._quickChatInfo["item1"] = {index:1,content:"群内游戏，切勿转发 ",sound:"fix_msg_2.m4a"};
        this._quickChatInfo["item2"] = {index:2,content:"别磨蹭，快点打牌 ",sound:"fix_msg_3.m4a"};
        this._quickChatInfo["item3"] = {index:3,content:"我出去叫人 ",sound:"fix_msg_4.m4a"};
        this._quickChatInfo["item4"] = {index:4,content:"你的牌好靓哇 ",sound:"fix_msg_5.m4a"};
        this._quickChatInfo["item5"] = {index:5,content:"我当年横扫澳门五条街 ",sound:"fix_msg_6.m4a"};
        this._quickChatInfo["item6"] = {index:6,content:"算你牛逼 ",sound:"fix_msg_7.m4a"};
        this._quickChatInfo["item7"] = {index:7,content:"别跟我抢庄 ",sound:"fix_msg_8.m4a"};
        this._quickChatInfo["item8"] = {index:8,content:"输得裤衩都没了 ",sound:"fix_msg_9.m4a"};
        this._quickChatInfo["item9"] = {index:9,content:"我给你们送温暖了 ",sound:"fix_msg_10.m4a"};
        this._quickChatInfo["item10"] = {index:10,content:"谢谢老板 ",sound:"fix_msg_11.m4a"};
        this._quickChatInfo["item11"] = {index:11,content:"别吹牛逼,有本事战到底 ",sound:"fix_msg_12.m4a"};
        cc.vv.netRoot.on('quick_chat_push',function(data){
            var data = data;
            var localIndex = cc.vv.gameNetMgr.getSeatNodeByUid(data.sender);
            var index = data.content;
            var info = self.getQuickChatInfo(index);

            var cVoice = self.chatVoices[localIndex].getComponent("Voice");
            cVoice.chat(info.content);
            cc.vv.audioMgr.playSFX(info.sound);
        });
        
        cc.vv.netRoot.on('emoji_push',function(data){
            var data = data.detail;
            var localIndex = cc.vv.gameNetMgr.getSeatNodeByUid(data.sender);
            var cVoice = self.chatVoices[localIndex].getComponent("Voice");
            cVoice.emoji(data.content);
        });
    },

    getQuickChatInfo:function(index){
        var key = "item" + index;
        return this._quickChatInfo[key];   
    },

    onShowChatClick:function(){
        cc.vv.uitools.ShowLayer("Chat",cc.director.getScene());
    },
    onShowChatClick2:function(){
        this.chatNode.active = true;
    },
    
});
