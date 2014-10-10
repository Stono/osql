'use strict';
var utils = require('./utils');
var _ = require('lodash');
var when = require('when');
var conker = new require('conker')({
  maxPerKey: 1
});

var Table = function(options) {
  utils.constraints.checkNotNull(options, 'Table options');  
  utils.constraints.checkNotNull(options.table, 'options.table');  
  utils.constraints.checkNotNull(options.database, 'options.database');  
  utils.constraints.checkNotNull(options.identity, 'options.identity');  

  var insert = function(model) {
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

    return conker.start(options.table, function(callback) {
      query.execute()
      .then(function(id) {
        if(!id && identityInsert === false) {
          throw new Error('No value was returned from the database for the identity of the inserted row.  This could indicate a problem with the users permissions to query the metadata of the table');
        }
        model[options.identity] = id;
        callback(null, model);
      });
    });

  };

  var selectOne = function(id) {
    return when.promise(function(resolve) {
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
    });
  };

  var selectMany = function() {
    return options
      .database
      .select()
      .from(options.table);
  };

  var updateOne = function(id, model) {
    var cloned = _.cloneDeep(model);
    delete cloned[options.identity];
    return options
      .database
      .update()
      .table(options.table)
      .setFields(cloned)
      .where(options.identity + ' = ?', id)
      .execute();
  };

  var updateMany = function(fields) {
    return options
      .database
      .update()
      .table(options.table)
      .setFields(fields);
  };

  var deleteOne = function(id) {
    return options
      .database
      .delete()
      .from(options.table)
      .where(options.identity + ' = ?', id)
      .execute();
  };

  var deleteMany = function() {
    return options
      .database
      .delete()
      .from(options.table);
  };

  return Object.freeze({
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
