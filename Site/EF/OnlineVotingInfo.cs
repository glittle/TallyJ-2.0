//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace TallyJ.EF
{
    using System;
    using System.Collections.Generic;
    
    public partial class OnlineVotingInfo
    {
        public int C_RowId { get; set; }
        public System.Guid ElectionGuid { get; set; }
        public System.Guid PersonGuid { get; set; }
        public string Email { get; set; }
        public Nullable<System.DateTime> WhenBallotCreated { get; set; }
        public string Status { get; set; }
        public Nullable<System.DateTime> WhenStatus { get; set; }
        public string ListPool { get; set; }
        public string ListVotes { get; set; }
        public string HistoryStatus { get; set; }
    }
}
