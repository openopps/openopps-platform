console.log('Loading... ', __filename);

// NOTIFICATION SETTINGS
module.exports = {
  // service functions called to produce the given audience
  audiences : {
    'everyone' : {
      method: 'findAllUsers'
    },
    'user' : {
      method: 'findUser'
    },
    // project audiences
    'projectOwners' : {
      method: 'findProjectOwners'
    },
    'projectParticipants' : {
      method: 'findProjectParticipants'
    },
    'projectLikers' : {
      method: 'findProjectLikers'
    },
    'projectThreadCommenters' : {
      method: 'findProjectThreadParentCommenters'
    },
    // task audiences
    'taskOwners' : {
      method: 'findTaskOwners'
    },
    'taskVolunteer' : {
      method: 'findTaskVolunteer'
    },
    'taskParticipants' : {
      method: 'findTaskParticipants'
    },
    'taskLikers' : {
      method: 'findTaskLikers'
    },
    'taskThreadCommenters' : {
      method: 'findTaskThreadParentCommenters'
    }
  },
  // Defines preflight delivery-building functions
  preflights: {
    'preflightProjectCommentReplyParent': {
      method: 'prepareCommentReplyEmail',
      settings: {
        emailName: 'projectCommentParentReply'
      }
    },
    'preflightProjectCommentReplyOwner': {
      method: 'prepareCommentReplyEmail',
      settings: {
        emailName: 'projectCommentOwnerReply'
      }
    },
    'preflightTaskCommentReplyParent': {
      method: 'prepareCommentReplyEmail',
      settings: {
        emailName: 'taskCommentParentReply'
      }
    },
    'preflightTaskCommentReplyOwner': {
      name: 'taskCommentReplyOwnerPrepare',
      method: 'prepareCommentReplyEmail',
      settings: {
        emailName: 'taskCommentOwnerReply'
      }
    },
    'preflightTaskVolunteer': {
      method: 'prepareTaskVolunteer',
      settings: {
        emailName: 'taskVolunteerAdded'
      }
    },
    'preflightTaskVolunteerRemoved': {
      method: 'prepareTaskVolunteerRemoved',
      settings: {
        emailName: 'taskVolunteerRemoved'
      }
    },
    'preflightTaskCreated': {
      method: 'prepareWelcomeUserEmail',
      settings: {
        emailName: 'taskCreated'
      }
    },
    'preflightTaskAssigned': {
      method: 'prepareTaskAllVolunteers',
      settings: {
        emailName: 'taskAssigned'
      }
    },
    'preflightUserPasswordReset': {
      method: 'prepareUserPasswordResetEmail',
      settings: {
        emailName: 'userPasswordResetEmail'
      }
    },
    'preflightWelcomeUser': {
      method: 'prepareWelcomeUserEmail',
      settings: {
        emailName: 'welcomeUser'
      }
    },
    'bypass': {
      name: 'bypass',
      method: 'passThrough',
      settings: {}
    }
  },
  // defines delivery functions
  deliveries: {
    'sendSimpleEmail': {
      name: 'sendSimpleEmail',
      method: 'sendSimpleEmail'
    },
    'bypass': {
      name: 'bypass',
      method: 'bypass'
    }
  },
  // defines trigger route configuration to respond correctly to action triggers
  triggerRoutes : {
    'globalBlast': {
      audience:{
        'everyone': {
          strategy: {
            'contactEmail': {
              preflight: ['bypass'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    },
    'directUserEmailRequestFromCard': {
      audience:{
        'user': {
          strategy: {
            'contactEmail': {
              preflight: ['bypass'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    },
    'userPasswordReset': {
      audience:{
        'user': {
          strategy: {
            'userPasswordReset': {
              preflight: ['preflightUserPasswordReset'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    },
    'welcomeUser': {
      audience:{
        'user': {
          strategy: {
            'welcomeUser': {
              preflight: ['preflightWelcomeUser'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    },
    'projectCommentAdded': {
      audience:{
        'projectOwners': {
          strategy: {
            'contactProjectOwnersOnCommentEmail': {
              preflight: ['preflightProjectCommentReplyOwner'],
              delivery: 'sendSimpleEmail'
            }
          }
        },
        'projectThreadCommenters': {
          strategy: {
            'contactProjectCommentParentOnCommentEmail': {
              preflight: ['preflightProjectCommentReplyParent'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    },
    'taskCommentAdded': {
      audience:{
        'taskOwners': {
          strategy: {
            'contactTaskOwnersOnCommentEmail': {
              preflight: ['preflightTaskCommentReplyOwner'],
              delivery: 'sendSimpleEmail'
            }
          }
        },
        'taskThreadCommenters': {
          strategy: {
            'contactTaskCommentParentOnCommentEmail': {
              preflight: ['preflightTaskCommentReplyParent'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    },
    'taskVolunteerAdded': {
      audience:{
        'taskVolunteer': {
          strategy: {
            'contactTaskOwnersOnVolunteerEmail': {
              preflight: ['preflightTaskVolunteer'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    },
    'taskVolunteerRemoved': {
      audience:{
        'taskVolunteer': {
          strategy: {
            'contactTaskOwnersOnVolunteerRemovedEmail': {
              preflight: ['preflightTaskVolunteerRemoved'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    },
    'taskCreated': {
      audience:{
        'user': {
          strategy: {
            'contactTaskOwnersOnVolunteerEmail': {
              preflight: ['preflightTaskCreated'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    },
    'taskAssigned': {
      audience:{
        'user': {
          strategy: {
            'contactTaskOwnersOnVolunteerEmail': {
              preflight: ['preflightTaskAssigned'],
              delivery: 'sendSimpleEmail'
            }
          }
        }
      }
    }
  }
};
