with users as (
    select 
        id, government_uri, username, "createdAt", community_user.created_at as joined_date, community_user.disabled, is_manager, agency_id, last_login, name,
        coalesce(given_name, (string_to_array(trim(name), ' '))[array_lower(string_to_array(trim(name), ' '), 1)]) as given_name,
		coalesce(last_name, (string_to_array(trim(name), ' '))[array_upper(string_to_array(trim(name), ' '), 1)]) as last_name, 
        (
			select row_to_json (agency)
			from (
				select * from agency where midas_user.agency_id = agency.agency_id
			) agency
		) as agency,
        (
			select row_to_json (bureau)
			from (
				select * from bureau where midas_user.bureau_id = bureau.bureau_id
			) bureau
		) as bureau,
        (select row_to_json (office)
			from (
				select * from office where midas_user.office_id = office.office_id
			) office
		) as office
    from midas_user inner join community_user on midas_user.id = community_user.user_id
    where midas_user.disabled = 'f' and community_user.community_id = ? 
)

select count(*) over() as full_count, * from users
[where clause]
order by [order by]
limit 25 offset ((? - 1) * 25);