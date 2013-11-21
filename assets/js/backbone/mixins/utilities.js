// Input:
// @collection [ARRAY] Backbone collection.
// @modelId [INTEGER] Backbone Model.cid

// Return: [OBJECT] Model instance looked up from modelId within collection.
var getCurrentModelFromId = function (collection, modelId) {
	var i = 0;
			id = parseInt(modelId)
			models = collection.models;

	for ( ; i < models.length; i += 1) {
		if (models[i].id === id) {
			return models[i];
		} else {
			continue;
		}
	}
}

// Input:
// @collection [ARRAY] Backbone collection.
// @attr [STRING] Value, to be found.

// Return: [OBJECT] Model instance that is corollary to the found @attr value.
var getCurrentModelFromFormAttributes = function (collection, attr) {
	var	j,
			i = 0,
			attr = $.trim(attr),
			models = collection.models;

	// Loop through all the models
	for ( ; i < models.length; i += 1) {

		// Loop through all the attributes within the model
		for (j in models[i].attributes) {

			// If we find the model.attr[value] on the current models
			// attribute that we are looping over, then stop and return that
			// model back out to the front-end.
			if (models[i].attributes[j] === attr) {
				return models[i]
			} else {
				// Otherwise continue on.
				continue;
			}
		}
	}
}

/**
 * Input:
 * @model [OBJECT* instance] Model instance.
 * @field [OBJECT property] Field you want to focus on for unmarshaling.
 * @splitType [STRING] Split type for marshalling (Eg: ||, -, etc)
 *
 * Return: Nothing; Cleaned @field [OBJECT property] stored in model.value
 */
var cleanStringFromUndefined = function (model, field, splitType) {
  var data, compiledTemplate,
      valueArray              = field.split(splitType),
      lastStringInValueArray  = $.trim(valueArray[valueArray.length - 1]);

  if (lastStringInValueArray === 'undefined') {
    valueArray.pop(lastStringInValueArray)
    model.value = valueArray.join()
  }
}

/**
 * Completely remove a backbone view and all of its
 * references.  This is needed to destroy the view
 * and all of its listeners, in order to start
 * fresh again and render a new view with a new
 * model.
 *
 * Input:
 * @view the view to be removed, typically called with removeView(this);
 *
 * Return:
 * nothing
 */
var removeView = function (view) {
  // view.$el.removeData().unbind();
  // view.remove();
  // Backbone.View.prototype.remove.call(view);
  view.undelegateEvents();
  //view.model.undelegateEvents();
  view.$el.html("");
}

/**
 * Clear out any el.
 * @params {[The non-jquery mapped el for the view instance]}
 * Return: Nothing.
 */
var clearEl = function (el) {
  $(el).children().remove();
}

/**
 * Clear out our global container for full page transitions.
 * @params None
 * @return Nothing
 */
var clearContainer = function () {
  $("#container").children().remove();
}

/**
 * This helps alleviate a common bug with ajax based
 * page transitions. That is sometimes when the page pushes itself off the screen
 * and allows a browser default background to show, after which scrolling
 * up is required.  It is a somewhat rare bug, but useful to have this function
 * if you need it.
 *
 * Return:
 * nothing
 */
var scrollTop = function () {
  $(window).scrollTop($(window).scrollTop());
}

/**
 * Add a method to the global Function object called "addSpinner",
 * which allows us to call the chained method "addSpinner" from any function
 * within the application.  Especially useful with render methods.
 * @param  {[Backbone View Instance]} self
 *
 * Return:
 * Attaches the spinner to the $el of the backbone view instance passed in, before that
 * view can actually set its $el, thereby dynamically allowing a spinner to exist with little effort.
 */
var addSpinnerToFunctionPrototype = function (self) {
  if (self) {
    Function.prototype.addSpinner = function () {
      self.$el.append("<i class='icon-spin icon-spinner'></i>")
    }
  } else {
    throw new Error("Pass in a Backbone View class");
  }
}

/**
 * Organize the tags output into an associative array key'd by their type.
 * If the tag has more than one value for said key, make it an array otherwise
 * keep it as a top level object.
 * @param  {[array]} tags           [array of tags]
 * @param  {[object]} bindingObject [this is the object you want to be returned out to the view to mix in to the template]
 * @return {[object]}               [bindingObject returned out]
 */
var organizeTags = function (tags) {
  var obj     = {},
      outTags = {};

  for (t in tags) {
    if (!(_.has(outTags, tags[t].tag.type))) {
      outTags[tags[t].tag.type] = [];
    }
    outTags[tags[t].tag.type].push(tags[t].tag);
  }

  for (var j in outTags) {
    if (outTags[j].length === 1) {
      var obj = outTags[j].pop();
      outTags[j] = obj
    }
    obj[outTags[j].type] = outTags[j].name;
  }
  return obj;
}