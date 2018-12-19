<?php
/**
* 父控制器
* 处理玩家是否登陆
*/
namespace app\index\controller;
use think\Controller;
use Util\data\Sysdb;

class Base extends Controller
{
	public function __construct(){
		parent::__construct();
		$uid = session('uid');
		$this->db = new Sysdb;
		$config = $this->db->table('config')->field('url')->where(array('id'=>5))->item();
		$this->url = $config['url'];
		// 未登录的用户不允许访问
		if(!$uid){
			header('Location: '.$this->url.'index.php/index/Login/login');
			exit;
		}
	}	
}