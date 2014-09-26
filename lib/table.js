'use strict';
var utils = require('./utils');
var _ = require('lodash');
var when = require('when');

var Table = function(options) {
  utils.constraints.checkNotNull(options, 'Table options');  
  utils.constraints.checkNotNull(options.table, 'options.table');  
  utils.constraints.checkNotNull(options.database, 'options.database');  
  utils.constraints.checkNotNull(options.identity, 'options.identity');  

  var insert = function(model) {
    model = _.cloneDeep(model);
    var query = options
      .database
      .insert()
      .into(options.table);

    if(_.isArray(model)) {
      query.setFieldsRows(model);
    } else {
      query.setFields(model);
    }
    return query.execute()
      .then(function() {
        return options.database.getLastInsertedId()
          .then(function(id) {
            if(id) { 
              model[options.identity] = id;
            }
            return model;
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
    return options
      .database
      .update()
      .table(options.table)
      .setFields(model)
      .where(options.identity + ' = ?', id)
      .execute();
  };

  var updateMany = function(fields) {
    return options
      .database
      .update()
      .table(options.table)
      .setFields(fields)
      .execute();
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
