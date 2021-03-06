﻿CREATE TABLE [tj].[ResultSummary] (
    [_RowId]               INT              IDENTITY (1, 1) NOT NULL,
    [ElectionGuid]         UNIQUEIDENTIFIER NOT NULL,
    [ResultType]           CHAR (1)         NOT NULL,
    [UseOnReports]         BIT              NULL,
    [NumVoters]            INT              NULL,
    [NumEligibleToVote]    INT              NULL,
    [MailedInBallots]      INT              NULL,
    [DroppedOffBallots]    INT              NULL,
    [InPersonBallots]      INT              NULL,
    [SpoiledBallots]       INT              NULL,
    [SpoiledVotes]         INT              NULL,
    [TotalVotes]           INT              NULL,
    [BallotsReceived]      INT              NULL,
    [BallotsNeedingReview] INT              NULL,
    [CalledInBallots]      INT              NULL,
    [SpoiledManualBallots] INT              NULL,
    CONSTRAINT [PK_ResultSummary] PRIMARY KEY CLUSTERED ([_RowId] ASC),
    CONSTRAINT [FK_ResultSummary_Election1] FOREIGN KEY ([ElectionGuid]) REFERENCES [tj].[Election] ([ElectionGuid]) ON DELETE CASCADE
);




GO
GRANT UPDATE
    ON OBJECT::[tj].[ResultSummary] TO [TallyJSite]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[tj].[ResultSummary] TO [TallyJSite]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[tj].[ResultSummary] TO [TallyJSite]
    AS [dbo];


GO
GRANT DELETE
    ON OBJECT::[tj].[ResultSummary] TO [TallyJSite]
    AS [dbo];



