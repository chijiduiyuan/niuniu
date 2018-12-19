if(window.io == null){
   // window.io = require("socket-io");
}


var Global = cc.Class({
    extends: cc.Component,

    statics:{
        ip:"47.104.17.36:3000",
        //ip:"127.0.0.1:3000",
        sio:null,
        isPinging:false,
        fnDisconnect:null,
        timeId:null,
        handlers:{},
        online:true,
        addHandler:function(event,fn){
            if(this.handlers[event]){
                return;
            }
            var handler = function(data){
                if(event != "disconnect" && typeof(data)=="string"){
                    //console.log("Socket:"+data)
                    data = JSON.parse(data);
                }
                fn(data);
            };
            this.handlers[event] = handler;
            if(this.sio){
                this.sio.on(event,handler);
            }
        },

        connect:function(callback){
            var self = this;
            var opts = {
                'reconnect':true,
                'reconnectionAttempts':10,
                'reconnectionDelay':1000,
                'reconnectionDelayMax':2000,
                'timeout':5000,
                'force new connection': true,
                'max reconnection attempts':10,
                'transports':['websocket', 'polling']
            }
            var isReconnext=false;
            this.sio = window.io.connect(this.ip,opts);
            this.sio.on('connecting',function(data){
            });
            this.sio.on('connect',function(data){
                self.sio.connected = true;
                if(isReconnext){
                    cc.vv.gameNetMgr.dispatchEvent('reconnect_update',null);
                }else{
                    cc.vv.gameNetMgr.dispatchEvent('conect_success','conect success');
                }
            });
            this.sio.on('reconnecting',function(data){
                cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"正在重连");
            });
            this.sio.on('reconnect',function(data){
                cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"重连成功");
                isReconnext = true;
            });
            this.sio.on('connect_error',function(data){
                cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"重连失败");
            });
            this.sio.on('disconnect',function(data){
                self.sio.connected = false;
                cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"已断开连接，请重进");
            });
            this.sio.on('reconnect_failed',function(data){
                cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"重连失败，请重进");
                cc.vv.uitools.ShowAlert(cc.director.getScene(),"你已断开连接,请重新连接",function(){
                    window.parent.location.href=Grobal.hallUrl+"?uid="+cc.args['uid']+"&roomNum="+cc.args['roomNum'];
                },false);
            });
            this.sio.on('connect_failed',function (){
                cc.vv.gameNetMgr.dispatchEvent('show_tips_message',"连接失败");
                isReconnext = true;
            });

            for(var key in this.handlers){
                var value = this.handlers[key];
                if(typeof(value) == "function"){
                    if(key == 'disconnect'){
                        this.fnDisconnect = value;
                    }else{
                        this.sio.on(key,value);                        
                    }
                }
            }
        },

        send:function(event,data){
            if(this.sio && this.sio.connected){
                if(data != null && (typeof(data) == "object")){
                    data = JSON.stringify(data);
                }
                this.sio.emit(event,data);                
            }
        },

        startHearbeat: function startHearbeat() {
            this.sio.on('game_pong', function (data) {
                self.lastRecieveTime = Date.now();
                self.delayMS = self.lastRecieveTime - self.lastSendTime;
                if (self.online == false) {
                    cc.vv.gameNetMgr.dispatchEvent('show_tips_message', null);
                    cc.vv.gameNetMgr.dispatchEvent('reconnect_update', null);
                }
                self.online = true;
            });
            this.lastRecieveTime = Date.now();
            var self = this;
            if (!self.isPinging) {
                self.isPinging = true;
                cc.game.on(cc.game.EVENT_HIDE, function () {
                    self.ping();
                });
                setInterval(function () {
                    if (self.sio) {
                        self.ping();
                    }
                }.bind(this), 5000);
                setInterval(function () {
                    if (self.sio) {
                        if (Date.now() - self.lastRecieveTime > 20000) {
                            self.close();
                        }
                    }
                }.bind(this), 500);
            }
        },

        ping: function ping() {
            if (this.sio) {
                var isonline = this.online;
                this.lastSendTime = Date.now();
                this.send('game_ping', { isonline: isonline });
            }
        },

        close: function close() {
            this.delayMS = null;
            if (this.sio && this.sio.connected) {
                this.sio.connected = false;
                this.sio.disconnect();
                this.sio = null;
            }
            this.sio = null;
        }
    },
});
