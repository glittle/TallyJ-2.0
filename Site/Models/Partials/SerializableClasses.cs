﻿using System;

namespace TallyJ.Models
{
  [Serializable]
  public partial class Election
  {
  }

  [Serializable]
  public partial class Computer
  {
  }

  [Serializable]
  public partial class Location
  {
  }

  //[MetadataType(typeof(DealWithPersonRowVersionRaw))]
  //public partial class vVoteInfo
  //{

  //}

  //public class DealWithPersonRowVersionRaw
  //{
  //  [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
  //  [IgnoreDataMember]
  //  [DefaultValue(0x0)]
  //  [Timestamp]
  //  public byte[] PersonRowVersionRaw { get; set; }
  //}
}