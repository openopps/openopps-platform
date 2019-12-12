select
	midas_user.id, midas_user.name, midas_user.username, task.id as "taskId", cycle.apply_end_date as "applyEndDate", 
	task.title as "internshipName", bureau.name as "internshipBureau", office.name as "internshipOffice",
	concat_ws(', ', task.city_name, country_subdivision.value, country.value) as "internshipLocation"
from application_task
join application on application.application_id = application_task.application_id
join midas_user on midas_user.id = application.user_id
join task on task.id = application_task.task_id
join cycle on cycle.cycle_id = task.cycle_id
inner join bureau on task.bureau_id = bureau.bureau_id
left join office on task.office_id = office.office_id
left join country on task.country_id = country.country_id
left join country_subdivision on task.country_subdivision_id = country_subdivision.country_subdivision_id
where application_task.task_id = ? and task.state = 'open';