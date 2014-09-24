'use strict';
var Table = require('../lib/table');
var Database = require('../lib/database');
var deride = require('deride');

/*jshint -W068 */
describe.only('Table', function() {
  it('Should throw an error if no options are passed', function() {
    (function() {
      var table = new Table();
      table = null;
    }).should.throw('Table options is null or undefined');
  });
  it('Should throw an error if no table name is passed', function() {
    (function() {
      var table = new Table({
        identity: 'id',
        database: {}
      });
      table = null;
    }).should.throw('options.table is null or undefined');
  });
  it('Should throw an error if no identity column name is passed', function() {
    (function() {
      var table = new Table({
        table: 'example_table',
        database: {}
      });
      table = null;
    }).should.throw('options.identity is null or undefined');
  });
  it('Should throw an error if no database is passed', function() {
    (function() {
      var table = new Table({
        table: 'example_table',
        identity: 'id'
      });
      table = null;
    }).should.throw('options.database is null or undefined');
  });
  describe('CRUD', function() {
    var db;
    var table;
    beforeEach(function(done) {
      db = new Database('sqlite3', ':memory:');
      db.execute('CREATE TABLE if not exists example_table (id INTEGER PRIMARY KEY ASC, column1 TEXT)')
        .then(function() {
          db.delete()
            .from('example_table')
            .execute()
            .then(function() {
              db = deride.wrap(db);
              table = new Table({
                table: 'example_table',
                identity: 'id',
                database: db
              });
              done();
            });
        });
    });

    it('Should allow me to insert a single row and set the id if one isnt provided', function(done) {
      table.insert({
        column1: 'test'
      }).then(function(model) {
        model.should.have.property('id');
        db.expect.insert.called.once();
        done();
      });
    });

    it('Should allow me to insert a single row with a provided id', function(done) {
      table.insert({
        id: 1,
        column1: 'test'
      }).then(function(model) {
        model.should.have.property('id');
        db.expect.insert.called.once();
        done();
      });
    });

    it('Should allow me to insert a bunch of records with a single insert', function(done) {
      var inserting = [];
      inserting.push({column1: 'test'});
      inserting.push({column1: 'test again'});
      inserting.push({column1: 'test again and again'});
      table.insert(inserting)
        .then(function() {
          db.expect.insert.called.once();
          done();
        });
    });

    it('Should allow me to select from the table', function(done) {
      table.insert({
        id: 1,
        column1: 'test'
      }).then(function(model) {
        db.expect.insert.called.once();
        table.select()
          .where('id = ?', model.id)
          .execute()
          .then(function(results) {
            db.expect.select.called.once();
            results.length.should.eql(1);
            results[0].should.eql(model);
            done();
          });
      });
    });

    it('Should allow me to update a single row', function(done) {
      table.insert({
        id: 1,
        column1: 'test'
      }).then(function(model) {
        table.updateOne(model.id, {
          column1: 'updated' 
        })
        .then(function() {
          db.expect.update.called.once();
          table.select()
            .where('id = ?', model.id)
            .execute()
            .then(function(results) {
              results[0].column1.should.eql('updated');
              done();
            });
        });
      });
    });

    it('Should allow me to update multiple rows', function(done) {
      table.insert({
        id: 1,
        column1: 'test'
      }).then(function(model) {
        table.update({
          column1: 'updated' 
        })
        .then(function() {
          db.expect.update.called.once();
          table.select()
            .where('id = ?', model.id)
            .execute()
            .then(function(results) {
              results[0].column1.should.eql('updated');
              done();
            });
        });
      });
    });

    it('Should allow me to delete a single row', function(done) {
      table.insert({
        id: 1,
        column1: 'test'
      }).then(function(model) {
        table.deleteOne(model.id)
          .then(function() {
            db.expect.delete.called.once();
            table.select()
              .where('id = ?', model.id)
              .execute()
              .then(function(results) {
                results.length.should.eql(0);
                done();
              });
          });
      });
    });

    it('Should allow me to delete mutliple rows', function(done) {
      table.insert({
        id: 1,
        column1: 'test'
      }).then(function() {
        table.delete()
          .where('id > ?', 0)
          .execute()
          .then(function() {
            db.expect.delete.called.once();
            table.select()
              .execute()
              .then(function(results) {
                results.length.should.eql(0);
                done();
              });
          });
      });
    });

  });
});
