select 
    id, government_uri, username, "createdAt", "isAdmin", is_approver, disabled, 
    agency_id, "isAgencyAdmin", hiring_path, last_login, id, name,
    coalesce(given_name, (string_to_array(trim(name), ' '))[array_lower(string_to_array(trim(name), ' '), 1)]) as given_name,
    coalesce(last_name, (string_to_array(trim(name), ' '))[array_upper(string_to_array(trim(name), ' '), 1)]) as last_name, 
    (
        select row_to_json (agency)
        from (
            select * from agency where midas_user.agency_id = agency.agency_id
        ) agency
    ) as agency
from midas_user
where midas_user.id = ?;