cc.Class({
    extends: cc.Component,

    properties: {
        tipLabel:cc.Label,
        _tipStr:'1',
        _isloading:false,
        _progress:0.0,

        _lasttime:0,
        _load:0,
    },

    onLoad: function () {
        cc.args = this.urlParse();
        this.initMgr();
    },

    initMgr: function(){
        cc.vv = {};
        cc.vv.socket = require("../utils/Socket");

        var UserMgr = require("../mgr/UserMgr");
        cc.vv.userMgr = new UserMgr();

        if(cc.vv.gameNetMgr == undefined){
            var GameNetMgr = require("../mgr/GameNetMgr");
            cc.vv.gameNetMgr = new GameNetMgr();
        }

        var root = cc.find("root");
        cc.vv.gameNetMgr.dataEventHandler = root;
        cc.vv.netRoot = root;

        var UI = require("../comp/UI");
        cc.vv.uitools = new UI();

        var AudioMgr = require("../mgr/AudioMgr");
        cc.vv.audioMgr = new AudioMgr();
        cc.vv.audioMgr.init();

        this.startPreLoading();
    },

    startPreLoading: function (){
        var self = this;
        self._tips =  cc.find("Canvas/nettips");
        self._tipLabel = self._tips.getComponent(cc.Label);
        if(cc.args == undefined){
            cc.args = {};
        }
        if(cc.args['roomNum'] == undefined || cc.args['uid'] == undefined){
            cc.vv.uitools.ShowAlert(cc.director.getScene(),"无效链接",function(){
                window.parent.location.href=Grobal.hallUrl;
            },false);
            return;
        }
        //登陆服务器
        cc.vv.userMgr.login();
        //连接服务器失败
        cc.vv.netRoot.on('show_tips_message',function(msg){
            this.ShowTips(msg);
        },this);
    },

    ShowTips:function(msg){
        var self = this;
        if(msg == null){
            self._tips.active = false
        }else{
            self._tips.active = true
            self._tipLabel.string = msg;
        }
    },

    urlParse:function(){
        var params = {};
        if(window.location == null){
            return params;
        }
        var name,value; 
        var str=window.location.href; 
        var num=str.indexOf("?") 
        var href = str.substr(0,num)
        str=str.substr(num+1); 
        
        var arr=str.split("&"); 
        for(var i=0;i < arr.length;i++){ 
            num=arr[i].indexOf("="); 
            if(num>0){ 
                name=arr[i].substring(0,num);
                value=arr[i].substr(num+1);
                params[name]=value;
            } 
        }
        params["href"]=href;
        return params;
    },


});
