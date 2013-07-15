import json
from django.forms.fields import Field
from django.forms import models as model_forms
from djinn_inline_editing.widgets.base import InlineRecordsWidget


class InlineRecordsField(Field):

    model = None
    widget = InlineRecordsWidget
    parent = None
    fkfield = None

    def __init__(self, model, fkfield, **kwargs):

        if "form" in kwargs.keys():
            self.form = kwargs['form']
            del kwargs['form']
        else:
            self.form = model_forms.modelform_factory(model)

        super(InlineRecordsField, self).__init__(**kwargs)
        
        self.widget.model = model
        self.widget.field = self
        self.model = model
        self.fkfield = fkfield

    def to_python(self, value):

        """ Return Python values. The value should be a JSON string that
        holds a list of object values as dict.
        """

        if not value:
            return []

        objects = []

        for elt in json.loads(value):

            elt[self.fkfield] = self.parent.pk

            try:
                instance = self.model.objects.get(pk=elt['id'])
            except:
                instance = None

            form = self.form(data=elt, instance=instance)

            objects.append(form.save(commit=False))

        return objects
