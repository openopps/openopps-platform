// Nav Secondary
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

var NavSecondaryView = Backbone.View.extend({

  initialize: function (options) {
    this.nav_secondary = $('[data-object="nav-secondary"]');
    this.fixed_nav = $('[data-behavior="is-fixed-nav"]');
    $(window).on('resize', _.throttle(this.toggleNav.bind(this), 250));
    _.delay(this.toggleNav.bind(this), 100);
  },

  render: function () {
    return this;
  },

  navSecondaryToggleMenuItems: function () {
    var nav_width = 0;
    var $menu = this.nav_secondary.find('ul.usajobs-nav-secondary__menu');
    var $more_menu = $menu.find('.more');
    var $more_container = this.nav_secondary.find(this.nav_secondary.attr('data-target'));
    var more_width = $more_menu.outerWidth(true);
    var available_space = this.nav_secondary.outerWidth(true) - more_width;
    var last_item;
    var first_more_el;
    var elem_width;

    $('ul.usajobs-nav-secondary__menu > li:not(.more)').each(function () {
      nav_width += $(this).outerWidth( true );
    });
    
    if (nav_width > available_space) {
      last_item = $('ul.usajobs-nav-secondary__menu > li:not(.more)').last();
      elem_width = $(last_item).outerWidth(true);
      last_item.prependTo($more_container);
      if((nav_width - elem_width) > available_space) {
        this.navSecondaryToggleMenuItems.bind(this)();
      }
    } else if ($more_menu.find('li').length > 0) {
      first_more_el = $more_menu.find('li').first();
      elem_width = $(first_more_el).outerWidth(true);

      if ((nav_width + elem_width) < available_space) {
        first_more_el.insertBefore($more_menu);
        this.navSecondaryToggleMenuItems.bind(this)();
      }
    }

    if ($more_menu.find('li').length > 0) {
      $more_menu.css('display','inline-block');
    } else {
      $more_menu.css('display','none');
    }
  },
    
  updateActiveNav: function () {
    var scroll_position = $(document).scrollTop(),
        fixed_nav = this.fixed_nav.length > 0,
        $links = this.nav_secondary.find('[data-behavior="nav-secondary.scroll-to-top nav-secondary.make-active"]');

    if (fixed_nav) {
      $links.each(function () {
        var $link = $(this),
            $section = $($link.attr('href'));

        if ($section.position().top <= scroll_position &&
                    $section.position().top + $section.height() > scroll_position) {
          $links.removeClass('is-active');
          $link.addClass('is-active');
        } else {
          $link.removeClass('is-active');
        }
      });
    }
  },

  // Toggle Secondary Nav items on resize
  toggleNav: function () {
    if (this.nav_secondary !== undefined && this.nav_secondary.length > 0) {
      this.navSecondaryToggleMenuItems();
    }
  },

  menuClick: function (event) {
    var $el = $(this),
        $object = $el.closest('[data-object="nav-secondary"]'),
        behavior = $el.attr('data-behavior'),
        $target = $object.find($object.attr('data-target')),
        state = $target.attr('data-state');

    event.preventDefault();
    $el.blur(); // Removes focus

    // Each behavior attached to the element should be triggered
    $.each(behavior.split(' '), function (idx, action) {
      $el.trigger(action, { el: $el, object: $object, state: state, target: $target });
    });
  },

  menuToggle: function () {
    var menu = $('.usajobs-nav-secondary__more-container');
    if (menu.attr('data-state') === 'is-closed') {
      menu.attr('data-state', 'is-open');
    } else {
      menu.attr('data-state', 'is-closed');
    }
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = NavSecondaryView;