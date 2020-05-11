SELECT
  *,
  (
    SELECT JSON_AGG (reply)
    FROM (
      SELECT
        *,
        (
          SELECT ROW_TO_JSON(midas_user)
          FROM (
            SELECT 
              name,
              "photoId"
            FROM midas_user
            WHERE id = reply."userId"
          ) midas_user
        ) AS "user"
      FROM comment reply WHERE reply."parentId" = comment.id AND "deletedAt" IS NULL ORDER BY "createdAt"
    ) reply
  ) AS replies,
  (
      SELECT ROW_TO_JSON(midas_user)
      FROM (
        SELECT 
          name,
          "photoId"
      FROM midas_user
      WHERE id = comment."userId"
    ) midas_user
  ) AS "user"
FROM comment
WHERE "taskId" = $1 AND "parentId" IS NULL AND "deletedAt" IS NULL
ORDER BY "createdAt"