<?php
/**
 * 客户端登陆模块
 */
namespace app\index\controller;
use think\Controller;
use Util\data\Sysdb;

class Login extends Controller
{
    //登陆页面
    public function login()
    {
        return $this->fetch();
    }

    //帐号密码登陆
    public function loginAjax()
    {
        $username = trim(input('post.username'));
        $password = trim(input('post.password'));
        if($username == ''){
			exit(json_encode(array('code'=>0,'msg'=>'帐号不能为空')));
        }
        if($password == ''){
			exit(json_encode(array('code'=>0,'msg'=>'密码不能为空')));
        }
        //验证用户
        $this->db = new Sysdb;
        if(strlen($username) == 6){
            $user = $this->db->table('user')->where(array('uid'=>(int)$username))->item();
        }
        //else if(strlen($username) == 11){
            //$user = $this->db->table('user')->where(array('phone'=>$username))->item();
        //}
        if(!$user){
			exit(json_encode(array('code'=>0,'msg'=>'用户不存在')));
        }
        if(md5($password) != $user['password']){
			exit(json_encode(array('code'=>0,'msg'=>'密码错误')));
        }
        if($user['status'] == 0){
			exit(json_encode(array('code'=>0,'msg'=>'用户已被禁用')));
        }
        //保存登陆时间
        if(count($username) == 6){
            $this->db->table('user')->where(array('uid'=>$uid))->update(['login_time'=>time()]);
        }
        //else if(count($username) == 11){
            //$this->db->table('user')->where(array('phone'=>$phone))->update(['login_time'=>time()]);
        //}
        // 设置用户session
		session('uid',$user['uid']);
		exit(json_encode(array('code'=>1,'msg'=>'登录成功')));
    }
}
