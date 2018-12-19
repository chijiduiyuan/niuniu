<?php
/**
* 房间管理
*/
namespace app\admins\controller;
use app\admins\controller\Base;

class Room extends Base{

	//房间列表
	public function index(){
        $data['current'] = max(1,(int)input('get.page'));
        $data['perPage'] = 10;
        $data['data'] = $this->db->table('rooms')->pages($data['perPage']);
        foreach($data['data']['lists'] as $key => $val){
            $data['data']['lists'][$key]['create_uid'] = $this->db->table('user')->field('nickname,agent')->where(array('uid'=>$val['create_uid']))->item();
            $data['data']['lists'][$key]['create_uid']['agent'] = $this->db->table('agent')->field('title')->where(array('id'=>$data['data']['lists'][$key]['create_uid']['agent']))->item();
            $data['data']['lists'][$key]['game_id'] = $this->db->table('gamelist')->field('title')->where(array('id'=>$val['game_id']))->item();
        }
        //dump($data);
		$this->assign('data',$data);
		return $this->fetch();
    }
    
    //房间详情
    public function info(){
        $id = (int)input('get.id');
        $data['room'] = $this->db->table('rooms')->where(array('id'=>$id))->item();
        $data['room']['conf'] = object_array(json_decode($data['room']['conf']));
        $map['wanfa'] = array('明牌抢庄','牛牛上庄','自由抢庄','固定庄家');
        $map['guize'] = array('1'=>'牛牛x3牛九x2牛八x2','2'=>'牛牛x3牛九x2牛八x2');
        $map['paixing'] = array('wxn'=>'五小牛','zdn'=>'五花牛','zdn'=>'炸弹牛');
        $map['jushu'] = array('1'=>'10局1房卡','2'=>'20局2房卡');

        $data['room']['conf']['wanfa'] = $map['wanfa'][$data['room']['conf']['wanfa']];

        $data['room']['conf']['guize'] = $map['guize'][$data['room']['conf']['guize']];
        $data['teshu'] = '';
        foreach($data['room']['conf']['paixing'] as $key => $value){
            $data['teshu'] .= $map['paixing'][$value].'、';
        }
        $data['room']['conf']['beishu'] = $data['room']['conf']['beishu'][0].'、'.$data['room']['conf']['beishu'][1].'、'.$data['room']['conf']['beishu'][2].'、'.$data['room']['conf']['beishu'][3];
        $data['room']['conf']['shijian'] = '准备:'.$data['room']['conf']['shijian'][0].'s、抢庄:'.$data['room']['conf']['shijian'][1].'s、下注:'.$data['room']['conf']['shijian'][2].'s、摊牌:'.$data['room']['conf']['shijian'][3].'s';
        $data['room']['conf']['jushu'] = $map['jushu'][$data['room']['conf']['jushu']];

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
        $this->assign('data',$data);
        return $this->fetch();
    }

}