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
    
    public partial class vLocationInfo
    {
        public int C_RowId { get; set; }
        public System.Guid ElectionGuid { get; set; }
        public System.Guid LocationGuid { get; set; }
        public string Name { get; set; }
        public string ContactInfo { get; set; }
        public string Long { get; set; }
        public string Lat { get; set; }
        public string TallyStatus { get; set; }
        public Nullable<int> SortOrder { get; set; }
        public Nullable<int> ActiveComputers { get; set; }
        public Nullable<int> Ballots { get; set; }
    }
}
