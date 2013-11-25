﻿using System;
using Microsoft.AspNet.SignalR;
using TallyJ.Code.Session;

namespace TallyJ.CoreModels.Hubs
{
  public class FrontDeskHub : Hub
  {
    public void Subscribe(Guid electionGuid)
    {
      Groups.Add(Context.ConnectionId, electionGuid.ToString());
    }

    public static void UpdateAllConnectedClients(object message)
    {
      var context = GlobalHost.ConnectionManager.GetHubContext<FrontDeskHub>();
      context.Clients.Group(UserSession.CurrentElectionGuid.ToString()).updatePeople(message);
    }
  }
}