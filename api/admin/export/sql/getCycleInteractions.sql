
select cycle.name as name, count(CASE when current_step = 0 and submitted_at is null THEN 1 ELSE NULL end) as "step0NextStepTotal", 
count(CASE when current_step = 1 and submitted_at is null THEN 1 ELSE NULL end) as "step1SelectInternshipTotal", 
 count(CASE when current_step = 2 and submitted_at is null THEN 1 ELSE NULL end) as "step2ExpRefTotal",
 count(CASE when current_step = 3 and submitted_at is null THEN 1 ELSE NULL end) as "step3EducationTotal", 
 count(CASE when current_step = 4 and submitted_at is null THEN 1 ELSE NULL end) as "step4LanguageTotal", 
  count(CASE when current_step = 5 and submitted_at is null THEN 1 ELSE NULL end) as "step5StatementTotal", 
  count(CASE when current_step = 6 and submitted_at is null THEN 1 ELSE NULL end) as "step6ReviewTotal", 
  count(CASE when internship_completed_at is not null then 1 ELSE NULL end) as "InternshipCompleteTotal", 
  count(CASE when submitted_at is not null then 1 ELSE NULL end) as "submittedTotal",
  count(case when task_list.title = 'Primary' then 1 else null end) as "PrimaryCount", 
  count(case when task_list.title = 'Alternate' then 1 else null end) as "AlternateCount"
 from application app left join task_list_application tla on app.application_id = tla.application_id 
 left join task_list on tla.task_list_id = task_list.task_list_id 
 left join cycle on app.cycle_id = cycle.cycle_id
 where app.community_id = ? group by cycle.cycle_id
    order by cycle.name
   

   