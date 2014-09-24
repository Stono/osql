'use strict';
var utils = require('./utils');
var _ = require('lodash');

var Table = function(options) {
  utils.constraints.checkNotNull(options, 'Table options');  
  utils.constraints.checkNotNull(options.table, 'options.table');  
  utils.constraints.checkNotNull(options.database, 'options.database');  
  utils.constraints.checkNotNull(options.identity, 'options.identity');  

  var insert = function(model) {
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
            model[options.identity] = id;
            return model;
          });
      });
  };

  var select = function() {
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

  var update = function(fields) {
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
    select: select,
    updateOne: updateOne,
    deleteOne: deleteOne,
    delete: deleteMany,
    update: update
  }); 
};

module.exports = Table;
