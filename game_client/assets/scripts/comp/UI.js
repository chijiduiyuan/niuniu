

cc.Class({
    extends: cc.Component,

    properties: {
    },

    addClickEvent:function(node,target,component,handler){
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },

    ShowAlert:function(parent,content,onok,showcancelbtn){
        cc.loader.loadRes("prefabs/AlertUI",function(err,prefab){
            var layer = cc.instantiate(prefab);
            layer.setPosition(cc.v2(0, 0));
            if(parent.getChildByName('Alert')  !== null){
                parent.removeChild(parent.getChildByName('Alert'));
            }
            parent.addChild(layer);
            var alert = layer.getComponent("Alert");
            alert.show(content,onok,showcancelbtn);
        });
    },
    ShowAlert2:function(parent,content,onok,oncancel,showcancelbtn,okBtnTitle,cancelBtnTitle){
        cc.loader.loadRes("prefabs/AlertUI2",function(err,prefab){
            var layer = cc.instantiate(prefab);
            layer.setPosition(cc.v2(0, 0));
            if(parent.getChildByName('AlertUI2')  !== null){
                parent.removeChild(parent.getChildByName('AlertUI2'));
            }
            parent.addChild(layer);
            var alert = layer.getComponent("Alert");
            alert.show2(content,onok,oncancel,showcancelbtn,okBtnTitle,cancelBtnTitle);
        });
    },
    ShowTips:function(parent,content,showtime,posx,posy){
        cc.loader.loadRes("prefabs/TipsUI",function(err,prefab){
            var layer = cc.instantiate(prefab);
            parent.addChild(layer);
            if(posx !== undefined || posy !== undefined ){
                layer.setPosition(cc.v2(posx,posy));
            }
            var tips = layer.getComponent("Tips");
            tips.show(content);
        });
        if(showtime == null || showtime == undefined){
            showtime = 3000;
        }
        setTimeout(function() {
            if(parent.getChildByName('Tips')  !== null){
                parent.removeChild(parent.getChildByName('Tips'));
            }
        }, showtime);
    },

    ShowLayer:function(layerName,parent,agrs){
        cc.loader.loadRes("prefabs/"+layerName,function(err,prefab){
            var layer = cc.instantiate(prefab);
            parent.addChild(layer);
            if(agrs && layer.getComponent(layerName)){ // 
                var script = layer.getComponent(layerName);
                script.init(agrs)
            } 
        });
    },
    //显示计时器
    ShowTime:function(layerName,parent,agrs){
        if(parent.getChildByName('Time')  !== null){
            parent.removeChild(parent.getChildByName('Time'));
        }
        cc.loader.loadRes("prefabs/"+layerName,function(err,prefab){
            var layer = cc.instantiate(prefab);
            if(parent.getChildByName('Time')  !== null){
                parent.removeChild(parent.getChildByName('Time'));
            }
            parent.addChild(layer);
            if(agrs && layer.getComponent(layerName)){ 
                var script = layer.getComponent(layerName);
                script.init(agrs);
            } 
        });
    },
    //清除计时器
    ClearTime:function(parent){
        if(parent.getChildByName('Time')  !== null){
            parent.removeChild(parent.getChildByName('Time'));
        }
    },

    ShowAnimation:function(actName,parent,agrs,callback){
        cc.loader.loadRes("prefabs/Animations",function(err,prefab){
            var layer = cc.instantiate(prefab);
            parent.addChild(layer);
            if(agrs !== undefined ){
                if(agrs.posx !== undefined && agrs.posy !== undefined){
                    layer.setPosition(cc.v2(agrs.posx,agrs.posy))
                }
                if(agrs.rotation !== undefined ){
                    layer.rotation = agrs.rotation;
                }
                if(agrs.scalex !== undefined){
                    layer.scaleX = agrs.scalex;
                }
            }
            var ctrl = layer.getComponent("SpineAniCtrl");
            cc.loader.loadRes("animation/"+actName, sp.SkeletonData, function(err,res){
                ctrl.init(res,agrs,callback);
            });
        });
    },
    //展示牛牌型
    ShowAniNui:function(value,parent,pos){
        cc.loader.loadRes("prefabs/Pokertype",function(err,prefab){
            var layer = cc.instantiate(prefab);
            layer.y = -20;
            parent.addChild(layer);
            var ctrl = layer.getComponent("PokerAct");
            var sprite = layer.getComponent(cc.Sprite);
            var bgName = ""
            if(value >= 10){
                bgName = "bg_niu3";
            }else if(value > 0){
                bgName = "bg_niu2";
            }else{
                bgName = "bg_niu1";
            }
            if(pos !== undefined){
                layer.setPosition(cc.v2(110,135));
            }else{
                if(parent.x<0){
                    layer.setPosition(cc.v2(26,-45));
                }else{
                    layer.setPosition(cc.v2(0,-45));
                }
            }
            cc.loader.loadRes("niuniu/bullfight_type"+value, cc.SpriteFrame, function(err,res){
                ctrl.init(res);
            }); 
        });
    },

    ShowScoreAni:function(data){
        var node = new cc.Node();
        node.addComponent("ScoreAni");
        cc.director.getScene().addChild(node);
        var ctrl = node.getComponent("ScoreAni");
        ctrl.show(data,node);
    },

    

});
