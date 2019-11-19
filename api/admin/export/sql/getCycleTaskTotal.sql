select cycle.name as name,
count(CASE WHEN task."createdAt" is not null THEN 1 ELSE NULL end) as totalcreated,
count(CASE WHEN task.state='submitted' THEN 1 ELSE NULL end) as submitted,
count(CASE WHEN task.state='open'and cycle.apply_start_date > now() THEN 1 ELSE NULL end) as approved,
count(CASE WHEN task.state='open' THEN 1 ELSE NULL end) as open,
count(CASE WHEN task.state='completed' THEN 1 ELSE NULL end) as completed	
from task
left join cycle on task.cycle_id = cycle.cycle_id
where task.state <> 'archived' and task.community_id = ?
group by cycle.cycle_id
    order by cycle.name
