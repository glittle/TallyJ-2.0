using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace TallyJ.Models
{
    public partial class vBallotInfo : Entity
    {
        public System.Guid LocationGuid { get; set; }
        public System.Guid BallotGuid { get; set; }
        public string StatusCode { get; set; }
        public string ComputerCode { get; set; }
        public int BallotNumAtComputer { get; set; }
        public string C_BallotCode { get; set; }
        public Nullable<System.Guid> TellerAtKeyboard { get; set; }
        public Nullable<System.Guid> TellerAssisting { get; set; }
        public byte[] C_RowVersion { get; set; }
        public System.Guid ElectionGuid { get; set; }
        public int LocationId { get; set; }
        public string LocationName { get; set; }
        public Nullable<int> LocationSortOrder { get; set; }
        public string TallyStatus { get; set; }
        public string TellerAtKeyboardName { get; set; }
        public string TellerAssistingName { get; set; }
        public Nullable<long> RowVersionInt { get; set; }
        public Nullable<int> SpoiledCount { get; set; }
        public Nullable<int> VotesChanged { get; set; }
    }
}
