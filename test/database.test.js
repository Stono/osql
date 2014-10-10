'use strict';
var _ = require('lodash');
var Database = require('../lib/database');
var should = require('should');
var drivers = require('./drivers');

/*jshint -W068 */
describe('Database', function() {
  var getDriver = function(name, opts) {
    return new Database(name, opts);
  };
  it('Should throw an error if an invalid driver is passed', function() {
    (function() {
      var db = getDriver('unknown', {});
      db = null;
    }).should.throw('Unknown driver: unknown');
  });

  _.forEach(drivers, function(driver) {
    describe('Driver: ' + driver.name, function() {
      describe('Initialisation', function() {
        it('Should accept the driver in the constructor', function() {
          var db = getDriver(driver.name, driver.opts);
          should(db).not.eql(null);
        });
        it('Should throw an error if no options are passed', function() {
          (function() {
            var db = getDriver(driver.name);
            db = null;
          }).should.throw('Driver options is null or undefined');
        });
      });
      describe('Execution', function() {
        beforeEach(function(done) {
          var db = getDriver(driver.name, driver.opts);
          db.execute('DROP TABLE example_table')
            .then(function() {
              done();
            }).then(null, function() {
              done();
            });
        });

        var getLastInsertedId =  function(db) {
          return db.select()
            .from('example_table')
            .limit(1)
            .execute()
            .then(function(results) {
              return results[0].id;
            });
        };

        describe('CRUD', function() {
          it('Should allow me to execute a select statement', function(done) {
            var db = getDriver(driver.name, driver.opts);
            db.execute(driver.createTable)
              .then(function() {
                return db.select()
                  .from('example_table')
                  .limit(1)
                  .execute();
              })
            .then(function(results) {
              results.should.eql([]);
              done();
            }).then(null, function(err) {
              done(err);
            });
          });

          it('Should allow me to execute an insert statement', function(done) {
            var db = getDriver(driver.name, driver.opts);
            db.execute(driver.createTable)
              .then(function() {
                return db.insert()
                  .into('example_table')
                  .set('column1', 'test')
                  .execute();
              })
            .then(function() {
              return db.select()
                .from('example_table')
                .limit(1)
                .execute();
            })
            .then(function(results) {
              results.length.should.eql(1);
              done();
            }).then(null, function(err) {
              done(err);
            });
          });

          it('Should allow me to execute an insert statement and escape single quotes', function(done) {
            var db = getDriver(driver.name, driver.opts);
            db.execute(driver.createTable)
              .then(function() {
                return db.insert()
                  .into('example_table')
                  .set('column1', 'te\'st')
                  .execute();
              })
            .then(function() {
              return db.select()
                .from('example_table')
                .limit(1)
                .execute();
            })
            .then(function(results) {
              results.length.should.eql(1);
              results[0].column1.should.eql('te\'st');
              done();
            }).then(null, function(err) {
              done(err);
            });
          });

          it('Should allow me to execute a update statement', function(done) {
            var db = getDriver(driver.name, driver.opts);
            var id;
            db.execute(driver.createTable)
              .then(function() {
                return db.insert()
                  .into('example_table')
                  .set('column1', 'test')
                  .execute();
              })
            .then(function() {
              return getLastInsertedId(db); 
            })
            .then(function(lastId) {
              id = lastId;
              return db.update()
                .table('example_table')
                .set('column1', 'updated')
                .where('id = ' + id)
                .execute();
            })
            .then(function() {
              return db.select()
                .from('example_table')
                .where('id = ' + id)
                .execute()
                .then(function(results) {
                  results[0].column1.should.eql('updated');
                  done();
                });
            }).then(null, function(err) {
              done(err);
            });
          });

          it('Should allow me to execute an delete statement', function(done) {
            var db = getDriver(driver.name, driver.opts);
            var id;
            db.execute(driver.createTable)
              .then(function() {
                return db.insert()
                  .into('example_table')
                  .set('column1', 'test')
                  .execute();
              })
            .then(function() {
              return getLastInsertedId(db);
            })
            .then(function(lastId) {
              id = lastId;
              return db.delete()
                .from('example_table')
                .where('id = ' + id)
                .execute();
            })
            .then(function() {
              return db.select()
                .from('example_table')
                .where('id = ' + id)
                .execute();
            })
            .then(function(results) {
              results.length.should.eql(0);
              done();
            }).then(null, function(err) {
              done(err);
            });
          });

        });
      });
    });
  });
});
