cc.Class({
    extends: cc.Component,

    properties: {
        sprite:cc.Sprite,
    },

    onLoad: function () {

    },

    init: function (spriteFrame) {
        this.sprite.spriteFrame = spriteFrame;
        var actArr = new Array();
        var action1 = cc.scaleTo(0.2, 1.2); 
        var action2 = cc.scaleTo(0.2, 1); 
        actArr.push(action1)
        actArr.push(action2)
        var seq = cc.sequence(actArr);
        this.node.runAction(seq);
    },

});
