const _ = require('lodash');
var dao = require('postgres-gen-dao');

const attachmentQuery = 'select @attachment.*, @file.* ' +
'from @attachment attachment inner join @file file on attachment."fileId" = file.id ' +
'where attachment."taskId" = ? ';

const options = {
  attachment: {
    fetch: {
      file: '',
    },
  },
};

module.exports = function (db) {
  return {
    File: dao({ db: db, table: 'file' }),
    Attachment: dao({ db: db, table: 'attachment' }),
    query: {
      attachmentQuery: attachmentQuery,
    },
    options: options,
  };
};
