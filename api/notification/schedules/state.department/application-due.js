module.exports = {
  name: 'U.S. Department of State Student Internship Program (Unpaid) application deadline reminder',
  description: 'Sends an email to to applicants who have not completed their application if the closing date of the apply cycle is within three days.',
  run: function () {
    // TODO: Query database for applications due in three days
    // TODO: Send notification in batches of 20 per second
  },
  /**
   * Get status of last scheduled run.
   */
  status: function () {
  },
}