const fs = require('fs');
const db = require('../../../../db/client');

module.exports = {
  name: 'U.S. Department of State Student Internship Program (Unpaid) application deadline reminder',
  description: 'Sends an email to to applicants who have not completed their application if the closing date of the apply cycle is within three days.',
  getNotificationData: function () {
    return new Promise((resolve, reject) => {
      fs.readFile(__dirname + '/../../sql/getApplicationsDue.sql', 'utf8', (err, applicationsDueQuery) => {
        if (err) {
          reject(err);
        } else {
          db.query(applicationsDueQuery).then(async results => {
            resolve(results.rows.map(result => {
              return {
                action: 'state.department/internship.application.due',
                model: {
                  user: {
                    username: result.username,
                    name: result.given_name,
                  },
                  apply_end_date: result.apply_end_date,
                  application_id: result.application_id,                 
                },
                layout: 'state.department/layout.html',
              };
            }));
          }).catch(reject);
        }
      });
    });
  },
  /**
   * Get status of last scheduled run.
   */
  status: function () {
  },
}