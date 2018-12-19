cc.Class({
    extends: cc.Component,

    properties: {
        soundSprite:cc.Sprite,
        effectSprite:cc.Sprite,
    },

    onLoad: function () {
        this.initView();
    },

    initView:function(){
        var self = this;
        var s = cc.sys.localStorage.getItem("bgmVolume");
        var e = cc.sys.localStorage.getItem("sfxVolume");
        if(s == 0 || s == null){
           cc.loader.loadRes("comm/onsetclose", cc.SpriteFrame, function (err, spriteFrame) {
                self.soundSprite.spriteFrame = spriteFrame;
           }); 
        }else {
            cc.loader.loadRes("comm/onsetopen", cc.SpriteFrame, function (err, spriteFrame) {
                self.soundSprite.spriteFrame = spriteFrame;
           }); 
        }
        if(e == 0 || e == null){
            cc.loader.loadRes("comm/onsetclose", cc.SpriteFrame, function (err, spriteFrame) {
                self.effectSprite.spriteFrame = spriteFrame;
           });
        }else if(e == 1){
            cc.loader.loadRes("comm/onsetopen", cc.SpriteFrame, function (err, spriteFrame) {
                self.effectSprite.spriteFrame = spriteFrame;
           }); 
        }
    },

    OnCloseClick:function(){
        this.node.removeFromParent();
    },

    OnSoundClick:function(){
        var s = cc.sys.localStorage.getItem("bgmVolume");
        if(s == 0){
            cc.vv.audioMgr.setBGMVolume(0.3);
        }else{
            cc.vv.audioMgr.setBGMVolume(0);
        }
        this.initView();
    },

    OnEffectClick:function(){
        var e = cc.sys.localStorage.getItem("sfxVolume");
        if(e == 0){
            cc.vv.audioMgr.setSFXVolume(1)
        }else{
            cc.vv.audioMgr.setSFXVolume(0)
        }
        this.initView()
    },
});
