<?php
/**
 * 群成员模块
 */
namespace app\index\controller;
use app\index\controller\Base;

class Qunmember extends Base
{
    //群成员
    public function index(){
        $data['lists'] = $this->db->table('qun')->where(array('qun_id'=>session('uid')))->lists();
        foreach($data['lists'] as $key => $value){
            $data['lists'][$key]['member_uid'] = $this->db->table('user')->where(array('uid'=>$data['lists'][$key]['member_uid']))->item();
        }
        $this->assign('data',$data);
        return $this->fetch();
    }
}