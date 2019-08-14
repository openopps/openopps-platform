select
	count(*),
	case
		when state = 'open' and cycle.apply_start_date > now() then 'approved'
		else state
	end as task_state
from task
left join cycle on task.cycle_id = cycle.cycle_id
where task.state <> 'archived' and task.community_id = ?
group by task_state;