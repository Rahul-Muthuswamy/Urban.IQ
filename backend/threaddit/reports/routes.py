from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from threaddit import db
from threaddit.reports.models import Report
from threaddit.reports.schemas import ReportCreateSchema, ReportSchema
from threaddit.posts.models import Posts
from threaddit.auth.decorators import auth_role
from marshmallow import ValidationError as MarshmallowValidationError


reports = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports.route("", methods=["POST"])
@login_required
def create_report():
    try:
        if not request.json:
            return jsonify({"message": "Request body is required"}), 400
        
        schema = ReportCreateSchema()
        validated_data = schema.load(request.json)
        
        post_id = validated_data.get("post_id")
        reason = validated_data.get("reason")
        
        post = Posts.query.get(post_id)
        if not post:
            return jsonify({"message": "Post not found"}), 404
        
        existing_report = Report.query.filter_by(
            post_id=post_id,
            reporter_id=current_user.id,
            status="pending"
        ).first()
        
        if existing_report:
            return jsonify({"message": "You already have a pending report on this post"}), 400
        
        new_report = Report(
            post_id=post_id,
            reporter_id=current_user.id,
            reason=reason,
            status="pending"
        )
        
        db.session.add(new_report)
        db.session.commit()
        
        report_schema = ReportSchema()
        return jsonify(report_schema.dump(new_report)), 201
        
    except MarshmallowValidationError as e:
        error_messages = e.messages
        if isinstance(error_messages, dict):
            first_error = list(error_messages.values())[0]
            if isinstance(first_error, list):
                error_message = first_error[0]
            else:
                error_message = str(first_error)
        else:
            error_message = str(error_messages)
        return jsonify({"message": error_message}), 400
    except Exception as e:
        return jsonify({"message": f"Error creating report: {str(e)}"}), 500


@reports.route("", methods=["GET"])
@login_required
@auth_role(["admin", "mod"])
def get_reports():
    try:
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=20, type=int)
        
        reports_query = Report.query.filter_by(status="pending").order_by(Report.created_at.desc())
        
        paginated_reports = reports_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        report_schema = ReportSchema(many=True)
        reports_data = report_schema.dump(paginated_reports.items)
        
        return jsonify({
            "reports": reports_data,
            "total": paginated_reports.total,
            "page": page,
            "per_page": per_page,
            "pages": paginated_reports.pages
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Error fetching reports: {str(e)}"}), 500


@reports.route("/<int:report_id>/resolve", methods=["PUT"])
@login_required
@auth_role(["admin", "mod"])
def resolve_report(report_id):

    try:
        report = Report.query.get(report_id)
        
        if not report:
            return jsonify({"message": "Report not found"}), 404
        
        if report.status == "resolved":
            return jsonify({"message": "Report is already resolved"}), 400
        
        keep_post = True
        if request.json and "keep_post" in request.json:
            keep_post = request.json.get("keep_post", True)
        
        report.mark_resolved()
        
        report_schema = ReportSchema()
        result = report_schema.dump(report)
        result["keep_post"] = keep_post
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"message": f"Error resolving report: {str(e)}"}), 500

