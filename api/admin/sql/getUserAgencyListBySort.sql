with users as (
    select 
        id, government_uri, username, "createdAt", disabled, 
        agency_id, "isAgencyAdmin", hiring_path, last_login, id, name, 
        count(*) over() as full_count,
        coalesce(given_name, (string_to_array(trim(name), ' '))[array_lower(string_to_array(trim(name), ' '), 1)]) as given_name,
		coalesce(last_name, (string_to_array(trim(name), ' '))[array_upper(string_to_array(trim(name), ' '), 1)]) as last_name, 
        (
			select row_to_json (agency)
			from (
				select * from agency where midas_user.agency_id = agency.agency_id
			) agency
		) as agency
    from midas_user
    where agency_id = ?
)

select * from users
[where clause]
order by [order by]
limit 25 offset ((? - 1) * 25);