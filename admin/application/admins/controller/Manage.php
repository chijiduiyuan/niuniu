<?php
namespace app\admins\controller;
use app\admins\controller\Base;

class Manage extends Base
{
    //管理员列表
    public function index(){
        $data['current'] = max(1,(int)input('get.page'));
        $data['perPage'] = 10;
        $data['data'] = $this->db->table('admin')->pages($data['perPage']);
        foreach($data['data']['lists'] as $key => $val){
            $data['data']['lists'][$key]['agent'] = $this->db->table('agent')->field('title,status')->where(array('id'=>$val['agent']))->item();
            $data['data']['lists'][$key]['role'] = $this->db->table('role')->field('title,status')->where(array('id'=>$val['role']))->item();
        }
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

        //分组列表
        $roleList = $this->db->table('role')->where(array('status'=>1))->lists();
        $this->assign('roleList',$roleList);
        return $this->fetch();
    }

    //添加保存
    public function addSave(){
        $data['username'] = input('post.username');
        $data['pwd'] = md5(input('post.pwd'));
        $data['role'] = (int)input('post.role');
        $data['agent'] = (int)input('post.agent');
        $data['create_time'] = time();
        $this->db->table('admin')->insert($data);
        exit(json_encode(array('code'=>1,'msg'=>'添加成功')));
    }

    //修改
    public function edit(){
        if(!role()){
            return $this->fetch('Error/error');
        }
        $id = (int)input('get.id');
        $manageInfo = $this->db->table('admin')->where(array('id'=>$id))->item();
        //dump($manageInfo);
        $this->assign('manageInfo',$manageInfo);

        //平台列表
        $agentList = $this->db->table('agent')->where(array('status'=>1))->lists();
        $this->assign('agentList',$agentList);

        //分组列表
        $roleList = $this->db->table('role')->where(array('status'=>1))->lists();
        $this->assign('roleList',$roleList);

        return $this->fetch();
    }

    //保存修改
    public function save(){
        $id = input('post.id');
        $data['agent'] = input('post.agent');
        $data['role'] = input('post.role');
        $data['status'] = (int)input('post.status');
        $this->db->table('admin')->where(array('id'=>$id))->update($data);
        exit(json_encode(array('code'=>1,'msg'=>'修改成功')));
    }

}