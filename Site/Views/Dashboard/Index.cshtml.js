﻿var dashboardIndex = function () {
    var localSettings = {
    };
    var publicInterface = {
        elections: [],
        electionsUrl: '',
        PreparePage: function () {
            site.onbroadcast(site.broadcastCode.electionStatusChanged, function (ev, info) {
                if (info.StateName) {
                  $('.features a, .mmSection a').each(function () {
                    var target = $(this);
                    var when = target.data('when');
                    var matched = when.search(info.StateName) != -1 || when == 'OnDash';
                    target.toggleClass('Featured', matched);
                    target.toggleClass('NotFeatured', !matched);
                  });
                }
            });
        }
    };

    return publicInterface;
};

var dashboardIndexPage = dashboardIndex();

$(function () {
  dashboardIndexPage.PreparePage();
});