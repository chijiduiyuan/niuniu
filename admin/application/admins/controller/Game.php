<?php
namespace app\admins\controller;
use app\admins\controller\Base;

class Game extends Base
{
    //游戏列表
    public function index(){
        $data['current'] = max(1,(int)input('get.page'));
        $data['perPage'] = 10;
        $data['data'] = $this->db->table('gamelist')->pages($data['perPage']);
        foreach($data['data']['lists'] as $key => $val){
            $data['data']['lists'][$key]['agent'] = $this->db->table('agent')->field('title,status')->where(array('id'=>$val['agent']))->item();
        }
        //dump($data);
        $this->assign('data',$data);
        return $this->fetch();
    }

    //添加
    public function add(){
        if(!role()){
            return $this->fetch('Error/error');
        }
        //平台列表
        $agentList = $this->db->table('agent')->where(array('status'=>1))->lists();
        $this->assign('agentList',$agentList);
        return $this->fetch();
    }

    // 图片上传
	public function upload(){
        $file = request()->file('file');
		if($file==null){
			exit(json_encode(array('code'=>1,'msg'=>'没有文件上传')));
        }
        //dump($file);
		$info = $file->move(ROOT_PATH.'public'.DS.'static/images/game');
		$ext = ($info->getExtension());         //获取文件后缀
		if(!in_array($ext,array('jpg','jpeg','gif','png'))){
			exit(json_encode(array('code'=>0,'msg'=>'文件格式不支持')));
		}
		$img = $info->getSaveName();
		exit(json_encode(array('code'=>1,'msg'=>$img)));
	}

    //添加保存
    public function addSave(){
        $data['agent'] = (int)input('post.agent');
        $data['title'] = trim(input('post.title'));
        $data['type'] = trim(input('post.type'));
        $data['code'] = input('post.code');
        $data['max_player'] = (int)input('post.max_player');
        $data['pic'] = input('post.pic');
        $data['status'] = (int)input('post.status');
        $data['create_time'] = time();
        $this->db->table('gamelist')->insert($data);
        exit(json_encode(array('code'=>1,'msg'=>'添加成功')));
    }

    //修改
    public function edit(){
        if(!role()){
            return $this->fetch('Error/error');
        }
        $id = input('get.id');
        $gameInfo = $this->db->table('gamelist')->where(array('id'=>$id))->item();
        //dump($gameInfo);
        $this->assign('gameInfo',$gameInfo);

        //平台列表
        $agentList = $this->db->table('agent')->where(array('status'=>1))->lists();
        $this->assign('agentList',$agentList);
        return $this->fetch();
    }

    //保存修改
    public function save(){
        $id = (int)input('post.id');
        $data['agent'] = (int)input('post.agent');
        $data['title'] = trim(input('post.title'));
        $data['type'] = trim(input('post.type'));
        $data['code'] = input('post.code');
        $data['max_player'] = input('post.max_player');
        $data['order'] = input('post.order');
        $data['pic'] = input('post.pic');
        $data['status'] = (int)input('post.status');
        $this->db->table('gamelist')->where(array('id'=>$id))->update($data);
        exit(json_encode(array('code'=>1,'msg'=>'修改成功')));
    }

}