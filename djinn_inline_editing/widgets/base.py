import json
from django import forms
from django.forms.models import model_to_dict
from django.utils.safestring import mark_safe
from django.template.loader import render_to_string


class InlineRecordsWidget(forms.widgets.Widget):

    """ Marker widget """

    template_name = "widgets/inlinerecords.html"

    def _json(self, value):

        return json.dumps([model_to_dict(obj) for obj in value])

    def render(self, name, value, attrs=None):

        context = {
            'name': name, 
            'widget': self,
            'value': value,
            'value_str': self._json(value)
            }

        context.update(self.attrs)
        
        if attrs:
            context.update(attrs)

        return mark_safe(render_to_string(self.template_name, context))

    @property
    def modelname(self):

        return self.model.__name__
