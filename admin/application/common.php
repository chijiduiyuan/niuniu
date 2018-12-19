<?php
// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | Copyright (c) 2006-2016 http://thinkphp.cn All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
// +----------------------------------------------------------------------
// | Author: 流年 <liu21st@gmail.com>
// +----------------------------------------------------------------------
// 异常错误报错级别,
//error_reporting(E_ERROR | E_PARSE );

// 应用公共文件
function CURL($url,$method,$data = ''){
    switch($method){
        case 'GET':
            $ch = curl_init(); //初始化
            $headers = array('Accept-Charset: utf-8');
            //设置URL和相应的选项
            curl_setopt($ch, CURLOPT_URL, $url); //指定请求的URL
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method); //提交方式
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE); //不验证SSL
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE); //不验证SSL
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers); //设置HTTP头字段的数组
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible;MSIE5.01;Windows NT 5.0)'); //头的字符串
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
            curl_setopt($ch, CURLOPT_AUTOREFERER, 1); //自动设置header中的Referer:信息
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data); //提交数值
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //是否输出到屏幕上,true不直接输出
            $temp = curl_exec($ch); //执行并获取结果
            curl_close($ch);
            return $temp; //return 返回值
            break;
        case 'POST':
            $data_string = json_encode($data);
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($ch, CURLOPT_POSTFIELDS,$data_string);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER,true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($data_string))
            );
            $result = curl_exec($ch);
            curl_close($ch);
            return $result;
            break;
        case 'PUT':
            $data_string = json_encode($data);
            $ch = curl_init(); //初始化CURL句柄 
            curl_setopt($ch, CURLOPT_URL, $url); //设置请求的URL
            curl_setopt ($ch, CURLOPT_HTTPHEADER, array('Content-type:application/json'));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER,1); //设为TRUE把curl_exec()结果转化为字串，而不是直接输出 
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST,"PUT"); //设置请求方式
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);//设置提交的字符串
            $output = curl_exec($ch);
            curl_close($ch);
            return $output;
            break;
        default:
            break;
    }
}

//对象转数组
function object_array($array) {  
    if(is_object($array)) {  
        $array = (array)$array;  
     } 
     if(is_array($array)) {  
         foreach($array as $key=>$value) {  
             $array[$key] = object_array($value);  
            }  
     }  
     return $array;  
}

//权限控制
function role(){
    $arr = session('privateRole');
    $controller = request()->controller();
    $method = request()->action();
    //dump($controller.$method);
    //dump($arr);
    if(in_array(($controller.$method),$arr)){
        return true;
    }else{
        return false;
    }
}