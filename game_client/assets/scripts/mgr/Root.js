

cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        cc.game.addPersistRootNode(this.node); 
    },
});
