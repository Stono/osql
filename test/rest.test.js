'use strict';
var Table = require('../lib/table');
var Database = require('../lib/database');
var deride = require('deride');
//var should = require('should');
var drivers = require('./drivers');
//var _ = require('lodash');
var restify = require('restify');
var rest = require('restler');
var _ = require('lodash');

/*jshint -W068 */
describe.only('REST Middleware', function() {
  var table;
  var port = 9284;
  var baseUrl = 'http://127.0.0.1:' + port;
  var driver = drivers[0];
  var db = new Database(driver.name, driver.opts);

  var server = restify.createServer({
    name: 'osql',
    version: '1.0.0'
  });

  before(function(done) {
    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.queryParser());
    server.use(restify.bodyParser());

    db.execute(driver.dropTable)
      .then(function() {
        return db.execute(driver.createTable);
      })
    .then(function() {
      db = deride.wrap(db);
      table = new Table({
        table: 'example_table',
        identity: 'id',
        database: db
      });
      table.insert({
        column1: 'test'
      });
      table.wrap(server);
      server.listen(port, done);
    });
  });

  after(function(done) {
    server.close(done);
  });

  /* jshint maxparams: 7 */
  var Test = function(name, method, url, statusCode, assert, data) {
    var self = {};
    self.url =  '/example_table' + url;
    self.method = method;
    self.name = name;
    self.validate = function(data, result) {
      if(assert) {
        assert(data, result);
      }
      result.statusCode.should.eql(statusCode);
    };
    self.go = function(done) {
      rest[method](baseUrl + self.url, data).on('complete', function(data, result) {
        self.validate(data, result);
        done();
      });
    };
    return self;
  };

  var tests = [];

  tests.push(new Test('Get All Records', 'get', '', 200));

  tests.push(new Test('Get a Single Record', 'get', '/1', 200, function(data) {
    data.column1.should.eql('test'); 
  }));

  tests.push(new Test('Create a new Record', 'postJson', '', 201, function(data) {
    data.column1.should.eql('new record'); 
    data.should.have.property('id');
  }, {
    column1: 'new record'
  }));

  //tests.push(new Test('Delete a Record', 'delete', '/2', 200));


  _.forEach(tests, function(test) {
    it(test.name + '(' + test.url + ')', function(done) {
      test.go(done);
    });
  });
});
