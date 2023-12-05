const crypto = require('crypto');
const dotenv = require('dotenv');
const url = require('url');
const querystring = require('querystring');
const xml2js = require('xml2js');
const WebSocket = require('ws');

dotenv.config();

let userChatHistory = {};
let userLastChatTime = {};
let userStashMsg = {};
let userHasAnswerIng = {};

const emojiObj = {
  "/::)": "微笑",
  "/::~": "伤心",
  "/::B": "美女",
  "/::|": "发呆",
  "/:8-)": "墨镜",
  "/::<": "哭",
  "/::$": "羞",
  "/::X": "哑",
  "/::Z": "睡",
  "/::’(": "哭",
  "/::-|": "囧",
  "/::@": "怒",
  "/::P": "调皮",
  "/::D": "笑",
  "/::O": "惊讶",
  "/::(": "难过",
  "/::+": "酷",
  "/:–b": "汗",
  "/::Q": "抓狂",
  "/::T": "吐",
  "/:,@P": "笑",
  "/:,@-D": "快乐",
  "/::d": "奇",
  "/:,@o": "傲",
  "/::g": "饿",
  "/:|-)": "累",
  "/::!": "吓",
  "/::L": "汗",
  "/::>": "高兴",
  "/::,@": "闲",
  "/:,@f": "努力",
  "/::-S": "骂",
  "/:?": "疑问",
  "/:,@x": "秘密",
  "/:,@@": "乱",
  "/::8": "疯",
  "/:,@!": "哀",
  "/:!!!": "鬼",
  "/:xx": "打击",
  "/:bye": "bye",
  "/:wipe": "汗",
  "/:dig": "抠",
  "/:handclap": "鼓掌",
  "/:&-(": "糟糕",
  "/:B-)": "恶搞",
  "/:<@": "什么",
  "/:@>": "什么",
  "/::-O": "累",
  "/:>-|": "看",
  "/:P-(": "难过",
  "/::’|": "难过",
  "/:X-)": "坏",
  "/::*": "亲",
  "/:@x": "吓",
  "/:8*": "可怜",
  "/:pd": "刀",
  "/:<W>": "水果",
  "/:beer": "酒",
  "/:basketb": "篮球",
  "/:oo": "乒乓",
  "/:coffee": "咖啡",
  "/:eat": "美食",
  "/:pig": "动物",
  "/:rose": "鲜花",
  "/:fade": "枯",
  "/:showlove": "唇",
  "/:heart": "爱",
  "/:break": "分手",
  "/:cake": "生日",
  "/:li": "电"
};

module.exports = async function (request, response) {
  const method = request.method;
  const timestamp = request.query.timestamp;
  const nonce = request.query.nonce;
  const signature = request.query.signature;
  const echostr = request.query.echostr;

  if (method === 'GET') {
    const token = process.env.WX_TOKEN;
    const tmpArr = [token, timestamp, nonce].sort();
    const tmpStr = tmpArr.join('');
    const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');
    if (hash === signature) {
      response.status(200).send(echostr);
      return;
    } else {
      response.status(200).send("failed");
      return;
    }
  }

  const xml = request.read().toString();
  const parser = new xml2js.Parser();
  const textMsg = await parser.parseStringPromise(xml);
  // console.log(textMsg);
  const ToUserName = textMsg.xml.ToUserName[0];
  const FromUserName = textMsg.xml.FromUserName[0];
  const CreateTime = textMsg.xml.CreateTime[0];
  const MsgType = textMsg.xml.MsgType[0];
  let Content;
  if (MsgType === 'text') {
    Content = textMsg.xml.Content[0];
    if (Object.hasOwnProperty.call(emojiObj, Content)) {
      Content = '我发送了表情：' + emojiObj[Content] + '，现在你要怎么做'
    }
  }

  const timeNow = Math.floor(Date.now() / 1000);

  if (MsgType === 'event') {
    const Event = textMsg.xml.Event[0];
    if (Event === 'subscribe') {
      response.status(200).send(formatReply(
        FromUserName,
        ToUserName,
        timeNow,
        '欢迎关注，我已经接入了星火认知大模型。快来和我对话吧。'
      ));
      return;
    } else {
      return response.status(200).send('');
    }
  }

  if (userHasAnswerIng[FromUserName]) {
    response.status(200).send(formatReply(
      FromUserName,
      ToUserName,
      timeNow,
      '【还在思考中，回复任意文字尝试获取回复】'
    ));
    return;
  }

  if (userStashMsg[FromUserName]) {
    console.log('用户有暂存数据，返回暂存数据');
    let tmp = userStashMsg[FromUserName];
    userStashMsg[FromUserName] = '';
    response.status(200).send(formatReply(
      FromUserName,
      ToUserName,
      timeNow,
      tmp
    ));
    return;
  }
  console.log("当前时间：", timeNow, "上次时间：", userLastChatTime[FromUserName])
  if (
    userLastChatTime[FromUserName] &&
    timeNow - userLastChatTime[FromUserName] >= 300
  ) {
    userChatHistory[FromUserName] = [];
  }
  userLastChatTime[FromUserName] = timeNow;
  if (!userChatHistory[FromUserName]) {
    userChatHistory[FromUserName] = [];
  }
  userChatHistory[FromUserName].push({ Role: 'user', Content });
  console.log("会话历史：", userChatHistory);
  const data = genParams(userChatHistory[FromUserName]);

  const connect = await getConnect();
  connect.send(JSON.stringify(data));

  let answer = '';
  let timeout;
  const done = new Promise((resolve) => {
    connect.on('message', (msg) => {
      const data = JSON.parse(msg);
      const payload = data.payload;
      const choices = payload.choices;
      const header = data.header;
      const code = header.code;

      if (code !== 0) {
        console.log(payload);
        return;
      }

      const status = choices.status;
      const text = choices.text;
      const content = text[0].content;
      if (status !== 2) {
        answer += content;
      } else {
        answer += content;
        console.log('收到最终结果：', answer);
        const usage = payload.usage;
        const temp = usage.text;
        const totalTokens = temp.total_tokens;
        console.log('total_tokens:', totalTokens);
        userHasAnswerIng[FromUserName] = false;
        userChatHistory[FromUserName].push({
          Role: 'assistant',
          Content: answer,
        });
        const timeNow2 = Math.floor(Date.now() / 1000);
        if (timeNow2 - timeNow > 3) {
          userStashMsg[FromUserName] = answer;
        }
        clearTimeout(timeout);
        resolve();
      }
    });
  });

  const timeoutPromise = new Promise((resolve) => {
    timeout = setTimeout(() => {
      userHasAnswerIng[FromUserName] = true;
      console.log('执行超过3s，提前返回');
      resolve(
        formatReply(
          FromUserName,
          ToUserName,
          timeNow,
          '【正在思考中，回复任意文字尝试获取回复】'
        )
      );
    }, 3000);
  });

  const result = await Promise.race([done, timeoutPromise]);
  if (result) {
    response.status(200).send(result);
    return;
  }
  response.status(200).send(formatReply(FromUserName, ToUserName, timeNow, answer));
  return
};

function formatReply(ToUserName, FromUserName, CreateTime, Content) {
  return `<xml>
        <ToUserName><![CDATA[${ToUserName}]]></ToUserName>
        <FromUserName><![CDATA[${FromUserName}]]></FromUserName>
        <CreateTime>${CreateTime}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${Content}]]></Content>
    </xml>`;
}

function genParams(messages) {
  return {
    header: {
      app_id: process.env.APPID,
    },
    parameter: {
      chat: {
        domain: process.env.SPARK_DOMAIN,
        temperature: 0.8,
        top_k: 6,
        max_tokens: 2048,
        auditing: 'default',
      },
    },
    payload: {
      message: {
        text: messages,
      },
    },
  };
}
async function getConnect() {
  const authUrl = assembleAuthUrl1();
  const ws = new WebSocket(authUrl);
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  return ws;
}

function assembleAuthUrl1() {
  const hostUrl = process.env.HOST_URL;
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_SECRET;
  const ul = url.parse(hostUrl);
  const date = new Date().toUTCString();
  const signString = `host: ${ul.host}\ndate: ${date}\nGET ${ul.pathname} HTTP/1.1`;
  const sha = hmacWithShaTobase64('hmac-sha256', signString, apiSecret);
  const authUrl = `hmac username="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${sha}"`;
  const authorization = Buffer.from(authUrl).toString('base64');
  const v = querystring.stringify({
    host: ul.host,
    date: date,
    authorization: authorization,
  });
  return hostUrl + '?' + v;
}

function hmacWithShaTobase64(algorithm, data, key) {
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  const encodeData = hmac.digest();
  return Buffer.from(encodeData).toString('base64');
}
