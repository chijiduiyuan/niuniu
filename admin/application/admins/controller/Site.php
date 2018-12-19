<?php
/**
 * 站点管理
 */
namespace app\admins\controller;
use app\admins\controller\Base;

class Site extends Base
{
    //站点列表
    public function index(){
        $siteList = $this->db->table('config')->lists();
        foreach($siteList as $key => $val){
            $siteList[$key]['agent'] = $this->db->table('agent')->field('title,status')->where(array('id'=>$val['agent']))->item();
        }
        //dump($siteList);
        $siteCount = $this->db->table('config')->count();
        //dump($siteCount);
        $current = max(1,(int)input('get.page'));
        $perPage = 10;
        $this->assign('current',$current);
        $this->assign('perPage',$perPage);
        $this->assign('count',$siteCount);
        $this->assign('siteList',$siteList);
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
        $data['appid'] = input('post.appid');
        $data['appsecret'] = input('post.appsecret');
        $data['url'] = input('post.url');
        $data['card'] = (int)input('post.card');
        $data['create_time'] = time();
        $site = $this->db->table('config')->where(array('agent'=>$data['agent']))->item();
        //dump($site);
        if($site){
            exit(json_encode(array('code'=>0,'msg'=>'此平台已经配置!')));
        }else{
            $this->db->table('config')->insert($data);
            exit(json_encode(array('code'=>1,'msg'=>'添加成功')));
        }
    }

    //修改
    public function edit(){
        if(!role()){
            return $this->fetch('Error/error');
        }
        $id = (int)input('get.id');
        $siteInfo = $this->db->table('config')->where(array('id'=>$id))->item();
        //dump($siteInfo);
        $this->assign('siteInfo',$siteInfo);

        //平台列表
        $agentList = $this->db->table('agent')->where(array('status'=>1))->lists();
        $this->assign('agentList',$agentList);

        return $this->fetch();
    }

    //保存修改
    public function save(){
        $id = (int)input('post.id');
        $data['agent'] = (int)input('post.agent');
        $data['appid'] = input('post.appid');
        $data['appsecret'] = input('post.appsecret');
        $data['url'] = input('post.url');
        $data['card'] = (int)input('post.card');
        $this->db->table('config')->where(array('id'=>$id))->update($data);
        exit(json_encode(array('code'=>1,'msg'=>'修改成功')));
    }

}