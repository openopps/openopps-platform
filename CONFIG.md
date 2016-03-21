Configuration
=====

## Customizing UI Text

We use an internationalization approach for customizing product text.  Keys and associated translation strings are stored in ```assets/locales/<language>/translation.json```

* Use ‘data-i18n’ tag in HTML elements to set the key used for retrieving internationalized text.
* Call the i18n() function on a JQuery element to recursively translate the element and its sub-elements. Typically done in the render function of a view, after setting the HTML for the element.
* Other messages can be translated by requiring the i18next module and calling the t() function, passing the translation key and optionally default text to use if the key is not found.
* Use $t(‘<key>’) to embed a translation for <key> within another translation string.
* Configuration options are in assets/js/backbone/config/i18n.json and in config/i18next.js. (Only an example server-side configuration, config/i18next.ex.js, is included in the repo.)

See [i18next](http://i18next.com/) for more information on configuration and use.


## Customizing UI

edit ```assets/js/backbone/config/ui.json``` which allows customization of UI features. Currently you can configure the following features:

### Hide Projects

It is possible to turn off the ability to have Projects (which serve as a way to group Opportunities/tasks).  To hide the project UI, simply change "show" to ```false```.

```
{
  "project": {
    "show": true
  }
}
```

### Full Time Detail Sample Text

When the user creates or edits a task and selects "Full Time Detail" in Step 1 (What type of effort is needed?), the sample text will be added to the task description, if there was no previous description text. There is also an extra link available (Show Default Description) that shows the sample text once it is clicked. The link is not available if the 'Full Time Detail' sample text is not setup.

The value of the description field supports markdown with links and formatting. The description field in the ui.json config file does not support a multiline string; newlines should be escaped as \n.

```
{
  "fullTimeDetail": {
    "description": "Default description **Full Time Detail**.... \n\n_Awesome!_\n\nLinks are also supported: [i18next](http://i18next.com/)."
  }
}
```


## Bulk Import of Tag Data

Bulk import of tags can be done via ```tagTool``` in the tools directory. It can be called like:
```
node tools\tagtool\tagtool.js <tagType> <tagFile>
<tagType>: location, agency, topic, skill, etc
<tagFile>: Filepath/name of file containing newline delimited tags one per line.
```
Database configuration for the tool is pulled from config/local.js. Duplicate tags will not be inserted.

tagTool can also be run from ```grunt```. Running ```grunt initTags``` will run the tool for all files with a .txt extension in tools\tagtool, using the file's name (without extension) as the ```tagType```.


## Configuring Opportunity and Project States

The state of a Project or Opportunity controls it's visibility in certain views and what funcitonality is available. The states currently supported are:

* Open - open for volunteering and discussions, this is the default state
* Assigned - a volunteer has been assigned, discussion is still open
* Archived - closed in a incomplete or unstarted state, no volunteers or discussion
* Completed - closed in a finished state, no volunteers or discussion

These states are listed in ```assets/js/backbone/config/ui.json```.
```
"states" :
    {
     "value": "open",
     "label": "Open"
    },...
```

Changing the value of label is largely cosmetic as it is used to drive drop downs and other display information. If you change the value of value and do not change code to support it midas will behave in an inconsitent manner.

When upgrading Midas from versions prior to .21 you need to run ```./tools/postgres/rename-public-to-open-state.sh``` to update any existing projects or opportunities.

## Adding a one-time modal to the Home page
In ```assets/js/backbone/config/ui.json``` change "modalHome" to true:
```
"modalHome" : {
    "show" : true
  }
```
You also need to add a row to usersetting for **each** user you want to see the modal upon logging in. This row should have the following column values:
```
key = showModalHome
value = true
isActive = true
userId = whichever user(s) you would like to see the modal.
```

The text of the modal is set in the translation file. The default value is **modalHome.text**:
```
"modalHome" : {
    "text" : "<section class='current'><h2>Congratulations!</h2><p>Welcome to the Midas platform.</p></section><section><h2>Congratulations!</h2><p>Welcome to the Midas platform.</p></section><section><h2>Congratulations!</h2><p>Welcome to the Midas platform.</p><p><input type='checkbox' class='tos-checkbox'/> I agree to the <a href=''>Terms and Conditions<a/> required to use this platform.</p></section>"
  }
  ```

## Set up SMTP for Email Notifications

To set up an email provider, add the credentials for your SMTP service to the `/config/local.js` file. For example, using Mandrill:

```js
  emailProtocol: 'SMTP',
  smtp: {
    service             : '',
    host                : 'smtp.mandrillapp.com',
    secureConnection    : false,
    port                : 587,
    auth                : {
      user              : '[mandrill user]',
      pass              : '[mandrill pass]'
    },
    ignoreTLS           : false,
    debug               : false,
    maxConnections      : 5
  },
  systemEmail: '[from address (don't use a GSA address — GSA will block the incoming messages]',
```
