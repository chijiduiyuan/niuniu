<?php
namespace app\admins\controller;
use app\admins\controller\Base;

class User extends Base
{
    //玩家列表
    public function index(){
        $data['current'] = max(1,(int)input('get.page'));
        $data['perPage'] = 10;
        $data['data'] = $this->db->table('user')->pages($data['perPage']);
        foreach($data['data']['lists'] as $key => $val){
            $data['data']['lists'][$key]['agent'] = $this->db->table('agent')->field('title,status')->where(array('id'=>$val['agent']))->item();
        }
        $this->assign('data',$data);
        return $this->fetch();
    }

    //修改
    public function edit(){
        if(!role()){
            return $this->fetch('Error/error');
        }
        $uid = (int)input('get.uid');
        $userInfo = $this->db->table('user')->where(array('uid'=>$uid))->item();
        //dump($userInfo);
        $this->assign('userInfo',$userInfo);

        return $this->fetch();
    }

    //保存修改
    public function editSave(){
        $uid = input('post.uid');
        $data['phone'] = input('post.phone');
        $data['status'] = (int)input('post.status');
        $this->db->table('user')->where(array('uid'=>$uid))->update($data);
        exit(json_encode(array('code'=>1,'msg'=>'修改成功')));
    }

    //房卡充值
    public function pay(){
        if(!role()){
            return $this->fetch('Error/error');
        }
        $uid = (int)input('get.uid');
        $userInfo = $this->db->table('user')->where(array('uid'=>$uid))->item();
        //dump($userInfo);
        $this->assign('userInfo',$userInfo);

        return $this->fetch();
    }

    public function paySave(){
        $uid = (int)input('post.uid');
        $card = (int)input('post.card');
        $data['num'] = (int)input('post.num');
        $data['price'] = (int)input('post.price');
        if($data['num'] <= 0){
            exit(json_encode(array('code'=>0,'msg'=>'数量必须大于0')));
        }
        $this->db->table('user')->where(array('uid'=>$uid))->update(array('card'=>($card+$data['num'])));
        $data['operator'] = $this->_admin['id'];
        $data['receiptor'] = $uid;
        $data['create_time'] = time();
        $this->db->table('card_record')->insert($data);
        exit(json_encode(array('code'=>1,'msg'=>'充值完成')));
    }

    //充值记录
    public function cardRecord(){
        $data['current'] = max(1,(int)input('get.page'));
        $data['perPage'] = 10;
        $data['data'] = $this->db->table('card_record')->pages($data['perPage']);
        //dump($data);
        foreach($data['data']['lists'] as $key => $val){
            $data['data']['lists'][$key]['operator'] = $this->db->table('admin')->where(array('id'=>$val['operator']))->item();
            $data['data']['lists'][$key]['operator']['agent'] = $this->db->table('agent')->where(array('id'=>$data['data']['lists'][$key]['operator']['agent']))->item();
            $data['data']['lists'][$key]['receiptor'] = $this->db->table('user')->where(array('uid'=>$val['receiptor']))->item();
            $data['data']['lists'][$key]['receiptor']['agent'] = $this->db->table('agent')->where(array('id'=>$data['data']['lists'][$key]['receiptor']['agent']))->item();
        }
        //dump($data);
        $this->assign('data',$data);
        return $this->fetch();
    }
}