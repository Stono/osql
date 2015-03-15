IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SP_TEST2]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[SP_TEST2]