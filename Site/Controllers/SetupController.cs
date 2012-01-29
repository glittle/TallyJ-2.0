﻿using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Web.Mvc;
//using Krystalware.SlickUpload;
//using Krystalware.SlickUpload.Storage.Streams;
using TallyJ.Code;
using TallyJ.Code.Session;
using TallyJ.EF;
using TallyJ.Models;

namespace TallyJ.Controllers
{
  public class SetupController : BaseController
  {
    
    public ActionResult Index()
    {
      return View("Setup", new SetupModel());
    }

    public ActionResult People()
    {
      return View(new SetupModel());
    }

    public JsonResult SaveElection(Election election)
    {
      return new ElectionModel().SaveElection(election);
    }

    public JsonResult DetermineRules(string type, string mode)
    {
      return new ElectionModel().GetRules(type, mode).AsJsonResult();
    }

    [ForAuthenticatedTeller]
    public ActionResult ImportExport(ImportExportModel importExportModel)
    {
      if (importExportModel == null)
      {
        importExportModel = new ImportExportModel();
      }

      return View(importExportModel);
    }


    [ForAuthenticatedTeller]
    public string Upload()
    {
      var model = new ImportExportModel();
      
      model.ProcessUpload();

      return "{success:true}";
    }

    //[ForAuthenticatedTeller]
    //public ActionResult UploadResult(ImportExportModel model, UploadSession session)
    //{
    //  model.UploadSession = session;

    //  return View("ImportExport", model);
    //}

    [ForAuthenticatedTeller]
    public ActionResult Download(int id)
    {
      var fullFile = Db.ImportFiles.SingleOrDefault(f => f.ElectionGuid == UserSession.CurrentElectionGuid && f.C_RowId == id);

      if (fullFile != null)
      {
        return File(fullFile.Contents, "application/octet-stream", fullFile.OriginalFileName);
      }
      return null;
    }

    [ForAuthenticatedTeller]
    public ActionResult DeleteFile(int id)
    {
      var importExportModel = new ImportExportModel();
      
      return importExportModel.DeleteFile(id);
    }

    [ForAuthenticatedTeller]
    public ActionResult GetUploadlist()
    {
      var importExportModel = new ImportExportModel();
      return importExportModel.GetUploadList();
    }

    public JsonResult SavePerson(Person person)
    {
      return new PeopleModel().SavePerson(person);
    }

    [ForAuthenticatedTeller]
    public JsonResult EditLocation(int id, string text)
    {
      return new LocationModel().EditLocation(id, text);
    }

    [ForAuthenticatedTeller]
    public JsonResult SortLocations(string ids)
    {
      return new LocationModel().SortLocations(ids);
    }

    [ForAuthenticatedTeller]
    public JsonResult ResetAll()
    {
      new PeopleModel().CleanAllPersonRecordsBeforeStarting();
      return "Done".AsJsonResult();
    }
 }
}