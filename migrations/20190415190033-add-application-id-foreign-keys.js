'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return Promise.all([ 
    db.addForeignKey('application_task', 'application', 'application_task_application_id_foreign',
      {
        'application_id': 'application_id',
      },
      {
        onDelete: 'CASCADE',
      }),
    db.addForeignKey('experience', 'application', 'experience_application_id_foreign',
      {
        'application_id': 'application_id',
      },
      {
        onDelete: 'CASCADE',
      }),
    db.addForeignKey('reference', 'application', 'reference_application_id_foreign',
      {
        'application_id': 'application_id',
      },
      {
        onDelete: 'CASCADE',
      }),
    db.addForeignKey('education', 'application', 'education_application_id_foreign',
      {
        'application_id': 'application_id',
      },
      {
        onDelete: 'CASCADE',
      }),
    db.addForeignKey('application_language_skill', 'application', 'application_language_skill_application_id_foreign',
      {
        'application_id': 'application_id',
      },
      {
        onDelete: 'CASCADE',
      }),
    db.addForeignKey('application_skill', 'application', 'application_skill_application_id_foreign',
      {
        'application_id': 'application_id',
      },
      {
        onDelete: 'CASCADE',
      }),
  ]);
};

exports.down = function (db) {
  return Promise.all([ 
    db.removeForeignKey('application_task', 'application_task_application_id_foreign'),
    db.removeForeignKey('experience', 'experience_application_id_foreign'),
    db.removeForeignKey('reference', 'reference_application_id_foreign'),
    db.removeForeignKey('education', 'education_application_id_foreign'),
    db.removeForeignKey('application_language_skill', 'application_language_skill_application_id_foreign'),
    db.removeForeignKey('application_skill', 'application_skill_application_id_foreign'),
  ]);
};
