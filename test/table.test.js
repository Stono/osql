'use strict';
var Table = require('../lib/table');
var Database = require('../lib/database');
var deride = require('deride');
var should = require('should');
var drivers = require('./drivers');
var _ = require('lodash');

/*jshint -W068 */
describe('Table', function() {
	var getDriver = function(name, opts) {
		return new Database(name, opts);
	};
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
	it('Should throw an error if no database is passed', function() {
		(function() {
			var table = new Table({
				table: 'example_table',
				identity: 'id'
			});
			table = null;
		}).should.throw('options.database is null or undefined');
	});

	_.forEach(drivers, function(driver) {
		describe('Driver: ' + driver.name, function() {
			describe('CRUD', function() {
				var db = getDriver(driver.name, driver.opts);
				var table;
				var table2;
				beforeEach(function(done) {
					db.execute(driver.dropTable)
						.then(function() {
							return db.execute(driver.dropTable.replace(/example_table/g, 'example_table2'));
						})
						.then(function() {
							return db.execute(driver.createTable);
						})
						.then(function() {
							return db.execute(driver.createTable.replace(/example_table/g, 'example_table2'));
						})
						.then(function() {
							db = deride.wrap(db);
							table = new Table({
								table: 'example_table',
								identity: 'id',
								database: db
							});
							table2 = new Table({
								table: 'example_table2',
								identity: 'id',
								database: db
							});
							done();
						});
				});

				describe('Should allow me to insert a single row and set the id if one isnt provided', function() {
					it('promised', function(done) {
						table.insert({
							column1: 'test'
						}).then(function(model) {
							model.should.have.property('id');
							db.expect.insert.called.once();
							done();
						});
					});

					it('callback', function(done) {
						table.insert({
							column1: 'test'
						}, function(err, model) {
							model.should.have.property('id');
							db.expect.insert.called.once();
							done();
						});
					});
				});

				describe('Multiple concurrent inserts should correctly return unqiue identifiers', function() {
					it('promised', function(done) {
						var insert1;
						table.insert({
							column1: 'test'
						}).then(function(model) {
							insert1 = model.id;
							return table.insert({
								column1: 'test'
							});
						}).then(function(model) {
							model.id.should.not.eql(insert1);
							done();
						});
					});

					it('callback', function(done) {
						var insert1;
						table.insert({
							column1: 'test'
						}, function(err, model) {
							insert1 = model.id;
							table.insert({
								column1: 'test'
							}, function(err, model) {
								model.id.should.not.eql(insert1);
								done();
							});
						});
					});
				});

				describe('Multiple concurrent inserts on different tables should correctly return unqiue identifiers', function() {
					it('promised', function(done) {
						var insert1;
						table.insert({
							column1: 'seed data'
						}).then(function() {
							return table.insert({
								column1: 'test'
							});
						}).then(function(model) {
							insert1 = model.id;
							return table2.insert({
								column1: 'test'
							});
						}).then(function(model) {
							model.id.should.not.eql(insert1);
							done();
						});
					});

					it('callback', function(done) {
						var insert1;
						table.insert({
							column1: 'seed data'
						}, function() {
							table.insert({
								column1: 'test'
							}, function(err, model) {
								insert1 = model.id;
								table2.insert({
									column1: 'test'
								}, function(err, model) {
									model.id.should.not.eql(insert1);
									done();
								});
							});
						});
					});
				});

				describe('Should allow me to insert a single row with a provided id', function() {
					it('promised', function(done) {
						table.insert({
							id: 1,
							column1: 'test'
						}).then(function(model) {
							model.should.have.property('id');
							db.expect.insert.called.once();
							done();
						});
					});

					it('callback', function(done) {
						table.insert({
							id: 1,
							column1: 'test'
						}, function(err, model) {
							model.should.have.property('id');
							db.expect.insert.called.once();
							done();
						});
					});
				});

				describe('Should allow me to insert a bunch of records with a single insert', function() {
					var inserting = [];
					before(function() {
						inserting.push({
							column1: 'test'
						});
						inserting.push({
							column1: 'test again'
						});
						inserting.push({
							column1: 'test again and again'
						});
					});
					it('promised', function(done) {
						table.insert(inserting)
							.then(function() {
								db.expect.insert.called.once();
								done();
							});
					});

					it('callback', function(done) {
						table.insert(inserting, function() {
							db.expect.insert.called.once();
							done();
						});
					});
				});

				describe('Should allow me to select a single row', function() {
					it('promised', function(done) {
						var model;
						table.insert({
								id: 1,
								column1: 'test'
							}).then(function(m) {
								model = m;
								db.expect.insert.called.once();
								return table.select(model.id);
							})
							.then(function(result) {
								db.expect.select.called.once();
								result.should.eql(model);
								done();
							});
					});
					it('callback', function(done) {
						var model;
						table.insert({
							id: 1,
							column1: 'test'
						}, function(err, m) {
							model = m;
							db.expect.insert.called.once();
							table.select(model.id, function(err, result) {
								db.expect.select.called.once();
								result.should.eql(model);
								done();
							});
						});
					});
				});

				describe('Should allow me to select multiple rows', function() {
					var inserting = [];
					before(function() {
						inserting.push({
							column1: 'test'
						});
						inserting.push({
							column1: 'test again'
						});
					});
					it('promised', function(done) {
						table.insert(inserting)
							.then(function() {
								db.expect.insert.called.once();
								return table.selectMany()
									.execute();
							})
							.then(function(results) {
								db.expect.select.called.once();
								results.length.should.eql(2);
								done();
							});
					});
					it('callback', function(done) {
						table.insert(inserting, function() {
							db.expect.insert.called.once();
							table
								.selectMany()
								.execute(function(err, results) {
									db.expect.select.called.once();
									results.length.should.eql(2);
									done();
								});
						});
					});
				});

				it('Should allow me to update a single row', function(done) {
					var model;
					table.insert({
							id: 1,
							column1: 'test'
						}).then(function(m) {
							model = m;
							model.column1 = 'updated';
							return table.update(model.id, model);
						})
						.then(function() {
							db.expect.update.called.once();
							return table.select(model.id);
						})
						.then(function(result) {
							result.should.eql(model);
							done();
						});
				});

				describe('Should allow me to update multiple rows', function() {
					var inserting = [];
					before(function() {
						inserting.push({
							column1: 'test'
						});
						inserting.push({
							column1: 'test again'
						});
						inserting.push({
							column1: 'test again and again'
						});
					});

					it('promised', function(done) {
						table.insert(inserting)
							.then(function() {
								return table.updateMany({
										column1: 'updated'
									})
									.where('id > 0')
									.execute();
							})
							.then(function() {
								db.expect.update.called.once();
								return table
									.selectMany()
									.execute();
							})
							.then(function(results) {
								for (var x = 0; x < results.length; x++) {
									results[x].column1.should.eql('updated');
								}
								done();
							});
					});

					it('callback', function(done) {
						table.insert(inserting, function() {
							table.updateMany({
									column1: 'updated'
								})
								.where('id > 0')
								.execute(function() {
									db.expect.update.called.once();
									table
										.selectMany()
										.execute(function(err, results) {
											for (var x = 0; x < results.length; x++) {
												results[x].column1.should.eql('updated');
											}
											done();
										});
								});
						});
					});
				});

				describe('Should allow me to delete a single row', function() {
					it('promised', function(done) {
						var model;
						table.insert({
								id: 1,
								column1: 'test'
							}).then(function(m) {
								model = m;
								return table.delete(model.id);
							})
							.then(function() {
								db.expect.delete.called.once();
								return table.select(model.id);
							})
							.then(function(result) {
								should(result).eql(null);
								done();
							});
					});

					it('callback', function(done) {
						var model;
						table.insert({
							id: 1,
							column1: 'test'
						}, function(err, m) {
							model = m;
							table.delete(model.id, function() {
								db.expect.delete.called.once();
								table.select(model.id, function(err, result) {
									should(result).eql(null);
									done();
								});
							});
						});
					});
				});

				describe('Should allow me to delete mutliple rows', function() {
					it('promised', function(done) {
						table.insert({
								id: 1,
								column1: 'test'
							}).then(function() {
								return table.deleteMany()
									.where('id > ?', 0)
									.execute();
							})
							.then(function() {
								db.expect.delete.called.once();
								return table.selectMany()
									.execute();
							})
							.then(function(results) {
								results.length.should.eql(0);
								done();
							});
					});

					it('callback', function(done) {
						table.insert({
							id: 1,
							column1: 'test'
						}, function() {
							table.deleteMany()
								.where('id > ?', 0)
								.execute(function() {
									db.expect.delete.called.once();
									table.selectMany()
										.execute(function(err, results) {
											results.length.should.eql(0);
											done();
										});
								});
						});
					});
				});
			});
		});
	});
});
