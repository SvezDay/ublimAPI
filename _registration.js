'use-strict';
var firebase = require('firebase');
var admin = require('firebase-admin');
// const fauth = require('firebase-auth');
// var fireapp = require('firebase/app');
// var fdb = require('firebase/database');
const functions = require('firebase-functions');

const neo4j = require('neo4j-driver').v1;
const parser = require('parse-neo4j');

const validator = require('./_services/validator');
const graphene = require('./_secret').graphene;

let driver = neo4j.driver(graphene.bolt, neo4j.auth.basic(graphene.username, graphene.password));

module.exports.graphRegistration = (tx, uid, email, first, last)=>{
    return new Promise((resolve, reject)=>{

        // uid is already validate by "_tokenValidation"
        validator.email(email)
        .then(()=> validator.str(first))
        .then(()=> validator.str(last))
        .then(()=>{
            let q ="MERGE (p:Person{uid:$uid, email:$email, first:$first, last:$last})"
            return tx.run(q,{uid:uid, email:email, first:first, last:last}).then(parser.parse)
        })
        .then(res=>{resolve(res)})
        .catch(err=>{ err.message = '_registration.js/graphRegistration'; reject(err); });
    })
}
module.exports.firebaseRegistration = (tx, email, pwd, first, last) => {
    // Create new user in FirebaseAuthDatabase
    return new Promise((resolve, reject)=>{

        validator.email(email)
        .then(()=> validator.pwd(pwd))
        .then(()=>{
            return firebase.auth().createUser({
                email: email,
                emailVerified: false,
                password: password,
                disabled: false
            });
        })
        .then(res=>{
            return this.graphRegistration(tx, res.uid, res.email, first, last);
        })
        .then(res=>{ resolve(res) })
        .catch(err=>{ err.message = '_registration.js/graphRegistration'; reject(err); });
    })
};

module.exports.main = (req, res, next)=>{
    let session = driver.session();
    let tx = session.beginTransaction();
    // let decoded = req.decoded;
    // let params = req.body;

    this.firebaseRegistration(tx, req.body.email, req.body.password, req.body.first, req.body.last)
    .then( data => require('../_service/graph-methods').success(session, tx, res, ps.uid, data) )
    .catch(err =>{console.log(err); require('../_service/graph-methods').fail(sessionn, {status: err.status || 400, mess: err.mess || 'user/get-profile.js/main'}, res, tx)} )
}
