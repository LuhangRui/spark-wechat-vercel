# spark-wechat-vercel
基于vercel的serverless服务，把星火认知大模型接入微信公众号

### 必要条件

1. 有一个域名

>这个条件我觉得已经相当低了，至少成本比服务器要少很多吧。`xyz、fun、asia` 结尾的域名只要6-14块一年。

### 流程

1. 注册星火认知大模型，创建一个应用，获得`APPID`,`API_SECRET`,`API_KEY`,领取400w token 的额度。
2. 去阿里云购买个你喜欢的域名，最便宜的那种就行。买完增加`cname`解析到`cname-china.vercel-dns.com`
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

### QA
#### 部署完成后为什么访问会404啊？

不用纠结为什么会404，我们使用的是vercel的serverless能力，我们项目里没有部署页面。所以访问首页会404，这是正常的。
如果要确认是否部署成功，请看一下一个问题。

#### 部署成功的特征是什么？

答：访问路径`https://你的域名/api/qw-wechat`，页面输出`failed`，即为部署成功，可以去微信公众平台提交开发配置，验证`token`。

#### 公众号验证token成功，但是发送消息没反应啊？

答：检查微信公众平台开发配置有没有启用。`Vercel`环境变量是否正确，务必注意环境变量的大小写情况以及命名方式是蛇形，不是驼峰，建议直接复制。
![image](https://github.com/SuxueCode/WechatBakTool/assets/30895030/d9312742-51ed-408a-a98e-f1ce776f7664)

```
HOST_URL
SPARK_DOMAIN
APPID
API_SECRET
API_KEY
WX_TOKEN
KEYWORD_REPLAY
SUBSCRIBE_REPLY
```
#### 为什么有时候会忘记之前的对话

答：`serverless`服务是一种无状态的服务，每次请求都是一个新的生命周期，只有在两次请求相距时间很短的情况下才有可能会复用上个生命周期，呈现出记录了上次对话的状态。因此，如果模型忘记了上次对话才是常态，记住了，才是取巧。

#### 能记住之前的对话嘛？

答：可以，依然是白嫖`Verel`的免费数据库资源，有能力的朋友可以自己研究下。作者也是据此开发了一版能记住更多对话的版本。不过不准备开源。有需要的朋友可以通过下方的公众号联系我。关注公众号之后的自动回复里有我的微信，不要在公众号里问。

#### 能帮忙部署嘛？

答：只提供有偿的代部署服务。

#### 能不能接入其他大模型啊？

答：不一定有精力，后续看一下。一般来说，不能白嫖的是不接入的。目前支持的有：

[星火认知大模型](https://github.com/LuhangRui/spark-wechat-vercel)

[通义千问大模型](https://github.com/LuhangRui/qw-wechat-vercel)


#### 有没有作者联系方式，有问题需要咨询？

答：关注我的微信公众号，然后你自然就会知道怎么找到我。

![image](https://github.com/SuxueCode/WechatBakTool/assets/30895030/0a508949-ca25-4394-9d51-062c5334d020)