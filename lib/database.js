'use strict';
var utils = require('./utils');
var when = require('when');
function requireUncached(module){
  delete require.cache[require.resolve(module)];
  return require(module);
}

var CrudDriver = function(opts) {
  var crud = function(which) {
    var query = opts.squel[which]();
    query.execute = function() {
      return opts.execute(query.toString());
    };
    return query;
  };
  var select = function() {
    return crud('select');
  };

  var insert = function() {
    return crud('insert');
  };

  var update = function() {
    return crud('update');
  };

  var deleteItem = function() {
    return crud('delete');
  };

  return Object.freeze({
    select: select,
    insert: insert,
    update: update,
    delete: deleteItem,
    execute: opts.execute,
    getLastInsertedId: opts.getLastInsertedId
  });
};

var SqlLite3Driver = function(options) {
  utils.constraints.checkNotNull(options, 'Driver options');  
  var sqlite3 = require('sqlite3').verbose();
  var db = new sqlite3.Database(options);
  var squel = requireUncached('squel').useFlavour('mysql');

  var execute = function(sql) {
    return when.promise(function(resolve, reject) {
      db.serialize(function() {
        db.all(sql, function(err, rows) {
          if(err) {
            reject(err);
            return;
          } else {
            resolve(rows);
          }
        }); 
      });
    });
  };
  var getLastInsertedId = function() {
    return when.promise(function(resolve) {
      execute('SELECT last_insert_rowid()')
        .then(function(rs) {
          resolve(rs[0]['last_insert_rowid()']);
        });
    });
  };

  return new CrudDriver({
    execute: execute,
    getLastInsertedId: getLastInsertedId,
    squel: squel
  });
};

var MssqlDriver = function(options) {
  utils.constraints.checkNotNull(options, 'Driver options');  
  var mssql = require('mssql');
  var squel = requireUncached('squel').useFlavour('mssql');
  var db;

  var getDbConnection = function() {
    return when.promise(function(resolve, reject) {
      if(db && db.connected) {
        resolve(db);
      } else {
        db = new mssql.Connection(options, function(err) {
          if(err) {
            reject(err);
            return;
          }
          resolve(db);
        });
      }
    });
  };

  var execute = function(sql) {
    return getDbConnection()
      .then(function(connection) {
        return when.promise(function(resolve, reject) {
          var request = new mssql.Request(connection);
          request.query(sql, function(err, recordset) {
            if(err) {
              reject(err);
            } else {
              resolve(recordset);
            }
          });
        });
      });
  };

  var getLastInsertedId = function(table) {
    return when.promise(function(resolve) {
      execute('SELECT IDENT_CURRENT(\'' + table + '\')')
          .then(function(rs) {
            resolve(rs[0][Object.keys(rs[0])[0]]);
          });
          });
      };

      return new CrudDriver({
        execute: execute,
        getLastInsertedId: getLastInsertedId,
        squel: squel
      });

      };

      var Database = function(driver, options) {
        var drivers = {
          'sqlite3': SqlLite3Driver,
          'mssql': MssqlDriver
        };
        var Driver = drivers[driver];
        if(!Driver) {
          throw new Error('Unknown driver: ' + driver);
        }
        return new Driver(options);
      };

module.exports = Database;
