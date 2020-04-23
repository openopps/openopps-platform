var $ = require('jquery');

var keywordAC = $.widget('custom.keywordAC', $.ui.autocomplete, {
  _create: function () {
    this._super();
    this.widget().menu('option', 'items', '> :not(.ui-autocomplete-category)');
  },
  _renderMenu: function (ul, items) {
    ul.addClass('profiles-search-keywords-autocomplete');
    var currentCategory = '',
        header = '<li class="ui-autocomplete-close-header">Close &nbsp;&nbsp;&times;</li>',
        $header = $(header);

    $.each(items, function (index, item) {
      var li;
      if (item.type !== currentCategory) {
        ul.append('<li class="ui-autocomplete-category ' + item.type + ' ">' + item.type + '</li>');
        currentCategory = item.type;
      }
      li = this._renderItemData(ul, item);
    }.bind(this));
  },
  _renderItem: function (ul, item) {
    return $('<li>')
      .addClass(item.type)
      .attr('data-value', item.value)
      .append($('<a>').html(item.label))
      .appendTo(ul);
  },
});

var locationAC = $.widget('custom.locationAC', $.ui.autocomplete, {
  _create: function () {
    this._super();
    this.widget().menu('option', 'items', '> :not(.ui-autocomplete-category)');
  },
  _renderMenu: function (ul, items) {
    ul.addClass('usajobs-search-location-autocomplete');
    var that = this,
        currentCategory = '',
        header = '<li class="ui-autocomplete-close-header">Close &nbsp;&nbsp;&times;</li>',
        $header = $(header);

    $.each(items, function (index, item) {
      var li;
      if (item.type !== currentCategory) {
        ul.append('<li class="ui-autocomplete-category ' + item.type + ' ">' + item.type + '</li>');
        currentCategory = item.type;
      }
      li = that._renderItemData(ul, item);
      if (item.Type) {
        li.attr('aria-label', item.type + ' : ' + item.value);
      }
    });
  },
  _renderItem: function (ul, item) {
    return $('<li>')
      .addClass(item.type)
      .attr('data-value', item.value)
      .append($('<a>').html(item.label))
      .appendTo(ul);
  },
});