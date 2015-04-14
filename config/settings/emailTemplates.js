console.log('Loading... ', __filename);

module.exports = {

  // predefined emails and their default values
  emails: {
    'projectCommentParentReply': {
      layout: 'default',
      template: 'commentParentReply',
      subject: '<% if (commentUser.name) { %><%= commentUser.name %><% } else { %>Somebody<% } %> replied to your comment on <%= globals.systemName %>',
      templateLocals: { callerComment: '', parentComment: '', projectTitle: '', projectLink: '' },
      layoutLocals: { }
    },
    'projectCommentOwnerReply': {
      layout: 'default',
      template: 'commentOwnerReply',
      subject: '<%= project.title %> <% if (parentComment) { %>has a new comment<% } else { %>has a new discussion<% } %> on <%= globals.systemName %>',
      templateLocals: { callerComment: '', parentComment: '', projectTitle: '', projectLink: '' },
      layoutLocals: { }
    },
    'taskCommentParentReply': {
      layout: 'default',
      template: 'commentParentReply',
      subject: '<% if (commentUser.name) { %><%= commentUser.name %><% } else { %>Somebody<% } %> replied to your comment on <%= globals.systemName %>',
      templateLocals: { callerComment: '', parentComment: '', taskTitle: '', taskLink: '' },
      layoutLocals: { }
    },
    'taskCommentOwnerReply': {
      layout: 'default',
      template: 'commentOwnerReply',
      subject: '<%= task.title %> <% if (parentComment) { %>has a new comment<% } else { %>has a new discussion<% } %> on <%= globals.systemName %>',
      templateLocals: { callerComment: '', parentComment: '', taskTitle: '', taskLink: '' },
      layoutLocals: { }
    },
    'taskVolunteerAddedOwnerReply': {
      layout: 'default',
      template: 'taskVolunteerAddedOwnerReply',
      subject: '<% if (volunteer.name) { %><%= volunteer.name %><% } else { %>Someone<% } %> has volunteered for <%= task.title %> on <%= globals.systemName %>',
      templateLocals: { taskTitle: '', taskLink: '', profileLink: '', profileTitle: '', profileName: '', profileLocation: '', profileAgency: '' },
      layoutLocals: { }
    },
    'taskVolunteerAdded': {
      layout: 'default',
      template: 'taskVolunteerAdded',
      subject: 'Thanks for your interest in <%= task.title %>',
      templateLocals: { },
      layoutLocals: { }
    },
    'taskVolunteerRemoved': {
      layout: 'default',
      template: 'taskVolunteerRemoved',
      subject: 'An update on <%= task.title %>',
      templateLocals: { },
      layoutLocals: { }
    },
    'taskCreated': {
      layout: 'default',
      template: 'taskCreated',
      subject: 'New Opportunity Submission',
      templateLocals: { },
      layoutLocals: { }
    },
    'taskAssigned': {
      layout: 'default',
      template: 'taskAssigned',
      subject: 'You’ve been selected for <%= task.title %>!',
      templateLocals: { },
      layoutLocals: { }
    },
    'userPasswordResetEmail': {
      layout: 'default',
      template: 'userPasswordReset',
      subject: 'Reset your password on <%= globals.systemName %>',
      templateLocals: { },
      layoutLocals: { }
    },
    'contactUserAboutProject': {
      layout: 'default',
      template: 'contactUserAboutProject',
      subject: 'Take A Look At This Project',
      templateLocals: { projectLink: '', projectTitle: '', projectDescription: '' },
      layoutLocals: { }
    },
    'contactUserAboutTask': {
      layout: 'default',
      template: 'contactUserAboutTask',
      subject: 'Take A Look At This Opportunity',
      templateLocals: { opportunityLink: '', opportunityTitle: '', opportunityDescription: '', opportunityMadlibs: '' },
      layoutLocals: { }
    },
    'contactUserAboutProfile': {
      layout: 'default',
      template: 'contactUserAboutProfile',
      subject: 'Take A Look At This Profile',
      templateLocals: { profileLink: '', profileTitle: '', profileName: '', profileLocation: '', profileAgency: '' },
      layoutLocals: { }
    },
    'welcomeUser': {
      layout: 'default',
      template: 'welcomeUser',
      subject: 'Welcome to <%=globals.systemName %>',
      templateLocals: { },
      layoutLocals: { }
    }
  }

};
