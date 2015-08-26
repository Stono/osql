'use strict';
var utils = require('./utils');
var _ = require('lodash');
var when = require('when');
var nodefn = require('when/node');
var bindCallback = nodefn.bindCallback;

var conker = new require('conker')({
  maxPerKey: 1
});

var Table = function(options) {
  utils.constraints.checkNotNull(options, 'Table options');  
  utils.constraints.checkNotNull(options.table, 'options.table');  
  utils.constraints.checkNotNull(options.database, 'options.database');  

  var insert = function(model, callback) {
    model = _.cloneDeep(model);
    var identityInsert = false;
    if(!utils.constraints.isNull(model[options.identity])) {
      identityInsert = true;
    }
    var query = options
      .database
      .insert(null, options.table, identityInsert)
      .into(options.table);

    if(_.isArray(model)) {
      query.setFieldsRows(model);
    } else {
      query.setFields(model);
    }

    return bindCallback(conker.start(options.table, function(callback) {
      query.execute()
        .then(function(id) {
          if(!id && identityInsert === false && options.identity) {
            throw new Error('No value was returned from the database for the identity of the inserted row.  This could indicate a problem with the users permissions to query the metadata of the table');
          }
          model[options.identity] = id;
          callback(null, model);
        })
		.catch(function(err) {
		  callback(err);		
		});
    }), callback);
  };

  var selectOne = function(id, callback) {
    return bindCallback(when.promise(function(resolve) {
      return options
        .database
        .select()
        .from(options.table)
        .limit(1)
        .where(options.identity + ' = ?', id)
        .execute()
        .then(function(results) {
          if(results.length > 0) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        });
    }), callback);
  };

  var selectMany = function() {
    return options
      .database
      .select()
      .from(options.table);
  };

  var updateOne = function(id, model, callback) {
    var cloned = _.cloneDeep(model);
    delete cloned[options.identity];
    return bindCallback(options
      .database
      .update()
      .table(options.table)
      .setFields(cloned)
      .where(options.identity + ' = ?', id)
      .execute(), callback);
  };

  var updateMany = function(fields) {
    return options
      .database
      .update()
      .table(options.table)
      .setFields(fields);
  };

  var deleteOne = function(id, callback) {
    return bindCallback(options
      .database
      .delete()
      .from(options.table)
      .where(options.identity + ' = ?', id)
      .execute(), callback);
  };

  var deleteMany = function() {
    return options
      .database
      .delete()
      .from(options.table);
  };

  var wrap = function(prefix, server) {
    if(prefix.slice(-1) !== '/') {
      prefix = prefix + '/';
    }
    var baseUrl = prefix + options.table;
    server.get(baseUrl, function(req, res) {
      selectMany()
        .execute()
        .then(function(results) {
          res.send(results);
        });
    });

    server.get(baseUrl + '/:id', function(req, res) {
      selectOne(req.params.id)
        .then(function(results) {
          if(!results) {
            // Really this should check .deleted, and return a 410 GONE if true.
            res.status(404);
            return res.end();
          }
          res.send(results);
        });
    });

    server.get(baseUrl + '/:id/:field', function(req, res) {
      selectOne(req.params.id)
        .then(function(result) {
          if(!result) {
            // Really this should check .deleted, and return a 410 GONE if true.
            res.status(404);
            return res.end();
          }
          res.send(result[req.params.field]);
        });
    });

    server.del(baseUrl + '/:id', function(req, res) {
      deleteOne(req.params.id)
        .then(function() {
          res.status(204);
          res.end();
        });
    });

    server.post(baseUrl, function(req, res) {
      insert(req.body)
        .then(function(result) {
          res.status(201);
          res.send(result);
        });
    });

    server.put(baseUrl + '/:id', function(req, res) {
      selectOne(req.params.id)
        .then(function(object) {
          if(!object) {
            res.status(404);
            return res.end();
          }
          return updateOne(req.params.id, req.body)
            .then(function(result) {
              // Returning a 200 as we're returning the object
              res.status(200);
              res.send(result);
            });
        });
    });
  };

  return Object.freeze({
    wrap: wrap,
    insert: insert,
    select: selectOne,
    selectMany: selectMany,
    update: updateOne,
    updateMany: updateMany,
    delete: deleteOne,
    deleteMany: deleteMany
  }); 
};

module.exports = Table;
