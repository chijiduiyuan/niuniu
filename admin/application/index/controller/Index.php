<?php
/**
 * 大厅模块
 */
namespace app\index\controller;
use app\index\controller\Base;

class Index extends Base
{
    //大厅
    public function index()
    {
        //玩家信息
        $data['user'] = $this->db->table('user')->where(array('uid'=>session('uid')))->item();
        $data['user']['agent'] = $this->db->table('agent')->where(array('id'=>$data['user']['agent']))->item();
        //发布的公告列表
        $data['notice'] = $this->db->table('notice')->where(array('agent'=>$data['user']['agent']['id'],'status'=>1))->lists();
        //上线的游戏列表
        $data['game'] = $this->db->table('gamelist')->where(array('status'=>1))->lists();
        //dump($data);
        $this->assign('data',$data);
        return $this->fetch();
    }

    //设置个人宣言
    public function createIntro(){
        $data['intro'] = trim(input('post.intro'));
        if($data['intro'] == ''){
            exit(json_encode(array('code'=>0,'msg'=>'请输入个人宣言')));
        }
        if(mb_strlen($data['intro'])>10){
            exit(json_encode(array('code'=>0,'msg'=>'长度超出范围')));
        }
        $this->db->table('user')->where(array('uid'=>session('uid')))->update($data);
        exit(json_encode(array('code'=>1,'msg'=>'设置成功')));
    }

    //创建房间规则
    public function createRoom(){
        $id = (int)input('get.id');
        //查询要创建的房间类型
        $game = $this->db->table('gamelist')->where(array('id'=>$id))->item();
        $this->assign('game',$game);
        return $this->fetch('index/'.$game['type']);
    }

    //创建房间
    public function createAjax(){
        $uid = session('uid');
        $data['create_uid'] = $uid;
        $data['game_id'] = (int)input('post.gameId');
        $data['conf'] = trim(input('post.conf'));
        $data['create_time'] = time();
        //处理公共房间和私密房间 处理消耗房卡
        $conf = object_array(json_decode($data['conf']));
        $user = $this->db->table('user')->where(array('uid'=>$uid))->item();
        if($conf['roomType'] == 2){
            if($user['is_open_qun'] != 1){
                exit(json_encode(array('code'=>0,'msg'=>'牌友群未开启')));
            }
        }
        if($conf['jushu'] == 1){
            $needHouseCard = 1;
        }else if($conf['jushu'] == 2){
            $needHouseCard = 2;
        }
        //预扣房卡
        $card = $user['card'] - $needHouseCard;
        if($card < 0){
            exit(json_encode(array('code'=>0,'msg'=>'房卡不足')));
        }
        $this->db->table('user')->where(array('uid'=>$uid))->update(array('card'=>$card));
        $id = $this->db->table('rooms')->insert($data);
        exit(json_encode(array('code'=>1,'msg'=>'创建房间成功','id'=>$id)));
    }

    //等待页面
    public function wait(){
        $roomId = (int)input('get.roomId');
        //dump($roomId);
        $data['room'] = $this->db->table('rooms')->where(array('id'=>$roomId))->item();
        $data['room']['conf'] = object_array(json_decode($data['room']['conf']));
        $data['room']['game_id'] = $this->db->table('gamelist')->field('id,title,type')->where(array('id'=>$data['room']['game_id']))->item();
        $data['room']['create_uid'] = $this->db->table('user')->field('uid,nickname,agent')->where(array('uid'=>$data['room']['create_uid']))->item();
        $data['uid'] = session('uid');
        $data['url'] = $this->url;
        //dump($data);
        $this->assign('data',$data);
        return $this->fetch();
    }
}
