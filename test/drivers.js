'use strict';
var drivers = [];
drivers.push({
  name: 'sqlite3', 
  opts: ':memory:',
  createTable: 'CREATE TABLE example_table (id INTEGER PRIMARY KEY ASC, column1 TEXT)',
  dropTable: 'DROP TABLE IF EXISTS example_table'
});
drivers.push({
  name: 'mssql', 
  opts: {
    user: 'example_user',
    password: 'example_user_password',
    server: '172.19.104.11',
    database: 'example_database'
  },
  createTable: 'CREATE TABLE example_table (id int not null identity(1, 1) primary key, column1 TEXT)', 
  dropTable: 'IF OBJECT_ID(\'example_table\', \'U\') IS NOT NULL DROP TABLE example_table',
  dropSP1:'IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N\'[dbo].[SP_TEST1]\') AND type in (N\'P\', N\'PC\')) ' +
          'DROP PROCEDURE [dbo].[SP_TEST1]',
  createSP1: 'CREATE PROCEDURE [dbo].[SP_TEST1]' +
              'AS ' + 
              'BEGIN ' +
                'DECLARE \@i INT ' +

                'IF OBJECT_ID(\'#mss_test\', \'U\') IS NOT NULL DROP TABLE #mss_test ' +
                'IF OBJECT_ID(\'tempdb..#mss_test\') IS NOT NULL DROP TABLE #mss_test ' +
                'CREATE TABLE #mss_test (id int not null identity(1, 1) primary key, name NVARCHAR(50)) ' +

                'SET \@i = 1 ' +

                'WHILE (\@i < 10) ' +
                'BEGIN ' +
                  'INSERT INTO #mss_test (name) VALUES (\'test\' + CONVERT(char(1), \@i)) ' +
                  'SET \@i = \@i + 1; ' +
                'END ' +
                
                'SET NOCOUNT ON; ' +
                'SELECT * FROM #mss_test; ' +
              'END',
  dropSP2:'IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N\'[dbo].[SP_TEST2]\') AND type in (N\'P\', N\'PC\')) ' +
          'DROP PROCEDURE [dbo].[SP_TEST2]',              
  createSP2: 'CREATE PROCEDURE [dbo].[SP_TEST2]' +
              '\@id int ' +
              'AS ' + 
              'BEGIN ' +
                'DECLARE \@i INT ' +

                'IF OBJECT_ID(\'#mss_test\', \'U\') IS NOT NULL DROP TABLE #mss_test ' +
                'IF OBJECT_ID(\'tempdb..#mss_test\') IS NOT NULL DROP TABLE #mss_test ' +
                'CREATE TABLE #mss_test (id int not null identity(1, 1) primary key, name NVARCHAR(50)) ' +

                'SET \@i = 1 ' +

                'WHILE (\@i < 10) ' +
                'BEGIN ' +
                  'INSERT INTO #mss_test (name) VALUES (\'test\' + CONVERT(char(1), \@i)) ' +
                  'SET \@i = \@i + 1; ' +
                'END ' +
                
                'SET NOCOUNT ON; ' +
                'SELECT * FROM #mss_test WHERE id = \@id ;' +
              'END',
  dropSP3:'IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N\'[dbo].[SP_TEST3]\') AND type in (N\'P\', N\'PC\')) ' +
          'DROP PROCEDURE [dbo].[SP_TEST3]',                
  createSP3: 'CREATE PROCEDURE [dbo].[SP_TEST3]' +
              '\@id int, ' +
              '\@result varchar(20) OUTPUT ' +
              'AS ' + 
              'BEGIN ' +
                'DECLARE \@i INT ' +

                'IF OBJECT_ID(\'#mss_test\', \'U\') IS NOT NULL DROP TABLE #mss_test ' +
                'IF OBJECT_ID(\'tempdb..#mss_test\') IS NOT NULL DROP TABLE #mss_test ' +
                'CREATE TABLE #mss_test (id int not null identity(1, 1) primary key, name NVARCHAR(50)) ' +

                'SET \@i = 1 ' +

                'WHILE (\@i < 10) ' +
                'BEGIN ' +
                  'INSERT INTO #mss_test (name) VALUES (\'test\' + CONVERT(char(1), \@i)) ' +
                  'SET \@i = \@i + 1; ' +
                'END ' +
                
                'SET NOCOUNT ON; ' +
                'SELECT \@result = name FROM #mss_test WHERE id = \@id ' +
              'END'
});        

module.exports = drivers;
