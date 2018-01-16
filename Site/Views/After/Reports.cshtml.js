﻿var ReportsPage = function () {
  var local = {
    refreshTimeout: null,
    templatesRaw: null,
    reportHolder: null
  };

  var preparePage = function() {
    local.reportHolder = $('#report');

    $('.chooser').on('click', 'a', function () {
      $('.chooser a').removeClass('selected');
      var title = $(this).addClass('selected').text();
      setTimeout(function() {
        getReport(location.hash.substr(1), title);
      }, 0);
    });
  };

  var warningMsg = '<p>Warning: The election is not yet finalized. This report may be incomplete and/or showing wrong information.</p>';

  var getReport = function (code, title) {
    ShowStatusDisplay('Getting report...');
    local.reportHolder.html('<div class=getting>Getting report...</div>');
    $('#Status').hide();
    CallAjaxHandler(publicInterface.controllerUrl + '/GetReportData', { code: code }, showInfo, { code: code, title: title });
  };

  var showInfo = function (info, codeTitle) {
    ResetStatusDisplay();
    if (!info) {
      return;
    }
    if (info.Status != 'ok') {
      $('#Status').text(info.Status).show();
      local.reportHolder.hide();
      return;
    }

    if (info.ElectionStatus != 'Finalized') {
      local.reportHolder.prepend('<div class="status">Report may not be complete (Status: {ElectionStatusText})</div>'.filledWith(info));
    }

    local.reportHolder.removeClass().addClass('Report' + codeTitle.code).fadeIn().html(info.Html);
    console.log('warn', info.Ready, $('div.body.WarnIfNotFinalized').length);
    if (!info.Ready && $('div.body.WarnIfNotFinalized').length) {
      console.log(warningMsg);
      $('#Status').html(warningMsg).show();
    }
    $('#title').text(codeTitle.title);
  };
  
  var publicInterface = {
    controllerUrl: '',
    local: local,
    PreparePage: preparePage
  };

  return publicInterface;
};

var reportsPage = ReportsPage();

$(function () {
  reportsPage.PreparePage();
});