//# sourceURL=select2-3.4.6.custom.js

(function (originalSelect2) {
  var CUSTOM_STATUS_ATTRIBUTE_NAME = 'data-custom-select2-status-id';
  var CUSTOM_STATUS_ID_PREFIX = 'customSelect2Status';
  var elementsWithChangeEvents = [];

  $.fn.select2 = function () {
    // When wrapping $.fn.select2, we need to fetch the defaults from the original
    $.fn.select2.defaults = originalSelect2.defaults;
    $.fn.select2.ajaxDefaults = originalSelect2.ajaxDefaults;

    var select2 = originalSelect2.apply(this, arguments);

    if ($(select2).length > 0) {
      $(select2).each(function (index, element) {
        attachChangeEvent(element);
          
        var labelText = getLabelText(element);

        if (isMultiSelect(element) || isHiddenInput(element)) {
          // Create an aria-live element to which we can push status update messages
          createCustomSelect2StatusElement(element);

          var $selectedOptionsList = getSelect2Container(element).children('ul.select2-choices').first();
          var $selectedOptions = $selectedOptionsList.children('li.select2-search-choice');
          
          updateMultiSelectAndSelectedOptions($selectedOptionsList, labelText, $selectedOptions);

          var $selectedOptionsSearch = $selectedOptionsList.children('li.select2-search-field').children('input.select2-input');
          $selectedOptionsSearch.prev('label').text('Search');
        } else if (isSingleSelect(element)) {
          var $select2Element = getSelect2Element(element);
          var select2AutoGenNumber = getSelect2AutoGenNumber($select2Element);

          if (select2AutoGenNumber !== null) {
            var selectedItemText = $select2Element.siblings('a.select2-choice').find('span.select2-chosen').text().trim();
            var combinedLabelAndItemText = combineLabelAndSelectedItemText(labelText, selectedItemText);

            // Replace the existing aria-labelledby attribute on the primary Select2 element with a custom aria-label
            // Also, inform screen readers that the primary Select2 element is a collapsed combobox that owns the appropriate results list
            $select2Element.attr({'role': 'combobox', 'aria-label': combinedLabelAndItemText, 'aria-expanded': 'false'});
            $select2Element.removeAttr('aria-labelledby');

            // Hide the empty links (for blank selections) from screen readers to prevent accessibility violations
            $select2Element.siblings('a.select2-choice').attr('aria-hidden', 'true');
          }
        }

        // The original select elements should be hidden from screen readers
        $(element).attr('aria-hidden', 'true');
      });
    }

    return select2;
  };

  $(document).on('select2-open', function (e) {
    if (isMultiSelect(e.target) || isHiddenInput(e.target)) {
      var $resultsLists = $('div.select2-drop-multi.select2-drop-active ul.select2-results');

      $resultsLists.attr({ 'role': 'listbox', 'aria-label': 'Options', 'tabindex': '0' });
      $resultsLists.find('ul.select2-result-sub').attr('role', 'group');
    } else if (isSingleSelect(e.target)) {
      var $select2Element = getSelect2Element(e.target);
      var select2AutoGenNumber = getSelect2AutoGenNumber($select2Element);

      if (select2AutoGenNumber !== null) {
        var $select2ResultsList = $('#select2-results-' + select2AutoGenNumber);
        var $select2ResultsSearch = $select2ResultsList.siblings('div.select2-search').find('input.select2-input');
        $select2Element.attr({'aria-owns': 'select2-results-' + select2AutoGenNumber});

        $select2Element.attr('aria-expanded', 'true');
        $select2ResultsList.attr({ 'aria-label': 'Options', 'tabindex': '0' });
        $select2ResultsSearch.attr('role', 'textbox');
        $select2ResultsSearch.removeAttr('aria-owns aria-expanded');
      }
    }
  });

  $(document).on('select2-close', function (e) {
    if (isSingleSelect(e.target)) {
      var $select2Element = getSelect2Element(e.target);
      $select2Element.attr('aria-expanded', 'false');
      $select2Element.removeAttr('aria-owns');
    }
  });

  $(document).on('select2-loaded', function (e) {
    if (isSingleSelect(e.target)) {
      var $select2Element = getSelect2Element(e.target);
      var select2AutoGenNumber = getSelect2AutoGenNumber($select2Element);

      if (select2AutoGenNumber !== null) {
        $('#select2-results-' + select2AutoGenNumber + ' li.select2-more-results').attr('role', 'presentation');
      }
    }
  });

  $(document).on('keydown', 'a.select2-search-choice-close', function (e) {
    // Make the remove selection "x" keyboard accessible (enter and space)
    if (e.keyCode === 13 || e.keyCode === 32) {
      e.preventDefault();
      $(e.target).click();
    }
  });

  $(document).on('blur', 'div.select2-container ul.select2-choices li.select2-search-choice:first', function (e) {
    $(e.target).parents('div.select2-container').first().removeClass('select2-container-active');
  });

  function attachChangeEvent (element) {
    // Select2 v3.4.6 doesn't have a -selected event, so we have to attach a change handler to each element
    if (arrayIncludes(elementsWithChangeEvents, element)) {
      return;
    }

    $(element).on('change', function (e) {
      var changeType = null;
      if (typeof e.added !== 'undefined' && e.added !== null) {
        changeType = 'add';
      } else if (typeof e.removed !== 'undefined' && e.removed !== null) {
        changeType = 'remove';
      } else {
        return;
      }

      var labelText = getLabelText(e.target);

      if (isMultiSelect(e.target) || isHiddenInput(e.target)) {
        var $selectedOptionsList = getSelect2Container(e.target).children('ul.select2-choices').first();
        var $selectedOptions = $selectedOptionsList.children('li.select2-search-choice');

        updateMultiSelectAndSelectedOptions($selectedOptionsList, labelText, $selectedOptions);

        if (changeType === 'add') {
          updateCustomSelect2StatusElement(e.target, 'Option ' + e.added.value + ' selected. Total number of selected options: ' + $selectedOptions.length);
        } else {
          updateCustomSelect2StatusElement(e.target, 'Option ' + e.removed.value + ' removed. Total number of selected options: ' + $selectedOptions.length);
        }
      } else if (isSingleSelect(e.target)) {
        if (changeType === 'add') {
          var $select2Element = getSelect2Element(e.target);
  
          // When the selection is changed, the custom aria-label value needs to be updated to reflect it
          var selectedItemText = e.added.text;
          var combinedLabelAndItemText = combineLabelAndSelectedItemText(labelText, selectedItemText);

          $select2Element.attr('aria-label', combinedLabelAndItemText);
          $select2Element.removeAttr('aria-labelledby');
        }
      }
    });

    elementsWithChangeEvents.push(element);
  }

  function updateMultiSelectAndSelectedOptions ($selectedOptionsList, labelText, $selectedOptions) {
    var combinedLabelAndSelectedOptionsCount = combineLabelAndSelectedOptionsCount(labelText, $selectedOptions.length);

    $selectedOptionsList.attr('aria-label', combinedLabelAndSelectedOptionsCount);
    $selectedOptions.children('a.select2-search-choice-close').children('.usa-sr-only').remove();
    $selectedOptions.children('a.select2-search-choice-close')
      .attr({ 'tabindex': 0, 'role': 'button' }).each(function () {
        $(this).append('<span class="usa-sr-only">Remove ' + labelText +  ' ' + this.parentElement.innerText + '</span>');
      });
  }

  function createCustomSelect2StatusElement (baseElement) {
    var customSelect2StatusElementId = getCustomSelect2StatusElementId(baseElement);
    if (customSelect2StatusElementId === null) {
      customSelect2StatusElementId = addCustomSelect2StatusElementId(baseElement);
    }

    var customSelect2StatusElement = document.getElementById(customSelect2StatusElementId);
    if (customSelect2StatusElement === null) {
      $(baseElement).after('<span id="' + customSelect2StatusElementId + '" role="status" class="sr-only" aria-live="polite"></span>');
    }
  }

  function updateCustomSelect2StatusElement (baseElement, text) {
    var customSelect2StatusElementId = getCustomSelect2StatusElementId(baseElement);

    if (customSelect2StatusElementId !== null) {
      $('#' + customSelect2StatusElementId).text(text);
    }
  }

  function getCustomSelect2StatusElementId (baseElement) {
    var customSelect2StatusElementId = $(baseElement).attr(CUSTOM_STATUS_ATTRIBUTE_NAME);

    if (typeof customSelect2StatusElementId !== 'undefined' && customSelect2StatusElementId !== false && customSelect2StatusElementId.length > 0) {
      return customSelect2StatusElementId;
    }

    return null;
  }

  function addCustomSelect2StatusElementId (baseElement) {
    var numberOfExistingStatusElements = $('span[id^="' + CUSTOM_STATUS_ID_PREFIX + '"]').length;
    var newCustomSelect2StatusElementId = CUSTOM_STATUS_ID_PREFIX + (numberOfExistingStatusElements + 1);

    $(baseElement).attr(CUSTOM_STATUS_ATTRIBUTE_NAME, newCustomSelect2StatusElementId);

    return newCustomSelect2StatusElementId;
  }

  function getSelect2Element (baseElement) {
    return getSelect2Container(baseElement).find('input.select2-focusser').first();
  }

  function getSelect2Container (baseElement) {
    return $(baseElement).siblings('div.select2-container');
  }

  function getSelect2AutoGenNumber ($select2Element) {
    var $select2ChosenElement = $select2Element.siblings('a.select2-choice').find('span.select2-chosen').first();
    if ($select2ChosenElement.length === 0) {
      return null;
    }

    var select2AutoGenId = getAttributeValue($select2ChosenElement, 'id');
    if (select2AutoGenId === null) {
      return null;
    }

    return select2AutoGenId.split('-')[2];
  }

  function getLabelText (baseElement) {
    // TODO:  In the future, consider following the rules for computing accessible names more closely.
    //          https://www.w3.org/TR/accname-1.1/

    var labelText = null;

    // 1. aria-labelledby
    labelText = getAriaLabelledByText(baseElement);
    if (labelText !== null) {
      return labelText;
    }

    // 2. aria-label
    labelText = getAriaLabelText(baseElement);
    if (labelText !== null) {
      return labelText;
    }

    // 3. <label for="">
    labelText = getLabelForText(baseElement);
    if (labelText !== null) {
      return labelText;
    }

    // 4. contained by <label>
    labelText = getContainingLabelText(baseElement);
    if (labelText !== null) {
      return labelText;
    }

    // 5. aria-describedby
    //      NOTE: This is for compatibility with existing elements ONLY and should not be used otherwise.
    //            This should be removed as soon as possible.
    labelText = getAriaDescribedByText(baseElement);
    if (labelText !== null) {
      return labelText;
    }

    return 'Unlabeled';
  }

  function getAriaLabelledByText (element) {
    var ariaLabelledByIds = getAttributeValue(element, 'aria-labelledby');
    if (ariaLabelledByIds === null || ariaLabelledByIds.trim().length === 0) {
      return null;
    }

    var splitAriaLabelledByIds = ariaLabelledByIds.trim().split(/\s+/);
    if (splitAriaLabelledByIds.length === 1) {
      var ariaLabelledByElement = document.getElementById(splitAriaLabelledByIds[0]);
      if (ariaLabelledByElement === null) {
        return null;
      }

      if (!isVisibleToScreenReaders(ariaLabelledByElement)) {
        return null;
      }

      var $labelContents = $(ariaLabelledByElement).clone();
      $labelContents.find('*').remove('[aria-hidden="true"]');

      var labelText = $labelContents.text().trim();
      if (labelText.length === 0) {
        return null;
      }

      return labelText;
    } else {
      var currentAriaLabelledByElement = null;
      var $currentLabelContents = null;
      var currentLabelText = '';
      var combinedLabelText = '';

      for (var i = 0; i < splitAriaLabelledByIds.length; i++) {
        currentAriaLabelledByElement = document.getElementById(splitAriaLabelledByIds[i]);
        if (currentAriaLabelledByElement === null) {
          continue;
        }

        if (!isVisibleToScreenReaders(currentAriaLabelledByElement)) {
          continue;
        }

        $currentLabelContents = $(currentAriaLabelledByElement).clone();
        $currentLabelContents.find('*').remove('[aria-hidden="true"]');

        currentLabelText = $currentLabelContents.text();
        if (currentLabelText.length > 0) {
          combinedLabelText += currentLabelText;
        }
      }

      if (combinedLabelText.trim().length === 0) {
        return null;
      }

      return combinedLabelText.trim();
    }
  }

  function getAriaLabelText (element) {
    var ariaLabelText = getAttributeValue(element, 'aria-label');
    if (ariaLabelText === null || ariaLabelText.trim().length === 0) {
      return null;
    }

    return ariaLabelText.trim();
  }

  function getLabelForText (element) {
    var elementId = getAttributeValue(element, 'id');
    if (elementId === null) {
      return null;
    }

    var labelForElement = document.querySelector('label[for="' + elementId + '"]');
    if (labelForElement === null) {
      return null;
    }

    if (!isVisibleToScreenReaders(labelForElement)) {
      return null;
    }

    var $labelContents = $(labelForElement).clone();
    $labelContents.find('*').remove('select');
    $labelContents.find('*').remove('input');
    $labelContents.find('*').remove('[aria-hidden="true"]');
    $labelContents.find('*').remove('span[id^="' + CUSTOM_STATUS_ID_PREFIX + '"]');
    $labelContents.find('*').remove('div.select2-container');

    var labelText = $labelContents.text().trim();
    if (labelText.length === 0) {
      return null;
    }

    return labelText;
  }

  function getContainingLabelText (element) {
    var $containingLabelElement = $(element).parent('label');
    if ($containingLabelElement.length === 0) {
      return null;
    }

    if (!isVisibleToScreenReaders($containingLabelElement)) {
      return null;
    }

    var $labelContents = $containingLabelElement.clone();
    $labelContents.find('*').remove('select');
    $labelContents.find('*').remove('input');
    $labelContents.find('*').remove('[aria-hidden="true"]');
    $labelContents.find('*').remove('span[id^="' + CUSTOM_STATUS_ID_PREFIX + '"]');
    $labelContents.find('*').remove('div.select2-container');

    var labelText = $labelContents.text().trim();
    if (labelText.length === 0) {
      return null;
    }

    return labelText;
  }

  function getAriaDescribedByText (element) {
    var ariaDescribedByIds = getAttributeValue(element, 'aria-describedby');
    if (ariaDescribedByIds === null || ariaDescribedByIds.trim().length === 0) {
      return null;
    }

    var splitAriaDescribedByIds = ariaDescribedByIds.trim().split(/\s+/);
    if (splitAriaDescribedByIds.length === 1) {
      var ariaDescribedByElement = document.getElementById(splitAriaDescribedByIds[0]);
      if (ariaDescribedByElement === null) {
        return null;
      }

      if (!isVisibleToScreenReaders(ariaDescribedByElement)) {
        return null;
      }

      var $labelContents = $(ariaDescribedByElement).clone();
      $labelContents.find('*').remove('[aria-hidden="true"]');

      var labelText = $labelContents.text().trim();
      if (labelText.length === 0) {
        return null;
      }

      return labelText;
    } else {
      var currentAriaDescribedByElement = null;
      var $currentLabelContents = null;
      var currentLabelText = '';
      var combinedLabelText = '';
        
      for (var i = 0; i < splitAriaDescribedByIds.length; i++) {
        currentAriaDescribedByElement = document.getElementById(splitAriaDescribedByIds[i]);
        if (currentAriaDescribedByElement === null) {
          continue;
        }

        if (!isVisibleToScreenReaders(currentAriaDescribedByElement)) {
          continue;
        }
        
        $currentLabelContents = $(currentAriaDescribedByElement).clone();
        $currentLabelContents.find('*').remove('[aria-hidden="true"]');

        currentLabelText = $currentLabelContents.text();
        if (currentLabelText.length > 0) {
          combinedLabelText += currentLabelText;
        }
      }

      if (combinedLabelText.trim().length === 0) {
        return null;
      }

      return combinedLabelText.trim();
    }
  }

  function combineLabelAndSelectedOptionsCount (labelText, selectedOptionsCount) {
    if (selectedOptionsCount === 0) {
      labelText = labelText + ': No items currently selected';
    } else if (selectedOptionsCount === 1) {
      labelText = labelText + ': 1 item currently selected';
    } else {
      labelText = labelText + ': ' + selectedOptionsCount + ' items currently selected';
    }

    return labelText;
  }

  function combineLabelAndSelectedItemText (labelText, selectedItemText) {
    if (selectedItemText !== null && selectedItemText.length > 0) {
      labelText = labelText + ': ' + selectedItemText;
    } else {
      labelText = labelText + ': Blank';
    }

    return labelText;
  }

  function isSelectElement (element) {
    if (element.tagName === 'SELECT') {
      return true;
    }

    return false;
  }

  function isSingleSelect (element) {
    if (isSelectElement(element) && element.multiple === false) {
      return true;
    }

    var select2TypeAttributeValue = getAttributeValue(element, 'select2-type');
    if (select2TypeAttributeValue !== null && select2TypeAttributeValue === 'single') {
      return true;
    }

    return false;
  }

  function isMultiSelect (element) {
    if (isSelectElement(element) && element.multiple === true) {
      return true;
    }

    return false;
  }

  function isHiddenInput (element) {
    if (element.tagName === 'INPUT' && element.type === 'hidden') {
      return true;
    }

    return false;
  }

  function getAttributeValue (element, attributeName) {
    var attributeValue = $(element).attr(attributeName);

    if (!attributeValueExists(attributeValue)) {
      return null;
    }

    return attributeValue;
  }

  function attributeValueExists (attributeValue) {
    if (typeof attributeValue === 'undefined' || attributeValue === false || attributeValue.length === 0) {
      return false;
    }

    return true;
  }

  function isVisibleToScreenReaders (element) {
    var ariaHiddenAttributeValue = getAttributeValue(element, 'aria-hidden');
    if (ariaHiddenAttributeValue !== null && ariaHiddenAttributeValue === 'true') {
      return false;
    }

    // NOTE:
    //  Ideally, we would also check for the element's visibility - the problem is that we don't have
    //  a good way to watch for dynamic visibility changes.  For example, it's fairly common for elements
    //  to be hidden until certain conditions are met.  If a select element and its associated label were
    //  both hidden when Select2 was initialized, we wouldn't be able to create a custom aria-label.

    return true;
  }

  function arrayIncludes (array, obj) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === obj) {
        return true;
      }
    }

    return false;
  }
})($.fn.select2);