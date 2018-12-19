cc.Class({
    extends: cc.Component,

    properties: {
        card_pos: '',
        card_node: cc.Node,
        pokerPrefab: cc.Prefab,
    },

    onLoad: function () {
        this._posx = new Array(60,95,130,46,72,96,124,145,50,75,98,125,151);
        this._posy = new Array(120,125,120,78,82,85,81,73,35,39,42,38,30);
        this._rotation = new Array(-10,0,10,-25,-10,0,10,20,-25,-10,0,10,20);
    },
    //展示5张普通牌
    ShowCardNormal:function(index){
        var self = this;
        self.card_node.removeAllChildren();
        self.card_node.active = true;
        self.card_node.setScale(1);
        var gap = 20;
        var scale = 0.32
        if(index == 0){
            gap = 20; 
            scale = 0.55;
        }

        for(var i = 0; i < 5; i++){
            var pokerSprite = cc.instantiate(self.pokerPrefab);
            pokerSprite.setScale(scale);
            
            self.card_node.addChild(pokerSprite);
            var pos = self.card_node.convertToNodeSpaceAR(cc.v2(350,800));
            pokerSprite.setPosition(pos); 
            pokerSprite.setPosition(pos.x , pos.y); 
            //pokerSprite.setPosition( -2* gap , 5); 
            var delay = cc.delayTime(0.05 + 0.05 * i);
            var ac0 = cc.moveTo(0.3,cc.v2(-30 + i*gap ,-10));
            pokerSprite.runAction(cc.sequence( delay,ac0 ));
        }
    },

    //展示自己的牌
    ShowSeflCardResult:function(cards,value,showType){
        var self = this;
        self.card_node.removeAllChildren();
        self.card_node.active = true;
        var gap = 85;
        //var scale = 0.55;
        var scale = 0.61;
        var list= null
        if(value > 0){
            list = self.getNiuList(cards,value);
        }

        if(Grobal.playerNum==6) {
            var move1 = new Array(-2,48,98,148,198);
        } else {
            var move1 = new Array(-42,8,58,108,158);
        }
        var move2 = new Array(-42,8,58,178,228);
        for(var i = 0; i < 5; i++){
            var pokerSprite = cc.instantiate(self.pokerPrefab);
            pokerSprite.setScale(scale);
            var poker = cards[i];
            if(list !== null){
                poker = cards[list[i]]
            }
            pokerSprite.setPosition(-42 + i*gap, 38);
            if(list !== null){
                pokerSprite.runAction(cc.moveTo (0.3,cc.v2(move2[i],38)));
            }else{
                pokerSprite.runAction(cc.moveTo (0.3,cc.v2(move1[i],38)));
            }
            pokerSprite.getComponent(cc.Sprite).spriteFrame = Grobal.pokerSpriteFrameMap[poker.name];
            self.card_node.addChild(pokerSprite);
        }
        self.card_node.setScale(0.85);
        cc.vv.uitools.ShowAniNui(value,self.card_node,1);
    },
    //展示其他人的牌
    ShowCardResult:function(cards,value,showType){
        var self = this
        self.card_node.removeAllChildren();
        self.card_node.active = true;
        var gap = 25;
        //var scale = 0.4;
        var scale = 0.45;
        var list= null;
        if(value > 0){
            list = self.getNiuList(cards,value);
        }
        for(var i = 0; i < 5; i++){
            var pokerSprite = cc.instantiate(self.pokerPrefab);
            pokerSprite.setScale(scale);
            if(i==3 ){
                gap = 25;
            }
            if(self.card_node.x<0){
                if(list !== null){
                    pokerSprite.setPosition(-39, 0); 
                }else{
                    pokerSprite.setPosition(-24, 0);
                }
            }else{
                pokerSprite.setPosition(-50, 0); 
            }
            if(list !== null){
                if(i>=3){
                    pokerSprite.runAction(cc.moveBy(0.5,cc.v2(i*gap+20,0))) 
                }else{
                    if(i > 0){
                        pokerSprite.runAction(cc.moveBy(0.5,cc.v2(i*gap,0))) 
                    }
                }
            }else{
                if(i > 0){
                    pokerSprite.runAction(cc.moveBy(0.5,cc.v2(i*gap,0))) 
                }
            }
            var poker = cards[i];
            if(list !== null){
                poker = cards[list[i]]
            }
            pokerSprite.getComponent(cc.Sprite).spriteFrame = Grobal.pokerSpriteFrameMap[poker.name];
            self.card_node.addChild(pokerSprite);
        }
        self.card_node.setScale(0.65);
        cc.vv.uitools.ShowAniNui(value,self.card_node);
    },
    //重组牌
    getNiuList:function(cards,value){
        var indexList = new Array();
        var m = 0;
        var n = 0;
        var s = 0;
        for(var i=0;i<3;i++){
            for(var k=i+1;k<5;k++){
                for(var b=k+1;b<5;b++){
                    if( ( cards[i].value +  cards[k].value  + cards[b].value) % 10 == 0){
                        m = i;
                        n = k;
                        s = b;
                    }
                }
            }
        }
        indexList.push(m);
        indexList.push(n);
        indexList.push(s);
        if(m==0 && n==0 && s==0){
            return null;
        }
        var checkVlue = 0
        for(var l=0;l<5;l++){
            if(l !==m && l !== n && l !== s){
                indexList.push(l);
            }
        }
        return indexList
    },
    //隐藏所有牌
    hideCard:function(){
        var self = this;
        self.card_node.active = false;
    },
});
