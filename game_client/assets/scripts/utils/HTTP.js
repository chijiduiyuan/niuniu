var HTTP = cc.Class({
    extends: cc.Component,

    statics:{
        sessionId:0,
        userid:0,
        master_url:URL,
        url:URL,
        sendRequest:function(path,data,handler,extUrl){
            var xhr = cc.loader.getXMLHttpRequest();
            xhr.timeout = 5000;
            var str = "?";
            for(var k in data){
                if (str != "?"){
                    str += "&";
                }
                str += k + "=" + data[k];
            }
            if(extUrl == null){
                extUrl = HTTP.url;
            }
            var requestURL = extUrl + path + encodeURI(str);
            xhr.open("GET",requestURL,true);
            if (cc.sys.isNative){
                xhr.setRequestHeader("Accept-Encoding","gzip,deflate","text/html;charset=UTF-8");
            }
            xhr.onreadystatechange = function(){
                if( xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)){
                    try{
                        var ret = JSON.parse(xhr.responseText);
                        if(handler !== null){
                            handler(ret)
                        }
                    }catch(e){
                    }
                    finally{
                    }
                }
            };

            if(false){
            }
            xhr.send();
            return xhr;
        },
    },
});
