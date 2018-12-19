cc.Class({
    extends: cc.Component,

    properties: {
        adds:{
            default:[],
            type:[cc.Node],
        },
        _totalAdd:cc.Node,
        _tatalScore:0,
    },

    init: function () {
        this.node.active = true;
        for(var i=0;i<3;i++){
            this.adds[i].active = false
        }
        this._totalAdd = this.node.getChildByName("total_score");
        this._totalAdd.active = false;
        this._tatalScore = 0;
    },

    ShowScore:function (index,data) {
        var self = this;
        this.adds[index].active = true;
        var score = this.adds[index].getChildByName("add_score").getComponent(cc.Label);
        score.string = data.score;
        var ext_score = this.adds[index].getChildByName("ext_add").getComponent(cc.Label);
        ext_score.string = data.ext_score;
        var total = parseInt(data.score) + parseInt(data.ext_score);
        self.AddTotal(total);
    },

    AddTotal:function (total) {
        this._tatalScore = this._tatalScore  + total;
        this.ShowAddTotal();
    },

    ShowTotal:function (total) {
        this._tatalScore = total;
        this.ShowAddTotal();
    },

    ShowAddTotal:function () {
        var self = this;
        self._totalAdd.active = true;
        var score = self._totalAdd.getChildByName("add_score").getComponent(cc.Label);
        score.string = self._tatalScore;
    },
});
