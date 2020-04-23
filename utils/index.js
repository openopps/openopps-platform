const _ = require ('lodash');

module.exports = {
  trimProperties: function (object) {
    if(_.isString(object)) {
      return _.trim(object);
    } else if(_.isArray(object)) {
      return object.map(item => {
        return this.trimProperties(item);
      });
    } else if(_.isObject(object) && !_.isDate(object) && !_.isFunction(object)) {
      Object.keys(object).forEach(key => {
        object[key] = this.trimProperties(object[key]);
      });
      return object;
    } else {
      return object;
    }
  },
  validatePassword: function (password, username) {
    var notUsername = password.toLowerCase().trim() !== username.split('@',1)[0].toLowerCase().trim();
    var minLength = password.length >= 8;
    var lowercase = /[a-z]/.test(password);
    var uppercase = /[A-Z]/.test(password);
    var number = /[0-9]/.test(password);
    var symbol = /[^\w\s]/.test(password);
    return (notUsername && minLength && lowercase && uppercase && number && symbol);
  },
  badgeDescriptions: {
    // should be able to follow "You are awared this badge because you "
    // for email notifications

    // <type: description>
    'newcomer': 'have completed your first task.',
    'maker': 'have completed three tasks.',
    'game changer': 'have completed five tasks.',
    'disruptor': 'have completed ten tasks.',
    'partner': 'have completed fifteen tasks.',
    'mentor': 'have created your first ongoing task.',
    'instigator': 'have created your first one-time task.',
    'team builder': 'have accepted at least four people on a task.',
  
    // the badges below have yet to be implemented
    'local': 'have completed 2 tasks for one agency.',
    'explorer': 'have completed a task for your second agency.',
    'connector': 'have completed a task for your third agency.',

    // community manager
    'community manager' :'have community manager role',
  },
};
