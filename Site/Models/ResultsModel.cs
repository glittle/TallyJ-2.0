using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using TallyJ.Code;
using TallyJ.Code.Enumerations;
using TallyJ.Code.Session;
using TallyJ.EF;

namespace TallyJ.Models
{
  public class ResultsModel : DataConnectedModel
  {
    private readonly IElectionAnalyzer _analyzer;
    private Election _election;

    public ResultsModel(Election election = null)
    {
      _election = election;

      _analyzer = CurrentElection.IsSingleNameElection
                    ? new ElectionAnalyzerSingleName() as IElectionAnalyzer
                    : new ElectionAnalyzerNormal();
    }

    private Election CurrentElection
    {
      get { return _election ?? (_election = UserSession.CurrentElection); }
    }

    public JsonResult FinalResultsJson
    {
      get
      {
        var resultSummaryAuto = _analyzer.ResultSummaryAuto;

        if (resultSummaryAuto.BallotsNeedingReview != 0)
        {
          // don't show any details if review is needed
          return new
                   {
                   }.AsJsonResult();
        }

        //currentElection.ShowFullReport.AsBool() ? 99999 : 
        var numToShow = CurrentElection.NumberToElect.AsInt();
        var numExtra = CurrentElection.NumberExtra.AsInt();
        var numForChart = (numToShow + numExtra) * 2;

        var reportVotes =
          Db.vResultInfoes.Where(ri => ri.ElectionGuid == CurrentElection.ElectionGuid).OrderBy(ri => ri.Rank).Take(
            numToShow + numExtra);

        //var chartVotes =
        //  Db.vResultInfoes.Where(ri => ri.ElectionGuid == CurrentElection.ElectionGuid).OrderBy(ri => ri.Rank)
        //    .Select(ri => new
        //                    {
        //                      ri.Rank,
        //                      ri.VoteCount
        //                    })
        //    .Take(numForChart);

        var tallyStatus = CurrentElection.TallyStatus;

        if (tallyStatus != ElectionTallyStatusEnum.Report)
        {
          return new
                   {
                     Status = tallyStatus,
                     StatusText = ElectionTallyStatusEnum.TextFor(tallyStatus)
                   }.AsJsonResult();
        }

        return new
                 {
                   ReportVotes = reportVotes.Select(r => new { r.PersonName, r.VoteCount, r.TieBreakCount, r.Section }),
                   //ChartVotes = chartVotes,
                   NumBallots = resultSummaryAuto.BallotsReceived,
                   resultSummaryAuto.TotalVotes,
                   TotalInvalidVotes = resultSummaryAuto.SpoiledVotes,
                   TotalInvalidBallots = resultSummaryAuto.SpoiledBallots,
                   resultSummaryAuto.NumEligibleToVote,
                   resultSummaryAuto.NumVoters,
                   Participation =
                     resultSummaryAuto.NumEligibleToVote.AsInt() == 0
                       ? 0
                       : Math.Round(
                         (resultSummaryAuto.BallotsReceived.AsInt() * 100D) /
                         resultSummaryAuto.NumEligibleToVote.AsInt(), 0),
                   Status = tallyStatus,
                   StatusText = ElectionTallyStatusEnum.TextFor(tallyStatus)
                 }.AsJsonResult();
      }
    }

    public JsonResult GetCurrentResultsJson()
    {
      return GetCurrentResults().AsJsonResult();
    }

    public object GetCurrentResults()
    {
      var resultSummaryAuto = _analyzer.ResultSummaryAuto;

      // don't show any details if review is needed
      if (resultSummaryAuto.BallotsNeedingReview != 0)
      {
        var needReview = _analyzer.VoteInfos.Where(VoteAnalyzer.VoteNeedReview)
          .Join(Db.Locations, vi => vi.LocationId, l => l.C_RowId, (vi, location) => new { vi, location })
          .Select(x => new
                         {
                           x.vi.LocationId,
                           x.vi.BallotId,
                           Status = x.vi.BallotStatusCode == "Review" ? BallotStatusEnum.Review.DisplayText : "Verification Needed",
                           Ballot = string.Format("{0} ({1})", x.vi.C_BallotCode, x.location.Name)
                         })
          .Distinct()
          .OrderBy(x => x.Ballot);

        return new
                 {
                   NeedReview = needReview,
                   NumBallots = resultSummaryAuto.BallotsReceived,
                   resultSummaryAuto.TotalVotes,
                   TotalInvalidVotes = resultSummaryAuto.SpoiledVotes,
                   TotalInvalidBallots = resultSummaryAuto.SpoiledBallots,
                 };
      }

      var vResultInfos =
        Db.vResultInfoes
          .Where(ri => ri.ElectionGuid == CurrentElection.ElectionGuid)
          .OrderBy(ri => ri.Rank)
          .Select(ri => new
                          {
                            // TODO 2012-01-21 Glen Little: Could return fewer columns for non-tied results
                            rid = ri.C_RowId,
                            ri.CloseToNext,
                            ri.CloseToPrev,
                            ri.ForceShowInOther,
                            ri.IsTied,
                            ri.IsTieResolved,
                            ri.PersonName,
                            ri.Rank,
                            //ri.RankInExtra,
                            ri.Section,
                            ri.TieBreakCount,
                            ri.TieBreakGroup,
                            ri.TieBreakRequired,
                            ri.VoteCount
                          });

      var ties = Db.ResultTies.Where(rt => rt.ElectionGuid == CurrentElection.ElectionGuid)
        .OrderBy(rt => rt.TieBreakGroup)
        .Select(rt => new
                        {
                          rt.TieBreakGroup,
                          rt.NumInTie,
                          rt.NumToElect,
                          rt.TieBreakRequired,
                          rt.IsResolved
                        });

      //var spoiledVotesSummary = Db.vVoteInfoes.where

      return new
               {
                 Votes = vResultInfos,
                 Ties = ties,
                 NumBallots = resultSummaryAuto.BallotsReceived,
                 NumVoted = resultSummaryAuto.NumVoters,
                 NumToElect = _election.NumberToElect,
                 NumExtra = _election.NumberExtra,
                 resultSummaryAuto.TotalVotes,
                 TotalInvalidVotes = resultSummaryAuto.SpoiledVotes,
                 TotalInvalidBallots = resultSummaryAuto.SpoiledBallots,
               };
    }

    public void GenerateResults()
    {
      _analyzer.GenerateResults();
    }

    public object GetCurrentResultsIfAvailable()
    {
      return _analyzer.IsResultAvailable ? GetCurrentResults() : null;
    }

    public JsonResult GetReportData(string code)
    {
      object data;
      switch (code)
      {
        case "Ballots":
          var ballots = Db.vBallotInfoes.Where(b => b.ElectionGuid == CurrentElection.ElectionGuid).ToList();
          var votes = Db.vVoteInfoes.Where(b => b.ElectionGuid == CurrentElection.ElectionGuid).ToList();
          data = ballots
            .Select(b => new
                           {
                             b.C_BallotCode,
                             b.StatusCode,
                             Spoiled = b.StatusCode != BallotStatusEnum.Ok,
                             Rows2 = votes
                           .Where(v => v.BallotGuid == b.BallotGuid).OrderBy(v => v.PositionOnBallot)
                           .Select(v => new
                                          {
                                            v.PersonFullNameFL,
                                            Spoiled = v.VoteStatusCode != VoteHelper.VoteStatusCode.Ok,
                                            VoteInvalidReasonDesc = IneligibleReasonEnum.DescriptionFor(v.VoteIneligibleReasonGuid.AsGuid()).SurroundContentWith("[", "]")
                                          })
                           });

          break;

        case "AllReceivingVotes":
        case "AllReceivingVotesByVote":
          var rows = Db.vResultInfoes.Where(r => r.ElectionGuid == CurrentElection.ElectionGuid);
          if (code == "AllReceivingVotes")
          {
            rows = rows.OrderBy(r => r.PersonName);
          }
          else
          {
            rows = rows.OrderByDescending(r => r.VoteCount)
              .ThenBy(r => r.PersonName);
          }
          data = rows.Select(r =>
                             new
                               {
                                 r.PersonName,
                                 r.VoteCount
                               }
            );
          break;

        default:
          return new { Status = "Unknown report" }.AsJsonResult();
      }

      return new
               {
                 Rows = data,
                 Status = "ok",
                 ElectionStatus = CurrentElection.TallyStatus,
                 ElectionStatusText = ElectionTallyStatusEnum.TextFor(CurrentElection.TallyStatus)
               }.AsJsonResult();
    }

    public JsonResult SaveTieCounts(List<string> counts)
    {
      // input like:   2_3,5_3,235_0
      var countItems = counts.Select(delegate(string s)
                                                          {
                                                            var parts = s.SplitWithString("_", StringSplitOptions.None);
                                                            return new
                                                                     {
                                                                       ResultId = parts[0].AsInt(),
                                                                       Value = parts[1].AsInt()
                                                                     };
                                                          }).ToList();
      var resultsIds = countItems.Select(ci => ci.ResultId).ToArray();

      var results =
        Db.Results.Where(r => resultsIds.Contains(r.C_RowId) && r.ElectionGuid == CurrentElection.ElectionGuid).ToList();

      foreach (var result in results)
      {
        result.TieBreakCount = countItems.Single(ci => ci.ResultId == result.C_RowId).Value;
      }

      Db.SaveChanges();

      return new
               {
                 Status = "Saved"
               }.AsJsonResult();
    }
  }
}