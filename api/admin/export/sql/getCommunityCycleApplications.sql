select
m_user."name" applicant_name,
m_user.username as applicant_email,
(case
    when app.submitted_at is not null and phase.sequence = 3 and task.state = 'completed' and app.internship_completed_at is not null
    then 'Completed'
    when app.submitted_at is not null and phase.sequence = 3 and task.state = 'completed' and app.internship_completed_at is null and task_list.title = 'Primary'
    then 'Not completed'
    when app.submitted_at is not null and phase.sequence = 3 and task.state = 'completed' and task_list.title = 'Alternate'
    then 'Alternate Select'
    when app.submitted_at is not null and phase.sequence = 3 and (task.state <> 'completed' or task.state is null) and task_list.title = 'Primary'
    then 'Primary Select'
    when app.submitted_at is not null and phase.sequence = 3 and (task.state <> 'completed' or task.state is null) and task_list.title = 'Alternate'
    then 'Alternate Select'
    when app.submitted_at is null and cycle.apply_end_date > current_timestamp
    then 'In progress'
	when app.submitted_at is null and cycle.apply_end_date < current_timestamp
    then 'Not submitted'
    when app.submitted_at is not null and (phase.sequence <> 3 or phase.sequence is null)
    then 'Applied'
    else 'Not selected'
end) as application_status,
task.title as internship_name,
creator."name" as internship_creator,
bureau.name as internship_bureau,
office.name as internship_office,
concat_ws(', ', task.city_name, country_subdivision.value, country.value) as internship_location,
app.updated_at as last_updated
from application app
inner join midas_user m_user on app.user_id = m_user.id
inner join application_task apptask on app.application_id = apptask.application_id
inner join task on apptask.task_id = task.id
left join task_list_application tla on app.application_id = tla.application_id 
left join task_list on tla.task_list_id = task_list.task_list_id
inner join bureau on task.bureau_id = bureau.bureau_id
left join office on task.office_id = office.office_id
left join country on task.country_id = country.country_id
left join country_subdivision on task.country_subdivision_id = country_subdivision.country_subdivision_id
inner join midas_user creator on task."userId" = creator.id
inner join cycle on app.cycle_id = cycle.cycle_id
left join phase on cycle.phase_id = phase.phase_id
where cycle.community_id = ? and cycle.cycle_id = ?
order by app.application_id, apptask.sort_order