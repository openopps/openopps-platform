select
	count(*), midas_user.name, agency.name as agency_name, agency.abbr, parent."name" as parent_name, parent.abbr as parent_abbr, rank() over(order by count(*) desc) as rank
from task
join agency on task.agency_id = agency.agency_id
join midas_user on task."userId" = midas_user.id
left join agency parent on agency.parent_code = parent.code
where agency.agency_id = ? and task.state != 'draft' and task."submittedAt" between ? and ?
group by midas_user.name, agency.name, agency.abbr, parent."name", parent.abbr
order by count desc