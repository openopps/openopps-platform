with tasks as (
	select
		task.*, cycle.apply_start_date,
		(
			select row_to_json (muser)
			from (
					select
						id, name, username, government_uri,
						coalesce(given_name, (string_to_array(trim(name), ' '))[array_lower(string_to_array(trim(name), ' '), 1)]) as given_name,
						coalesce(last_name, (string_to_array(trim(name), ' '))[array_upper(string_to_array(trim(name), ' '), 1)]) as last_name
					from midas_user where task."userId" = midas_user.id
				) muser
		) as owner,
		(
			select count (applications)
			from (
				select application_task.task_id
				from application_task
				join application on application_task.application_id = application.application_id
				where application_task.task_id = task.id and application_task.sort_order <> -1 and application.submitted_at is not null
			) applications
		) as applicants,
		(select row_to_json (office)
			from (
				select * from office where task.office_id = office.office_id
			) office
		) as office,
		(select row_to_json (bureau)
			from (
				select * from bureau where task.bureau_id = bureau.bureau_id
			) bureau
		) as bureau
	from task
	left join cycle on task.cycle_id = cycle.cycle_id
)
select * from tasks
where [where clause]
order by [order by]
limit 25 offset ((? - 1) * 25);