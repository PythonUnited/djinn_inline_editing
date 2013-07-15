/**
 * Djinn inline editing JS lib.
 */

if (djinn == undefined) {
    var djinn = {};
}


/**
 * Djinn inline editing namespace
 */
djinn.ie = {
  TEMPLATES: {},
  OBJECTMAP: {},
  OBJECTS: {},
  CONTAINERS: {}
};


/**
 * Add object to local objects.
 * @param model Model type
 * @param obj Created object
 */
djinn.ie.addObject = function(model, obj) {

  if (!djinn.ie.OBJECTMAP[model]) {
    djinn.ie.OBJECTMAP[model] = {};
  }

  if (!djinn.ie.OBJECTS[model]) {
    djinn.ie.OBJECTS[model] = 0;
  }

  if (!obj.id) {
    obj.id = model + "_" + djinn.ie.OBJECTS[model];
  }

  djinn.ie.OBJECTS[model]++;
  djinn.ie.OBJECTMAP[model][obj.id] = obj;

  return obj;
};


/**
 * Remove object for the given model and id.
 * @param model Model for object
 * @param id Object id
 */
djinn.ie.rmObject = function(model, id) {

  delete djinn.ie.OBJECTMAP[model][id];
  djinn.ie.OBJECTS[model]--;
};


/**
 * Update object for the given model and object. Object should have id.
 * @param model Model for object
 * @param obj Object
 */
djinn.ie.updateObject = function(model, obj) {

  djinn.ie.OBJECTMAP[model][obj.id] = obj;
};


/**
 * Get the object specified by it's id
 * @param model Model to fetch
 * @param id Object id
 */
djinn.ie.getObject = function(model, id) {
  
  return djinn.ie.OBJECTMAP[model][id];
};


/**
 * Get all objects for model
 * @param model Model to fetch
 */
djinn.ie.getObjects = function(model) {

  objects = []

  for (key in djinn.ie.OBJECTMAP[model]) {
    objects.push(djinn.ie.OBJECTMAP[model][key])
  }

  return objects;
};


/**
 * Render a template using underscore.
 * @param model Model to get template for
 * @param mode Template mode. Usually one of edit, add or view
 * @param data Dict of data
 */
djinn.ie.renderTemplate = function(model, mode, data){
     
  return _.template(djinn.ie.TEMPLATES[model][mode], data);
};


/**
 * Convert form to dict
 * @param form jQuery wrapped form object
 */
djinn.ie.formAsDict = function(form) {

  data = {};
  formdata = form.serializeArray();

  for (var i = 0; i < formdata.length; i++) {
    data[formdata[i].name] = formdata[i].value;
  }

  return data;
};


/**
 * Apply dict to form
 * @param dict Associative array with values
 * @param form jQuery wrapped form object
 */
djinn.ie.dictAsForm = function(dict, form) {

  for (key in dict) {

    form.find("[name='" + key + "']").val(dict[key]);
  }
};


/**
 * Serialize the instances of the given model to JSON.
 * @param model Model
 */
djinn.ie.serializeObjects = function(model) {

  return JSON.stringify(djinn.ie.getObjects(model));
};


/**
 * Update all containers for given model with the snippet.
 * @param model Model
 * @param snippet HTML snippet to use
 * @param id Id of object. If provided, replace, otherise add
 */
djinn.ie.updateContainers = function(model, snippet, id) {

  if (!id) {
    for (var i = 0; i < djinn.ie.CONTAINERS[model].length; i++) {
      djinn.ie.CONTAINERS[model][i].append(snippet);
    }
  } else {
    for (var i = 0; i < djinn.ie.CONTAINERS[model].length; i++) {
      djinn.ie.CONTAINERS[model][i].find("[data-object_id='" + id + "']").
      replaceWith(snippet);
    }
  }
};


$(document).ready(function() {

    // Append form container
    $("body").append('<div id="djinn_ie_form"></div>');

    // Load templates
    $("link[rel='template']").each(function() {

        var link = $(this);

        $.get(link.attr("href"), function(data) {

            if (!djinn.ie.TEMPLATES[link.data("model")]) {
              djinn.ie.TEMPLATES[link.data("model")] = [];
            }
           
            djinn.ie.TEMPLATES[link.data("model")][link.data("mode")] = data;
          });
      });

    // Find all containers and set up model stuff.
    $(".djinn_ie_addable").each(function() {

        var model = $(this).data("model");

        if (!djinn.ie.CONTAINERS.model) {
          djinn.ie.CONTAINERS[model] = [];
        }

        djinn.ie.CONTAINERS[model].push($(this));
      });

    $(document).on("click", ".djinn_ie_rm", function(e) {
        var link = $(e.currentTarget);
        var rec = link.parents(".djinn_ie_editable").eq(0);

        djinn.ie.rmObject(rec.data("model"), rec.data("object_id"));

        $(document).triggerHandler("djinn_ie_rm_object", 
                                   [rec.data("model"), 
                                    rec.data("object_id")]);

        rec.remove();
      });

    $(document).on("click", ".djinn_ie_edit", function(e) {
        var link = $(e.currentTarget);
        var rec = link.parents(".djinn_ie_editable").eq(0);
        var model = rec.data("model");

        var obj = djinn.ie.getObject(model, rec.data("object_id"));

        $("#djinn_ie_form").css("left", link.offset().left - 100);
        $("#djinn_ie_form").css("top", link.offset().top);
        $("#djinn_ie_form").html(djinn.ie.renderTemplate(model, "edit", obj));
        $("#djinn_ie_form form").data("model", model);
        $("#djinn_ie_form form").data("object_id", obj.id);

        djinn.ie.dictAsForm(obj, $("#djinn_ie_form form"));

        $("#djinn_ie_form").show();

        e.preventDefault();
      });

    $(".djinn_ie_objects").each(function() {

        var objects = JSON.parse($(this).val());
        var model = $(this).data("model");

        for (var i= 0; i < objects.length; i++) {
          djinn.ie.addObject(model, objects[i]);
        }
      });

    $(".djinn_ie_add_object").click(function(e) {

        var link = $(e.currentTarget);
        var model = link.data("model");

        $("#djinn_ie_form").css("left", link.offset().left);
        $("#djinn_ie_form").css("top", link.offset().top);
        $("#djinn_ie_form").html(djinn.ie.renderTemplate(model, "add", {}));

        $("#djinn_ie_form form").data("model", model);

        $("#djinn_ie_form").show();

        e.preventDefault();
      });

    $(document).on("submit", "#djinn_ie_form form", function(e) {

        var form = $(e.currentTarget);
        var obj = djinn.ie.formAsDict($(e.currentTarget));
        var model = $(e.currentTarget).data("model");

        if (form.data("object_id")) {
          obj.id = form.data("object_id");
          djinn.ie.updateObject(model, obj);

          var snippet = djinn.ie.renderTemplate(model, "view", obj);

          djinn.ie.updateContainers(model, snippet, obj.id);
          
          $(document).triggerHandler("djinn_ie_update_object", [model, obj]);
        } else {
          djinn.ie.addObject(model, obj);

          var snippet = djinn.ie.renderTemplate(model, "view", obj);

          djinn.ie.updateContainers(model, snippet);

          $(document).triggerHandler("djinn_ie_add_object", [model, obj]);
        }

        $("#djinn_ie_form").hide();
        $("#djinn_ie_form").html("");

        return false;
      });

    $(document).on("click", "#djinn_ie_form [type='button']", function(e) {
        $("#djinn_ie_form").hide();
        $("#djinn_ie_form").html("");
      });

    $(document).on("click", ".djinn_ie_editable", function(e) {

        var rec = $(e.currentTarget);

        rec.siblings().removeClass("selected");
        rec.toggleClass("selected");

        $(document).triggerHandler(
                                   "djinn_ie_select_object", 
                                   [rec.data("model"), 
                                    rec.data("object_id"),
                                    rec.hasClass("selected")]);
      });
  });
