//------------------------------------------------------------------------------
// <auto-generated>
//    This code was generated from a template.
//
//    Manual changes to this file may cause unexpected behavior in your application.
//    Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace TallyJ.EF
{
    using System;
    using System.Collections.Generic;
    
    public partial class vBallot
    {
        public int C_RowId { get; set; }
        public System.Guid LocationGuid { get; set; }
        public System.Guid BallotGuid { get; set; }
        public string C_BallotCode { get; set; }
        public string StatusCode { get; set; }
        public string ComputerCode { get; set; }
        public int BallotNumAtComputer { get; set; }
        public Nullable<System.Guid> TellerAtKeyboard { get; set; }
        public Nullable<System.Guid> TellerAssisting { get; set; }
        public byte[] C_RowVersion { get; set; }
        public System.Guid ElectionGuid { get; set; }
    }
}
