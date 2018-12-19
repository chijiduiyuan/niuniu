<?php
/**
 * 房卡礼包模块
 */
namespace app\index\controller;
use app\index\controller\Base;

class Cardgift extends Base
{
    //房卡礼包
    public function index(){
        $data['send'] = $this->db->table('card_gift')->where(array('sender'=>session('uid')))->order('id desc')->lists();
        if($data['send']){
            foreach($data['send'] as $key => $value){
                $data['send'][$key]['sender'] = $this->db->table('user')->field('uid,nickname')->where(array('uid'=>$data['send'][$key]['sender']))->item();
            }
        }
        $data['receive'] = $this->db->table('card_gift')->where(array('receiver'=>session('uid')))->order('id desc')->lists();
        if($data['receive']){
            foreach($data['receive'] as $key => $value){
                $data['receive'][$key]['sender'] = $this->db->table('user')->field('uid,nickname')->where(array('uid'=>$data['receive'][$key]['sender']))->item();
            }
        }
        //dump($data);
        $this->assign('data',$data);
        return $this->fetch();
    }
}