/**
 * SearchController
 *
 * @module		:: Controller
 * @description	:: Performs search functions for the front end
 */

var _ = require('underscore');
var async = require('async');
var projUtil = require('../services/utils/project');
var taskUtil = require('../services/utils/task');
var tagUtil = require('../services/utils/tag');

function search(target, req, res){
  //builds an array of task/project ids where search terms were found
  //   returns task / project(+counts) objects which are rendered by the calling page as cards
  //   search terms are ANDed
  //      if you put in foo and bar, only results with BOTH will return

  var results   = [];

  var modelProxy = null;
  if ( target == 'tasks' ){
    modelProxy=Task;
    modelWord = 'task';
  } else {
    modelProxy=Project;
    modelWord='project';
  }

  // make the query well formed
  var q = req.body;
  q.freeText = q.freeText || [];

  var freeTextSearch = function (search,cb) {
    //this is a temp solution
    // should be revisited once we are on sails 10
    // we are waiting for support of contains in an or-pair fragment in waterline

    var titleSqlFrag = descSqlFrag = "";

    _.each(search,function(term){
      if ( titleSqlFrag == "" ){
        titleSqlFrag = " title ilike '%"+term+"%'";
        descSqlFrag  = " description ilike '%"+term+"%'";
      } else {
        titleSqlFrag = titleSqlFrag+" and title ilike '%"+term+"%'";
        descSqlFrag = descSqlFrag+" and description ilike '%"+term+"%'";
      }
    });

    modelProxy.query("select distinct id from "+modelWord+" where "+titleSqlFrag+" or "+descSqlFrag+" order by id asc",function(err,data){
      var temp = _.map(data.rows,function(item,key){
        return item.id;
      });
      results.push.apply(results,temp);
      cb();
    });
  };

  var tagSearch = function (search, cb) {
    //this is a temp solution
    // should be revisited once we are on sails 10
    // we are waiting for support of contains in an or-pair fragment in waterline

    var sqlFrag = "";

    _.each(search,function(term){
      if ( sqlFrag == "" ){
        sqlOrFrag  = " name ilike '%"+term+"%'";
      } else {
        sqlOrFrag  = sqlOrFrag+" or name ilike '%"+term+"%'";
      }
    });

    TagEntity.query("select distinct id from TagEntity where "+sqlOrFrag+" order by id asc",function(err,data){
      var temp = _.map(data.rows,function(item,key){
        return item.id;
      });
      Tag.find({tagId: temp})
        .exec(function(err,foundTags){
          _.each(foundTags,function(tag,key){
            if ( target == 'tasks'){
              if ( !_.isNull(tag.taskId) ){
                results.push(tag.taskId);
              }
            } else {
              if ( !_.isNull(tag.projectId) ){
                results.push(tag.projectId);
              }
            }
          });;
        cb();
      });
    });
  };

  async.series([
    function(callback){
      freeTextSearch(q.freeText,function(err){
        //we're don't care about the callback behavior here, so discard it
        callback(null,null);
      });
    },
    function(callback){
      tagSearch(q.freeText,function(err){
        //we're don't care about the callback behavior here, so discard it
        callback(null,null);
      });
    }],
    function(err,trash){
    var items = [];

    //de-dupe
    results = _.uniq(results);

    if ( target == 'tasks' ){
      taskUtil.findTasks({id:results}, function (err, items) {
        if ( _.isNull(items) ){
          res.send([]);
        } else {
          res.send(items);
        }
      });
    } else {
      var items = [];
      //this each is required so we can add the counts which are need for project cards only
      async.each(results,
        function(id,fcb){
          Project.findOneById(id,function(err,proj){
            projUtil.addCounts(proj, function (err) {
              items.push(proj);
              fcb();
            });
          });
        },
        function(err){
          if ( _.isNull(items) ){
            res.send([]);
          } else {
            res.send(items);
          }
        });
    }
  });
};

module.exports = {

  index: function (req, res) {
    if (!req.body) {
      return res.send(400, { message: 'Need data to query' });
    }
    if ((req.body.target == 'projects') || (req.body.target == 'tasks')) {
      return search(req.body.target, req, res);
    }
    return res.send([]);
  },

};
