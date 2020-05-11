SELECT
	"comment".value,
	task.title,
	(
		SELECT ROW_TO_JSON(midas_user)
	  	FROM (
        SELECT
        	id,
          name,
          government_uri,
          username,
          bounced
        FROM midas_user
        WHERE id = task."userId"
	  	) midas_user
	) AS owner,
	(
		SELECT ROW_TO_JSON(midas_user)
	  	FROM (
        SELECT
        	id,
          name
        FROM midas_user
        WHERE id = "comment"."userId"
	  	) midas_user
	) AS commenter,
	CASE WHEN "comment"."parentId" IS NOT NULL THEN
	(
		SELECT JSON_AGG(midas_user)
		FROM (
			SELECT
				id,
				name,
				government_uri,
				username,
        bounced
			FROM midas_user
			WHERE
				id <> "comment"."userId" AND
				id <> task."userId" AND
				id IN (
					SELECT c."userId"
					FROM "comment" c
					WHERE c.id = "comment"."parentId" OR c."parentId" = "comment"."parentId"
				)
		) midas_user
	)
	ELSE
	(
		SELECT JSON_AGG(midas_user)
		FROM (
			SELECT
				id,
				name,
				government_uri,
				username,
      	bounced
			FROM midas_user
			WHERE
				id <> "comment"."userId" AND
				id <> task."userId" AND
				id IN (
					SELECT c."userId"
					FROM "comment" c
					WHERE c."taskId" = "comment"."taskId" AND c."parentId" IS NULL
				)
		) midas_user
	)
	END AS recipients
FROM "comment"
JOIN task ON task.id = "comment"."taskId"
WHERE "comment".id = $1