<?php
namespace app\admins\controller;
use app\admins\controller\Base;

class Agent extends Base
{
    //平台列表
    public function index(){
        $data['current'] = max(1,(int)input('get.page'));
        $data['perPage'] = 10;
        $data['data'] = $this->db->table('agent')->pages($data['perPage']);
        //dump($data);
        $this->assign('data',$data);
        return $this->fetch();
    }

    //添加
    public function add(){
        if(!role()){
            return $this->fetch('Error/error');
        }
        return $this->fetch();
    }

    //添加保存
    public function addSave(){
        $data['title'] = input('post.title');
        $data['is_main'] = (int)input('post.is_main');
        $data['status'] = (int)input('post.status');
        $data['create_time'] = time();
        $this->db->table('agent')->insert($data);
        exit(json_encode(array('code'=>1,'msg'=>'添加成功')));
    }

    //修改
    public function edit(){
        if(!role()){
            return $this->fetch('Error/error');
        }
        $id = input('get.id');
        $agentInfo = $this->db->table('agent')->where(array('id'=>$id))->item();
        //dump($agentInfo);
        $this->assign('agentInfo',$agentInfo);
        return $this->fetch();
    }

    //保存修改
    public function save(){
        $id = input('post.id');
        $data['title'] = input('post.title');
        $data['is_main'] = (int)input('post.is_main');
        $data['status'] = (int)input('post.status');
        $this->db->table('agent')->where(array('id'=>$id))->update($data);
        exit(json_encode(array('code'=>1,'msg'=>'修改成功')));
    }
 
}