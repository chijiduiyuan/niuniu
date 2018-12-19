<?php
namespace app\admins\controller;
use think\Controller;

class Count extends Controller
{
    //游戏列表
    public function count(){
        
        return $this->fetch();
    }

    public function countAjax(){
        
    }

    //数据分析
    public function spreadData(){
       
        return $this->fetch();
    }

    private function getArray($obj){
        $arr = [];
        foreach($obj as $k => $value){
            $array = [];
            $array['time'] = date('m/d',(int)$k*86400);
            $array['num'] = $value;
            array_push($arr,$array);
        }
        return $arr;
    }

}