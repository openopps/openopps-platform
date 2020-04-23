with applications as (
SELECT 
midas_user.id As "applicantId", midas_user.name as "applicantName", midas_user.username,app.cycle_id,task.state,task_list.title,
 coalesce(midas_user.given_name, (string_to_array(trim(midas_user.name), ' '))[array_lower(string_to_array(trim(midas_user.name), ' '), 1)]) as given_name,
coalesce(midas_user.last_name, (string_to_array(trim(midas_user.name), ' '))[array_upper(string_to_array(trim(midas_user.name), ' '), 1)]) as last_name, 
app.application_id AS "id", app.submitted_at AS "submittedAt", app.community_id, app.withdrawn,
  comm.community_name AS "communityName", c.name AS "cycleName", c.cycle_start_date AS "cycleStartDate",
  c.apply_end_date AS "applyEndDate", app.updated_at AS "updatedAt", phase."name", phase."sequence", 
  case when app.internship_completed_at is not null then true else false end AS "internshipComplete",
 (    
        case
        when app.submitted_at is not null and phase."sequence"=3 and task."state"='completed'
        and app.internship_completed_at is not null 
        then 'Completed'
        when app.submitted_at is not null and phase."sequence"=3 and task."state"='completed'
         and app.internship_completed_at is  null and task_list.title ='Primary'
        then 'Not completed'        
        when app.submitted_at is not null and phase."sequence"=3 and task."state"='completed' 
          and task_list.title='Alternate'
        then 'Alternate Select'
        when app.submitted_at is not null and phase."sequence"=3 and (task."state"!='completed' or task."state" is null)
         and  task_list.title ='Primary'
        then 'Primary Select'
        when app.submitted_at is not null and phase."sequence"=3 and (task."state"!='completed' or task."state" is null)
         and  task_list.title ='Alternate'
         then 'Alternate Select'        
        when app.submitted_at is null 
        and  c.apply_end_date >current_timestamp  
        then 'In progress'    
       when app.submitted_at is null 
        and  c.apply_end_date < current_timestamp  
        then 'Not submitted'
         when app.submitted_at is not null and (phase."sequence" !=3 or phase."sequence" is null)
        then 'Applied'        
        else 'Not selected'
        end
         ) as "status"
  FROM application app 
  INNER JOIN community comm ON app.community_id = comm.community_id
  
  JOIN cycle c ON app.cycle_id = c.cycle_id 
  join midas_user on midas_user.id = app.user_id
  LEFT JOIN phase ON c.phase_id = phase.phase_id 
  LEFT join task_list_application tla on app.application_id = tla.application_id
  LEFT join task_list on tla.task_list_id = task_list.task_list_id 
  LEFT join task on task_list.task_id = task.id 
)

select applications.* 
from applications
 where applications.withdrawn <> true and applications.community_id = ? and applications.cycle_id= ? [filter clause]
order by [order by]



