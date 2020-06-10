SELECT
	task.*,
	(SELECT JSON_AGG (users)
		FROM (
			SELECT
				midas_user.id,
				midas_user.name,
				midas_user.given_name,
				midas_user.last_name,
				midas_user.username,
				midas_user.government_uri
			FROM
				co_owner
			JOIN midas_user ON
				co_owner.user_id = midas_user.id
			WHERE
				co_owner.task_id = task.id
		) users
	) AS co_owners
FROM
	task
LEFT JOIN co_owner ON co_owner.task_id = task.id AND co_owner.user_id = $1
WHERE
	task."userId" = $1 OR co_owner.user_id = $1