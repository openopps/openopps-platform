# Save as Draft

Task creator view:
- User selects "Save draft"
- User stays on editing page.
- User receives notice stating that the draft has been saved.
- Edit page includes "Save draft" and "Submit for review" button.
- Edit Opportunity State, included "Submitted"
- Notification:
  - changing state to "Submitted" should trigger current notification
  - saving as draft for the first time, generates a one time email with a link to the draft -- based on the creation date and the updated date matching  (people really use the email notifications to find direct links to their tasks and as reminders about next steps)

Admin view:
- First tab "Submitted" allows admin to publish or delete a draft
- New *actual* "Draft" tab is in the far right
