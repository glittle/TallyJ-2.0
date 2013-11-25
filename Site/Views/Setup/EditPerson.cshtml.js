﻿var EditPersonPage = function () {
    var local = {
        inputField: null,
        hostPanel: null
    };

    var startNewPerson = function (panel, ineligible) {
        applyValues(panel, {
            C_RowId: -1,
            IneligibleReasonGuid: ineligible,
        });
    };
    var applyValues = function (panel, person) {
        if (panel) {
            local.hostPanel = panel;
        }
        else {
            panel = local.hostPanel;
        }
        panel.find(':input[data-name]').each(function () {
            var input = $(this);
            var value = person[input.data('name')] || '';
            switch (input.attr('type')) {
                case 'checkbox':
                    input.prop('checked', value);
                    break;
                default:
                    input.val(value);
                    break;
            }
        });

        panel.fadeIn();
        panel.find('[data-name="FirstName"]').focus();

        //TODO...
        //        if (publicInterface.defaultRules.CanVoteLocked) {
        //            $('[data-name="CanVote"]').prop('enabled', false).propertyIsEnumerable('checked', publicInterface.defaultRules.CanVote=='A');
        //        }
        //        if (publicInterface.defaultRules.CanReceiveLocked) {
        //            $('[data-name="CanReceiveVote"]').prop('enabled', false).propertyIsEnumerable('checked', publicInterface.defaultRules.CanReceive=='A');
        //        }

        //        panel.fadeIn();
        //        panel.find('[data-name="FirstName"]').focus();
    };

    var saveChanges = function () {
        var form = {};
        local.hostPanel.find(':input[data-name]').each(function () {
            var input = $(this);
            var value;
            switch (input.attr('type')) {
                case 'checkbox':
                    value = input.prop('checked');
                    break;
                default:
                    value = input.val();
                    break;
            }
            form[input.data('name')] = value;
        });

        if (!(form.FirstName && form.LastName)) {
            alert('First and Last names are required.');
            return;
        }

        ShowStatusDisplay("Saving...");
        CallAjaxHandler(publicInterface.controllerUrl + '/SavePerson', form, function (info) {
            if (info.Person) {
                applyValues(null, info.Person);

                site.broadcast(site.broadcastCode.personSaved, info);
            }
            ShowStatusDisplay(info.Status);
        });
    };


    var preparePage = function () {
        $('#btnSave').click(saveChanges);
        $('#ddlIneligible').html(prepareReasons());

        site.onbroadcast(site.broadcastCode.startNewPerson, function (ev, data) {
            startNewPerson($(data.panelSelector), data.ineligible);
        });

        site.qTips.push({ selector: '#qTipFName', title: 'First Name', text: 'These are the main names for this person. Both first and last name must be filled in.' });
        site.qTips.push({ selector: '#qTipLName', title: 'Last Name', text: 'These are the main names for this person. Both first and last name must be filled in.' });
        site.qTips.push({ selector: '#qTipOtherName', title: 'Other Names', text: 'Optional. If a person may be known by other first names, enter them here.' });
        site.qTips.push({ selector: '#qTipOtherLastName', title: 'Other Names', text: 'Optional. If a person may be known by other last names, enter them here.' });
        site.qTips.push({ selector: '#qTipOtherInfo', title: 'Other Identifying Information', text: 'Optional. Anything else that may be commonly used to identify this person. E.g. Doctor' });
        site.qTips.push({ selector: '#qTipArea', title: 'Sector / Area', text: 'Optional. For a city, the sector or neighbourhood they live in. For a regional or national election, their home town.' });
        site.qTips.push({ selector: '#qTipBahaiId', title: 'Bahá\'í ID', text: 'Optional. The person\'s ID. Shows in final reports if elected.' });
        site.qTips.push({ selector: '#qTipIneligible', title: 'Ineligible', text: 'Most people are eligible to participate in the election by voting or being voted for.'
          + '<br><br>However, if this person is ineligible, select the best reason here. Their name will show in some lists, but votes for them will be automatically marked as spoiled.'
        });
        site.qTips.push({ selector: '#qTipCanVote', title: 'Can Vote?', text: 'In this election, only named individuals or delegates can participate as voters.  If this person can vote, check this box.' });
        site.qTips.push({ selector: '#qTipCanReceive', title: 'Tie Break?', text: 'In this election, only named individuals can be voted for.  If this person can receive votes, check this box.' });
    };

    var prepareReasons = function () {
        var html = ['<option value="">Eligible to participate</option>'];
        var group = '';
        $.each(publicInterface.invalidReasons, function () {
            var reasonGroup = this.Group;
            if (reasonGroup == 'Unreadable') return;
            if (reasonGroup != group) {
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

    var publicInterface = {
        peopleUrl: '',
        invalidReasons: [],
        defaultRules: null,
        applyValues: applyValues,
        startNewPerson: startNewPerson,
        PreparePage: preparePage
    };
    return publicInterface;
};

var editPersonPage = EditPersonPage();

$(function () {
    editPersonPage.PreparePage();
});