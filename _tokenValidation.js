'use-strict';
var admin = require('firebase-admin');

const jwt = require('jsonwebtoken');
const secret = require('./_secret').token_secret;
// const algo = require('../config/config').algo;

// module.exports.verify = (token)=>{
//   return jwt.verify(token, secret.secret, function(err, decoded){
//     if(err){
//       // console.log('token websocket verify ERROR', err);
//       return { success: 'false', message: 'Fail to authenticate token !' }
//     }else{
//       return decoded
//     }
//   });
// }

let firebaseVerifyToken = (token)=>{
    return new Promise((resolve, reject)=>{
        // console.log("In firebaseVerifyToken 1");
        admin.auth().verifyIdToken(token)
        .then(decodedToken => {
            var uid = decodedToken.uid;
            // console.log("In firebaseVerifyToken 2");
            // console.log("Successfully validate token:", uid);
            // resolve("done !")
            resolve(decodedToken);
        })
        .catch(error => {
            console.log("Error creating new user:", error);
            resolve("failed !")
        });
    })
}

module.exports.tokenFn = (req, res, next)=>{
  // Check headers or url parameters or post parameters for token
  const token = req.headers.authorization || req.headers['x-access-token'] || req.query.token || req.body.token;
  // Decode token
  // console.log('req.headers', req.headers);
  // console.log('token', token);
  if(token){
      firebaseVerifyToken(JSON.parse(token)).then(decodedToken=>{
          // console.log("uid:", decodedToken.uid);
          req.decoded = decodedToken;
          next();
      })
     // jwt.verify(token, secret.secret, function(err, decoded){
     //   if(err){
     //     console.log('token ERROR 1');
     //     console.log(err);
     //     return res.status(401).json({
     //        success: 'false', message: 'Fail to authenticate token !'
     //     });
     //   }else{
     //     req.decoded = decoded;
     //     next();
     //   }
     // });
  }
  // Trow error
  else {
     console.log('tokenFn Error');
     res.status(401).json({
        success: false,
        message: 'No token provided.'
     })
  }
}

// var serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://users.firebaseio.com'
// });

// var refreshToken; // Get refresh token from OAuth2 flow
// admin.initializeApp({
//   credential: admin.credential.refreshToken(refreshToken),
//   databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
// });
