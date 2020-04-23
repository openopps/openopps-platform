  select
	count(*) as applicant ,cast (task.cycle_id as int8)
from application_task
 join task on application_task.task_id= task.id
join application on application.application_id = application_task.application_id
join midas_user on midas_user.id = application.user_id

where task.state='completed' and  application.submitted_at is not null and application.community_id = ?
group by
     task.cycle_id