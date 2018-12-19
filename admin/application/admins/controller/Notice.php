<?php
namespace app\admins\controller;
use app\admins\controller\Base;

class Notice extends Base
{
    //公告列表
    public function index(){
        $data['current'] = max(1,(int)input('get.page'));
        $data['perPage'] = 10;
        $data['data'] = $this->db->table('notice')->pages($data['perPage']);
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

    //添加保存
    public function addSave(){
        $data['agent'] = (int)input('post.agent');
        $data['content'] = md5(input('post.content'));
        $data['status'] = (int)input('post.status');
        $data['create_time'] = time();
        $this->db->table('notice')->insert($data);
        exit(json_encode(array('code'=>1,'msg'=>'添加成功')));
    }

    //修改
    public function edit(){
        if(!role()){
            return $this->fetch('Error/error');
        }
        $id = (int)input('get.id');
        $noticeInfo = $this->db->table('notice')->where(array('id'=>$id))->item();
        //dump($noticeInfo);
        $this->assign('noticeInfo',$noticeInfo);

        //平台列表
        $agentList = $this->db->table('agent')->where(array('status'=>1))->lists();
        $this->assign('agentList',$agentList);

        return $this->fetch();
    }

    //保存修改
    public function save(){
        $id = input('post.id');
        $data['agent'] = input('post.agent');
        $data['content'] = input('post.content');
        $data['status'] = (int)input('post.status');
        $this->db->table('notice')->where(array('id'=>$id))->update($data);
        exit(json_encode(array('code'=>1,'msg'=>'修改成功')));
    }

}