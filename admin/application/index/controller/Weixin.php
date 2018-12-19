<?php
/**
* 微信登陆
*/
namespace app\index\controller;
use think\Controller;
use Util\data\Sysdb;

class Weixin extends Controller
{
    public function Oauth() {
        $agent = 5;             //此平台默认id
        $this->db = new Sysdb;
        $wxConfig = $this->db->table('config')->field('appid,appsecret,url,card')->where(array('id'=>$agent))->item();
        //dump($wxConfig);
        $redirect_uri = urlencode($wxConfig['url'].'index.php/index/Weixin/Oauth');
        $code = input('get.code');
        if (empty($code)) {
            //1 第一步：用户同意授权，获取code
            $url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='.$wxConfig['appid'].'&redirect_uri='.$redirect_uri.'&response_type=code&scope=snsapi_userinfo&state=1111#wechat_redirect';
            header('location:'.$url);
            exit;
        } else {
            //2 第二步：通过code换取网页授权access_token
            //echo $code;
            //echo '<br>';
            $url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=" . $wxConfig['appid'] . "&secret=" . $wxConfig['appsecret'] . "&code=" . $code . "&grant_type=authorization_code";
            $tmpJson = CURL($url,"GET"); //访问URL获取数据
            $obj = json_decode($tmpJson);
            //var_dump($obj);
            $access_token = $obj->access_token;
            $openid = $obj->openid;

            //3第三步：拉取用户信息(需scope为 snsapi_userinfo)
            $url = 'https://api.weixin.qq.com/sns/userinfo?access_token=' . $access_token . '&openid=' . $openid . '&lang=zh_CN';
            $tmpJson = CURL($url,"GET"); //访问URL获取数据
            $obj = json_decode($tmpJson);
            //var_dump($obj);
            //保存用户信息到用户表(用户表添加字段)
            $uinfo = $this->db->table('user')->where(array('username'=>$obj->openid))->item();
            //dump($uinfo);
            if (empty($uinfo)) {//用户不存在,添加
                $userData = array(
                    'agent' => $agent,
                    'card'  => $wxConfig['card'],
                    'username' => $obj->openid,
                    'nickname' => $obj->nickname, //昵称
                    'avatar' => $obj->headimgurl, //头像
                    'create_time' => time(), //时间
                    'login_time' => time(),
                    'status' => 1           //1=正常 0=禁用
                );
                $uid = $this->db->table('user')->insert($userData);
                ///设置session保存登录状态
                session('uid',$uid);
            } else {//存在,更新
                $userData = array(
                    'nickname' => $obj->nickname, //昵称
                    'avatar' => $obj->headimgurl, //头像
                    'login_time' => time()
                );
                $this->db->table('user')->where(array('username' => $obj->openid))->update($userData);
                ///设置session保存登录状态
                session('uid',$uinfo['uid']);
            }
            $this->redirect('Index/index');
        }
    }

}