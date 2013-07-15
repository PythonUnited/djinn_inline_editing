from djinn_core.utils import implements
from djinn_inline_editing.fields.base import InlineRecordsField


class InlineRecordsMixin(object):

    """ Save inlines as well """

    def __init__(self, *args, **kwargs):

        super(InlineRecordsMixin, self).__init__(*args, **kwargs)
        
        for fieldname, field in self.inline_fields.items():
            field.parent = self.instance

            fieldvalue = []
            _filter = {field.fkfield: self.instance}

            for obj in field.model.objects.filter(**_filter):
                fieldvalue.append(obj)
            self.initial[fieldname] = fieldvalue

    @property
    def inline_fields(self):

        return dict((k, v) for k, v in self.fields.items() if 
                    implements(v, InlineRecordsField))

    def save(self, commit=True):

        obj = super(InlineRecordsMixin, self).save(commit=commit)
    
        for field in self.inline_fields:

            keep = []

            for inline_obj in self.cleaned_data[field]:
                inline_obj.save()
                keep.append(inline_obj.id)

            # Delete records that are not in new data
            for inline_obj in self.initial[field]:

                if not inline_obj.id in keep:
                    inline_obj.delete()

        return obj
