
 SELECT 
  application_task.application_task_id AS "applicationTaskId", application_task.application_id AS "applicationId", 
  application_task.task_id AS "taskId", application_task.sort_order AS "sortOrder", application_task.updated_at AS "updatedAt", 
  task.title, bureau.name AS bureau, office.name AS office
  FROM application_task 
  join application on application.application_id= application_task.application_id
  JOIN task ON task.id = application_task.task_id 
  LEFT JOIN bureau ON bureau.bureau_id = task.bureau_id 
  LEFT JOIN office ON office.office_id = task.office_id 
  WHERE application.user_id = ? and application.cycle_id=? and application_task.sort_order <> -1