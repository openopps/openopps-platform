const _ = require('underscore');

const ApplyTemplate = require('../templates/apply_summary_template.html');
const ProcessFlowTemplate = require('../templates/process_flow_template.html');
const ApplyAddEducationTemplate = require('../templates/apply_add_education_template.html');
const ApplyEducationTemplate = require('../templates/apply_education_template.html');
const ApplyAddExperienceTemplate = require('../templates/apply_add_experience_template.html');
const ApplyExperienceTemplate = require('../templates/apply_experience_template.html');
const ApplyAddLanguageTemplate = require('../templates/apply_add_language_template.html');
const ApplyLanguageTemplate = require('../templates/apply_language_template.html');
const ApplyAddReferenceTemplate = require('../templates/apply_add_reference_template.html');
const ApplyAddSkillTemplate = require('../templates/apply_add_skill_template.html');
const ApplyIneligibleCitizenshipTemplate = require('../templates/apply_ineligible_citizenship_template.html');
const ApplyIneligibleEducationTemplate = require('../templates/apply_ineligible_education_template.html');
const ApplyProgramTemplate = require('../templates/apply_program_template.html');
const ApplyReviewTemplate = require('../templates/apply_review_template.html');
const ApplyStatementTemplate = require('../templates/apply_statement_template.html');
const SubmittedApplicationTemplate = require('../templates/submitted_application_template.html');
var ApplyEducationPreviewTemplate = require('../templates/apply_education_preview_template.html');
const ApplyTranscriptTemplate=require('../templates/apply_transcript_template.html');
const ApplyExperiencePreviewTemplate = require('../templates/apply_experience_preview_template.html');
const ApplySubmittedMessagesAplicationReceivedTemplate =require('../templates/apply_submitted_messages_application_received.html');
const ApplySubmittedMessagesSelectedTemplate = require('../templates/apply_submitted_messages_selected.html');
const ApplySubmittedMessagesAlternateTemplate = require('../templates/apply_submitted_messages_alternate.html');
const ApplySubmittedMessagesNotSelectedTemplate = require('../templates/apply_submitted_messages_not_selected.html');
const ApplySubmittedSelectedInternshipTemplate = require('../templates/apply_submitted_selected_internship.html');

var templates = {
  main: _.template(ApplyTemplate),
  processflow: _.template(ProcessFlowTemplate),
  applyAddEducation: _.template(ApplyAddEducationTemplate),
  applyEducation: _.template(ApplyEducationTemplate),
  applyAddExperience: _.template(ApplyAddExperienceTemplate),
  applyExperience: _.template(ApplyExperienceTemplate),
  applyAddLanguage: _.template(ApplyAddLanguageTemplate),
  applyLanguage: _.template(ApplyLanguageTemplate),
  applyAddReference: _.template(ApplyAddReferenceTemplate),
  applyAddSkill: _.template(ApplyAddSkillTemplate),
  applyIneligibleCitizenship: _.template(ApplyIneligibleCitizenshipTemplate),
  applyIneligibleEducation: _.template(ApplyIneligibleEducationTemplate),
  applyProgram: _.template(ApplyProgramTemplate),
  applyReview: _.template(ApplyReviewTemplate),
  applyStatement: _.template(ApplyStatementTemplate),
  submittedApplication: _.template(SubmittedApplicationTemplate),
  applyeducationPreview:_.template(ApplyEducationPreviewTemplate),
  applyTranscript:_.template(ApplyTranscriptTemplate),
  applyExperiencePreview:_.template(ApplyExperiencePreviewTemplate),
  applySubmittedApplicationReceived :_.template(ApplySubmittedMessagesAplicationReceivedTemplate),
  applySubmittedSelected :_.template(ApplySubmittedMessagesSelectedTemplate),
  applySubmittedAlternate :_.template(ApplySubmittedMessagesAlternateTemplate),
  applySubmittedNotSelected :_.template(ApplySubmittedMessagesNotSelectedTemplate),
  applySubmittedSelectedInternship : _.template(ApplySubmittedSelectedInternshipTemplate),
};

templates.getTemplateForStep = function (step) {
  return [
    templates.main,
    templates.applyProgram,
    templates.applyExperience,
    templates.applyEducation,
    templates.applyLanguage,
    templates.applyStatement,
    templates.applyReview,
  ][step];
};

module.exports = templates;