## Contributing

We aspire to create a welcoming environment for collaboration on this project.
To that end, we follow the [18F Code of Conduct](https://github.com/18F/code-of-conduct/blob/master/code-of-conduct.md) and ask that all contributors do the same. Open Opps has a defined [governance model](GOVERNANCE.md) to assist with managing the project.  
### Public domain

This project is in the public domain within the United States, and
copyright and related rights in the work worldwide are waived through
the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0
dedication. By submitting a pull request, you are agreeing to comply
with this waiver of copyright interest.

## Communication

Anyone actively contributing or using OpenOpps, should join our [Mailing List](https://groups.google.com/forum/#!forum/openopps-platform).
We also have a public Slack chat room. If you're interested in following along with the development process or have questions, feel free to [join us](https://chat.18f.gov/?channel=openopps-public).

You should be using the master branch for most stable release, please review [release notes](https://github.com/openopps/openopps-platform/releases) regularly. We do releases every week or two and send out notes.  We're generally using [semantic versioning](http://semver.org/), but we're pre-1.0, so API can change at any time. We use the minor version for changes where there are significant installation process changes or API changes or a database migration is needed.

If you want to keep up with the latest changes, we work in the "dev" branch.  If you are using dev, keep an eagle-eye on commits and/or join our daily standup.

We also have a [wiki](https://github.com/openopps/openopps-platform/wiki) where we keep various development notes. If anything is confusing or your questions are not answered there, please shout out on the [mailing list](https://groups.google.com/forum/#!forum/openopps-platform).

## Development Process

This project follows the [git flow](http://nvie.com/posts/a-successful-git-branching-model/) branching model of product development.

### Watch command

Use `npm run watch` to automatically regenerate the application after changing files. This command will also source a `.env` file as a bash script if it exists. Use this for setting up environment variables for your development environment, such as:

```sh
# New Relic settings
export NEW_RELIC_APP_NAME=midas-local-dev
export NEW_RELIC_LICENSE_KEY=18956ab3a4d8c772

# LinkedIn auth settings
export LINKEDIN_CLIENT_ID=77xinrs
export LINKEDIN_CLIENT_SECRET=11aw6wbHC
export LINKEDIN_CALLBACK_URL=http://localhost:1337/api/auth/callback/linkedin

# MyUSA auth settings
export MYUSA_CLIENT_ID=0a33d1c4df848fa1ec666068285e903
export MYUSA_CLIENT_SECRET=bc4b61e58a579efb8907f5d673cef9f34e
export MYUSA_CALLBACK_URL=http://localhost:1337/api/auth/callback/myusa

export DATABASE_URL=midas
```

### Testing

To run all the tests:
```
npm test
```

For testing in Midas, we are using:
* [mocha](http://visionmedia.github.io/mocha/) test framework
* [chai](http://chaijs.com/) assertion library
* [request](https://github.com/mikeal/request) to make http calls for testing API endpoints

The following command will execute a single test file in the application context:

```
NODE_ENV=test ./node_modules/.bin/mocha test/test.upstart.js test/api/sails/tag.test.js
```

Note: there are some methods that use postgres-specific queries.  For ease of development,
tests for these are marked _pending_. If you are modifying this code, enable these tests
and make sure they pass.  You will need to have a test database:

```
psql midas
CREATE DATABASE midastest WITH TEMPLATE midas;
```

### Backbone

- [Midas Backbone Best Practices](https://github.com/Innovation-Toolkit/midas/wiki/Backbone-Best-Practices).  Some basic hints on development in Backbone for Midas.

### Secure templating

Since Midas accepts and displays user-generated content, take care to make sure that is it escaped before displaying it. Otherwise, users may enter potentially harmful JavaScript code.

Escape all content that doesn't need to render as HTML in the client template file with [HTML-escaped filters](http://underscorejs.org/#template) `<%- ... %>`.

Any content that does need to display HTML, such as the user's profile, should be escaped in the view with `_.escape(content)` or by passing markdown content through `marked()`, which will sanitize HTML by default. Also include [a comment](https://github.com/openopps/openopps-platform/blob/dev/assets/js/backbone/apps/profiles/show/templates/profile_show_template.html#L148) about how the content has been escaped so we can easily audit the templates.

Note: server-side templates use [node-ejs](https://github.com/tj/ejs) instead of [underscore](http://underscorejs.org/#template) for templates. The syntax is very similar, but HTML-escaping is done by default with `<%= ... %>` with EJS instead of `<%- ... %>` like underscore.

### <a name="git-hooks"></a> Git Hooks

When working in the development environment, be sure to install the project specific git hooks.

     tools/git_hooks/create-sym-links

### <a name="code-style"></a> Code Style

Generally try to follow the [Google Javascript Style Guide](http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml).  Spaces should be used instead of tabs, and the tab width should be set to 2 spaces.  No spaces at the end of lines.

### <a name="commit-messages"></a> Commit Messages

Treat commit messages as an email message that describes what you changed and why.

The first line of the commit log must be treated as as an email
subject line.  It must be strictly no greater than 50 characters long.
The subject must stand on its own and not only make external
references such as to relevant bug numbers.

The second line must be blank.

The third line begins the body of the commit message (one or more
paragraphs) describing the details of the commit.  Paragraphs are each
separated by a blank line.  Paragraphs must be word wrapped to be no
longer than 76 characters.

The last part of the commit log should contain all "external
references", such as which issues were fixed.

### Database changes

The database schema is managed in this repository under `/migrations/`. When
you first set up Midas and run `npm run init`, all migrations will be run, the
first of which creates the initial schema.  Each subsequent run of `npm run
migrate` checks the database version and runs migration scripts to update it if
the database is out of date.  `npm run check-migrate` can be used to check for
any pending migrations without applying them.

When running `npm run start` or `npm run watch`, `npm run check-migrate` will
be run automatically, alerting you to any pending migrations.

Grunt tasks, `grunt db:migrate:up` and `grunt db:migrate:down`, can also be
used to run specific migration scripts or to downgrade.  See the
[sails-db-migrate
documentation](https://github.com/building5/sails-db-migrate#running-migrations)
or the [db-migrate
documentation](http://umigrate.readthedocs.org/projects/db-migrate/en/v0.10.x/Getting%20Started/the%20commands/)
for more details.

Also note that running `npm run init`, `npm run install`, or `npm run demo`
will automatically run `npm run migrate`, applying any pending migrations
before continuing.

#### Creating New Migrations

Database migrations are written in javascript as
[db-migrate](http://umigrate.readthedocs.org/projects/db-migrate/) scripts.

New migrations are created using the `db:migrate:create` grunt task.

```
$ grunt db:migrate:create --name add-new-feature
+ db-migrate create add-new-feature
DATABASE_URL=postgres://midas:****@localhost/midas
[INFO] Created migration at /home/user/git/openopps-platform/migrations/20160316214102-add-new-feature.js

Done, without errors.
```

Edit the new file created by `grunt db:migrate:create` to add the new migration
steps needed.  The `up` and `down` functions exported from the new migration
file will be used to perform the migration.  See the [db-migrate
documentation](http://umigrate.readthedocs.org/projects/db-migrate/en/latest/Getting%20Started/usage/#creating-migrations)
for the function signatures, examples, and tips.

Many common SQL statements for manipulating the database schema and data are
supported by the db-migrate's
[javascript API](http://umigrate.readthedocs.org/projects/db-migrate/en/latest/API/SQL/).

## <a name="submit"></a> Submission Guidelines

### Submitting an Issue
Before you submit your issue search the archive, maybe your question was already answered.

If your issue appears to be a bug, and hasn't been reported, open a new issue.
Help us to maximize the effort we can spend fixing issues and adding new
features, by not reporting duplicate issues.  Providing the following information will increase the
chances of your issue being dealt with quickly:

* **Overview of the issue** - if an error is being thrown a non-minified stack trace helps
* **Motivation for or Use Case** - explain why this is a bug for you
* **Midas Version(s)** - is it a regression?
* **Browsers and Operating System** - is this a problem with all browsers or only IE8?
* **Reproduce the error** - provide a live example, screenshot, and/or a unambiguous set of steps. The more the better.
* **Related issues** - has a similar issue been reported before?  Reference the related issues in the descrioption.
* **Suggest a Fix** - if you can't fix the bug yourself, perhaps you can point to what might be
  causing the problem (line of code or commit).  If you're requesting a feature, describe how the feature might work to resolve the user story.

### Submitting a Pull Request
Before you submit your pull request consider the following guidelines:

* Search [GitHub](https://github.com/Innovation-Toolkit/midas/pulls) for an open or closed Pull Request that relates to your submission. You don't want to duplicate effort.
* Make your changes in a new git branch

     ```shell
     git checkout -b my-fix-branch dev
     ```

* Create your patch, **including appropriate test cases**.
* Follow our [Code Style](#code-style).
* Run the full Midas test suite, including `make test` and `make demo`,
  and ensure that all tests pass.
* Commit your changes using a descriptive commit message that follows our
  [commit message conventions](#commit-messages) and passes our commit message presubmit hook
  `pre-commit` and `commit-msg` (see [git hooks](#git-hooks)). Adherence to the [commit message conventions](#commit-messages)
  is required to assist in generating release notes.

     ```shell
     git commit -a
     ```
  Note: the optional commit `-a` command line option will automatically "add" and "rm" edited files.

* Build your changes locally to ensure all the tests pass

    ```shell
    npm test
    ```

* Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

* In GitHub, send a pull request to `midas:dev`.
* If we suggest changes then:
  * Make the required updates.
  * Re-run the Midas test suite to ensure tests are still passing.
  * Rebase your branch and force push to your GitHub repository (this will update your Pull Request):

    ```shell
    git rebase dev -i
    git push -f
    ```

That's it! Thank you for your contribution!

#### After your pull request is merged

After your pull request is merged, you can safely delete your branch and pull the changes
from the main (upstream) repository:

* Delete the remote branch on GitHub either through the GitHub web UI or your local shell as follows:

    ```shell
    git push origin --delete my-fix-branch
    ```

* Check out the dev branch:

    ```shell
    git checkout dev -f
    ```

* Delete the local branch:

    ```shell
    git branch -D my-fix-branch
    ```

* Update your dev with the latest upstream version:

    ```shell
    git pull --ff upstream dev
    ```

### Reviewing Pull Requests

Except for critical, urgent or very small fixes, we try to leave pull requests open for most of the day or overnight if something comes in late in the day, so that multiple people have the chance to review/comment.  Anyone who reviews a pull request should leave a note to let others know that someone has looked at it.  For larger commits, we like to have a +1 from someone else on the core team and/or from other contributor(s).  Please note if you reviewed the code or tested locally -- a +1 by itself will typically be interpreted as your thinking its a good idea, but not having reviewed in detail.

If the PR contains a database migration, please tag it with the `help wanted`. A
contributor for the project will work with you to get this tested in a staging
environment along with getting the migration running on the database. These PRs
will also be code reviewed at this time as well.
