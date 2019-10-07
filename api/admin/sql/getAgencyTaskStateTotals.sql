select
	count(*),
	case
		when state = 'in progress' and accepting_applicants = false then 'in progress'
		when state in ('open', 'in progress') and accepting_applicants = true then 'open'
		else state
	end as task_state
from task
where task.state <> 'archived' and task.community_id is null and task.agency_id = ?
group by task_state;