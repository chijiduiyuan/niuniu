<?php
/**
 * 个人中心模块
 */
namespace app\index\controller;
use app\index\controller\Base;

class Personal extends Base
{
    //个人中心
    public function index()
    {
        //玩家信息
        $data['user'] = $this->db->table('user')->where(array('uid'=>session('uid')))->item();
        //dump($data);
        $data['uid'] = session('uid');
        $this->assign('data',$data);
        return $this->fetch();
    }

    //设置密钥
    public function setPwd(){
        $pwd = trim(input('post.pwd'));
        if($pwd == ''){
            exit(json_encode(array('code'=>0,'msg'=>'请输入密钥')));
        }
        $data['password'] = md5($pwd);
        $this->db->table('user')->where(array('uid'=>session('uid')))->update($data);
        exit(json_encode(array('code'=>1,'msg'=>'设置成功')));
    }

    //开通群
    public function qunAjax(){
        $status = (int)input('post.status');
        $this->db->table('user')->where(array('uid'=>session('uid')))->update(array('is_open_qun'=>$status));
        //查找群是否存在
        $qun = $this->db->table('qun')->where(array('qun_id'=>session('uid'),'member_uid'=>session('uid')))->item();
        if($qun){
            //群存在 则修改玩家群状态
            $qunArr = $this->db->table('qun')->where(array('qun_id'=>session('uid')))->lists();
            foreach($qunArr as $key => $value){
                $this->db->table('qun')->where(array('qun_id'=>session('uid')))->update(array('status'=>$status));
            }
        }else{
            //不存在 则创建群
            $data['qun_id'] = session('uid');
            $data['member_uid'] = session('uid');
            $data['ident'] = 1;     //1=群主 0=成员
            $data['member_status'] = 3;     //3=已同意
            $data['create_time'] = time();
            $this->db->table('qun')->insert($data);
        }
        exit(json_encode(array('code'=>1,'msg'=>'')));
    }

    //退出登陆
    public function logout(){
        session('uid',null);
		exit(json_encode(array('code'=>1,'msg'=>'退出成功')));
    }

}
