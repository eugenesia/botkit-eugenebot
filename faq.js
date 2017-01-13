// Salesforce FAQ functions.
'use strict';

const config = require('./config');
const jsforce = require('jsforce');

// New connection to Salesforce.
const conn = new jsforce.Connection(config.salesforce);

// Search FAQs for a term string.
// Callback is a function in the form function (err, result).
module.exports.search = (term, callback) => {

  let query = `FIND {${term}} IN NAME FIELDS `
    + 'RETURNING FAQ__kav (Id, ArticleNumber, Title, Summary '
    + 'WHERE LANGUAGE = \'en_US\' AND PublishStatus = \'Online\') '
    + 'WITH SNIPPET';

  conn.search(query, (err, res) => {
    console.log(res);

    callback(err, res);
  });
}

// Find a single FAQ by ArticleNumber (integer).
// Callback is a function in the form function (err, result).
module.exports.findByArticleNumber = (articleNumber, callback) => {

  // Left-pad ArticleNumber with zeros to create a 9-digit int as a string.
  articleNumber = '000000000' + String(articleNumber);
  articleNumber = articleNumber.substr(-9);

  let query = 'SELECT Id, ArticleNumber, Title, Summary, Solution__c FROM FAQ__kav '
    + "WHERE Language = 'en_US' AND PublishStatus = 'Online'"
    + `AND ArticleNumber = '${articleNumber}'`;

  conn.query(query, function(err, result) {
    callback(err, result);
  });
}

