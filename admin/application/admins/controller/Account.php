<?php
namespace app\admins\controller;
use think\Controller;
use Util\data\Sysdb;

class Account extends Controller
{
    //登陆
    public function login(){
        return $this->fetch();
    }

    // 管理员登录
	public function dologin(){
		$username = trim(input('post.username'));
		$pwd = trim(input('post.pwd'));

		if($username == ''){
			exit(json_encode(array('code'=>1,'msg'=>'用户名不能为空')));
		}
		if($pwd == ''){
			exit(json_encode(array('code'=>1,'msg'=>'密码不能为空')));
		}
		//验证用户
		$this->db = new Sysdb;
		$admin = $this->db->table('admin')->where(array('username'=>$username))->item();
		$admin['agent'] = $this->db->table('agent')->field('id,title,status')->where(array('id'=>$admin['agent']))->item();
		$admin['role'] = $this->db->table('role')->field('id,title,status')->where(array('id'=>$admin['role']))->item();
		if(!$admin){
			exit(json_encode(array('code'=>0,'msg'=>'用户不存在')));
		}
		if(md5($pwd) != $admin['pwd']){
			exit(json_encode(array('code'=>0,'msg'=>'密码错误')));
		}
		if($admin['status'] == 0){
			exit(json_encode(array('code'=>1,'msg'=>'用户已被禁用')));
		}
		if($admin['agent'] == null){
			exit(json_encode(array('code'=>1,'msg'=>'用户所属平台不存在')));
		}
		if($admin['role'] == null){
			exit(json_encode(array('code'=>1,'msg'=>'用户所属分组不存在')));
		}
		if($admin['agent']['status'] == 0){
			exit(json_encode(array('code'=>1,'msg'=>'用户所属平台已被禁用')));
		}
		if($admin['role']['status'] == 0){
			exit(json_encode(array('code'=>1,'msg'=>'用户所属分组已被禁用')));
		}
		session('admin',$admin);
		exit(json_encode(array('code'=>1,'msg'=>'登录成功')));
	}

    //退出登陆
	public function logout(){
		session('admin',null);
		session('privateRole',null);
		exit(json_encode(array('code'=>1,'msg'=>'退出成功')));
	}

}