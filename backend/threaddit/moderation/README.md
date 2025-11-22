# Moderation Module

This module provides moderation functionality including post deletion with audit logging and analytics.

## Endpoints

### DELETE /api/mod/posts/<int:post_id>
Delete a post and log deletion in audit history.

**Authentication:** Required (moderator/admin only)

**Query Parameters:**
- `report_id` (optional): Report ID that triggered this deletion

**Request Body (optional):**
```json
{
  "reason": "Optional moderator note/reason for deletion"
}
```

**Response:**
```json
{
  "success": true,
  "post_id": 123,
  "deletion_id": 456
}
```

### GET /api/mod/analytics/summary
Get moderation analytics summary.

**Authentication:** Required (moderator/admin only)

**Response:**
```json
{
  "total_reports": 100,
  "pending_reports": 10,
  "resolved_reports": 90,
  "total_deletions": 5,
  "deletions_last_7_days": [
    {"date": "2024-01-01", "count": 2}
  ],
  "reports_last_7_days": [
    {"date": "2024-01-01", "count": 5}
  ]
}
```

### GET /api/mod/analytics/top_reported_posts
Get top reported posts.

**Authentication:** Required (moderator/admin only)

**Query Parameters:**
- `limit` (optional, default: 10): Number of results

**Response:**
```json
[
  {
    "post_id": 123,
    "title": "Post Title",
    "report_count": 5
  }
]
```

### GET /api/mod/analytics/top_reporters
Get top reporters.

**Authentication:** Required (moderator/admin only)

**Query Parameters:**
- `limit` (optional, default: 10): Number of results

**Response:**
```json
[
  {
    "reporter_id": 456,
    "username": "user123",
    "reports_count": 10
  }
]
```

### GET /api/mod/deletions
Get paginated deletion history with filters.

**Authentication:** Required (moderator/admin only)

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `per_page` (optional, default: 20): Items per page
- `from_date` (optional): Filter deletions from this date (ISO format)
- `to_date` (optional): Filter deletions to this date (ISO format)
- `reporter_id` (optional): Filter by reporter ID
- `author_id` (optional): Filter by original author ID

**Response:**
```json
{
  "deletions": [...],
  "total": 50,
  "page": 1,
  "per_page": 20,
  "pages": 3
}
```

### GET /api/mod/reports
Get reports with additional post and author details.

**Authentication:** Required (moderator/admin only)

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `per_page` (optional, default: 20): Items per page
- `status` (optional, default: "pending"): Filter by status ('pending' or 'resolved')

**Response:**
```json
{
  "reports": [
    {
      "id": 1,
      "post_id": 123,
      "post": {
        "title": "Post Title",
        "author_username": "author123"
      },
      "reporter": {
        "id": 456,
        "username": "reporter123"
      },
      "reason": "Report reason",
      "status": "pending",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

## Models

### DeletionHistory
Stores audit log of deleted posts.

**Fields:**
- `id`: Primary key
- `post_id`: ID of the deleted post
- `deleted_by`: ID of the moderator/admin who deleted
- `reason`: Optional moderator note/reason
- `original_title`: Original post title
- `original_content`: Original post content
- `original_media`: Original post media URL
- `original_author_id`: Original author ID
- `original_author_username`: Original author username
- `created_at`: Original post creation timestamp
- `deleted_at`: Deletion timestamp
- `report_id`: Optional linked report ID

## Usage Notes

- All endpoints require moderator or admin role
- Deletion operations are transactional - if logging fails, post is not deleted
- Deletion history is preserved even when posts are cascade deleted
- Reports are automatically deleted when posts are deleted (CASCADE)

