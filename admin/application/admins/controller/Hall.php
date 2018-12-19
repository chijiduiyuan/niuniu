<?php
namespace app\admins\controller;
use think\Controller;

class Hall extends Controller
{
    //房间列表
    public function roomList(){
        $token = session('token');
        $agent = session('agent');
        $current = max(1,(int)input('get.page'));
        $perPage = 10;
        $url = "http://192.168.0.169:9000/public_room/public_rooms_list?token=".$token."&agent=".$agent."&current=".$current."&perPage=".$perPage;
        $tmpJson = CURL($url,'GET');
        $obj = json_decode($tmpJson);
        //dump($obj);
        $roomList = object_array($obj->data->list);
        $roomCount = object_array($obj->data->count);
        $gameType = object_array($obj->data->gameTypeMap);
        //dump($roomList);
        $this->assign('current',$current);
        $this->assign('perPage',$perPage);
        $this->assign('count',$roomCount);
        $this->assign('roomList',$roomList);
        $this->assign('gameType',$gameType);
        return $this->fetch();
    }

    //房间详情
    public function roomInfo(){
        $token = session('token');
        $agent = session('agent');
        $roomId = input('get.roomId');
        $url = "http://192.168.0.169:9000/public_room/room?token=".$token."&agent=".$agent."&roomId=".$roomId;
        $tmpJson = CURL($url,'GET');
        $obj = json_decode($tmpJson);
        //dump($obj);
        $roomInfo = object_array($obj->data->room);
        $matchList = object_array($obj->data->list);
        $roomInfo['rule'] = object_array(json_decode($roomInfo['rule']));
        //dump($roomInfo);
        //dump($matchList);
        $rank = object_array($obj->data->rank);
        $this->assign('roomInfo',$roomInfo);
        $this->assign('matchList',$matchList);
        $this->assign('rank',$rank);
        return $this->fetch();
    }
}