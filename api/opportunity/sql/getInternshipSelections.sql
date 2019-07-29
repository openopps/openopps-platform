select
	task_list.title, task_list.task_id as "taskId",
	task_list_application.application_id as "applicationId",
	case when application.internship_completed_at is not null then true else false end as "internshipComplete",
	midas_user.given_name as "givenName", midas_user.last_name as "lastName"
from task_list_application
inner join task_list on task_list_application.task_list_id = task_list.task_list_id
inner join application on task_list_application.application_id = application.application_id
inner join midas_user on application.user_id = midas_user.id
where task_list.title in ('Primary', 'Alternate') and task_list.task_id = ?
order by task_list.task_id, task_list.sort_order