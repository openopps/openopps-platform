const jobs = {
  'dos-application-due': require('./state.department/application-due'),
};

const undefinedJob = {
  name: 'JOB NOT FOUND',
  description: 'JOB NOT FOUND',
  getNotificationData: function () {},
  status: function () {
    return this.name;
  },
}

module.exports = {
  /**
   * @param {string} key
   * @returns {Object} a job
   */
  getJob: function (key) {
    return jobs[key] || undefinedJob;
  },
  /**
   * @returns {Array<Object>}
   */
  listJobs: function () {
    return Object.keys(jobs).map((key) => {
      return {
        job: key,
        name: jobs[key].name,
        description: jobs[key].description,
      };
    })
  },
};