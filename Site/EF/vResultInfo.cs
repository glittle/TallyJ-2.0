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
    
    public partial class vResultInfo
    {
        public System.Guid ElectionGuid { get; set; }
        public string Section { get; set; }
        public int Rank { get; set; }
        public Nullable<int> RankInExtra { get; set; }
        public string PersonName { get; set; }
        public Nullable<bool> IsTied { get; set; }
        public Nullable<bool> IsTieResolved { get; set; }
        public string TieBreakGroup { get; set; }
        public Nullable<int> TieBreakCount { get; set; }
        public Nullable<int> VoteCount { get; set; }
        public int C_RowId { get; set; }
        public System.Guid PersonGuid { get; set; }
        public Nullable<bool> CloseToPrev { get; set; }
        public Nullable<bool> CloseToNext { get; set; }
        public Nullable<bool> TieBreakRequired { get; set; }
        public Nullable<bool> ForceShowInOther { get; set; }
    }
}
