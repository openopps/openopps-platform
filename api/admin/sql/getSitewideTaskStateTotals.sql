select
	count(*),
	case
		when state = 'in progress' and accepting_applicants = false then 'in progress'
		when state in ('open', 'in progress') and accepting_applicants = true then 'open'
		else state
	end as task_state
from task
left join community on task.community_id = community.community_id
where task.state <> 'archived' and (community.target_audience <> 2 or community.target_audience is null)
group by task_state;