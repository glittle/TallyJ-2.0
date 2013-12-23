﻿var MonitorPage = function () {
  var settings = {
    rowTemplateMain: '',
    rowTemplateExtra: '',
    rowTemplateBallot: '',
    refreshTimeout: null
  };

  var preparePage = function () {
    var tableBody = $('#mainBody');
    settings.rowTemplateMain = '<tr class="{ClassName}">' + tableBody.children().eq(0).html() + '</tr>';
    settings.rowTemplateExtra = '<tr class="Extra {ClassName}">' + tableBody.children().eq(1).html() + '</tr>';

    var ballotTableBody = $('#ballotsBody');
    settings.rowTemplateBallot = '<tr class="{ClassName}">' + ballotTableBody.children().eq(0).html() + '</tr>';

    showInfo(publicInterface.LocationInfos, true);

    var desiredTime = GetFromStorage(storageKey.MonitorRefresh, 60);

    //        $('#ddlElectionStatus').on('change', function () {
    //            //ShowStatusDisplay('Updating...');
    //            var ddl = $(this);
    //            CallAjaxHandler(site.rootUrl + 'Elections/UpdateElectionStatus', {
    //                status: ddl.val()
    //            }, function () {
    //                //ShowStatusDisplay('Updated', 0, 1000, false, true);
    //                ResetStatusDisplay();
    //                $('.ElectionState').text(ddl.find(':selected').text());
    //            });
    //        });

    $('#ddlRefresh').val(desiredTime).change(function () {
      $('#chkAutoRefresh').prop('checked', true);
      setAutoRefresh(true);
      SetInStorage(storageKey.MonitorRefresh, $(this).val());
    });

    $('#chkAutoRefresh').click(setAutoRefresh);
    $('#chkList').click(updateListing);
    $('#btnRefesh').click(function () {
      ShowStatusDisplay("Refreshing...");
      refresh();
    });

    if (publicInterface.isGuest) {
      $('#chkList').prop('disabled', true);
      $('#ddlElectionStatus').prop('disabled', true);
    }

    setAutoRefresh(false);
  };

  var showInfo = function (info, firstLoad) {
    clearInterval(settings.autoMinutesTimeout);

    var table = $('#mainBody');
    if (!firstLoad) {
      table.animate({
        opacity: 0.5
      }, 10, function () {
        table.animate({
          opacity: 1
        }, 500);
      });
    }
    table.html(expandLocations(info.Locations));

    var ballotHost = $('table.Ballots');
    if (info.Ballots.length == 0) {
      ballotHost.hide();
    } else {
      ballotHost.show();
      var ballotTable = $('#ballotsBody');
      ballotTable.html(expandBallots(info.Ballots));
    }

    $('#lastRefresh').html(new Date().toLocaleTimeString());

    startAutoMinutes();
    setAutoRefresh();
    $('#mainBody, #ballotsBody').removeClass('Hidden');
  };
  var startAutoMinutes = function () {
    var startTime = new Date();
    $('.minutesOld').each(function () {
      var span = $(this);
      span.data('startTime', startTime);
    });
    settings.autoMinutesTimeout = setInterval(function () {
      updateAutoMinutes();
    }, 15 * 1000);
  };

  var updateAutoMinutes = function () {
    $('.minutesOld').each(function () {
      var span = $(this);
      var start = +span.data('start');
      if (start) {
        var startTime = span.data('startTime');
        var now = new Date();
        var ms = now.getTime() - startTime.getTime();
        span.text(Math.round(ms / 1000 / 6 + start * 10) / 10);
      }
    });
  };

  var setAutoRefresh = function (ev) {
    var wantAutorefresh = $('#chkAutoRefresh').prop('checked');
    clearTimeout(settings.refreshTimeout);

    if (wantAutorefresh) {
      settings.refreshTimeout = setTimeout(function () {
        refresh();
      }, 1000 * $('#ddlRefresh').val());

      if (ev) { // called from a handler
        refresh();
      }
    }
  };

  var updateListing = function () {
    var chk = $('#chkList');
    var form = {
      listOnPage: chk.prop('checked')
    };
    ShowStatusDisplay('Saving...');
    CallAjaxHandler(publicInterface.controllerUrl + '/UpdateListing', form, function () {
      ShowStatusSuccess('Saved');
    });
  };

  var refresh = function () {
    CallAjaxHandler(publicInterface.controllerUrl + '/RefreshMonitor', null, showInfo);
  };

  var expandBallots = function (ballots) {
    var html = [];
    $.each(ballots, function () {
      this.Btn = '<a target=L{LocationId} class=ZoomIn title=View href="../Ballots?l={LocationId}&b={Id}"><span class="ui-icon ui-icon-zoomin"></span></a>'.filledWith(this);

      html.push(settings.rowTemplateBallot.filledWith(this));
    });
    return html.join('');
  };
  var expandLocations = function (locations) {
    var lastName = '';
    var count = 0;
    var rows = -1;
    var last = null;
    var html = [];

    $.each(locations, function () {
      rows++;

      this.Btn = '<a target=L{LocationId} class=ZoomIn title=View href="../Ballots?l={LocationId}"><span class="ui-icon ui-icon-zoomin"></span></a>'.filledWith(this);

      if (this.Name != lastName) {
        if (last != null) {
          last.rows = rows;
          rows = 0;
        }

        count++;
        this.ClassName = count % 2 == 0 ? 'Even' : 'Odd';
        lastName = this.Name;
        last = this;
      } else {
        this.Extra = true;
        this.ClassName = last.ClassName;
      }

      if (this.BallotsCollected) {
        var pct = Math.floor(this.BallotsAtLocation / this.BallotsCollected * 100);
        this.BallotsReport = '{0} of {1} ({2}%)'.filledWith(this.BallotsAtLocation, this.BallotsCollected, pct); // ' of {0} ({1} to go)'.filledWith(this.BallotsCollected, this.BallotsCollected - this.Ballots);
        if (pct > 100) {
          this.BallotsReport = '<span class=error>{^0}</span>'.filledWith(this.BallotsReport);
        }
      } else {
        if (this.BallotsAtLocation) {
          this.BallotsReport = '{0} entered'.filledWith(this.BallotsAtLocation); // ' entered';
        }
      }
      if (!this.TallyStatus) {
        this.TallyStatus = '(status not set)';
      }
    });

    if (last != null) {
      last.rows = rows + 1;
    }

    $.each(locations, function () {
      if (this.Extra) {
        html.push(settings.rowTemplateExtra.filledWith(this));
      }
      else {
        html.push(settings.rowTemplateMain.filledWith(this));
      }
    });

    return html.join('');
  };

  var publicInterface = {
    controllerUrl: '',
    isGuest: false,
    LocationInfos: null,
    PreparePage: preparePage
  };

  return publicInterface;
};

var monitorPage = MonitorPage();

$(function () {
  monitorPage.PreparePage();
});