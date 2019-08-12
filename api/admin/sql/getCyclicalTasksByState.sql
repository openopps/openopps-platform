select
	task.*,
	(
		select row_to_json (muser)
		from (select id, name, given_name, last_name, username, government_uri from midas_user where task."userId" = midas_user.id) muser
	) as owner,
	(
		select json_agg (users)
		from (
			select midas_user.id, midas_user.name, midas_user.given_name, midas_user.last_name, midas_user.username, midas_user.government_uri
			from application_task
			join application on application_task.application_id = application.application_id
			join midas_user on application.user_id = midas_user.id
			where application_task.task_id = task.id
		) users
	) as applicants
from task
left join cycle on task.cycle_id = cycle.cycle_id
where [where clause]
limit 25 offset ((? - 1) * 25);