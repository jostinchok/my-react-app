-- COS30049 CTIP Canvas-style demo course records
-- This file inserts demo courses into the real MySQL training tables.
-- It replaces frontend-only seeded arrays with database table records.
--
-- Run:
--   mysql -u root -p cos30049_assignment < database/demo_canvas_courses.sql

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM canvas_quiz_attempts
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM canvas_item_progress
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM course_module_items
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM lessons
WHERE module_id IN (
  SELECT module_id FROM training_modules
  WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')
);

DELETE FROM progress
WHERE module_id IN (
  SELECT module_id FROM training_modules
  WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')
);

DELETE FROM certifications
WHERE module_id IN (
  SELECT module_id FROM training_modules
  WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')
);

DELETE FROM course_enrollments
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM course_resources
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM training_modules
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM courses
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: localhost    Database: cos30049_assignment
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- GTID state at the beginning of the backup 
--


--
-- Dumping data for table `courses`
--
-- WHERE:  course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')

/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` (`course_id`, `course_name`, `description`, `start_date`, `end_date`, `total_contact_hours`, `created_at`, `updated_at`) VALUES ('SFC-FIELD-2026','SFC Field Response Essentials','Canvas-style training path for AI camera evidence, IoT proximity alerts, field notes, and Admin-ready recommendations.','2026-05-01','2026-06-15',12,'2026-05-08 05:52:03','2026-05-08 05:52:03'),('SFC-GUIDE-2026','SFC Park Guide Orientation','Orientation course for Park Guides using the digital portal, course resources, visitor briefings, and completion evidence.','2026-05-01','2026-07-15',8,'2026-05-08 05:52:03','2026-05-08 05:52:03'),('SFC-WILDLIFE-2026','Sarawak Protected Wildlife Awareness','Training modules for recognizing wildlife interaction risk, enforcing no-touch policy, and escalating evidence.','2026-05-01','2026-06-30',10,'2026-05-08 05:52:03','2026-05-08 05:52:03');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-08 16:00:28
-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: localhost    Database: cos30049_assignment
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- GTID state at the beginning of the backup 
--


--
-- Dumping data for table `training_modules`
--
-- WHERE:  course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')

/*!40000 ALTER TABLE `training_modules` DISABLE KEYS */;
INSERT INTO `training_modules` (`module_id`, `title`, `description`, `category`, `park`, `level`, `duration`, `format`, `image_url`, `accent_color`, `badge_name`, `objectives`, `created_by`, `created_at`, `course_id`, `status`, `sort_order`, `criteria`) VALUES (80,'AI and IoT Incident Evidence Review','Review AI camera and IoT sensor evidence before writing a recommendation for Admin review.','Incident Evidence','Demo Camera Zone','Intermediate','1 hour','Blended','','#ff7a1a','AI Evidence Reviewer','[\"Identify AI camera incident evidence\",\"Differentiate Plucking Plants, wildlife contact, and sensor proximity alerts\",\"Check timestamp, location, and metadata\",\"Avoid treating weak evidence as confirmed behavior too early\"]',NULL,'2026-05-08 05:52:03','SFC-FIELD-2026','Published',1,NULL),(81,'Park Ranger Recommendation Workflow','Explains how Rangers add field notes and recommendations without changing official incident status.','Ranger Workflow','Bako National Park','Intermediate','45 minutes','Blended','','#ff7a1a','Ranger Recommendation Ready','[\"Understand Ranger recommendation-only boundaries\",\"Write useful field notes\",\"Recommend outcomes for Admin review\"]',NULL,'2026-05-08 05:52:03','SFC-FIELD-2026','Published',2,NULL),(82,'Visitor Interaction and Conservation Rules','Guides staff on explaining no-touch conservation rules to visitors.','Visitor Safety','All Parks','Beginner','40 minutes','Blended','','#ff7a1a','Visitor Guidance Basics','[\"Explain conservation rules politely\",\"Reduce visitor contact with plants and wildlife\",\"Escalate repeat violations\"]',NULL,'2026-05-08 05:52:03','SFC-FIELD-2026','Published',3,NULL),(83,'Wildlife Interaction Basics','Introduces common visitor-wildlife interaction risks in Sarawak protected parks.','Wildlife','All Parks','Beginner','1 hour','Blended','','#ff7a1a','Wildlife Awareness','[\"Recognize unsafe wildlife interaction\",\"Explain why feeding and touching wildlife is harmful\",\"Record observation notes\"]',NULL,'2026-05-08 05:52:03','SFC-WILDLIFE-2026','Published',1,NULL),(84,'No-touch Visitor Policy','Policy explanation for plants, wildlife, and protected natural resources.','Policy','All Parks','Beginner','35 minutes','Blended','','#ff7a1a','No-touch Policy Ready','[\"Explain no-touch rules\",\"Handle visitor questions\",\"Escalate repeat issues\"]',NULL,'2026-05-08 05:52:03','SFC-WILDLIFE-2026','Published',2,NULL),(85,'Evidence Escalation Guide','Shows when and how to escalate wildlife-related evidence to Admin.','Evidence','All Parks','Intermediate','45 minutes','Blended','','#ff7a1a','Evidence Escalation Ready','[\"Judge evidence quality\",\"Prepare escalation notes\",\"Avoid false claims\"]',NULL,'2026-05-08 05:52:03','SFC-WILDLIFE-2026','Published',3,NULL),(86,'Digital Portal Orientation','Introduces the SFC Digital Portal, Canvas-style course shell, module items, progress, files, and certificates.','Orientation','All Parks','Beginner','40 minutes','Blended','','#ff7a1a','Portal Ready','[\"Open assigned courses\",\"Use course-level navigation\",\"Complete module items\",\"Find files and completion evidence\"]',NULL,'2026-05-08 05:52:03','SFC-GUIDE-2026','Published',1,NULL),(87,'Visitor Briefing Standards','Covers practical visitor briefings, trail safety, and protected-area expectations.','Visitor Briefing','Kubah National Park','Beginner','45 minutes','Blended','','#ff7a1a','Visitor Briefing Ready','[\"Prepare a clear visitor briefing\",\"Explain safety and conservation rules\",\"Use the correct escalation path\"]',NULL,'2026-05-08 05:52:03','SFC-GUIDE-2026','Published',2,NULL),(88,'Completion Evidence and Certificates','Explains how item completion, quiz attempts, and Admin review connect to certificates.','Completion','All Parks','Beginner','30 minutes','Blended','','#ff7a1a','Certificate Ready','[\"Complete all required items\",\"Submit quiz attempts\",\"Review certificate readiness\"]',NULL,'2026-05-08 05:52:03','SFC-GUIDE-2026','Published',3,NULL);
/*!40000 ALTER TABLE `training_modules` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-08 16:00:29
-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: localhost    Database: cos30049_assignment
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- GTID state at the beginning of the backup 
--


--
-- Dumping data for table `lessons`
--
-- WHERE:  module_id IN (SELECT module_id FROM training_modules WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026'))

/*!40000 ALTER TABLE `lessons` DISABLE KEYS */;
INSERT INTO `lessons` (`lesson_id`, `module_id`, `title`, `content`, `media_url`, `lesson_type`, `sort_order`) VALUES (92,80,'Overview','Review AI camera and IoT sensor evidence before writing a recommendation for Admin review.',NULL,'Text',1),(93,81,'Overview','Explains how Rangers add field notes and recommendations without changing official incident status.',NULL,'Text',1),(94,82,'Overview','Guides staff on explaining no-touch conservation rules to visitors.',NULL,'Text',1),(95,83,'Overview','Introduces common visitor-wildlife interaction risks in Sarawak protected parks.',NULL,'Text',1),(96,84,'Overview','Policy explanation for plants, wildlife, and protected natural resources.',NULL,'Text',1),(97,85,'Overview','Shows when and how to escalate wildlife-related evidence to Admin.',NULL,'Text',1),(98,86,'Overview','Introduces the SFC Digital Portal, Canvas-style course shell, module items, progress, files, and certificates.',NULL,'Text',1),(99,87,'Overview','Covers practical visitor briefings, trail safety, and protected-area expectations.',NULL,'Text',1),(100,88,'Overview','Explains how item completion, quiz attempts, and Admin review connect to certificates.',NULL,'Text',1);
/*!40000 ALTER TABLE `lessons` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-08 16:00:30
-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: localhost    Database: cos30049_assignment
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- GTID state at the beginning of the backup 
--


--
-- Dumping data for table `course_module_items`
--
-- WHERE:  course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')

/*!40000 ALTER TABLE `course_module_items` DISABLE KEYS */;
INSERT INTO `course_module_items` (`item_id`, `module_id`, `course_id`, `item_type`, `title`, `description`, `content`, `external_url`, `file_name`, `stored_name`, `mime_type`, `size_bytes`, `file_url`, `quiz_json`, `checklist_json`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES (285,80,'SFC-FIELD-2026','page','How AI camera evidence is reviewed','Step-by-step guide for reviewing camera evidence.','Start by checking the event type, timestamp, location, image clarity, and whether the image clearly shows prohibited visitor interaction. Do not mark a case as resolved from one weak image. Park Rangers should add field notes and recommendations only. Admin remains responsible for official status decisions.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',1,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(286,80,'SFC-FIELD-2026','text','Evidence triage note template','Short field-note pattern.','Observed behavior: what the evidence shows. Confidence: clear, partial, or unclear. Field action: what the ranger checked. Recommendation: the status outcome Admin should consider.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',2,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(287,80,'SFC-FIELD-2026','image','Example AI evidence frame','Evidence review image for discussion.','Use the frame to discuss event label, timestamp, location, and confidence before writing a field note.','http://localhost:5175/user/training/incident-ai-monitoring.webp',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',3,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(288,80,'SFC-FIELD-2026','video','Field evidence walkthrough','Short walkthrough reference.','Open the linked reference during the demo or replace it with an uploaded MP4 from the Admin builder.','https://sarawakforestry.com/',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',4,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(289,80,'SFC-FIELD-2026','link','SFC field reporting reference','External guideline reference.','','https://sarawakforestry.com/',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',5,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(290,80,'SFC-FIELD-2026','file','Incident handover worksheet','Downloadable worksheet placeholder for field response handover.','Use this file item for incident handover evidence during the presentation.','http://localhost:5175/user/training/safety-response.webp',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',6,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(291,80,'SFC-FIELD-2026','checklist','Evidence quality checklist','Things to verify before recommending action.','','',NULL,NULL,NULL,0,NULL,NULL,'[\"Image is visible and not blurred\", \"Event type matches the evidence\", \"Location and timestamp are recorded\", \"Sensor metadata is available for IoT alerts\", \"Recommendation is written clearly for Admin review\"]','published',7,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(292,80,'SFC-FIELD-2026','quiz','Is this incident ready for Admin review?','Quick scenario check.','','',NULL,NULL,NULL,0,NULL,'{\"answer\": 2, \"choices\": [\"Park Guide\", \"Park Ranger\", \"Admin\", \"Visitor\"], \"question\": \"Who should officially change an incident status?\"}',NULL,'published',8,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(293,81,'SFC-FIELD-2026','page','Ranger recommendation role boundary','Clear explanation of what Rangers can and cannot do.','Park Rangers may view incidents, inspect field evidence, add notes, and recommend outcomes. They should not directly change official incident status. This keeps accountability with Admin while still using Ranger field expertise.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',1,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(294,81,'SFC-FIELD-2026','text','Useful recommendation wording','Recommended field note phrasing.','Use neutral wording such as \"Recommend In Review because the image is clear but field location needs confirmation.\" Avoid assigning intent to visitors.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',2,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(295,81,'SFC-FIELD-2026','checklist','Field note writing checklist','Checklist for useful Ranger notes.','','',NULL,NULL,NULL,0,NULL,NULL,'[\"Mention what was seen in the field\", \"Mention whether evidence matches the location\", \"Use neutral wording\", \"Avoid guessing intent\", \"Recommend next action clearly\"]','published',3,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(296,81,'SFC-FIELD-2026','quiz','Official status vs recommendation','Role boundary quiz.','','',NULL,NULL,NULL,0,NULL,'{\"answer\": 2, \"choices\": [\"Change status to resolved\", \"Delete the incident\", \"Recommend resolved with field notes\", \"Ignore the incident\"], \"question\": \"A Ranger believes an incident is solved. What should they do?\"}',NULL,'published',4,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(297,82,'SFC-FIELD-2026','page','Explaining rules to visitors','Simple script for visitor-facing communication.','Use friendly, direct language. Explain that protected plants and wildlife must not be touched, plucked, fed, or disturbed. Focus on safety, conservation, and visitor responsibility.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',1,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(298,82,'SFC-FIELD-2026','image','Visitor safety briefing card','Visual reminder for visitor briefing.','Use this image item to brief visitors before trail entry.','http://localhost:5175/user/training/visitor-safety.webp',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',2,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(299,82,'SFC-FIELD-2026','link','Bako National Park visitor guide','Visitor reference link.','','https://sarawakforestry.com/parks/bako-national-park/',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',3,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(300,82,'SFC-FIELD-2026','checklist','Visitor safety reminders','Before patrol checklist.','','',NULL,NULL,NULL,0,NULL,NULL,'[\"Brief visitors before trail entry\", \"Remind them not to feed wildlife\", \"Remind them not to pluck plants\", \"Report suspicious behavior early\"]','published',4,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(301,83,'SFC-WILDLIFE-2026','page','Why touching wildlife is dangerous','Basic conservation and safety explanation.','Touching wildlife can harm animals, create aggressive behavior, spread disease, and put visitors at risk. Staff should intervene early and record evidence when available.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',1,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(302,83,'SFC-WILDLIFE-2026','text','Safe-distance briefing script','Plain-language visitor script.','Please keep a safe distance, do not feed wildlife, and let animals move away naturally. This protects visitors and the animals.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',2,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(303,83,'SFC-WILDLIFE-2026','image','Protected wildlife awareness card','Training visual for no-contact wildlife rules.','Use this image to explain why protected wildlife should be observed from a distance.','http://localhost:5175/user/training/biodiversity-basics.webp',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',3,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(304,83,'SFC-WILDLIFE-2026','video','Wildlife awareness reference','Reference video placeholder.','Replace this with a local awareness video from Admin if available.','https://sarawakforestry.com/',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',4,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(305,83,'SFC-WILDLIFE-2026','quiz','Wildlife safety check','Basic quiz.','','',NULL,NULL,NULL,0,NULL,'{\"answer\": 2, \"choices\": [\"Feed it\", \"Touch it gently\", \"Observe from a safe distance\", \"Chase it away\"], \"question\": \"What should visitors do when they see wildlife?\"}',NULL,'published',5,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(306,84,'SFC-WILDLIFE-2026','page','No-touch policy explanation','Plain-language policy script.','Visitors should not touch, pick, pluck, feed, chase, or disturb plants and wildlife. Staff should explain the policy calmly and record incidents when evidence exists.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',1,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(307,84,'SFC-WILDLIFE-2026','file','Policy reminder card','Downloadable reminder for guide briefing.','Use this as a file item for no-touch briefing evidence.','http://localhost:5175/user/training/rules-compliance.webp',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',2,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(308,84,'SFC-WILDLIFE-2026','link','Sarawak Forestry policy reference','External policy reference.','','https://sarawakforestry.com/',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',3,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(309,84,'SFC-WILDLIFE-2026','checklist','No-touch enforcement checklist','Quick enforcement steps.','','',NULL,NULL,NULL,0,NULL,NULL,'[\"Warn politely\", \"Explain conservation reason\", \"Record evidence if repeated\", \"Escalate to Admin if needed\"]','published',4,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(310,85,'SFC-WILDLIFE-2026','page','When to escalate','Escalation decision guide.','Escalate when evidence shows repeated contact, high-risk behavior, visitor refusal, wildlife distress, or unclear incidents needing Admin review.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',1,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(311,85,'SFC-WILDLIFE-2026','text','Escalation summary format','Short structured summary.','Incident type, location, time, evidence quality, field note, recommended outcome, and any follow-up needed.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',2,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(312,85,'SFC-WILDLIFE-2026','link','Sarawak Forestry Corporation','Official reference site.','','https://sarawakforestry.com/',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',3,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(313,86,'SFC-GUIDE-2026','page','Welcome to the SFC Digital Portal','Orientation page for new Park Guides.','The portal organizes training into courses. Each course contains an overview, modules, item detail, progress, files, and certificate state. Complete each item and quiz to build completion evidence for Admin.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',1,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(314,86,'SFC-GUIDE-2026','text','Course shell quick reference','Short reference for course navigation.','Use Overview for course purpose, Modules for the learning sequence, Item Detail for the selected page or quiz, Progress for completion, Files for resources, and Completion for badge or certificate state.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',2,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(315,86,'SFC-GUIDE-2026','image','Portal learning flow diagram','Visual guide for course navigation.','Use this diagram as an orientation visual for the course shell.','http://localhost:5175/user/training/ecotourism-briefing.webp',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',3,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(316,86,'SFC-GUIDE-2026','video','Portal walkthrough reference','Short walkthrough placeholder.','Replace with a recorded walkthrough during final polish if needed.','https://sarawakforestry.com/',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',4,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(317,86,'SFC-GUIDE-2026','file','Guide onboarding checklist file','Orientation file item for onboarding.','File item used for onboarding checklist evidence.','http://localhost:5175/user/training/protected-areas.webp',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',5,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(318,86,'SFC-GUIDE-2026','link','SFC official website','External organization reference.','','https://sarawakforestry.com/',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',6,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(319,86,'SFC-GUIDE-2026','checklist','First login checklist','Steps for a new Park Guide.','','',NULL,NULL,NULL,0,NULL,NULL,'[\"Open the assigned course\", \"Read the overview\", \"Complete the first page item\", \"Submit one quiz attempt\", \"Review completion state\"]','published',7,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(320,86,'SFC-GUIDE-2026','quiz','Portal navigation check','Course shell quiz.','','',NULL,NULL,NULL,0,NULL,'{\"answer\": 1, \"choices\": [\"Files\", \"Completion\", \"Admin Detection\", \"Park Ranger Console\"], \"question\": \"Where should a Park Guide check certificate readiness?\"}',NULL,'published',8,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(321,87,'SFC-GUIDE-2026','page','Trail briefing structure','Briefing sequence for guide teams.','Start with route expectations, safety reminders, no-contact conservation rules, weather awareness, and how visitors should ask for help.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',1,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(322,87,'SFC-GUIDE-2026','image','Rainforest safety visual','Orientation image for safety briefing.','Use this image item to support a clear safety briefing.','http://localhost:5175/user/training/kubah-rainforest-safety.webp',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',2,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(323,87,'SFC-GUIDE-2026','checklist','Before departure checklist','Quick checks before a guided route.','','',NULL,NULL,NULL,0,NULL,NULL,'[\"Confirm headcount\", \"Confirm route and weather\", \"Explain protected wildlife boundaries\", \"Confirm emergency contact path\"]','published',3,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(324,87,'SFC-GUIDE-2026','quiz','Briefing readiness check','Visitor briefing scenario.','','',NULL,NULL,NULL,0,NULL,'{\"answer\": 1, \"choices\": [\"Only the route name\", \"Safety, conservation rules, and contact path\", \"A souvenir list\", \"No briefing is needed\"], \"question\": \"What should be included before visitors enter a protected trail?\"}',NULL,'published',4,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(325,88,'SFC-GUIDE-2026','page','How completion evidence is built','Completion and certificate state explanation.','Each completed item and quiz attempt is saved through the User API when MySQL is running. Admin can review progress summaries and issue badges or certificates when the course requirements are complete.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',1,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(326,88,'SFC-GUIDE-2026','text','Completion evidence summary','What Admin can review.','Admin sees available items, completed items, quiz attempts, latest score, and course-level progress. This demo keeps completion state separate from AI/IoT incident status.','',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',2,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(327,88,'SFC-GUIDE-2026','file','Certificate readiness worksheet','Course completion file item.','Use this file item as a certificate readiness worksheet during the demo.','http://localhost:5175/user/training/conservation-law.webp',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',3,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(328,88,'SFC-GUIDE-2026','link','Course completion support','External support reference.','','https://sarawakforestry.com/',NULL,NULL,NULL,0,NULL,NULL,NULL,'published',4,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(329,88,'SFC-GUIDE-2026','checklist','Certificate readiness checklist','Final course completion checks.','','',NULL,NULL,NULL,0,NULL,NULL,'[\"All module items completed\", \"Quiz attempts submitted\", \"Progress page reviewed\", \"Completion page checked\", \"Admin can issue badge if approved\"]','published',5,'2026-05-08 05:52:03','2026-05-08 05:52:03'),(330,88,'SFC-GUIDE-2026','quiz','Completion state check','Final orientation quiz.','','',NULL,NULL,NULL,0,NULL,'{\"answer\": 2, \"choices\": [\"Canvas item progress\", \"Quiz attempts\", \"AI and IoT incident status\", \"Course certificates\"], \"question\": \"What data should remain separate from training completion?\"}',NULL,'published',6,'2026-05-08 05:52:03','2026-05-08 05:52:03');
/*!40000 ALTER TABLE `course_module_items` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-08 16:00:32

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;

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
