var mysql=require("mysql");  
var crypto = require('./crypto');

var pool = null;

function nop(a,b,c,d,e,f,g){

}

function query(sql,callback){  
    pool.getConnection(function(err,conn){  
        if(err){  
            callback(err,null,null);  
        }else{  
            conn.query(sql,function(qerr,vals,fields){
                //释放连接  
                conn.release();  
                //事件驱动回调  
                callback(qerr,vals,fields);  
            });  
        }  
    });  
};

String.prototype.format = function(args) {
	var result = this;
	if (arguments.length > 0) {
		if (arguments.length == 1 && typeof (args) == "object") {
			for (var key in args) {
				if(args[key]!=undefined){
					var reg = new RegExp("({" + key + "})", "g");
					result = result.replace(reg, args[key]);
				}
			}
		}
		else {
			for (var i = 0; i < arguments.length; i++) {
				if (arguments[i] != undefined) {
					//var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出
					var reg = new RegExp("({)" + i + "(})", "g");
					result = result.replace(reg, arguments[i]);
				}
			}
		}
	}
	return result;
};

exports.init = function(){
    pool = mysql.createPool({
        host: '47.104.17.36',
        user: 'zhanghang',
        password: 'hang10093712',
        database: 'zhanghang',
        port: '3306',
    });
};

//查找玩家数据
exports.get_user_data = function(uid,callback){
    callback = callback == null? nop:callback;
    if(uid == null){
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_user WHERE uid = "' + uid + '"';
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        callback(rows[0]);
    });
}

//查找平台配置
exports.get_config = function(agent,callback){
    callback = callback == null? nop:callback;
    if(agent == null){
        callback(null);
        return;
    }
    var sql = 'SELECT url,agent FROM t_config WHERE agent = '+agent;
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        callback(rows[0]);
    });
}


//更新房间状态
exports.update_room_status = function(roomNum,status){
    if(roomNum == null || status == null){
        return;
    }
    var sql = 'UPDATE t_rooms SET status = ' + status + ' WHERE id = ' + roomNum;
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
    });
};
//查找玩家数据
exports.get_room_data = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT a.id,a.create_uid,a.conf,a.status,a.create_time,b.type,b.max_player,b.code FROM t_rooms a JOIN t_gamelist b ON a.game_id = b.id WHERE a.id = ' + roomId+' and b.status = 1';
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        callback(rows[0]);
    });
}

//添加战绩
exports.insert_match = function(roomId,currentNum,result,extInfo,endTime,callback){
    callback = callback == null? nop:callback;
    if(roomId == null || currentNum == null || result == null || extInfo == null || endTime == null){
        callback(null);
        return;
    }
    var sql = "INSERT INTO t_match(room_id,current_num,result,extInfo,end_time) VALUES({0},{1},'{2}','{3}',{4})";
    sql = sql.format(roomId,currentNum,result,extInfo,endTime);
    //console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            callback(null);
            throw err;
        }
    });
}

//查看玩家在线信息
exports.get_player_line_info = function(uid,callback){
    callback = callback == null? nop:callback;
    if(uid == null){
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_online WHERE uid = ' + uid;
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        callback(rows[0]);
    });
}

//添加玩家在线信息
exports.insert_player_online = function(uid,roomId,status){
    if(uid == null || roomId == null || status == null){
        return;
    }
    var sql = "INSERT INTO t_online(uid,room_id,status) VALUES({0},{1},{2})";
    sql = sql.format(uid,roomId,status);
    //console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            throw err;
        }
    });
}

//更新房间状态
exports.update_player_online = function(uid,roomId,status,num){
    if(uid == null || roomId == null || status == null){
        return;
    }
    if(status == 0){
        var sql = 'UPDATE t_online SET status = ' + status + ' WHERE uid = ' + uid;
    }
    if(status == 1){
        var sql = 'UPDATE t_online SET room_id = ' + roomId  + ',login_num = ' + num + ',status = ' + status + ' WHERE uid = ' + uid;
    }
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
    });
};

//删除房间
exports.delete_room = function(roomId){
    if(roomId == null){
        return;
    }
    var sql = "DELETE FROM t_rooms WHERE id = ".roomId;
    query(sql,function(err,rows,fields){
        if(err){
            throw err;
        }
    });
}

//更新玩家房卡
exports.update_user_card = function(uid,num,callback){
    if(uid == null || num == null){
        callback(null);
        return;
    }

    var sql = 'UPDATE t_user SET card = ' + num + ' WHERE uid = ' + uid;

    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }else{
            callback(null);
        }
    });
};

exports.query = query;