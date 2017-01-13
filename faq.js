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

