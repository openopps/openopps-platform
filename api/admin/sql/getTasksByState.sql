select
	task.*,
	(
		select row_to_json (muser)
		from (select id, name, given_name, last_name, username, government_uri from midas_user where task."userId" = midas_user.id) muser
	) as owner,
	(
		select json_agg (users)
		from (
			select midas_user.id, midas_user.name, midas_user.given_name, midas_user.last_name, midas_user.username, midas_user.government_uri
			from volunteer
			join midas_user on volunteer."userId" = midas_user.id
			where volunteer."taskId" = task.id
		) users
	) as volunteers
from task
left join community on task.community_id = community.community_id 
where [where clause]
limit 25 offset ((? - 1) * 25);