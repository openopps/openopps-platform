select
	count(*), agency.name, agency.abbr, parent."name", parent.abbr
from task
join agency on task.agency_id = agency.agency_id
left join agency parent on agency.parent_code = parent.code
where task.state != 'draft' and task."submittedAt" between ? and ?
group by agency.name, agency.abbr, parent."name", parent.abbr
order by count desc
limit 5;