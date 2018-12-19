/**
 * 显示场景信息 场景按钮点击事件
 */
cc.Class({
    extends: cc.Component,

    properties: {
        roomIdLable:cc.Label, //桌号
        difenLable:cc.Label,    //底分
        //_roombeishu:null,   //倍数
        jushuLabel:cc.Label,    //局数
        cardLabel:cc.Label,     //房卡数量
        tipNode:cc.Node,        //提示节点
        tipLabel:cc.Label,         //提示

        _choiceBtn:null,
        _tipslast:null,
        _lastTime:0,
        _shengyinBtn:null,
        _homeBtn:null,
    },

    onLoad: function () {
        //页面显示信息                  
        this.roomIdLable.string = "桌号："+ Grobal.roomNum;      //桌号
        this.cardLabel.string=cc.vv.userMgr.houseCard+"张";     //房卡
        this.difenLable.string = "底分:"+Grobal.difen;   //底分

        if(Grobal.numOfGame==0){
            this.jushuLabel.string="1 / "+Grobal.maxOfGame+" 局";
        }else{
            this.jushuLabel.string=""+Grobal.numOfGame+" / "+Grobal.maxOfGame+" 局";
        }

        //this._chatBtn = this.node.getChildByName("gameview").getChildByName("chatBtn");
        // if(this._chatBtn!=null){
        //     cc.vv.uitools.addClickEvent(this._chatBtn,this.node,"GameLogic","ShowControlList");
        // }
        
        //初始化tipsNode 接收node.emit消息
        this.initHandlers();
    },


    initHandlers: function() {
        var self = this;
        cc.vv.netRoot.on('show_tips_message', function (msg) {
            self.ShowTips(msg);
        }, this);
    },
    
    ShowTips: function(msg) {
        var self = this;
        if (msg == null) {
            self.tipNode.active = false;
        } else {
            self.tipNode.active = true;
            self.tipLabel.string = msg;
            self.tipNode.height = this.tipNode.getChildByName("label").height + 20;
        }
    },

    //显示语音列表
    ShowControlList:function(){
        var self = this;
        cc.loader.loadRes("prefabs/ControllUI",function(err,prefab){
            if(self.node.getChildByName("ControllUI") == null){
                 var layer = cc.instantiate(prefab);
                 self.node.addChild(layer);
            }
        });
             
    },

    //点击规则
    onGuizeBtnClick: function() {
        cc.vv.uitools.ShowLayer("Rule", this.node);
    },
    //点击提示
    onTishiClick: function() {
        cc.vv.uitools.ShowLayer("TipRule", this.node);
    },
    //点击声音设置
    onShengyinBtnClick: function() {
        cc.vv.uitools.ShowLayer("SettingUI2", this.node);
    },
    //点击返回大厅
    onHomeBtnClick: function() {
        cc.vv.uitools.ShowAlert(cc.director.getScene(), "确认返回主页", function () {
            window.parent.location.href=Grobal.hallUrl;
        }, true);
    },
    //点击玩法
    onWanfaBtnClick: function() {
        cc.vv.uitools.ShowLayer("Rule", this.node);
    },

    update: function(dt) {
        if (this.tipNode.active == true) {
            var str = this.tipLabel.string.replace(this._tipslast, "");
            if (Date.now() - this._lastTime > 1000) {
                if (this._tipslast == null || this._tipslast == "...") {
                    this._tipslast = ".";
                } else {
                    this._tipslast = this._tipslast + ".";
                }
                this.tipLabel.string = str + this._tipslast;
                this._lastTime = Date.now();
            }
        }
    }
});
