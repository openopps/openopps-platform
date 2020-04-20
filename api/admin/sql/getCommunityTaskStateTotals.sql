with tasks as (
	select task.title, task.state, tagentity.name, task.community_id, task.agency_id, task.accepting_applicants,task.detail_selection,
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
	from tagentity_tasks__task_tags as task_tags
	join tagentity on tagentity.id = task_tags.tagentity_tasks
	join task on task.id = task_tags.task_tags
	where tagentity."type" = 'task-time-required' 
	and task.state in ('draft','submitted','open','not open','in progress','completed','canceled')
	and task.community_id = ? [filter clause]
)
select
	count(*),
	case
		when state = 'draft' then 'draft'
		when state = 'submitted' then 'submitted'
		when state in ('open', 'in progress') and "accepting_applicants" = true then 'open'
		when state = 'not open' then 'notOpen'
		when state = 'in progress' and "accepting_applicants" = false then 'inProgress'
		when state = 'completed' then 'completed'
		when state = 'canceled' then 'canceled'
		else state
	end as task_state
from tasks
where tasks.state <> 'archived' 
group by task_state
union
select
	count(*),
	case
		when tasks.name = 'One time' or tasks.name is null then 'oneTime'
		when tasks.name = 'Ongoing' then 'onGoing'
		when tasks.name = 'Lateral' then 'lateral'
		when tasks.detail_selection = 'Part-time' then 'partTime'
		when tasks.detail_selection = 'Full-time' then 'fullTime'		
	end as task_state
from tasks
where tasks.state <> 'archived' 
group by task_state;