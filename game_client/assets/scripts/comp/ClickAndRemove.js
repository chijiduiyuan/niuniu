cc.Class({
    extends: cc.Component,

    properties: {
        
    },
    
    onLoad: function () {

    },

    ClickAndRemove:function(){
        this.node.removeFromParent();
    }
});
