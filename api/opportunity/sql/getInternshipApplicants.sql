select
	midas_user.id, midas_user.name, midas_user.given_name as "givenName",
	midas_user.last_name as "lastName", application_task.sort_order as preference
from application_task
join application on application.application_id = application_task.application_id
join midas_user on midas_user.id = application.user_id
where application_task.task_id = ? and application.submitted_at is not null;