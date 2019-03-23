'use-strict';
const neo4j = require('neo4j-driver').v1;
const parser = require('parse-neo4j');
const graphene = require('../_secret').graphene;

let driver = neo4j.driver(graphene.bolt, neo4j.auth.basic(graphene.username, graphene.password));

module.exports.getProfile = (tx, decoded)=>{
    return new Promise((resolve, reject)=>{
        let q = `match (p:Person{uid:$uid}) return {first:p.first, last:p.last, email:p.email, photo:p.photo}`;

        return tx.run(q, {uid:decoded.uid}).then(parser.parse)
        .then( data => {
            if(!data.length){
                return require('../_registration').graphRegistration(tx, decoded.uid, decoded.email, "first", "last");
            }else{
                return data;
            }
        })
        .then(data=> resolve(data[0]) )
        .catch(err =>{console.log(err); reject({status: err.status || 400, mess: err.mess || 'user/get-profile.js/getProfile'}); })
    })
}

module.exports.main = (req, res, next)=>{
    let session = driver.session();
    let tx = session.beginTransaction();
    let decoded = req.decoded;
    // let params = req.body;

    this.getProfile(tx, decoded)
    .then( data => require('../_services/graph-methods').success(session, tx, res, req.decoded.uid, data) )
    .catch(err =>{console.log(err); require('../_services/graph-methods').fail(session, {status: err.status || 400, mess: err.mess || 'user/get-profile.js/main'}, res, tx)} )
}
