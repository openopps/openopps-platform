
with applications as (
SELECT 
midas_user.id As "applicantId", midas_user.name as "applicantName", midas_user.username,app.cycle_id,
 coalesce(midas_user.given_name, (string_to_array(trim(midas_user.name), ' '))[array_lower(string_to_array(trim(midas_user.name), ' '), 1)]) as given_name,
coalesce(midas_user.last_name, (string_to_array(trim(midas_user.name), ' '))[array_upper(string_to_array(trim(midas_user.name), ' '), 1)]) as last_name, 
app.application_id AS "id", app.submitted_at AS "submittedAt", app.community_id,
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
)

select applications.*, 
(	
		case
		when applications."submittedAt" is not null and applications."sequence"=3 and applications."taskState"='completed'
		and applications."internshipComplete"='true' 
		then 'Completed'
		when applications."submittedAt" is not null and applications."sequence"=3 and applications."taskState"='completed'
		 and applications."internshipComplete"='false' and applications."reviewProgress"='Primary'
		then 'Not completed'
		when applications."submittedAt" is not null and applications."sequence"=3 and applications."taskState"='completed'
		  and applications."reviewProgress"='Alternate'
		then 'Alternate'
		when applications."submittedAt" is not null and applications."sequence"=3 and applications."taskState"!='completed'
		 and  applications."reviewProgress"='Primary'
		then 'Primary Select'
		when applications."submittedAt" is not null and applications."sequence"=3 and applications."taskState"!='completed'
		 and  applications."reviewProgress"='Alternate'
		 then 'Alternate Select'		
		when applications."submittedAt" is null 
		and applications."applyEndDate">current_timestamp  
		then 'In progress'	
	   when applications."submittedAt" is null 
		and applications."applyEndDate"< current_timestamp  
		then 'Not submitted'
		 when applications."submittedAt" is not  null and applications."sequence"!=3
		then 'Applied'
		else 'Not selected'
		end
		 ) as "status"

from applications
 where applications.community_id = ? and applications.cycle_id= ?
order by [order by]



