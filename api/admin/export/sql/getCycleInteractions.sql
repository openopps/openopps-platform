
select cycle.name as name, count(CASE when current_step = 0 THEN 1 ELSE NULL end) as "step0NextStepTotal", 
count(CASE when current_step = 1 THEN 1 ELSE NULL end) as "step1SelectInternshipTotal", 
 count(CASE when current_step = 2 THEN 1 ELSE NULL end) as "step2ExpRefTotal",
 count(CASE when current_step = 3 THEN 1 ELSE NULL end) as "step3EducationTotal", 
 count(CASE when current_step = 4 THEN 1 ELSE NULL end) as "step4LanguageTotal", 
  count(CASE when current_step = 5 THEN 1 ELSE NULL end) as "step5StatementTotal", 
  count(CASE when current_step = 6 THEN 1 ELSE NULL end) as "step6ReviewTotal", 
  count(CASE when internship_completed_at is not null then 1 ELSE NULL end) as "InternshipCompleteTotal", 
  count(CASE when submitted_at is not null then 1 ELSE NULL end) as "submittedTotal"
  from application
  left join cycle on application.cycle_id = cycle.cycle_id
 where application.community_id = ? group by cycle.cycle_id
    order by cycle.name
   