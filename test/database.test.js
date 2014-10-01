'use strict';
var _ = require('lodash');
var Database = require('../lib/database');
var should = require('should');

/*jshint -W068 */
describe('Database', function() {
  var getDriver = function(name, opts) {
    return new Database(name, opts);
  };
  var drivers = [];
  drivers.push({
    name: 'mssql', 
    opts: {
      user: 'example_user',
      password: 'example_user_password',
      server: '172.19.104.11',
      database: 'example_database'
    },
    createTable: 'CREATE TABLE example_table (id int not null identity(1, 1) primary key, column1 TEXT)'
  });
  drivers.push({
    name: 'sqlite3', 
    opts: ':memory:',
    createTable: 'CREATE TABLE example_table (id INTEGER PRIMARY KEY ASC, column1 TEXT)'
  });
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

        describe('CRUD', function() {
          it('Should allow me to execute a select statement', function(done) {
            var db = getDriver(driver.name, driver.opts);
            db.execute(driver.createTable)
              .then(function() {
                return db.select()
                  .from('example_table')
                  .limit(1)
                  .execute()
                  .then(function(results) {
                    results.should.eql([]);
                    done();
                  });
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
                  .execute()
                  .then(function() {
                    return db.select()
                      .from('example_table')
                      .limit(1)
                      .execute()
                      .then(function(results) {
                        results.length.should.eql(1);
                        done();
                      });
                  });
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
                  .execute()
                  .then(function() {
                    return db.select()
                      .from('example_table')
                      .limit(1)
                      .execute()
                      .then(function(results) {
                        results.length.should.eql(1);
                        results[0].column1.should.eql('te\'st');
                        done();
                      });
                  });
              }).then(null, function(err) {
                done(err);
              });
          });

          it('Should allow me to execute a update statement', function(done) {
            var db = getDriver(driver.name, driver.opts);
            db.execute(driver.createTable)
              .then(function() {
                return db.insert()
                  .into('example_table')
                  .set('column1', 'test')
                  .execute()
                  .then(function() {
                    db.getLastInsertedId('example_table')
                      .then(function(id) {
                        db.update()
                          .table('example_table')
                          .set('column1', 'updated')
                          .where('id = ' + id)
                          .execute()
                          .then(function() {
                            db.select()
                              .from('example_table')
                              .where('id = ' + id)
                              .execute()
                              .then(function(results) {
                                results[0].column1.should.eql('updated');
                                done();
                              });
                          });
                      });
                  });
              }).then(null, function(err) {
                done(err);
              });
          });

          it('Should allow me to execute an delete statement', function(done) {
            var db = getDriver(driver.name, driver.opts);
            db.execute(driver.createTable)
              .then(function() {
                return db.insert()
                  .into('example_table')
                  .set('column1', 'test')
                  .execute()
                  .then(function() {
                    db.getLastInsertedId()
                      .then(function(id) {
                        db.delete()
                          .from('example_table')
                          .where('id = ' + id)
                          .execute()
                          .then(function() {
                            db.select()
                              .from('example_table')
                              .where('id = ' + id)
                              .execute()
                              .then(function(results) {
                                results.length.should.eql(0);
                                done();
                              });
                          });
                      });
                  });
              }).then(null, function(err) {
                done(err);
              });
          });
        });
      });
    });
  });
});
