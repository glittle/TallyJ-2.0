﻿CREATE TABLE [tj].[Person] (
    [_RowId]               INT              IDENTITY (1, 1) NOT NULL,
    [ElectionGuid]         UNIQUEIDENTIFIER NOT NULL,
    [PersonGuid]           UNIQUEIDENTIFIER  NOT NULL,
    [LastName]             NVARCHAR (50)    NOT NULL,
    [FirstName]            NVARCHAR (50)    NULL,
    [OtherLastNames]       NVARCHAR (100)   NULL,
    [OtherNames]           NVARCHAR (100)   NULL,
    [OtherInfo]            NVARCHAR (150)   NULL,
    [Area]                 NVARCHAR (50)    NULL,
    [BahaiId]              VARCHAR (20)     NULL,
    [CombinedInfo]         NVARCHAR (MAX)   NULL,
    [CombinedSoundCodes]   VARCHAR (MAX)    NULL,
    [CombinedInfoAtStart]  NVARCHAR (MAX)   NULL,
    [AgeGroup]             VARCHAR (2)      NULL,
    [CanVote]              BIT              NULL,
    [CanReceiveVotes]      BIT              NULL,
    [IneligibleReasonGuid] UNIQUEIDENTIFIER NULL,
    [RegistrationTime]     DATETIME2 (0)    NULL,
    [VotingLocationGuid]   UNIQUEIDENTIFIER NULL,
    [VotingMethod]         VARCHAR (1)      NULL,
    [EnvNum]               INT              NULL,
    [_RowVersion]          ROWVERSION       NOT NULL,
    [_FullName]            AS               ((((([LastName]+coalesce((' ['+nullif([OtherLastNames],''))+']',''))+', ')+coalesce([FirstName],''))+coalesce((' ['+nullif([OtherNames],''))+']',''))+coalesce((' ('+nullif([OtherInfo],''))+')','')) PERSISTED,
    [_RowVersionInt]       AS               (CONVERT([bigint],[_RowVersion],0)),
    [_FullNameFL]          AS               ((((coalesce([FirstName]+' ','')+[LastName])+coalesce((' ['+nullif([OtherNames],''))+']',''))+coalesce((' ['+nullif([OtherLastNames],''))+']',''))+coalesce((' ('+nullif([OtherInfo],''))+')','')) PERSISTED,
    [Teller1]              NVARCHAR(25) NULL,
    [Teller2]              NVARCHAR(25) NULL,
    CONSTRAINT [PK_Person] PRIMARY KEY CLUSTERED ([_RowId] ASC),
    CONSTRAINT [FK_Person_Election] FOREIGN KEY ([ElectionGuid]) REFERENCES [tj].[Election] ([ElectionGuid]) ON DELETE CASCADE
);








GO
CREATE UNIQUE NONCLUSTERED INDEX [IX_Person_1]
    ON [tj].[Person]([PersonGuid] ASC);


GO
GRANT UPDATE
    ON OBJECT::[tj].[Person] TO [TallyJSite]
    AS [dbo];


GO
GRANT SELECT
    ON OBJECT::[tj].[Person] TO [TallyJSite]
    AS [dbo];


GO
GRANT INSERT
    ON OBJECT::[tj].[Person] TO [TallyJSite]
    AS [dbo];


GO
GRANT DELETE
    ON OBJECT::[tj].[Person] TO [TallyJSite]
    AS [dbo];


GO
CREATE NONCLUSTERED INDEX [IX_Person]
    ON [tj].[Person]([ElectionGuid] ASC);


GO
CREATE NONCLUSTERED INDEX [IX_PersonElection]
    ON [tj].[Person]([ElectionGuid] ASC)
    INCLUDE([_RowId], [CombinedInfo], [CombinedSoundCodes]);

