SELECT alert.* FROM alert
JOIN alert_location_bridge alb ON alb.alert_id = alert.alert_id
JOIN alert_location al ON al.alert_location_id = alb.alert_location_id
WHERE
	al."location" = $1
AND
  $2 BETWEEN start_date AND end_date