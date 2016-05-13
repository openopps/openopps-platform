
var fs = require('fs');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseComponent = require('../base/base_component');
var Bootstrap = require('bootstrap');
var PopoverProfile = fs.readFileSync(__dirname + '/templates/popover_profile.html').toString();


var Popovers = BaseComponent.extend({

  popoverPeopleInit: function (target) {
    $(target).popover(
      {
        placement: 'auto top',
        trigger: 'manual',
        html: 'true',
        title: 'load',
        container: 'body',
        content: '<div class="popover-spinner"><div class="loading">Fetching Information</div><i class="fa fa-spinner fa-spin"></i></div>',
        template: '<div class="popover"><div class="arrow"></div><h3 class="popover-title" style="display:none; visibility:hidden"></h3><div class="popover-content"></div></div>'
      }).on("mouseleave", function () {
        var _this = this;
        var timeoutFn = function () {
          if (!$(".popover:hover").length) {
            $(_this).popover("hide");
          } else {
            setTimeout(timeoutFn, 100);
          }
        };
        setTimeout(timeoutFn, 100);
      });
  },

  popoverPeopleOn: function (e) {
    if (e.preventDefault) e.preventDefault();
    var target = $(e.currentTarget);
    var popover = target.data('bs.popover');
    // if the data element isn't set or popovers not init'd, abort
    if ((_.isUndefined(target.data('userid'))) || (_.isUndefined(popover))) {
      console.log('popoverPeopleOn data unavailable:', target.data('userid'));
      return;
    }
    target.popover('show');
    // Only load data if the popover hasn't previously been loaded
    if (popover.options.title == 'load') {
      $.ajax({ url: '/api/user/' + target.data('userid') }).done(function(data) {
        var template = _.template(PopoverProfile)({data: data});
        popover.options.title = 'done';
        popover.options.content = template;
        popover.setContent();
        popover.$tip.addClass(popover.options.placement);
        // handle links in the popovers
        $(".popover").on('click', ".link-backbone", function (e) {
          target.popover('hide');
          linkBackbone(e);
        });
      });
    }
  },

  popoverClick: function (e) {
    if (e.preventDefault) e.preventDefault();
    var id = $(e.currentTarget).data('userid');
    $(e.currentTarget).popover('hide');
    Backbone.history.navigate('profile/' + id, { trigger: true });
  }
});

module.exports = Popovers;
