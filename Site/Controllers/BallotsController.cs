using System;
using System.Collections.Generic;
using System.Web.Mvc;
using TallyJ.Code;
using TallyJ.Code.Session;
using TallyJ.CoreModels;
using System.Linq;

namespace TallyJ.Controllers
{
  public class BallotsController : BaseController
  {
    public ActionResult Index()
    {
      var locationId = Request.QueryString["l"].AsInt();
      if (locationId != 0 && (UserSession.CurrentLocation == null || locationId != UserSession.CurrentLocation.C_RowId))
      {
        // switch to location, if allowed
        var switched = new ComputerModel().MoveCurrentComputerIntoLocation(locationId);
        if (!switched)
        {
          return RedirectToAction("ChooseElection", "Dashboard");
        }
      }

      var isSingle = UserSession.CurrentElection.IsSingleNameElection;
      var ballotModel = CurrentBallotModel;

      var ballotId = Request.QueryString["b"].AsInt();
      if (ballotId == 0)
      {
        if (isSingle)
        {
          ballotModel.GetCurrentBallot();
        }
      }
      else
      {
        ballotModel.SetAsCurrentBallot(ballotId);
      }

      return isSingle ? View("BallotSingle", ballotModel) : View("BallotNormal", ballotModel);
    }

    public ActionResult Reconcile()
    {
      return View(new PeopleModel());
    }

    public JsonResult BallotsForLocation(int id)
    {
      return new
               {
                 Ballots = new PeopleModel().BallotSources(id)
               }.AsJsonResult();
    }

    public JsonResult SaveVote(int pid, int vid, int count, string invalid)
    {
      var invalidGuid = invalid.AsNullableGuid();
      return CurrentBallotModel.SaveVote(pid, vid, count, invalidGuid);
    }

    public JsonResult DeleteVote(int vid)
    {
      return CurrentBallotModel.DeleteVote(vid);
    }

    public JsonResult NeedsReview(bool needs)
    {
      return CurrentBallotModel.SetNeedsReview(needs);
    }

    public JsonResult SwitchToBallot(int ballotId)
    {
      return CurrentBallotModel.SwitchToBallotAndGetInfo(ballotId).AsJsonResult();
    }

    public JsonResult UpdateLocationStatus(int id, string status)
    {
      return ContextItems.LocationModel.UpdateStatus(id, status);
    }

    //public JsonResult UpdateBallotStatus(string status)
    //{
    //  return new
    //           {
    //             Status = status,
    //             Updated = false
    //           }.AsJsonResult();
    //  //return CurrentBallotModel.UpdateBallotStatus(status);
    //}
    
    public JsonResult UpdateLocationInfo(string info)
    {
      return ContextItems.LocationModel.UpdateLocationInfo(info);
    }
    
    public JsonResult GetLocationInfo()
    {
      if (UserSession.CurrentElection.IsSingleNameElection)
      {
        return new
        {
          Location = ContextItems.LocationModel.CurrentBallotLocationInfo(),
          BallotInfo = CurrentBallotModel.CurrentBallotInfo(),
          Ballots = CurrentBallotModel.CurrentBallotsInfoList()
        }.AsJsonResult();
      }
      return null;
    }
    
    public JsonResult UpdateLocationCollected(int numCollected)
    {
      return ContextItems.LocationModel.UpdateNumCollected(numCollected);
    }

    public JsonResult RefreshBallotsList()
    {
      return CurrentBallotModel.CurrentBallotsInfoList().AsJsonResult();
    }

    public JsonResult SortVotes(List<int> idList)
    {
      //var ids = idList.Split(new[] {','}).Select(s => s.AsInt()).ToList();
      return CurrentBallotModel.SortVotes(idList).AsJsonResult();
    }

    public JsonResult NewBallot()
    {
      return CurrentBallotModel.StartNewBallotJson();
    }

    public JsonResult DeleteBallot()
    {
      return CurrentBallotModel.DeleteBallotJson();
    }

    private static IBallotModel CurrentBallotModel
    {
      get { return BallotModelFactory.GetForCurrentElection(); }
    }
  }
}