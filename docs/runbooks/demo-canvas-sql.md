# Demo Canvas Course SQL Setup

The Canvas-style demo courses are inserted as real MySQL records, not frontend-only seeded arrays.

## Tables Used

- `courses`
- `training_modules`
- `lessons`
- `course_module_items`
- `course_resources`

## Demo Courses

1. SFC Field Response Essentials
2. Sarawak Protected Wildlife Awareness
3. SFC Park Guide Orientation

## What V18 Improves

The demo records now look more like real courses instead of short placeholder examples.

Each course includes:

- 5 structured modules
- realistic module objectives
- page, text, image, video, external link, file, checklist, and quiz items
- course-level resource metadata
- longer operational descriptions
- clearer assessment and certificate-readiness flow

## Insert Demo Records

Run from project root:

~~~bash
mysql -u root -p cos30049_assignment < database/demo_canvas_courses.sql
~~~

## Verify Records

~~~bash
mysql -u root -p cos30049_assignment -e "
SELECT
  c.course_id,
  c.course_name,
  COUNT(DISTINCT tm.module_id) AS modules,
  COUNT(DISTINCT cmi.item_id) AS module_items,
  COUNT(DISTINCT cr.resource_id) AS resources,
  c.total_contact_hours AS contact_hours
FROM courses c
LEFT JOIN training_modules tm ON tm.course_id = c.course_id
LEFT JOIN course_module_items cmi ON cmi.course_id = c.course_id
LEFT JOIN course_resources cr ON cr.course_id = c.course_id
WHERE c.course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')
GROUP BY c.course_id, c.course_name, c.total_contact_hours
ORDER BY c.course_id;
"
~~~

Expected result:

~~~text
SFC-FIELD-2026       SFC Field Response Essentials          5   34   2   18
SFC-GUIDE-2026       SFC Park Guide Orientation             5   33   2   14
SFC-WILDLIFE-2026    Sarawak Protected Wildlife Awareness   5   32   2   16
~~~

## Presentation Check Pages

~~~text
http://localhost:5174/admin/course
http://localhost:5174/admin/training
http://localhost:5175/user
~~~

Admin and User pages should load the same records through the backend/API.

## Architecture

~~~text
SQL insert script
↓
MySQL training tables
↓
Admin API and User API
↓
Admin Course Builder, Training Overview, and User Portal
~~~
