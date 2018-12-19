<?php
/**
 * 开房查询模块
 */
namespace app\index\controller;
use app\index\controller\Base;

class Roomsearch extends Base
{
    //房间列表
    public function index(){
        $id = max(0,input('get.id'));
        $data['gameList'] = $this->db->table('gamelist')->lists();
        if($id > 0){
            $data['rooms'] = $this->db->table('rooms')->where(array('create_uid'=>session('uid'),'game_id'=>$id))->order('create_time desc')->lists();
        }else{
            $data['rooms'] = $this->db->table('rooms')->where(array('create_uid'=>session('uid')))->order('create_time desc')->lists();
        }
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