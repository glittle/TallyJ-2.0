﻿CREATE
/*

Name: SqlSearch

Purpose: Do a name search directly in SQL

Note: 


*/
PROCEDURE tj.SqlSearch
    @Election uniqueidentifier
  , @Term1 nvarchar(25)
  , @Term2 nvarchar(25)
  , @Sound1 nvarchar(25)
  , @Sound2 nvarchar(25)
  , @MaxToReturn int
  , @MoreExactMatchesFound bit out
  , @ShowDebugInfo int = 0
AS
  set nocount on

  declare @sep nvarchar(1)
  set @sep = '^'

  declare @Raw1 nvarchar(25)
  declare @Raw2 nvarchar(25)

  set @Raw1 = coalesce(@Term1,'')
  set @Raw2 = coalesce(@Term2,'')

  set @Term1 = @sep + @Raw1
  set @Term2 = @sep + @Raw2

  set @Sound1 = @sep + coalesce(@Sound1, '') + @sep
  set @Sound2 = @sep + coalesce(@Sound2, '') + @sep



  declare @search1 nvarchar(30)
  declare @search2 nvarchar(30)
  declare @temp nvarchar(30)
  declare @passGroup int

  select
     cast(0 as int) RowId,
	 cast(0 as int) PassNum,
	 cast(0 as int) PassGroup,
	 cast(0 as bit) BothMatched,
	 space(2000) Source,
	 cast(0 as int) FirstMatch,
	 cast(0 as int) EndFirstMatch,
	 space(30) Search1,
	 space(30) Search2
  into #hits

  /* pass numbers

  1 = as typed, starting words
  2 = backwards, starting words
  3 = as typed, sounds like
  4 = backwards, sounds like
  5 = as typed, anywhere
  6 = backwards, anywhere

  */

  if @Raw1 = '~~Voters~~'
  begin
      insert into #hits (RowId, PassNum)
				select p._RowId, 0 
					from tj.Person p
					where p.ElectionGuid = @Election
            and p.CanVote = 1

  end
  else if @Raw1 = '~~Tied~~'
  begin
      insert into #hits (RowId, PassNum)
				select p._RowId, 0
					from tj.Person p
					where p.ElectionGuid = @Election
            and p.CanReceiveVotes = 1
  end
  else if LEN(@term1) > 0
  begin

	  declare @passNum int
	  set @passNum = 1

	  while @passNum <= 6
		begin
		    set @passGroup = (@passNum + 1) / 2
			set @search1 = case @passGroup when 1 then @Term1 when 2 then @Sound1 else @Raw1 end
			set @search2 = case @passGroup when 1 then @Term2 when 2 then @Sound2 else @Raw2 end

			if @passNum % 2 = 1 
			begin
	   		  -- swap every other pass
			  set @temp = @search1
			  set @search1 = @search2
			  set @search2 = @temp
			end

			if @ShowDebugInfo > 4 print cast(@passNum as varchar) + ':' + cast(@passNum % 3 as varchar) + '  --- ' + @Search1 + ' -- ' + @Search2
		

			if LEN(replace(@search1,'^','')) > 0
			begin
			
			   if @ShowDebugInfo > 4 print 'searching'
			 
			   ;with sourceList as (
					select _RowId [RowId]
						, case @passGroup when 1 then @sep + p.CombinedInfo 
										  when 2 then @sep + p.CombinedSoundCodes + @sep
										  else p.CombinedInfo end [Search]
					from tj.Person p
					where p.ElectionGuid = @Election
				)
				insert into #hits
				select m.RowId [RowId]
					, @passNum
					, @passGroup
					, 0
					, left(m.Search, 2000)
					, CHARINDEX(@Search1, m.Search collate Latin1_General_CI_AI, 0) [FirstMatch]
					, 0
					, @search1 -- for debugging
					, @search2
				from sourceList m
				where CHARINDEX(@Search1, Search collate Latin1_General_CI_AI, 0) > 0


				if LEN(replace(@search2,'^','')) > 0
				begin
				
					update #hits
					    set EndFirstMatch = CHARINDEX(@sep, Source collate Latin1_General_CI_AI, FirstMatch)
					where PassNum = @passNum
				
					update #hits
						set BothMatched = 1
					where CHARINDEX(@Search2, Source collate Latin1_General_CI_AI, EndFirstMatch) > 0
						and PassNum = @passNum
				
				end
			end
			
			set @passNum = @passNum + 1

		end
	end

  --can't leave @ShowDebugInfo, or EF4 will read this structure
  --if @ShowDebugInfo > 3 select * from #hits order by 1

  
  if len(coalesce(@Raw2,'')) > 0
  begin
    delete from #hits where BothMatched = 0
  end




  --> did use 'into #results' but that fails with SET FMTONLY ON, so EF4 can't read it
  --declare #results table (
  --   RowId int,
	 --FirstMatch int,
	 --PassNum int,
	 --PassGroup int,
	 --_FullName nvarchar(500),
	 --AgeGroup varchar(20),
	 --IneligibleReasonGuid uniqueidentifier,
	 --SortOrder int,
	 --CanReceiveVotes bit,
	 --Votes int
  --)

  ;with byScore as (
     select RowId, PassNum, ROW_NUMBER() over (partition by RowId order by PassNum) RowNum
	 from #hits
  )
  select h.RowId
       , h.FirstMatch
	   , h.PassNum
	   , h.PassGroup
       , p._FullName
	   , p.AgeGroup
	   , p.IneligibleReasonGuid
	   , ROW_NUMBER() over (order by h.PassNum, _FullName) [SortOrder]
	   , p.CanReceiveVotes
	   , coalesce((select SUM(case when v.IsSingleNameElection = 1 then v.SingleNameElectionCount else 1 end) from tj.vVoteInfo v where v.PersonGuid = p.PersonGuid),0) [Votes]
   into #results
   from #hits h
     join tj.Person p on p._RowId = h.RowId
	 join byScore s on s.RowId = h.RowId and s.PassNum = h.PassNum
   where s.RowNum = 1

  set @MoreExactMatchesFound = case when (select COUNT(*) from #results where PassNum = 300) > @MaxToReturn then 1 else 0 end 


	select RowId [PersonId]
			, _FullName [FullName]
            , res.IneligibleReasonGuid [Ineligible]
			, res.PassGroup [MatchType]
			, res.CanReceiveVotes
			--, case when ROW_NUMBER() over (partition by PassNum order by Votes desc) = 1 
			--			then 1 else 0 end 
      , Votes [BestMatch]
	from #results res
		-- left join tj.Reasons r1 on r1.ReasonGuid = res.IneligibleReasonGuid
	where res.SortOrder <= @MaxToReturn
	order by PassNum, _FullName
GO
GRANT EXECUTE
    ON OBJECT::[tj].[SqlSearch] TO [TallyJSite]
    AS [dbo];

