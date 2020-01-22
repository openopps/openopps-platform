select
	application.application_id, cycle.name, cycle.apply_end_date,
	midas_user.username, midas_user.given_name, midas_user.last_name
from application
join cycle on "cycle".cycle_id = application.cycle_id
join midas_user on midas_user.id = application.user_id
where DATE_PART('day', cycle.apply_end_date - current_date) = 3