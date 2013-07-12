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

  $(document).triggerHandler("djinn_ie_add_object", [model, obj]);

  return obj;
};


djinn.ie.rmObject = function(model, id) {

  delete djinn.ie.OBJECTMAP[model][id];
  djinn.ie.OBJECTS[model]--;

  $(document).triggerHandler("djinn_ie_rm_object", [model]);
};


djinn.ie.getObject = function(model, id) {
  
  return djinn.ie.OBJECTMAP[model][id];
};


djinn.ie.getObjects = function(model) {

  objects = []

  for (key in djinn.ie.OBJECTMAP[model]) {
    objects.push(djinn.ie.OBJECTMAP[model][key])
  }

  console.log(objects);
  
  return objects;
};


/**
 * Render a template using underscore.
 * @param tplId Template unique id
 * @param data Dict of data
 */
djinn.ie.renderTemplate = function(model, mode, data){
     
  return _.template(djinn.ie.TEMPLATES[model][mode], data);
};


/**
 * Serialize form to dict
 * @param form jQuery wrapped form object
 */
djinn.ie.serializeForm = function(form) {

  data = {};
  formdata = form.serializeArray();

  for (var i = 0; i < formdata.length; i++) {
    data[formdata[i].name] = formdata[i].value;
  }

  return data;
};


/**
 * Serialize the instances of the given model to JSON.
 * @param model Model
 */
djinn.ie.serializeObjects = function(model) {

  return JSON.stringify(djinn.ie.getObjects(model));
}


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

        rec.remove();
      });

    $(".djinn_ie_objects").each(function() {

        var objects = JSON.parse($(this).val());
        var model = $(this).data("model");

        console.log(objects);
        
        for (var i= 0; i < objects.length; i++) {
          djinn.ie.addObject(model, objects[i]);
        }
      });

    $(".djinn_ie_add_object").click(function(e) {

        var link = $(e.currentTarget);
        var model = link.data("model");

        $("#djinn_ie_form").css("left", "0px");
        $("#djinn_ie_form").css("top", "0px");
        $("#djinn_ie_form").offset($(link.attr("href")).offset());

        $("#djinn_ie_form").html(djinn.ie.TEMPLATES[model]["add"]);
        $("#djinn_ie_form").find("form.djinn_ie_inline").data("model", model);

        $("#djinn_ie_form").show();

        e.preventDefault();
      });

    $(document).on("submit", "form.djinn_ie_inline", function(e) {

        var obj = djinn.ie.serializeForm($(e.currentTarget));
        var model = $(e.currentTarget).data("model");

        djinn.ie.addObject(model, obj);

        for (var i = 0; i < djinn.ie.CONTAINERS[model].length; i++) {
          djinn.ie.CONTAINERS[model][i].append(djinn.ie.renderTemplate(model, "view", obj));
        }

        $("#djinn_ie_form").hide();
        $("#djinn_ie_form").html("");

        return false;
      });

    $(document).on("click", "form.djinn_ie_inline [type='button']", function(e) {
        $("#djinn_ie_form").hide();
        $("#djinn_ie_form").html("");
      });

  });
