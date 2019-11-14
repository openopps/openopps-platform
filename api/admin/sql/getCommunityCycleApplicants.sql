SELECT 
midas_user.id As "applicantId", midas_user.name as "applicantName", midas_user.username,app.cycle_id,
app.application_id AS "id", app.submitted_at AS "submittedAt", 
  comm.community_name AS "communityName", c.name AS "cycleName", c.cycle_start_date AS "cycleStartDate",
  c.apply_end_date AS "applyEndDate", app.updated_at AS "updatedAt", phase."name", phase."sequence", 
  case when app.internship_completed_at is not null then true else false end as "internshipComplete",
  (  
		select 
			task.state  
		from application 
		inner join task_list_application tla on application.application_id = tla.application_id
    inner join task_list on tla.task_list_id = task_list.task_list_id 
    inner join task on task_list.task_id = task.id 
    where application.application_id = app.application_id 
    limit 1 
	) as "taskState",
	( 
		select
			task_list.title 
		from application 
		inner join task_list_application tla on application.application_id = tla.application_id 
		inner join task_list on tla.task_list_id = task_list.task_list_id 
    where application.application_id = app.application_id 
    limit 1 
	) as "reviewProgress" 
  FROM application app 
  INNER JOIN community comm ON app.community_id = comm.community_id
  INNER JOIN cycle c ON app.cycle_id = c.cycle_id 
  join midas_user on midas_user.id = app.user_id
  LEFT JOIN phase ON c.phase_id = phase.phase_id 
  WHERE app.community_id = 4 and app.cycle_id= 27