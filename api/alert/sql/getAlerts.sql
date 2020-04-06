SELECT
  *,
  ARRAY_TO_JSON (
    ARRAY (
      SELECT "location" FROM alert_location
      WHERE alert_location_id IN (
        SELECT alert_location_id FROM alert_location_bridge
        WHERE alert_id = alert.alert_id
      )
    )
  ) AS locations
FROM alert
WHERE $1 BETWEEN start_date AND end_date