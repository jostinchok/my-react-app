# Demo Canvas Course SQL Setup

The three Canvas-style demo courses are inserted as real MySQL records, not frontend-only seeded arrays.

## Tables Used

- `courses`
- `training_modules`
- `lessons`
- `course_module_items`

## Demo Courses

1. SFC Field Response Essentials
2. Sarawak Protected Wildlife Awareness
3. SFC Park Guide Orientation

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
  COUNT(DISTINCT cmi.item_id) AS module_items
FROM courses c
LEFT JOIN training_modules tm ON tm.course_id = c.course_id
LEFT JOIN course_module_items cmi ON cmi.course_id = c.course_id
WHERE c.course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')
GROUP BY c.course_id, c.course_name
ORDER BY c.course_id;
"
~~~

Expected result:

~~~text
SFC-FIELD-2026       SFC Field Response Essentials          3   16
SFC-GUIDE-2026       SFC Park Guide Orientation             3   18
SFC-WILDLIFE-2026    Sarawak Protected Wildlife Awareness   3   12
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
