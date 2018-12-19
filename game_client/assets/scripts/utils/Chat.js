cc.Class({
    extends: cc.Component,

    properties: {
        _chatVoice:null,
        _chatRoot:null,
        _tabQuick:null,
        _tabEmoji:null,
        _tabQuickBtn:null,
        _tabEmojiBtn:null,
        _iptChat:null,
        _bg2:null,
        _quickChatInfo:null,
    },

    onLoad: function () {
        var self = this;
        this.node.active = true;
        this._chatVoice = cc.find("Canvas/seatinfo/chat_voice");
        this._chatVoice.active = true;
        
        this._tabQuickBtn = this.node.getChildByName("chatinfo").getChildByName("tabMsg");
        this._tabEmojiBtn = this.node.getChildByName("chatinfo").getChildByName("tabEmoji");
        cc.loader.loadRes("chat/tabMsg_2", cc.SpriteFrame, function (err, spriteFrame) {
			self._tabQuickBtn.getComponent(cc.Button).normalSprite = spriteFrame;
        });
        
        this._tabQuick = this.node.getChildByName("chatinfo").getChildByName("msgScroll");
        var quickchildren = this._tabQuick.getChildByName("view").getChildByName("content").children;
        for (var i = 0; i < quickchildren.length; ++i) {
            if(quickchildren[i].name.indexOf("item")>=0){
                cc.vv.uitools.addClickEvent(quickchildren[i],this.node,"Chat","onQuickChatItemClicked");
            }
        }

        cc.vv.netRoot.on('show_chat_click',function(msgBean){
            self.node.active = true;
        });
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
    },
    
    getQuickChatInfo:function(index){
        var key = "item" + index;
        return this._quickChatInfo[key];   
    },

    
    onBtnChatClicked:function(){
        this.node.active = !this.node.active;
    },
    
    onBgClicked:function(){
        this.node.active = false;
    },

    onTabClicked:function(event){
        var self = this;
        if(event.target.name == "tabMsg"){
            this._tabQuick.active = true;
            cc.loader.loadRes("chat/tabMsg_2", cc.SpriteFrame, function (err, spriteFrame) {
				self._tabQuickBtn.getComponent(cc.Button).normalSprite = spriteFrame;
			});
        }
        else if(event.target.name == "tabEmoji"){
            this._tabQuick.active = false;
            cc.loader.loadRes("chat/tabMsg_1", cc.SpriteFrame, function (err, spriteFrame) {
				self._tabQuickBtn.getComponent(cc.Button).normalSprite = spriteFrame;
			});
        }
    },
    
    onQuickChatItemClicked:function(event){
        this.node.active = false;
        var info = this._quickChatInfo[event.target.name];
        cc.vv.socket.send('quick_chat', info.index);
    },
    
    onEmojiItemClicked:function(event){
        this.node.active = false;
        cc.vv.socket.send("emoji",event.target.name);
    },
});
