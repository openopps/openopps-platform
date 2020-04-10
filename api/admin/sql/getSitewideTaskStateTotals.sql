with tasks as (
	select task.title, task.state, task.community_id, task.accepting_applicants,
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
	) as agency		
	from task
)

select
	count(*),
	case
		when state = 'in progress' and accepting_applicants = false then 'in progress'
		when state in ('open', 'in progress') and accepting_applicants = true then 'open'
		else state
	end as task_state
from tasks
left join community on tasks.community_id = community.community_id
where tasks.state <> 'archived' and community.is_disabled = false and (community.target_audience <> 2 or community.target_audience is null) [filter clause]
group by task_state;