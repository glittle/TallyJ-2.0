using System.Collections.Generic;
using TallyJ.Models;

namespace TallyJ.CoreModels
{
    public interface IElectionAnalyzer
    {
        /// <Summary>Current Results records</Summary>
        List<Result> Results { get; }

        List<ResultSummary> ResultSummaries { get; }

        /// <Summary>Current Results records</Summary>
        ResultSummary ResultSummaryFinal { get; }

        /// <Summary>Current VoteInfo records</Summary>
        List<vVoteInfo> VoteInfos { get; }

        /// <Summary>Indicate if the results are available, or need to be generated</Summary>
        bool IsResultAvailable { get; }

        List<Ballot> Ballots { get; }
     
        ResultSummary AnalyzeEverything();
        
        void GetOrCreateResultSummaries();
        
        void FinalizeSummaries();
    }
}