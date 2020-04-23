with tasks as (
	select task.*, community.target_audience,
	(select row_to_json (muser)
		from (
			select
				id, name, username, government_uri, 
				coalesce(given_name, (string_to_array(trim(name), ' '))[array_lower(string_to_array(trim(name), ' '), 1)]) as given_name,
				coalesce(last_name, (string_to_array(trim(name), ' '))[array_upper(string_to_array(trim(name), ' '), 1)]) as last_name		
					from midas_user where task."userId" = midas_user.id 
		) muser
	) as owner,		
	(select json_agg (users)
		from (
			select midas_user.id, midas_user.name, midas_user.given_name, midas_user.last_name, midas_user.username, midas_user.government_uri
				from volunteer
				join midas_user on volunteer."userId" = midas_user.id
				where midas_user.disabled = false and volunteer."taskId" = task.id
		) users
	) as volunteers,
	(select row_to_json (agency)
		from (
			select * from agency where task.agency_id = agency.agency_id
		) agency
	) as agency		
	from task
	left join community on task.community_id = community.community_id
)
	
select * from tasks
where [where clause]
order by [order by]
limit 25 offset ((? - 1) * 25);