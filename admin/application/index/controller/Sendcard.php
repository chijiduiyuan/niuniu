<?php
/**
 * 赠送房卡模块
 */
namespace app\index\controller;
use app\index\controller\Base;

class Sendcard extends Base
{
    //赠送房卡
    public function index()
    {
        //玩家信息
        $data['user'] = $this->db->table('user')->where(array('uid'=>session('uid')))->item();
        //dump($data);
        $this->assign('data',$data);
        return $this->fetch();
    }

    //赠送房卡检测
    public function sendCardAjax(){
        $num = (int)input('post.num');
        if($num <= 0){
            exit(json_encode(array('code'=>0,'msg'=>'数量必须大于0')));
        }
        $user = $this->db->table('user')->field('agent,card')->where(array('uid'=>session('uid')))->item();
        if($num > $user['card']){
            exit(json_encode(array('code'=>0,'msg'=>'房卡不足')));
        }
        //扣除玩家房卡
        $res = $this->db->table('user')->where(array('uid'=>session('uid')))->update(array('card'=>($user['card']-$num)));
        //dump($res);
        if($res == 1){
            //增加房卡赠送记录
            $data['agent'] = $user['agent'];
            $data['sender'] = session('uid');
            $data['card_num'] = $num;
            $data['send_time'] = time();
            $id = $this->db->table('card_gift')->insert($data);
            //dump($res);
            if($id > 0){
                exit(json_encode(array('code'=>1,'msg'=>'赠送成功','data'=>$id)));
            }
        }else{
            exit(json_encode(array('code'=>0,'msg'=>'扣除房卡失败')));
        }
    }

    //赠送房卡
    public function send(){
        $id = (int)input('get.id');
        $data = $this->db->table('card_gift')->where(array('id'=>$id))->item();
        $data['sender'] = $this->db->table('user')->field('nickname,uid,avatar')->where(array('uid'=>$data['sender']))->item();
        $data['receiver'] = $this->db->table('user')->field('nickname,uid,avatar')->where(array('uid'=>$data['receiver']))->item();
        //dump($data);
        $this->assign('data',$data);
        return $this->fetch();
    }
    //领取房卡检测
    public function receiveCardAjax(){
        $id = (int)input('post.id');
        $card = $this->db->table('card_gift')->where(array('id'=>$id))->item();
        if(!$card){
            exit(json_encode(array('code'=>0,'msg'=>'礼包不存在')));
        }
        if($card['receiver'] != null){
            exit(json_encode(array('code'=>0,'msg'=>'礼包已被领取')));
        }
        $user = $this->db->table('user')->field('agent,card')->where(array('uid'=>session('uid')))->item();
        if($user['agent'] != $card['agent']){
            exit(json_encode(array('code'=>0,'msg'=>'礼包不可跨平台领取')));
        }
        //玩家增加房卡
        $this->db->table('user')->where(array('uid'=>session('uid')))->update(array('card'=>($user['card'] + $card['card_num'])));
        //房卡记录更新
        $data['receiver'] = session('uid');
        $data['receive_time'] = time();
        $this->db->table('card_gift')->where(array('id'=>$id))->update($data);
        exit(json_encode(array('code'=>1,'msg'=>'领取成功')));
    }
}
