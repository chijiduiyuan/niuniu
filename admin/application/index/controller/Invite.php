<?php
/**
 * 邀请函模块
 */
namespace app\index\controller;
use app\index\controller\Base;

class Invite extends Base
{
    //邀请函
    public function index(){
        $uid = input('get.uid');
        $data['user'] = $this->db->table('user')->where(array('uid'=>$uid))->item();

        $this->assign('data',$data);
        return $this->fetch();
    }

    public function join(){
        $qunId = input('post.qun_id');
        if($qunId == ''){
            exit(json_encode(array('code'=>0,'msg'=>'链接失效')));
        }
        $qun = $this->db->table('qun')->where(array('qun_id'=>$qunId,'member_uid'=>session('uid')))->item();
        if($qun){
            if($qun['member_status'] == 0){
                exit(json_encode(array('code'=>0,'msg'=>'您的申请已被拒绝。')));
            }else if($qun['member_status'] == 1){
                exit(json_encode(array('code'=>0,'msg'=>'您已被群主踢出。')));
            }else if($qun['member_status'] == 2){
                exit(json_encode(array('code'=>0,'msg'=>'您已经申请过了，等待群主同意。')));
            }else if($qun['member_status'] == 3){
                exit(json_encode(array('code'=>0,'msg'=>'您已经在群里了')));
            }
        }else{
            $manage = $this->db->table('user')->where(array('uid'=>$qunId))->item();
            if($manage['is_open_qun'] == 0){
                exit(json_encode(array('code'=>0,'msg'=>'群被关闭了')));
            }
            $data['qun_id'] = $qunId;
            $data['member_uid'] = session('uid');
            $data['member_status'] = 1;     //1=申请中 
            $data['create_time'] = time();
            $this->db->table('qun')->insert($data);
            exit(json_encode(array('code'=>1,'msg'=>'申请成功，等待群主同意')));
        }

    }
}