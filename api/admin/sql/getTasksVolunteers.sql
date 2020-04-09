select volunteer.id, volunteer."userId", volunteer.selected, 
  volunteer."taskComplete", midas_user.name, midas_user.username, midas_user.government_uri as "governmentUri", midas_user.bounced, midas_user."photoId" 
  from volunteer
  join midas_user on midas_user.id = volunteer."userId" 
  where midas_user.disabled = false and volunteer."taskId" = ?