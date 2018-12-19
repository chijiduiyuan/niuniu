<?php
namespace app\admins\controller;
use app\admins\controller\Base;
/**
* 后台首页
*/
class Home extends Base
{
	public function index(){
		$menus = false;
		$role = $this->db->table('role')->where(array('id'=>$this->_admin['role']['id']))->item();
		if($role){
			$role['rights'] = (isset($role['rights']) && $role['rights']) ? json_decode($role['rights'],true) : [];
		}
		if($role['rights']){
			$where = 'id in('.implode(',',$role['rights']).') and ishidden=0 and status=1';
			$menus = $this->db->table('menu')->where($where)->cates('id');
			$menus && $menus = $this->gettreeitems($menus);
			$acts = $this->db->table('menu')->where(array('ishidden'=>1,'status'=>1))->lists();
			$privateRole = array();
			//dump($acts);
			foreach($acts as $key => $value){
				array_push($privateRole,($value['controller'].strtolower($value['method'])));
			}
			session('privateRole',$privateRole);
		}
		//dump($menus);
		$this->assign('role',$role);
		$this->assign('menus',$menus);
		return $this->fetch();
  	}
	
	  private function gettreeitems($items){
		$tree = array();
		foreach ($items as $item) {
			if(isset($items[$item['pid']])){
				$items[$item['pid']]['children'][] = &$items[$item['id']];
			}else{
				$tree[] = &$items[$item['id']];
			}
		}
		return $tree;
	}
}