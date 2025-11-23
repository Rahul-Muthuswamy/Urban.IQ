from threaddit import ma
from marshmallow import fields, validate
from threaddit.reports.models import Report


class ReportCreateSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Report
    
    post_id = fields.Int(required=True, validate=validate.Range(min=1))
    reason = fields.Str(required=True, validate=validate.Length(min=10, max=300))


class ReporterSchema(ma.SQLAlchemySchema):
    class Meta:
        model = None 
    
    id = fields.Int(dump_only=True)
    username = fields.Str(dump_only=True)


class ReportSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Report
    
    id = fields.Int(dump_only=True)
    post_id = fields.Int(dump_only=True)
    reporter = fields.Nested(ReporterSchema, dump_only=True)
    reason = fields.Str(dump_only=True)
    status = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

