CREATE PROCEDURE [dbo].[SP_TEST2]  
@id int 
AS
BEGIN
  DECLARE @i int
  IF OBJECT_ID('#mss_test', 'U') IS NOT NULL
    DROP TABLE #mss_test
  IF OBJECT_ID('tempdb..#mss_test') IS NOT NULL
    DROP TABLE #mss_test
  CREATE TABLE #mss_test (
    id int NOT NULL IDENTITY (1, 1) PRIMARY KEY,
    name nvarchar(50)
  )
  SET @i = 1
  WHILE (@i < 10)
  BEGIN
    INSERT INTO #mss_test (name)
      VALUES ('test' + CONVERT(char(1), @i))
    SET @i = @i + 1;
  END
  SET NOCOUNT ON;
  SELECT
    *
  FROM #mss_test
  WHERE id = @id;
END