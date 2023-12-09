# spark-wechat-vercel
基于vercel的serverless服务，把星火认知大模型接入微信公众号

### 必要条件

1. 有一个域名

>这个条件我觉得已经相当低了，至少成本比服务器要少很多吧。`xyz、fun、asia` 结尾的域名只要6-14块一年。

### 流程

1. 注册星火认知大模型，创建一个应用，获得`APPID`,`API_SECRET`,`API_KEY`,领取400w token 的额度。
2. 去阿里云购买个你喜欢的域名，最便宜的那种就行。买完增加`cname`解析到`cname.vercel-dns.com`
3. 注册微信公众号，个人订阅号就行。后台管理页面上找到`设置与开发`-`基本配置`-`服务器配置`，修改服务器地址url为`https://你的域名/api/spark-wechat`，`TOKEN`是自定义的，随便编一个。`EncodingAESKey`随机生成(~~反正我们不用这一项~~)，我们选明文模式就好了。先不要提交，提交会校验TOKEN，所以等下一步我们部署好了再进行操作。
4. fork本项目到你自己的仓库，访问[【Vercel】](https://vercel.com/)使用github账号登录就好了。然后新建项目，选择`Import Git Repository`从github仓库导入。在`Environment Variables`选项卡，增加环境变量。把下面的变量一项一项的加进去：
```
#这是v3版本星火大模型的请求地址，如果请求v2,v1.5修改HOST_URL、SPARK_DOMAIN这两项即可
#v1.5 地址：ws(s)://spark-api.xf-yun.com/v1.1/chat DOMAIN:general
#V2 地址：ws(s)://spark-api.xf-yun.com/v2.1/chat DOMAIN:generalv2
HOST_URL=wss://spark-api.xf-yun.com/v3.1/chat
SPARK_DOMAIN=generalv3
APPID=星火appid
API_SECRET=星火appsecret
API_KEY=星火apikey
WX_TOKEN=微信公众号TOKEN
#这一项是关键词自动回复，是个json串，用于对特定关键词回复不同内容
KEYWORD_REPLAY={"聊天记录":"https://www.alipan.com/s/XRqvCx7Sur7 点击链接保存，或者复制本段内容，打开「阿里云盘」APP"}
#此项为关注后的自动回复配置
SUBSCRIBE_REPLY=欢迎关注，我已经接入了星火认知大模型。快来和我对话吧。
```
填完之后点击`Deploy`，等待部署完成后，点击`settings`找到`Domain`，把你的域名填上去就好了，会自动加https

5. 这个时候回到微信后台，可以点击提交了，不出意外的话，会提示`token验证成功`，到外边，启用服务器配置。ok，大功告成。现在你有一个接入星火认知大模型的微信公众号聊天机器人了。