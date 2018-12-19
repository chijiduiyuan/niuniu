<?php
/**
 * 留言模块
 */
namespace app\index\controller;
use app\index\controller\Base;

class Feedback extends Base
{
    //意见反馈
    public function index(){
        $id = max(0,input('get.id'));
        $data['gameList'] = $this->db->table('gamelist')->lists();
        if($id > 0){
            $data['rooms'] = $this->db->table('rooms')->where(array('create_uid'=>session('uid'),'game_id'=>$id))->order('create_time desc')->lists();
        }else{
            $data['rooms'] = $this->db->table('rooms')->where(array('create_uid'=>session('uid')))->order('create_time desc')->lists();
        }
        $this->assign('data',$data);
        return $this->fetch();
    }

    //反馈
    public function feedAjax(){
        $data['feed_uid'] = session('uid');
        $data['type'] = input('post.type');
        $data['content'] = input('post.content');
        $data['create_time'] = time();
        $this->db->table('feed')->insert($data);
        exit(json_encode(array('code'=>1,'msg'=>'反馈成功。')));
    }

    //我的反馈
    public function myfeed(){
        $data['feedList'] = $this->db->table('feed')->where(array('feed_uid'=>session('uid')))->order('create_time desc')->lists();
        //dump($data);
        $this->assign('data',$data);
        return $this->fetch();
    }
}