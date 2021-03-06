﻿var BallotNormalPageFunc = function () {
    var publicInterface = {};
    var temp1 = '{StatusCodeText}{BallotStatusText} <span class="SpoiledCount HideZero{SpoiledCount}"> ({SpoiledCount} spoiled)<span>';
    var local = {
        People: [],
        peopleHelper: null,
        lastSearch: '',
        //    actionTag: null,
        inputField: null,
        lastKey: null,
        nameList: null,
        searchPanel: null,
        ballotsPanel: null,
        btnDeleteBallot: null,
        location: {},
        lastVid: 0,
        votesNeeded: 0,
        ballotStatus: '',
        ballotId: 0,
        votes: [],
        votesList: null,
        tabList: null,
        ballotCountAtLastLoad: 0,
        invalidReasonsHtml: null,
        invalidReasonsShortHtml: null,
        rowSelected: 0,
        searchResultTemplate: '<li id=P{Id}{^Classes}{^IneligibleData}><span class=ShowVote style="width:{VoteSize}%"></span>{^HtmlName}</li>',
        ballotListDetailTemplate: temp1,
        ballotListTemplate: '<div id=B{Id}>{Code} - <span id=BallotStatus{Id}>' + temp1 + '</span></div>',
        NormalVoteLineTemplate: null
    };
    var tabNum = {};

    function preparePage() {
        local.NormalVoteLineTemplate = $('#NormalVoteLine').text();

        tabNum = publicInterface.HasLocations ? {
            ballotEdit: 2,
            ballotListing: 1,
            location: 0
        } : {
                ballotEdit: 1,
                ballotListing: 0
            };

        local.tabList = $('#accordion');
        local.tabList.accordion({
            heightStyle: "content",
            collapsible: true,
            icons: { "header": "ui-icon-plus", "activeHeader": "ui-icon-minus" },
            activate: function (event, ui) {
                var activePanelId = ui.newPanel.attr('id');
                switch (activePanelId) {
                    case 'tabBallots':
                        local.inputField.focus().select();
                        showAddToThisBtn(true);
                        break;
                    case 'tabNameSearch':
                        local.inputField.focus().select();
                        showAddToThisBtn(false);
                        break;
                    default:
                        showAddToThisBtn(true);
                        break;
                }
            }
        });

        local.inputField = $('#txtSearch').on('keyup paste', searchTextChanged);

        local.peopleHelper = new PeopleHelper(publicInterface.peopleUrl, true);
        local.peopleHelper.Prepare(function (lastVid) {
            local.lastVid = lastVid;
            local.inputField.prop('disabled', false);
            local.inputField.focus();
        });

        local.inputField.prop('disabled', true);
        local.nameList = $('#nameList');
        local.searchPanel = $('#nameSearch');
        local.ballotsPanel = $('#ballots');
        local.votesList = $('#votesList');

        local.nameList.on('click', 'li', nameClick);
        $('#ballotList').on('click', 'div', ballotClick);

        $('#btnAddSpoiled').on('click', addSpoiled);

        local.votesList.on('click', '.ui-icon-trash', deleteVote);
        local.votesList.on('click', '.btnClearChangeError', resaveVote);

        local.votesList.on('change', 'select.Invalid', function (ev) {
            var select = ev.target;
            if (select.size > 1) {
                return;
            }
            invalidReasonChanged(null, select);
        });
        local.votesList.on('click', 'select.Invalid option', function (ev) {
            var select = $(ev.target).closest('select');
            invalidReasonChanged(null, select);
        });
        local.votesList.on('keypress', 'select.Invalid', invalidReasonKey);

        local.votesList.sortable({
            handle: '.ui-icon-arrow-2-n-s',
            items: '.VoteHost',
            axis: 'y',
            containment: 'parent',
            tolerance: 'pointer',
            stop: orderChanged
        });

        local.btnDeleteBallot = $('#btnDeleteBallot');
        local.btnDeleteBallot.on('click', deleteBallot);
        $('#btnCloseBallot').on('click', function () {
            showBallot({});
        });

        $('#btnRefreshBallotCount').on('click', changeLocationStatus);
        $('#btnRefreshBallotList').on('click', startToRefreshBallotList);
        $('#btnRefreshBallot').on('click', function () { loadBallot('B' + local.ballotId, true); });

        $('#btnNewBallot').on('click', newBallot);
        $('#btnNewBallot2').on('click', newBallot);
        $('#btnAddToThis').on('click', showBallotTab);
        $('#ballotFilter').on('change', startToChangeBallotFilter);

        $('#btnCancelAddMissing').on('click', cancelAddMissing);

        $('#cbReview').on('click, change', cbReviewChanged);

        $('#cbShowAll').on('click, change', cbShowAll).prop('checked', GetFromStorage('ballots_showAll', false));
        cbShowAll();

        $('#ddlLocationStatus').on('change', changeLocationStatus);
        showLocationStatus();

        $('#txtContact').on('change', function () {
            CallAjaxHandler(publicInterface.controllerUrl + '/UpdateLocationInfo', { info: $(this).val() }, function () {
                ShowStatusSuccess('Updated');
            });
        });
        $('#txtNumCollected').on('change', function () {
            var num = Math.max(0, +$(this).val());
            ShowStatusDisplay('Saving...');
            CallAjaxHandler(publicInterface.controllerUrl + '/UpdateLocationCollected', { numCollected: num }, function (info) {
                if (info.Message) {
                    ShowStatusFailed(info.Message);
                    return;
                }
                if (info.Location) {
                    showLocation(info.Location);
                    ShowStatusSuccess('Saved');
                }
            });
        });
        resetSearch();

        local.invalidReasonsHtml = prepareReasons();
        local.invalidReasonsShortHtml = prepareReasons('Unreadable');

        //        site.qTips.push({ selector: '#qTipMissing', title: 'Add Missing', text: 'If the name on the ballot paper cannot be found by searching, then use this button to add a new name.<br><br>If this person named is ineligible to receive votes, this can be noted as you add the name.' });
        site.qTips.push({ selector: '#qTipSpoiled', title: 'Add Spoiled', text: 'Click to add a spoiled vote.  If the name is readable, first search for it, as someone else may have added it already!' });
        site.qTips.push({ selector: '#qTipSearch', title: 'Searching for Names', text: 'Type the first few letters of desired name(s). A quick search will be done, followed by a more thorough search when the green bar touches the bottom. Type more letters or press Esc to cancel the second search.' });

        site.onbroadcast(site.broadcastCode.personSaved, newPersonSaved);
        site.onbroadcast(site.broadcastCode.personNameChanging, function (ev, fullname) {
            local.inputField.val(fullname);
            searchTextChanged();
        });
        site.onbroadcast(site.broadcastCode.locationChanged, function () {
            // do instant reload
            changedLocation();
        });

        showBallot(publicInterface);

        $('#votesPanel, .sidePanel').show();

        connectToFrontDeskHub();

    };

    var connectToFrontDeskHub = function () {
        $.connection().logging = true;
        var hub = $.connection.frontDeskHubCore;

        hub.client.updatePeople = function (info) {
            console.log('signalR: updatePeople');
            local.peopleHelper.UpdatePeople(info);
            local.lastSearch = '';
            searchTextChanged();
            startToRefreshBallotList();
        };

        startSignalR(function () {
            console.log('Joining frontDesk hub');
            CallAjaxHandler(publicInterface.frontDeskUrl + '/JoinFrontDeskHub', { connId: site.signalrConnectionId });
        });

    };

    function changedLocation() {
        ShowStatusDisplay('Loading location...');
        CallAjaxHandler(publicInterface.controllerUrl + '/GetLocationInfo', null, function (info) {
            if (info.Message) {
                ShowStatusFailed(info.Message);
                return;
            }

            showLocation(info.Location);
            showLocationStatus();

            showBallot(info, true);
        });
    };

    function orderChanged(ev, ui) {
        var ids = [];
        var pos = 1;
        var toUpdate = [];

        local.votesList.children().each(function () {
            var voteHost = $(this);
            var id = +voteHost.data('vote-id');
            if (id > 0) {
                ids.push(id);
                toUpdate.push(voteHost.find('.VoteNum'));
            }
            pos++;
        });
        var form = {
            idList: ids
        };
        ShowStatusDisplay("Saving...");
        CallAjaxHandler(publicInterface.controllerUrl + '/SortVotes', form, function (info) {
            if (info.Message) {
                ShowStatusFailed(info.Message);
                return;
            }
            if (info) {
                // no need to update client with new order
                ShowStatusSuccess("Saved");
                // update to reflect changes
                $.each(toUpdate, function (i, o) {
                    o.text(i + 1);
                });
                showExtraVotes();
            }
        });

    };

    function showBallotTab(focusOnIt) {
        resetSearch();

        local.tabList.find('h3').eq(tabNum.ballotEdit).show();
        if (focusOnIt) {
            // local.tabList.find('h3').eq(tabNum.ballotEdit).next().show();
            local.tabList.accordion('option', 'active', tabNum.ballotEdit);
        }
    };

    function showAddToThisBtn(show) {
        if (show) {
            $('#btnAddToThis').show();
        } else {
            $('#btnAddToThis').hide();
        }
    }

    function hideBallotTab() {
        local.tabList.find('h3').eq(tabNum.ballotEdit).hide().next().hide();
    };

    function newBallot() {
        // disable on click...
        $('.NewBallotBtns').prop('disabled', true);

        CallAjaxHandler(publicInterface.controllerUrl + "/NewBallot", null, function (info) {
            if (info.Message) {
                ShowStatusFailed(info.Message);
                $('.NewBallotBtns').prop('disabled', false);
                return;
            }
            showBallot(info);
            showBallotTab(true);


            local.inputField.focus().val('').change();
            local.nameList.html('');
            $('.NewBallotBtns').prop('disabled', false);
        }, null, function () {
            // failed
            $('.NewBallotBtns').prop('disabled', false);
        });
    };

    function focusOnTextInput() {
        local.inputField.focus().select();
    };

    function startToChangeBallotFilter() {
        CallAjaxHandler(publicInterface.controllerUrl + '/ChangeBallotFilter', { code: $('#ballotFilter').val() }, function (info) {
            showBallots(info);
            highlightBallotInList();
            ShowStatusSuccess('Updated');
        });
    };

    function startToRefreshBallotList() {
        ShowStatusDisplay('Refreshing ballots');
        CallAjaxHandler(publicInterface.controllerUrl + '/RefreshBallotsList', null, function (info) {
            showBallots(info);
            highlightBallotInList();
            ShowStatusSuccess('Updated');
        });
    };

    function showLocationStatus() {
        // copy selected status to the heading
        var statusDdl = $('#ddlLocationStatus');
        if (!statusDdl.length) {
            return;
        }
        var select = statusDdl[0];
        if (select.selectedIndex === -1) {
            $('.LocationStatus').text(': Unknown');
            return;
        }
        var text = select.options[select.selectedIndex].text;
        $('.LocationStatus').text(': ' + text)
    }

    function changeLocationStatus() {
        if (!publicInterface.Location) {
            ShowStatusFailed("Select a location first!");
            return;
        }
        var form = {
            id: publicInterface.Location.Id,
            status: $('#ddlLocationStatus').val()
        };
        CallAjaxHandler(publicInterface.controllerUrl + '/UpdateLocationStatus', form, function (info) {
            if (info.Location) {
                showLocation(info.Location);
                showLocationStatus();

                $('span[data-location]').each(function () {
                    var span = $(this);
                    if (span.data('location') == info.Location.Id) {
                        span.text(info.Location.TallyStatus);
                    }
                });
            }
            ShowStatusSuccess('Updated');
        });
    };

    function addMissing(voteId) {
        toggleAddMissingPanel();

        $('#addMissingPanel').data('voteId', voteId);

        var ddl = $('#ddlIneligible');
        ddl[0].size = ddl.find('option, optgroup').length + 1;

        var searchParts = local.inputField.val().split(' ');
        var capitalized = function (s) {
            if (!s) return '';
            return s.substr(0, 1).toUpperCase() + s.substr(1);
        };
        var first = searchParts.shift();
        var last = searchParts.join(' ');
        site.broadcast(site.broadcastCode.startNewPerson, {
            panelSelector: '#addMissingPanel',
            ineligible: 'ce27534d-d7e8-e011-a095-002269c41d11', // Unidentifiable_Unknown_person
            first: capitalized(first),
            last: capitalized(last)
        });
    };

    function cancelAddMissing() {
        var panel = $('#addMissingPanel');

        if (panel.is(':visible')) {
            var voteId = panel.data('voteId');
            var select = $('#V' + voteId + ' select');
            select[0].selectedIndex = 0;

            toggleAddMissingPanel();
        }
    };

    function newPersonSaved(ev, info) {
        local.lastSearch = ''; // force a reload
        searchTextChanged();
        toggleAddMissingPanel();

        if ($('#ddlTopLocation').val() == -1) {
            ShowStatusFailed('Must select your location first!');
            return;
        }

        var person = info.Person;
        var votes = $.grep(local.votes, function (v) {
            return v.vid == 0;
        });
        var vote;
        if (votes.length) {
            vote = votes[0];
            vote.pid = person.C_RowId;
            vote.name = person.C_FullName;
            vote.ineligible = person.CanReceiveVotes ? null : person.IneligibleReasonGuid;
        } else {
            vote = {
                vid: 0,
                pid: person.C_RowId,
                name: person.C_FullName,
                count: 0,
                ineligible: person.CanReceiveVotes ? null : person.IneligibleReasonGuid
            };
            local.votes.push(vote);
        }
        if (!vote.ineligible) {
            vote.InvalidReasons = null;
            vote.invalidType = null;
            vote.invalid = null;
        }
        showVotes();

        var newHost = local.votesList.find('.VoteHost#V0').eq(0);

        startSavingVote(newHost);
    };

    function toggleAddMissingPanel() {
        $('#votesPanel, #addMissingPanel').toggle();
    };

    function showBallot(info, showLocationTab) {
        local.votesList.scrollTop(0);

        if (info.Ballots) {
            showBallots(info.Ballots);
        }

        var ballotInfo = info.BallotInfo;
        if (ballotInfo) {
            $('#votesPanel').css('visibility', 'visible');

            var ballot = ballotInfo.Ballot;
            $('.ballotCode').text(ballot.Code);
            $('#ballotStatus').text(ballot.StatusCode);

            showBallotTab();

            local.votesNeeded = ballotInfo.NumNeeded;
            local.ballotStatus = ballot.StatusCode;
            local.votes = ballotInfo.Votes;
            local.ballotId = ballot.Id;

            showVotes();
            scrollVotesTo(0);

            updateStatusDisplay(ballot);

            var toShow = (ballot.StatusCode === 'TooFew' || ballot.StatusCode === 'Empty') ? tabNum.ballotEdit : tabNum.ballotListing;
            local.tabList.find('h3').eq(toShow).show().next().show();
            local.tabList.accordion('option', 'active', toShow);
            showAddToThisBtn(toShow == tabNum.ballotListing);

            highlightBallotInList();

        } else {
            $('.ballotCode').text('');

            $('#votesPanel').css('visibility', 'hidden');
            $('#votesList').html('');

            if (showLocationTab) {
                local.tabList.accordion('option', 'active', tabNum.location);
            } else {
                local.tabList.accordion('option', 'active', tabNum.ballotListing);
            }
            hideBallotTab();
            showAddToThisBtn(true);
            //local.btnDeleteBallot.show();
        }

        if (info.Location) {
            showLocation(info.Location);
            publicInterface.Location = info.Location;
        }

    };

    function showVotes() {
        var votes = extendVotes(local.votes);

        cancelAddMissing();

        local.votesList.html(local.NormalVoteLineTemplate.filledWithEach(votes));
        local.votesList.find('select').each(function () {
            var select = $(this);
            var reason = select.data('invalid');
            if (reason) {
                select.val(reason);
            }
        });

        showExtraVotes();

        findAndMarkDups(local.votesList.find('.VoteHost'));

        var disable = votes.length > 0;
        local.btnDeleteBallot
            .toggle(!disable);
        //.toggleClass('btn-warning', !disable); // only show orange if usable

        setTimeout(function () {
            checkScrollLength();
        }, 0);
    };

    function checkScrollLength() {
        var div = local.votesList[0];
        var overflowing = div.clientHeight < div.scrollHeight;
        $('.showAll').toggle(overflowing || $('#votesPanel').hasClass('showAllVotes'));
    }

    function scrollVotesTo(offset) {
        $('#votersList').scrollTop(offset);
    };



    function findAndMarkDups(votes) {
        var found = false;
        var dups = {};
        var list = [];
        var vote;
        local.votesList.find('.Duplicate').hide();
        votes.each(function () {
            vote = $(this);
            vote.removeClass('duplicateVote');
            var thisPerson = vote.data('person-id');
            if (thisPerson && dups[thisPerson]) {
                dups[thisPerson].push(vote);

                if ($.inArray(thisPerson, list) === -1) {
                    list[list.length] = thisPerson;
                }
            } else {
                dups[thisPerson] = [vote];
            }
        });

        for (var i = 0; i < list.length; i++) {
            var id = list[i];
            var dupVotes = dups[id];
            if (dupVotes.length > 1) {
                found = true;
                for (var j = 0; j < dupVotes.length; j++) {
                    vote = dupVotes[j];
                    vote.addClass('duplicateVote');
                    //          vote.children().eq(0).after('<span class=Duplicate>Duplicate:</span>');
                    vote.find('.Duplicate').show();
                }
            }
        }
        return found;
    };

    function updateStatusInList(info) {
        $('#BallotStatus' + local.ballotId).html(local.ballotListDetailTemplate.filledWith(info));
    };

    function updateStatusDisplay(info) {

        if (info.StatusCode) {
            // backward compatibilty... convert values
            info.BallotStatus = info.StatusCode;
            info.BallotStatusText = info.StatusCodeText;
        }

        $('#cbReview').prop('checked', info.BallotStatus === 'Review');

        var status = info.BallotStatus;

        var topDisplay = $('.ballotStatus');

        topDisplay.html(info.BallotStatusText);

        if (status === 'Ok') {
            topDisplay.removeClass('InvalidBallot');
            topDisplay.addClass('Ok');
        } else if (status === 'TooFew') {
            topDisplay.removeClass('InvalidBallot');
            topDisplay.removeClass('Ok');
        } else {
            topDisplay.removeClass('Ok');
            topDisplay.addClass('InvalidBallot');
        }
    };

    function cbShowAll() {
        var checked = $('#cbShowAll').prop('checked');
        $('#votesPanel').toggleClass('showAllVotes', checked);
        SetInStorage('ballots_showAll', checked);
        checkScrollLength();
    }

    function cbReviewChanged() {
        var checked = $('#cbReview').prop('checked');
        //var isReview = local.ballotStatus == 'Review';

        //if (checked != isReview) {
        ShowStatusDisplay('Saving');

        CallAjaxHandler(publicInterface.controllerUrl + '/NeedsReview', { needs: checked }, function (info) {
            if (info.Message) {
                ShowStatusFailed(info.Message);
                return;
            }
            updateStatusDisplay(info);
            updateStatusInList(info);

            ShowStatusSuccess('Saved');
        });

        //}
    };

    function showLocation(location) {
        local.location = location;
        $('.locationInfo [data-name], .LocationName[data-name]').each(function () {
            var target = $(this);
            var value = location[target.data('name')];

            switch (this.tagName) {
                case 'SPAN':
                case 'DIV':
                    target.html(value);
                    break;
                default:
                    target.val(value);
                    break;
            }
        });
        showBallotCount(0, location.BallotsEntered);
    };

    function showBallotCount(numEnteredOnThisComputer, numEnteredInLocation) {
        $('#lblNumEntered').text(numEnteredOnThisComputer || local.ballotCountAtLastLoad || '-');

        var remainingToEnter = (local.location.BallotsCollected || 0) - (numEnteredInLocation || 0);
        var title;
        if (remainingToEnter === 0) {
            title = ': All entered';
        } else if (remainingToEnter < 0) {
            title = ': {0} more than counted'.filledWith(0 - remainingToEnter);
        }
        else {
            title = ': {0} more to enter'.filledWith(remainingToEnter);
        }

        $('#collectedVsEnteredTitle').text(title);
    };

    function showBallots(info) {
        var list = info.Ballots;

        $('#ballotList')
            .html(local.ballotListTemplate.filledWithEach(list));

        showBallotCount(list.length, info.Total);
        local.ballotCountAtLastLoad = list.length;

        $('#showingWhat').text($('#ballotFilter').val() || 'All');
    };

    function highlightBallotInList() {
        var ballotList = $('#ballotList');
        var highlighted = ballotList.children().removeClass('selected').end().find('#B{0}'.filledWith(local.ballotId)).addClass('selected');
        scrollIntoView(highlighted, ballotList);
    };

    function invalidReasonKey(ev) {
        var select = ev.target;
        // console.log('a', select.size);
        if (select.size === 1) {
            invalidReasonChanged(ev);
            return;
        }
        if (ev.which === 13) {
            if (select.selectedIndex > 0) {
                invalidReasonChanged(ev);
                ev.preventDefault();
            }
        }
    }

    var removedParent; // seems to be triggering twice!
    function invalidReasonChanged(ev, target) {
        var target = target || ev.target;
        if (target.selectedIndex === -1) {
            return; //nothing selected
        }
        var select = $(target);
        var reason = select.val();
        if (reason === '0') {
            return;  // don't save with no reason
        }
        select.attr('size', 1);
        var parent = select.closest('.VoteHost');

        if (reason === '-1') {
            // remove this one

            //parent.remove();

            //if (!removedParent) {
            //  removedParent = parent;
            //  parent.remove();
            //} else {
            //  removedParent = null;
            //  //return;
            //}

            var voteId = parent.data('vote-id') || 0;
            //console.log(voteId);
            for (var i = 0; i < local.votes.length; i++) {
                var vote = local.votes[i];
                if (vote.vid === voteId) {
                    local.votes.splice(i, 1);
                    break;
                }
            }
            if (voteId != 0) {
                var form = {
                    vid: voteId
                };
                CallAjaxHandler(publicInterface.controllerUrl + '/DeleteVote', form, function (info) {
                    // if failed, user will have to manually remove it
                });
            }

            // add the new one
            addMissing(voteId);
            return;
        }

        startSavingVote(parent);

        focusOnTextInput();
    };

    function resaveVote(ev) {
        var host = $(ev.target).closest('.VoteHost');
        startSavingVote(host, true);
    };

    function startSavingVote(host, verifying) {
        if ($('#ddlTopLocation').val() == -1) {
            ShowStatusFailed('Must select your location first!');
            return;
        }

        var invalids = host.find('select:visible');
        var invalidId = invalids.val() || '';
        var voteId = +host.data('vote-id') || 0;

        var form = {
            pid: host.data('person-id') || 0,
            vid: voteId,
            lastVid: local.lastVid
        };
        if (invalidId) {
            form.invalid = invalidId;
        }
        if (verifying) {
            form.verifying = verifying;
        }

        if (invalidId) {
            invalids.data('invalid', invalidId);
            for (var i = 0; i < local.votes.length; i++) {
                var vote = local.votes[i];
                if (vote.vid == voteId) {
                    vote.invalid = invalidId;
                }
            }
        }

        ShowStatusDisplay('Saving...');

        CallAjaxHandler(publicInterface.controllerUrl + '/SaveVote', form, function (info) {
            var i, vote;

            if (info.Updated) {
                ShowStatusSuccess('Saved');
                // assume any error was removed
                host.removeClass('Changedtrue').addClass('Changedfalse');

                if (invalids.length === 1) {
                    invalids[0].size = 1;
                }

                if (!publicInterface.Location) {
                    location.href = location.href;
                    //TODO: use Ajax to reload the content?
                    return;
                }

                local.lastVid = info.LastVid;

                if (info.Location) {
                    showLocation(info.Location);
                }

                if (form.vid == 0) {
                    if (info.VoteId) {
                        host.data('vote-id', info.VoteId);
                        host.attr('id', 'V' + info.VoteId);
                        host.find('.VoteNum').text(info.pos);

                        for (i = 0; i < local.votes.length; i++) {
                            vote = local.votes[i];
                            if (vote.vid == 0) {
                                vote.vid = info.VoteId;
                                vote.pos = info.pos;
                            }
                        }
                    }
                    else {
                        ShowStatusFailed('Error on save. Please reload this page.');
                    }
                }

                if (verifying && info.Name) {
                    // name will has changed
                    host.find('.Name').html(info.Name);
                }

                scrollToVote(host, info.pos);
                updateStatusDisplay(info);
                updateStatusInList(info);

                local.peopleHelper.RefreshListing(local.inputField.val(), displaySearchResults, getUsedIds(), info);

                if (info.BallotStatus === 'Ok') {
                    local.tabList.accordion('option', 'active', tabNum.ballotListing);

                    $('#btnNewBallot2').effect('highlight', null, 1500);
                }
            }
            else {
                ShowStatusFailed(info.Error || info.Message);
                for (i = 0; i < local.votes.length; i++) {
                    vote = local.votes[i];
                    if (vote.vid == 0) {
                        local.votes.splice(i, 1);
                    }
                }
                showVotes();
            }

        });
    };

    function scrollToVote(host, num) {
        var parent = host.parent();
        var size = host.outerHeight();

        var newScroll = num * size;
        if (newScroll > parent.height() - 2 * size) {
            parent.scrollTop(newScroll);
        } else {
            parent.scrollTop(0);
        }
    };
    function deleteVote(ev) {
        var host = $(ev.target).closest('.VoteHost');
        var voteId = host.data('vote-id') || 0;
        var form = {
            vid: voteId
        };

        if (voteId == 0) {
            host.remove();
            return;
        }

        ShowStatusDisplay('Deleting...');
        CallAjaxHandler(publicInterface.controllerUrl + '/DeleteVote', form, function (info) {
            if (info.Deleted) {
                ShowStatusSuccess('Deleted');
                host.remove();

                if (info.NumNeeded) {
                    local.votesNeeded = info.NumNeeded;
                }

                if (info.Votes) {
                    local.votes = info.Votes;
                    showVotes();
                }

                updateStatusDisplay(info);
                updateStatusInList(info);

                if (info.BallotStatus === 'Ok') {
                    local.tabList.accordion('option', 'active', tabNum.ballotListing);
                    showAddToThisBtn(true);
                }

                if (info.Location) {
                    showLocation(info.Location);
                }
                local.peopleHelper.RefreshListing(local.inputField.val(), displaySearchResults, getUsedIds(), info);
            }
            else {
                ShowStatusFailed(info.Message);
            }
        });
    };

    function deleteBallot() {
        ShowStatusDisplay('Deleting...');
        CallAjaxHandler(publicInterface.controllerUrl + '/DeleteBallot', null, function (info) {
            if (info.Deleted) {
                ShowStatusSuccess('Deleted');

                showBallot(info);

                if (info.Location) {
                    showLocation(info.Location);
                }
            }
            else {
                ShowStatusFailed(info.Message);
            }
        });
    };

    function displaySearchResults(info, beingRefreshed, showNoneFound) {

        local.People = info.People || [];

        local.nameList.html(local.searchResultTemplate.filledWithEach(local.People));
        $('#more').html(''); //info.MoreFound
        if (!local.People.length && local.lastSearch) {
            var search = local.inputField.val();
            if (search && showNoneFound) {
                local.nameList.append('<li>...no matches found...</li>');
            }
        } else {
            if (info.MoreFound && local.lastSearch) {
                local.nameList.append('<li title="Enter more of the name to limit how many are matched!">...more matched...</li>');
            }
            if (beingRefreshed) {
                local.rowSelected = info.currentFocusRow;
            } else {
                local.rowSelected = info.BestRowNum;
            }
            local.nameList.find('li[data-ineligible]').each(function (i, item) {
                var li = $(item);
                var ineligible = li.data('ineligible');
                if (!li.data('canreceivevotes')) {
                    var desc = getIneligibleReasonDesc(ineligible);
                    item.title = 'Ineligible: ' + desc;
                } else {
                    if (ineligible) {
                        li.data('ineligible', null);
                    }
                }
            });
        }
        //    local.actionTag.removeClass('searching');
        //    local.actionTag.text('');
        //    local.inputField.removeClass('searching');

        setSelected(local.nameList.children(), local.rowSelected);
    };

    function getIneligibleReasonDesc(guid) {
        var matched = $.grep(publicInterface.invalidReasons, function (item, i) {
            return item.Guid === guid;
        });
        if (matched.length === 0) return '';
        return matched[0].Desc;
    };

    function moveSelected(delta) {
        var children = local.nameList.children();
        var numChildren = children.length;
        if (children.eq(numChildren - 1).text() === '...') { numChildren--; }

        var rowNum = typeof local.rowSelected == 'undefined' ? -1 : local.rowSelected;
        rowNum = rowNum + delta;
        if (rowNum < 0) { rowNum = 0; }
        if (rowNum >= numChildren) { rowNum = numChildren - 1; }
        setSelected(children, rowNum);
    };

    function setSelected(children, rowNum) {
        children.removeClass('selected');
        local.rowSelected = rowNum;
        var newSelected = children.eq(rowNum);
        newSelected.addClass('selected');
        scrollIntoView(newSelected[0], local.nameList);
    };

    function scrollIntoView(element, container) {
        if (!element) return;
        var containerTop = $(container).scrollTop();
        var containerBottom = containerTop + $(container).height();
        var elemTop = element.offsetTop;
        var elemBottom = elemTop + $(element).height();
        if (elemTop < containerTop) {
            $(container).scrollTop(Math.max(0, elemTop - 10));
        } else if (elemBottom > containerBottom) {
            $(container).scrollTop(elemBottom - $(container).height() + 30);
        }
    };

    function edit(selectedPersonLi) {
        local.nameList.children().removeClass('selected');
        selectedPersonLi.addClass('selected');
        addToVotesList(selectedPersonLi);
    };

    function addToVotesList(selectedPersonLi) {
        if (!selectedPersonLi.length) return;

        var rawId = selectedPersonLi.attr('id');
        if (!rawId) return;

        var personId = +rawId.substr(1);
        if (personId === 0) return;

        focusOnTextInput();

        local.votes.push({
            vid: 0,
            pid: personId,
            name: selectedPersonLi.text(),
            count: 0,
            ineligible: selectedPersonLi.data('ineligible')
        });

        showVotes();
        scrollVotesTo(9999);

        var newHost = local.votesList.find('.VoteHost').last();

        startSavingVote(newHost);
    };

    function addSpoiled() {
        // if one is pending, don't add another
        var unresolved = false;
        local.votesList.find('select.Invalid:visible').each(function (i, s) {
            if (s.selectedIndex < 1) {
                unresolved = true;
                s.size = s.options.length + $(s).children().length - 1;
                setTimeout(function () {
                    console.log('focus2', s);
                    $(s).focus();
                }, 0)
            }
            if (s.selectedIndex === 1) {
                invalidReasonChanged(null, s);
            }
        });
        if (unresolved) {
            return;
        }

        //    console.log('spoiled');
        local.votes.push({
            vid: 0,
            count: 0,
            invalid: 0,
            changed: false,
            InvalidReasons: local.invalidReasonsShortHtml
        });

        showVotes(false);
        scrollVotesTo(9999);

        var newHost = local.votesList.find('.VoteHost').last();
        var input = newHost.find('select');
        input.attr('size', input[0].options.length + input.children().length - 1);

        // vote not saved until a reason is chosen
        setTimeout(function () {
            input.focus();
        }, 0);
    };

    function extendVotes(votes) {
        var num = 0;
        $.each(votes, function () {
            if (this.invalid && this.invalid !== null) {
                this.InvalidReasons = local.invalidReasonsShortHtml;
                this.invalidType = 'C';
            }
            if (this.ineligible && this.ineligible !== null) {
                // person is invalid!

                var vote = this;
                var reasonList = $.grep(publicInterface.invalidReasons, function (item) {
                    return item.Guid === vote.ineligible;
                });
                var reason = 'Ineligible';
                if (reasonList.length === 1) {
                    reason = reasonList[0].Desc;
                }
                //this.Display = '<span class=CannotReceiveVotes>{name}</span>'.filledWith(this); // ' &nbsp; <span class=Ineligible>{0}</span>'.filledWith(reason, this.name);
                this.Display = this.name;
                this.invalid = vote.ineligible;
                this.invalidType = 'P';
                this.InvalidDescription = reason;

            }
            else {
                this.Display = this.name;
            }

            num++;
        });
        return votes;
    };

    function showExtraVotes() {
        var votes = local.votesList.find('.VoteHost, .VoteHostFake');
        var num = 0;
        var extra = local.votesNeeded + 1;
        votes.each(function (i, o) {
            var host = $(o);
            num++;
            host.removeClass('ExtraVote');
            host.removeClass('ExtraVotes');
            if (num === extra) {
                host.addClass('ExtraVote');
            }
            else if (num > extra) {
                host.addClass('ExtraVotes');
            }
        });
        var missing = local.votesNeeded - votes.length;
        if (missing) {
            var emptyVote = { pos: '-', Fake: 'Fake' };
            for (var i = 0; i < missing; i++) {
                emptyVote.pos = votes.length + i + 1;
                local.votesList.append(local.NormalVoteLineTemplate.filledWith(emptyVote));
            }
        }

    };

    function prepareReasons(onlyGroup) {
        var html = [
            '<option value="0">Select a reason...</option>',
            '<optgroup label="Name not in the List">',
            ballotPage.isGuest ?
                '<option value="0">(Ask head teller to add required name)</option>' :
                '<option value="-1">Add new name (including spoiled)</option>',
            '</optgroup>'
        ];
        var group = '';
        $.each(publicInterface.invalidReasons, function () {
            var reasonGroup = this.Group;
            if (onlyGroup && reasonGroup !== onlyGroup) {
                return;
            }
            if (reasonGroup !== group) {
                if (group) {
                    html.push('</optgroup>');
                }
                html.push('<optgroup label="{0}">'.filledWith(reasonGroup));
                group = reasonGroup;
            }
            html.push('<option value="{Guid}">{Desc}</option>'.filledWith(this));
        });
        html.push('</optgroup>');
        return html.join('\n');
    };

    function navigating(ev) {
        switch (ev.which) {
            case 38: // up
                moveSelected(-1);
                ev.preventDefault();
                return true;

            case 33: // page up
                moveSelected(-6);
                ev.preventDefault();
                return true;

            case 40: // down
                moveSelected(1);
                ev.preventDefault();
                return true;

            case 34: // page down
                moveSelected(6);
                ev.preventDefault();
                return true;

            case 13: // enter
                ev.preventDefault();
                edit(local.nameList.children().eq(local.rowSelected));
                return true;

            case 27: // esc
                if (local.lastKey === 27) {
                    // pressed esc twice - clear inputs
                    local.inputField.val('');
                    searchTextChanged();
                }
                return true;

            default:
                //        console.log(ev.which);
                break;
        }
        return false;
    };

    function searchTextChanged(ev) {
        var input = local.inputField;
        var text = input.val();
        if (ev) {
            if (navigating(ev)) {
                local.lastKey = ev.which;
                return;
            }
            local.lastKey = ev.which;
        }
        if (text === '') {
            resetSearch();
            return;
        }
        if (local.lastSearch === text) return;

        local.lastSearch = text;

        local.peopleHelper.Search(text, function (info) {
            displaySearchResults(info, false, true);
        }, getUsedIds());
    };

    function getUsedIds() {
        return $.map($('.VoteHost'), function (item) {
            return $(item).data('person-id');
        });
    };

    function resetSearch() {
        local.lastSearch = '';
        local.inputField.val('');
        displaySearchResults({
            People: [],
            MoreFound: ''
        }, true, false);
    };

    function ballotClick(ev) {
        var ballotId = $(ev.target).closest('div').attr('id');
        loadBallot(ballotId);
    };

    function loadBallot(ballotId, refresh) {
        if (ballotId.substr(0, 1) === 'B') {
            ballotId = ballotId.substr(1);
        }
        CallAjaxHandler(publicInterface.controllerUrl + '/SwitchToBallot', { ballotId: ballotId, refresh: refresh || false }, function (info) {
            if (refresh) {
                startToRefreshBallotList();
            }
            showBallot(info);
        });
    };

    function nameClick(ev) {
        var el = $(ev.target).closest('li');
        var nameId = el.attr('id');
        $.each(local.People, function (i, item) {
            if ('P' + item.Id === nameId) {
                local.rowSelected = i;
                return false;
            }
            return true;
        });

        edit(el);
    };

    publicInterface = {
        peopleUrl: '',
        controllerUrl: '',
        invalidReasons: [],
        BallotInfo: null,
        Ballots: null,
        BallotStatus: [],
        Location: null,
        HasLocations: false,
        PreparePage: preparePage,
        peopleHelper: function () { return local.peopleHelper; },
        local: local
    };

    return publicInterface;
};

var ballotPage = BallotNormalPageFunc();

$(function () {
    ballotPage.PreparePage();
});