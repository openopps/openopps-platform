select
	count(midas_user.id), agency.name, agency.abbr, parent."name" as parent_name, parent.abbr as parent_abbr
from task
join agency on task.agency_id = agency.agency_id
left join agency parent on agency.parent_code = parent.code
join volunteer on task.id = volunteer."taskId"
join midas_user on volunteer."userId" = midas_user.id
where task.state != 'draft' and volunteer.assigned = true and task."submittedAt" between ? and ?
group by agency.name, agency.abbr, parent."name", parent.abbr
order by count desc
limit 5;