with tasks as (
	select task.title, task.state, task.cycle_id, task.community_id, task.agency_id, task.accepting_applicants,
	(select row_to_json (muser)
		from (
			select
				id, name, username, government_uri, 
				coalesce(given_name, (string_to_array(trim(name), ' '))[array_lower(string_to_array(trim(name), ' '), 1)]) as given_name,
				coalesce(last_name, (string_to_array(trim(name), ' '))[array_upper(string_to_array(trim(name), ' '), 1)]) as last_name		
					from midas_user where task."userId" = midas_user.id 
		) muser
	) as owner,
	(select row_to_json (agency)
		from (
			select * from agency where task.agency_id = agency.agency_id
		) agency
	) as agency,
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
)

select
	count(*),
	case
		when state = 'open' and cycle.apply_start_date > now() then 'approved'
		else state
	end as task_state
from tasks
left join cycle on tasks.cycle_id = cycle.cycle_id
where tasks.state <> 'archived' and tasks.community_id = ? and tasks.cycle_id = ? [filter clause]
group by task_state;