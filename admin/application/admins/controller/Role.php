<?php
/**
* 角色管理
*/
namespace app\admins\controller;
use app\admins\controller\Base;

class Role extends Base{

	// 角色列表
	public function index(){
		$data['roles'] = $this->db->table('role')->lists();
		$this->assign('data',$data);
		return $this->fetch();
	}

	// 角色添加
	public function add(){
		if(!role()){
            return $this->fetch('Error/error');
        }
		$id = (int)input('get.id');
		$role = $this->db->table('role')->where(array('id'=>$id))->item();
		$role && $role['rights'] && $role['rights'] = json_decode($role['rights']);
		$this->assign('role',$role);

		$menu_list = $this->db->table('menu')->where(array('status'=>1))->cates('id');
		$menus = $this->gettreeitems($menu_list);
		$results = array();
		foreach ($menus as $value) {
			$value['children'] = isset($value['children'])?$this->formatMenus($value['children']):false;
			$results[] = $value;
		}
		$this->assign('menus',$results);
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

	private function formatMenus($items,&$res = array()){
		foreach($items as $item){
			if(!isset($item['children'])){
				$res[] = $item;
			}else{
				$tem = $item['children'];
				unset($item['children']);
				$res[] = $item;
				$this->formatMenus($tem,$res);
			}
		}
		return $res;
	}

	public function save(){
		$id = (int)input('post.id');

		$data['title'] = trim(input('post.title'));
		$menus = input('post.menu/a');
		if(!$data['title']){
			exit(json_encode(array('code'=>1,'msg'=>'角色名称不能为空')));
		}
		$menus && $data['rights'] = json_encode(array_keys($menus));

		if($id){
			$this->db->table('role')->where(array('id'=>$id))->update($data);
		}else{
			$this->db->table('role')->insert($data);
		}
		
		exit(json_encode(array('code'=>1,'msg'=>'保存成功')));
	}

	// 删除
	public function deletes(){
		if(!role()){
            return $this->fetch('Error/error');
        }
		$id = (int)input('id');
		$this->db->table('role')->where(array('id'=>$id))->delete();
		exit(json_encode(array('code'=>1,'msg'=>'删除成功')));
	}
}