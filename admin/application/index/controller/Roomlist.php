<?php
/**
 * 游戏记录模块
 */
namespace app\index\controller;
use app\index\controller\Base;

class Roomlist extends Base
{
    //房间列表
    public function index(){
        $id = max(0,input('get.id'));
        $data['gameList'] = $this->db->table('gamelist')->lists();

            $data['match'] = $this->db->table('match')->order('room_id desc')->lists();
            foreach($data['match'] as $key => $value){
                $data['match'][$key]['result'] = object_array(json_decode($value['result']));
                $data['match'][$key]['extInfo'] = object_array(json_decode($value['extInfo']));
            }
            //dump($data['match']);
            $arr = array();
            $arr1 = array();
            foreach($data['match'] as $k => $val){
                foreach($val['result'] as $ke => $va){
                    if(!in_array($va['uid'],$arr1)){
                        array_push($arr1,$va['uid']);
                    }
                }
                $arr[$val['room_id']] = $arr1;
            }
            //dump($arr);
            $arr2 = array();
            foreach($arr as $k=>$v){
                 if(in_array(session('uid'),$v)){
                    array_push($arr2,$k);
            }
        }
        //dump($arr2);
        $data['rooms'] = array();
        foreach($arr2 as $kk => $vv){
            if($id > 0){
                $room = $this->db->table('rooms')->where(array('id'=>$vv,'game_id'=>$id))->order('create_time desc')->item();
                if($room){
                    array_push($data['rooms'],$room);
                }
            }else{
                $data['rooms'][] = $this->db->table('rooms')->where(array('id'=>$vv))->order('create_time desc')->item();
            }
        }
        //dump($data['rooms']);
        $this->assign('data',$data);
        return $this->fetch();
    }

    //房间详情
    public function info(){
        $roomId = (int)input('get.id');
        $data['room'] = $this->db->table('rooms')->where(array('id'=>$roomId))->item();
        $data['room']['conf'] = object_array(json_decode($data['room']['conf']));
        $data['room']['game_id'] = $this->db->table('gamelist')->field('id,title,type')->where(array('id'=>$data['room']['game_id']))->item();
        $data['room']['create_uid'] = $this->db->table('user')->field('uid,nickname,agent')->where(array('uid'=>$data['room']['create_uid']))->item();

        $data['match'] = $this->db->table('match')->where(array('room_id'=>$roomId))->lists();
        if($data['match']){
            foreach($data['match'] as $key => $value){
                $data['match'][$key]['result'] = object_array(json_decode($value['result']));
                $data['match'][$key]['extInfo'] = object_array(json_decode($value['extInfo']));
            }
            $arr = array();
            foreach($data['match'] as $k => $val){
                foreach($val['result'] as $ke => $va){
                    array_push($arr,$va);
                }
            }
            $data['rank']=array();
            foreach($arr as $k=>$v){
            unset($v['cards']);
                if(!isset($data['rank'][$v['uid']])){
                    $data['rank'][$v['uid']]=$v;
                }else{
                    $data['rank'][$v['uid']]['score']+=$v['score'];
                }
            }
            array_multisort(array_column($data['rank'],'score'),SORT_DESC,$data['rank']);
            foreach($data['rank'] as $k => $v){
                $data['rank'][$k]['uid'] = $this->db->table('user')->field('uid,nickname,avatar')->where(array('uid'=>$v['uid']))->item();
            }
            //dump($data);
            $this->assign('data',$data);
        }
        return $this->fetch();
    }

    //积分榜
    public function rank(){
        $id = input('get.id');
        $data['room'] = $this->db->table('rooms')->where(array('id'=>$id))->item();
        $data['room']['conf'] = object_array(json_decode($data['room']['conf']));
        $data['match'] = $this->db->table('match')->where(array('room_id'=>$id))->lists();
        
        foreach($data['match'] as $key => $value){
            $data['match'][$key]['result'] = object_array(json_decode($value['result']));
            $data['match'][$key]['extInfo'] = object_array(json_decode($value['extInfo']));
        }

        $arr = array();
        foreach($data['match'] as $k => $val){
            foreach($val['result'] as $ke => $va){
                array_push($arr,$va);
            }
        }
        $data['rank']=array();
        foreach($arr as $k=>$v){
           unset($v['cards']);
            if(!isset($data['rank'][$v['uid']])){
                $data['rank'][$v['uid']]=$v;
            }else{
                $data['rank'][$v['uid']]['score']+=$v['score'];
            }
        }
        array_multisort(array_column($data['rank'],'score'),SORT_DESC,$data['rank']);
        foreach($data['rank'] as $k => $v){
            $data['rank'][$k]['uid'] = $this->db->table('user')->field('uid,nickname,avatar')->where(array('uid'=>$v['uid']))->item();
        }

        //dump($data);

        $this->assign('data',$data);
        return $this->fetch();
    }
}