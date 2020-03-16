const functions = require('firebase-functions');
const request = require('request');
const region = 'asia-northeast1';
const admin = require("firebase-admin");
config = require('./parms/parm')

const spec = {
    memory: "1GB"
};

admin.initializeApp(functions.config().firebase)
const db = admin.firestore();

exports.LineAPI = functions.region(region).runWith(spec).https.onRequest((request, respond) => {
    var event = request.body.events[0]
    var userId = event.source.userId;
    var timestamp = event.timestamp;
    var replyToken = event.replyToken;
    var userText = ""
    if (event.type === "message" && event.message.type === "text"){
        userText = event.message.text
    } else {
        userText = "(Message type is not text)";
    }
    const addChatHistory = db.collection("linechat_hist").doc(timestamp.toString()).set({
        "userId": userId,
        "Message": userText,
        "timestamp": timestamp
    })

    const getUserData = db.collection("line_user").doc(userId).get().then( returnData =>{
        if (returnData.exists){
          var name = returnData.data().name
          var surname = returnData.data().surname
          var nickname = returnData.data().nickname
          reply_message(replyToken, `Hello ${nickname}(${name} ${surname})`)
        } else {
          reply_message(replyToken, `Hello, this is your first time with us. Would you like to register?`)
          // do some registration function here
        }
        return null
    }).catch(err => {
        console.log(err)
    })

    return respond.status(200).send(request.method);
});

const LINE_HEADER = {
    "Content-Type": "application/json",
    "Authorization": "Bearer {'QxfXM7D3PTYydikKC+K4cEjE0NgYPftH3VsayWB2dAECxLTuradAe75aX9znx3gXPy5TvYFpWZCtoZyjOr7HqJhZEvwXIpUe9mQlkSLwUF7iNmlRwHW6URYEfEyEAnX8OTHrjRPzXqk99oQE967OrQdB04t89/1O/w1cDnyilFU='}"
  }

function reply_message(replytoken,textfrom){
    return request.post({
        uri: `https://api.line.me/v2/bot/message/reply`,
        headers: LINE_HEADER,
        body: JSON.stringify({
          replyToken: replytoken,
          messages: [
            {
              type: "text",
              text: textfrom
            }
          ]
        })
      });
}

