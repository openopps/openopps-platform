const _ = require('lodash');
const dao = require('postgres-gen-dao');

const volunteerQuery = 'select ' +
'task.id, task.title, volunteer."userId", midas_user.name as ownername, midas_user.bounced as bounced, ' +
'midas_user.username as ownerusername, m2.name as name, m2.username as username ' +
'from volunteer inner join task on volunteer."taskId" = task.id ' +
'inner join midas_user on midas_user.id = task."userId" ' +
'inner join midas_user m2 on m2.id = volunteer."userId" ' +
'where volunteer.id = ? ';

const assignedVolunteerQuery = 'select ' +
'volunteer."userId", midas_user.name, midas_user.bounced, midas_user.username ' +
'from volunteer ' +
'inner join midas_user on midas_user.id = volunteer."userId" ' +
'where volunteer.id = ? ';

const lookupVolunteerQuery = 'select volunteer.id ' +
'from volunteer ' +
'join midas_user on midas_user.id = volunteer."userId" ' +
'where midas_user.id = ? and volunteer."taskId" = ? ';

const userAgencyQuery = 'select @midas_user.*, @agency.* ' +
'from @midas_user ' +
'inner join @agency on agency.agency_id = midas_user.agency_id ' +
'where midas_user.id = ? ';

const options = {
  user: {
    fetch: {
      agency: '',
    },
    exclude: {
      midas_user: [ 'deletedAt', 'createdAt', 'updatedAt', 'passwordAttempts', 'disabled' ],
    },
  },
};

module.exports = function (db) {
  return {
    Agency: dao({ db: db, table: 'agency '}),
    Task: dao({ db: db, table: 'task' }),
    User: dao({ db: db, table: 'midas_user '}),
    Volunteer: dao({ db: db, table: 'volunteer' }),
    query: {
      volunteer: volunteerQuery,
      lookupVolunteer: lookupVolunteerQuery,
      user: userAgencyQuery,
      assignedVolunteer: assignedVolunteerQuery,
    },
    options: options,
  };
};
