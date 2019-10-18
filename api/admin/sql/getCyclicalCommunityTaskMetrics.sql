select  count(CASE WHEN task.state='completed' THEN 1 ELSE NULL end) as  completed,
count(CASE WHEN task.state='canceled' THEN 1 ELSE NULL end) as canceled,
count(task."publishedAt") as published,
count(*) filter (where task."updatedBy"!= task."userId" and task.state='completed') as "completedByAdmin",
 cycle.cycle_id,cycle.name,cycle.posting_start_date as postingStartDate
     from task join cycle on  task.cycle_id = cycle.cycle_id where  task.community_id = ?
     group by
     cycle.cycle_id