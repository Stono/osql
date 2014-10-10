'use strict';
var utils = require('./utils');
var when = require('when');
var _ = require('lodash');
var async = require('async');

function requireUncached(module){
  delete require.cache[require.resolve(module)];
  return require(module);
}

var CrudDriver = function(opts) {
  var getOperation = function(which, copts) {
    copts = _.merge({}, copts, { replaceSingleQuotes: true });
    return opts.squel[which](copts);
  };
  var rud = function(which, copts) {
    var query = getOperation(which, copts);
    query.execute = function() {
      return opts.execute(query.toString());
    };
    return query;
  };
  var select = function(copts) {
    return rud('select', copts);
  };

  var insert = function(copts, table, identityInsert) {
    var query = getOperation('insert', copts);
    query.execute = function() {
      var commands = [];
      if(identityInsert && opts.insertQueryWrap) {
        commands.push(opts.insertQueryWrap(table, query.toString()));
      } else {
        commands.push(query.toString());
      }
      commands.push(opts.lastInsertedCommand);
      return opts.execute(commands).then(opts.lastInsertedParser);
    };
    return query; 
  };

  var update = function(copts) {
    return rud('update', copts);
  };

  var deleteItem = function(copts) {
    return rud('delete', copts);
  };

  return Object.freeze({
    db: opts.db,
    select: select,
    insert: insert,
    update: update,
    delete: deleteItem,
    execute: opts.execute,
    getLastInsertedId: opts.getLastInsertedId
  });
};
var handleAsyncFinish = function(err, results, resolve, reject) {
  if(err) {
    return reject(err);
  } else if(results.length === 1) {
    return resolve(results[0]);
  }
  resolve(results);
};

var SqlLite3Driver = function(options) {
  utils.constraints.checkNotNull(options, 'Driver options');  
  var sqlite3 = require('sqlite3').verbose();
  var db = new sqlite3.Database(options);
  var squel = requireUncached('squel').useFlavour('mysql');

  var execute = function(sql) {
    return when.promise(function(resolve, reject) {
      if(!_.isArray(sql)) {
        sql = [sql];
      }
      db.serialize(function() {
        var results = [];

        async.each(sql, function(command, callback) {
          db.all(command, function(err, result) {
            results.push(result);
            callback(err);
          });
        }, function(err) {
          handleAsyncFinish(err, results, resolve, reject); 
        });

      });
    });
  };

  var lastInsertedCommand = 'SELECT last_insert_rowid()';
  var lastInsertedParser = function(result) {
    return result[1][0]['last_insert_rowid()'];
  };

  return new CrudDriver({
    db: function() {
      return when.promise(function(resolve) {
        resolve(db);
      });
    },
    execute: execute,
    lastInsertedCommand: lastInsertedCommand,
    lastInsertedParser: lastInsertedParser,
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
    if(!_.isArray(sql)) {
      sql = [sql];
    }
    return getDbConnection()
      .then(function(connection) {
        return when.promise(function(resolve, reject) {
          var t = new mssql.Transaction(connection);
          t.begin(function() { 
            var results = [];
            var err;
            var ps = new mssql.Request(t);

            var ex = function(s) {
              ps.query(s, function(e, rs) {
                if(e) {
                  err = e;
                  sql = [];
                }
                results.push(rs);
                doNextStatement();
              });
            };
            var doNextStatement = function() {
              if(sql.length > 0) {
                var s = sql.shift();
                ex(s);
              } else {
                var action = 'commit';
                if(err) {
                  console.warn('MSSQL Error, attempting to roll back transaction...');
                  action = 'rollback';
                }
                t[action](function() {
                  handleAsyncFinish(err, results, resolve, reject); 
                });
              }
            };
            doNextStatement();
          });
        });
      });
  };

  var lastInsertedCommand = 'SELECT @@IDENTITY';
  var lastInsertedParser = function(result) {
    var id = result[1][0][Object.keys(result[1][0])[0]];
    return id;
  };
  var insertQueryWrap = function(table, command) {
    return 'SET IDENTITY_INSERT ' + table + ' ON\n' + command + '\nSET IDENTITY_INSERT ' + table + ' OFF';
  };
  return new CrudDriver({
    db: getDbConnection,
    execute: execute,
    lastInsertedCommand: lastInsertedCommand,
    lastInsertedParser: lastInsertedParser,
    insertQueryWrap: insertQueryWrap,
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
