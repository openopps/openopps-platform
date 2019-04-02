const db = require('../../../db');
const dao = require('./dao')(db);
const faker = require('faker');
const moment = require('moment');

var service = {};

service.generateFakeData = async function(user, params) {
    if (params.numberOfTasks < 3) {
        return { 'error': 'Number of tasks must be greater or equal than 3' };
    }
    var community = (await dao.Community.find('community_name = ?', params.community || 'U.S. Department of State Student Internship Program (Unpaid)'))[0];
    if (community == null) {
        return { 'error': 'No community passed in' };
    }
    var results = {users: []};
    var newCycle = {
        name: params.cycle || faker.company.companyName() + '_faker',
        posting_start_date: params.postingStartDate || moment().subtract(30, 'days'),
        posting_end_date: params.postingEndDate || moment().subtract(1, 'days'),
        apply_start_date: params.applyStartDate || moment().subtract(30, 'days'),
        apply_end_date: params.applyEndDate || moment().subtract(1, 'days'),
        cycle_start_date: params.cycleStartDate || moment().add(7, 'days'),
        cycle_end_date: params.cycleEndDate || moment().add(1, 'second'),
        community_id: community.communityId,
        created_at: new Date,
        updated_at: new Date,
        updated_by: user.id          
    }
    var cycle = await dao.Cycle.insert(newCycle);
    results.cycle = cycle;

    var locations = (await dao.Task.db.query(dao.query.countryData)).rows;
    var bureaus = (await dao.Task.db.query(dao.query.bureauData)).rows;
    var languages = await dao.Language.find('is_disabled = false');
    var languageProficiencyList = await dao.LookupCode.find('lookup_code_type = ?', 'LANGUAGE_PROFICIENCY');
    var availableTaskSkills = await dao.TagEntity.query(`
        select tag.id 
        from tagentity_tasks__task_tags tags inner join tagentity tag on tags.tagentity_tasks = tag.id
        where tag.type = 'skill'
    `);

    results.task = [];

    for (var a = 0; a < params.numberOfTasks; a++) {
        var loc = faker.random.arrayElement(locations);
        var bureau = faker.random.arrayElement(bureaus);

        var newTask = {
            state: "open",
            userId: user.id,
            title: faker.company.bs(),
            description: faker.lorem.paragraph(),
            createdAt: new Date,
            updatedAt: new Date,
            publishedAt: new Date,
            submittedAt: new Date,
            restrict: "{}",
            accepting_applicants: true,
            updatedBy: user.id,
            details: faker.company.catchPhrase(),
            about: faker.lorem.paragraphs(2),
            community_id: community.communityId,
            agency_id: user.agency_id,
            country_id: loc.country_id,
            country_subdivision_id: loc.country_subdivision_id,
            city_name: faker.address.city(),
            interns: faker.random.number({ min: 1,  max: 30}),
            cycle_id: cycle.cycleId,
            bureau_id: bureau.bureau_id,
            office_id: bureau.office_id,
            gpa_weight: 1.0,
            random_weight: 1.0
        }
        var task = await dao.Task.insert(newTask);
        results.task.push(task);

        var lanCount = faker.random.number({min: 0, max: 8});
        task.language = [];
        for (var b=0; b < lanCount; b++) {           
            var language = {
                task_id: task.id,
                language_id: faker.random.arrayElement(languages).languageId,
                speaking_proficiency_id: faker.random.arrayElement(languageProficiencyList).lookupCodeId,
                writing_proficiency_id: faker.random.arrayElement(languageProficiencyList).lookupCodeId,
                reading_proficiency_id: faker.random.arrayElement(languageProficiencyList).lookupCodeId,
                created_at: new Date,
                updated_at: new Date,
                weight_factor: 1
            }
            await dao.LanguageSkill.insert(language);
            task.language.push(language);
        }

        task.skill = [];
        var skillCount = faker.random.number({min: 0, max: 5});
        for (var c=0; c < skillCount; c++) {
            var skill = {
                tagentity_tasks: faker.random.arrayElement(availableTaskSkills).id,
                task_tags: task.id
            }

            await dao.TaskTag.insert(skill);
            task.skill.push(skill);
        }
    }

    var availableSkills = await dao.TagEntity.query(`
        select tag.id 
        from tagentity_users__user_tags tags inner join tagentity tag on tags.tagentity_users = tag.id
        where tag.type = 'skill'
    `);

    var securityClearanceList = await dao.LookupCode.find('lookup_code_type = ?', 'SECURITY_CLEARANCE');
    var referenceTypeList = await dao.LookupCode.find('lookup_code_type = ?', 'REFERENCE_TYPE');
    var degreeLevelList = await dao.LookupCode.find('lookup_code_type = ?', 'DEGREE_LEVEL');
    var honorsList = await dao.LookupCode.find('lookup_code_type = ?', 'HONORS');
    var experienceTypes = ['Student','Dependent','Peace Corps','Military','Government','Other'];

    for (var i = 0; i < params.numberOfApplicants; i++)
    {
        var midas_user = {
            username: faker.internet.email() + i,
            name: faker.name.findName(),
            bio: 'Created by Faker',
            isAdmin: false,
            disabled: false,
            linked_id: '200001662',
            government_uri: '',
            hiring_path: 'student',
            createdAt: new Date,
            updatedAt: new Date,
            given_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            is_us_citizen: true
        }
        var user = await dao.User.insert(midas_user);
        results.users.push(midas_user);
        
        var application = {
            user_id: user.id,
            statement_of_interest: faker.company.bs(),
            is_consent_to_share: faker.random.boolean(),
            has_overseas_experience: faker.random.boolean(),           
            has_security_clearance: faker.random.boolean(),
            created_at: new Date,
            updated_at: new Date,
            submitted_at: new Date,
            community_id: community.communityId,
            cycle_id: cycle.cycleId,
            is_currently_enrolled: faker.random.boolean(),
            is_minimum_completed: faker.random.boolean(),
            is_education_continued: faker.random.boolean(),
            cumulative_gpa: faker.finance.amount(3.5, 4.0, 1),
            current_step: 0,
            has_vsfs_experience: faker.random.boolean(),
            transcript_id: null,
            transcript_name: null
        }
       
        application.security_clearance_id = application.has_security_clearance ? faker.random.arrayElement(securityClearanceList).lookupCodeId : null;
        application.security_clearance_issuer = application.has_security_clearance ? faker.company.companyName() : null;
        application.overseas_experience_types = application.has_overseas_experience ? faker.helpers.shuffle(experienceTypes).slice(0, faker.random.number({min: 1, max: 6})) : null;        
        application.overseas_experience_length = application.has_overseas_experience ? faker.random.words(4) : '';
        application.overseas_experience_other = application.overseas_experience_types !== null && application.overseas_experience_types.indexOf('Other') > -1 ? faker.name.title() : '';

        var applicationResult = await dao.Application.insert(application);
        midas_user.application = applicationResult;
      
        var ranNum = faker.random.number( {min: 0, max: results.task.length });
        var taskArr = [];
        for (var d=0; d < 3; d++) {
            if (ranNum + d >= results.task.length) {
                ranNum = 0;
            }
            taskArr.push(results.task[ranNum + d]);       
        }
        taskArr = faker.helpers.shuffle(taskArr);

        midas_user.applicationTask = [];
        for (var j=0; j < 3; j++) {
            var applicationTask = {
                application_id: applicationResult.applicationId,
                user_id: midas_user.id,
                task_id: taskArr[j].id,
                sort_order: j + 1,
                created_at: new Date,
                updated_at: new Date,
                is_removed: false
            }

            await dao.ApplicationTask.insert(applicationTask);
            midas_user.applicationTask.push(applicationTask);
        }

        midas_user.experience = [];
        var expCount = faker.random.number({min: 0, max: 3});
        for (var k=0; k < expCount; k++) {
            var loc = faker.random.arrayElement(locations);

            var exp = {
                application_id: applicationResult.applicationId,
                user_id: midas_user.id,
                country_id: loc.country_id,
                country_subdivision_id: loc.country_subdivision_id,
                address_line_one: faker.address.streetAddress(),
                address_line_two: null,
                city_name: faker.address.city(),
                postal_code: faker.address.zipCode(),
                duties: faker.company.bs(),
                employer_name: faker.company.companyName(),
                formal_title: faker.name.jobTitle(),
                start_date: faker.date.past(),
                created_at: new Date,
                updated_at: new Date                    
            }

            if (k == 0) {
                exp.is_present = true;
                exp.end_date = null;
            } else {
                exp.is_present = false;
                exp.end_date = faker.date.between(exp.start_date, new Date);                
            }

            await dao.Experience.insert(exp);
            midas_user.experience.push(exp);
        }
        
        midas_user.reference = [];
        var refCount = faker.random.number({min: 0, max: 3});
        for (var l=0; l < refCount; l++) {
            var ref = {
                application_id: applicationResult.applicationId,
                user_id: midas_user.id,
                reference_type_id: faker.random.arrayElement(referenceTypeList).lookupCodeId,
                reference_name: faker.name.findName(),
                reference_employer: faker.company.companyName(),
                reference_title: faker.name.title(),
                reference_phone: faker.phone.phoneNumber(),
                reference_email: faker.internet.email(),
                is_reference_contact: faker.random.boolean(),
                created_at: new Date,
                updated_at: new Date    
            }

            await dao.Reference.insert(ref);
            midas_user.reference.push(ref);
        }

        midas_user.education = [];
        var eduCount = faker.random.number({min: 1, max: 3});
        for (var m=0; m < eduCount; m++) {
            var loc = faker.random.arrayElement(locations);

            var edu = {
                application_id: applicationResult.applicationId,
                user_id: midas_user.id,
                school_name: faker.company.companyName(),
                city_name: faker.address.city(),
                postal_code: faker.address.zipCode(),
                country_id: loc.country_id,
                country_subdivision_id: loc.country_subdivision_id,
                degree_level_id: faker.random.arrayElement(degreeLevelList).lookupCodeId,
                completion_month: faker.random.number({min: 1, max: 12}),
                completion_year: faker.random.number({min: 1965, max: 2019}),
                major: faker.company.catchPhrase(),
                minor: faker.company.catchPhraseDescriptor(),
                gpa: faker.finance.amount(3.5, 4.0, 1),
                gpa_max: '4.0',
                total_credits_earned: faker.random.number({min: 0, max: 120}),
                credit_system: faker.lorem.word(),
                honors_id: faker.random.arrayElement(honorsList).lookupCodeId,
                course_work: faker.lorem.paragraphs(),
                created_at: new Date,
                updated_at: new Date                  
            }

            await dao.Education.insert(edu);
            midas_user.education.push(edu);
        }

        midas_user.language = [];
        var lanCount = faker.random.number({min: 0, max: 8});
        for (var n=0; n < lanCount; n++) {
            var language = {
                application_id: applicationResult.applicationId,
                user_id: midas_user.id,
                language_id: faker.random.arrayElement(languages).languageId,
                speaking_proficiency_id: faker.random.arrayElement(languageProficiencyList).lookupCodeId,
                writing_proficiency_id: faker.random.arrayElement(languageProficiencyList).lookupCodeId,
                reading_proficiency_id: faker.random.arrayElement(languageProficiencyList).lookupCodeId,
                created_at: new Date,
                updated_at: new Date  
            }

            await dao.ApplicationLanguageSkill.insert(language);
            midas_user.language.push(language);
        }

        midas_user.skill = [];
        var skillCount = faker.random.number({min: 0, max: 5});
        for (var o=0; o < skillCount; o++) {
            var skill = {
                application_id: applicationResult.applicationId,
                skill_id: faker.random.arrayElement(availableSkills).id,
                user_id: midas_user.id,
                created_at: new Date
            }

            await dao.ApplicationSkill.insert(skill);
            midas_user.skill.push(skill);
        }
    }
    return results;
}

service.deleteFakeData = async function(params) {
    return await db.transaction(function* () {
        yield dao.ApplicationSkill.query(`
            delete from application_skill 
            where application_id in (
                select application_id 
                from application 
                where cycle_id = ?
            )
        `, params.cycleId);
        yield dao.ApplicationLanguageSkill.query(`
            delete from application_language_skill 
            where application_id in (
                select application_id 
                from application 
                where cycle_id = ?
            );
        `, params.cycleId);
        yield dao.Education.query(`
            delete from education 
            where application_id in (
                select application_id 
                from application 
                where cycle_id = ?
            );
        `, params.cycleId);
        yield dao.Reference.query(`
            delete from reference 
            where application_id in (
                select application_id 
                from application 
                where cycle_id = ?
            );
        `, params.cycleId);
        yield dao.Experience.query(`
            delete from experience 
            where application_id in (
                select application_id 
                from application 
                where cycle_id = ?
            );
        `, params.cycleId);
        yield dao.ApplicationTask.query(`
            delete from application_task 
            where application_id in (
                select application_id 
                from application 
                where cycle_id = ?
            );
        `, params.cycleId);
        yield dao.Application.query(`
            delete from application 
            where cycle_id = ?
        `, params.cycleId);
        yield dao.User.query(`
            delete from midas_user
            where bio = 'Created by Faker'
            and id not in (select user_id from application)
        `);
        yield dao.TaskTag.query(`
            delete from tagentity_tasks__task_tags
            where task_tags in (
                select id
                from task
                where cycle_id = ?
            );
        `, params.cycleId);
        yield dao.LanguageSkill.query(`
            delete from language_skill
            where task_id in (
                select id
                from task
                where cycle_id = ?
            );
        `, params.cycleId);
        yield dao.Task.query(`
            delete from task
            where cycle_id = ?      
        `, params.cycleId);
        yield dao.Cycle.query(`   
            delete from cycle
            where cycle_id = ?        
        `, params.cycleId);
    }).then(async () => {
        return true;
    }).catch((err) => {
        return false;
    });
}

service.deleteBoardData = async function(taskId) {
   return await db.transaction(function* () {
        yield dao.TaskList.query(`delete from task_list where task_id = ?`, taskId);
        yield dao.TaskListApplication.query(`
            delete from task_list_application 
            where task_list_id in (
                select task_list_id from task_list where task_id = ?
            )`, taskId);
    }).then(async () => {
        return true;
    }).catch((err) => {
        return false;
    });
}

module.exports = service;