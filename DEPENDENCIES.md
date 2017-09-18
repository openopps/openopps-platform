# Dependency Information

Badge | Status
--- | ---
**Version Eye** | [![Version Eye Dependency Status](https://www.versioneye.com/user/projects/57297a80a0ca35004baf7d09/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/57297a80a0ca35004baf7d09#tab-dependencies)

The Open Opportunities platform contains various versioned dependencies. Below
is a list of dependencies that are purposefully out-of-date. Each item in the
list contains an explanation regarding why it is out-of-date. Versioned
dependencies may also not share the same [license](LICENSE.md) with so each
dependencies license is outlined at the end of this document.

## Runtime Dependencies

    "express": "^3.x.x"

Express is the lightweight framework that is relied on by the more robust
Sails framework that Open Opportunities Platform is built on. The reason why the
version is locked a major version behind is because of the critical middleware
that Sails depends on were removed in [versions greater than ][express-reason].

[express-reason]: https://github.com/expressjs/express/blob/master/History.md?_ga=1.190227883.1428253699.1469419900#400--2014-04-09 "Express Release Notes"

    "marked": "openopps/marked"

The Marked library is used by the platform to parse and transpile Markdown
syntax text into HTML. These strings are stored in the description of both
opportunities or descriptions. There was a XSS vulnerability found within the
Marked library when parsing specific HTML entities. [Please read the release
notes][marked-reason] for more information on [the vulnerability][marked-issue].

[marked-reason]: https://github.com/openopps/openopps-platform/releases/tag/v0.10.6 "Open Opps release notes"
[marked-issue]: https://snyk.io/blog/marked-xss-vulnerability/ "Snyk Marked XSS Vulnerability"

    "sails": "^0.12.x"

The Sails framework is the very foundation of the Open Opportunities Platform's API.
While the client-side is written mostly in Backbone and jQuery, the server-side
API component depends heavily on the conventions in Sails. While there are tags
greater than `0.12.x` in the releases for the repository, [the latest release
resolves with the current version][sails-reason].

[sails-reason]: https://github.com/balderdashy/sails/releases/latest "Sails Latest Release"

    "select2": "3.5.2-browserify"

The Select2 library is used for any of the dropdowns in the application. The
only stable release that Open Opportunities Platform can use because of our
dependency on Browserify. Although [a version of the package exists which
officially states it supports Browserify][select2-browserify], we have tested it
and found that [it in fact does not support using the "Full" version of the
package][select2-issue].

[select2-browserify]: https://github.com/select2/select2/issues/3461 "Select2 Issue about Browserify"
[select2-issue]: https://groups.google.com/d/msg/select2/yifYbU1HPOY/elnBFC5-dLMJ "Select2 Issue Not Loading Full"

## Development Dependencies

None of these dependencies are currently out of date.

## Licenses

The following licenses do not fall under the [`LICENSE.md`](LICENSE.md) file
referenced by the Open Opportunities Platform.

Package | License
--- | ---
async | MIT
autolinker | MIT
aws-sdk | Apache-2.0
babel-preset-es2015 | MIT
babel-preset-stage-0 | MIT
babelify | MIT
backbone | MIT
bcryptjs | MIT
bcryptjs | BSD-3-Clause
bluebird | MIT
blueimp-file-upload | MIT
bootstrap | MIT
bourbon | MIT
brfs | MIT
browserify | MIT
cfenv | Apache-2.0
connect-pg-simple | MIT
connect-redis | MIT
csv-parse | BSD-3-Clause
csvtojson | MIT
db-migrate | MIT
db-migrate-pg | MIT
ejs | Apache-2.0
express | MIT
file-type | MIT
gm | MIT
grunt | MIT
grunt-cli | MIT
grunt-contrib-clean | MIT
grunt-contrib-coffee | MIT
grunt-contrib-concat | MIT
grunt-contrib-copy | MIT
grunt-contrib-cssmin | MIT
grunt-contrib-jst | MIT
grunt-contrib-less | MIT
grunt-contrib-sass | MIT
grunt-contrib-uglify | MIT
grunt-contrib-watch | MIT
grunt-sails-linker | MIT
grunt-sass | MIT
grunt-sync | UNKNOWN
helmet | MIT
i18next | MIT
i18next-xhr-backend | MIT
include-all | MIT
jquery | MIT
jquery-i18next | MIT
json2csv | MIT
location | UNKNOWN
lodash | MIT
lusca | Apache-2.0
marked | UNKNOWN
moment | MIT
navigator | UNKNOWN
newrelic | proprietary
node-uuid | MIT
nodemailer | MIT
nodemailer-smtp-pool | MIT
nodemailer-smtp-transport | MIT
nodemon | MIT
passport | MIT
passport-http-bearer | MIT
passport-local | MIT
passport-myusa | MIT
pg | MIT
pg-promise | MIT
rc | BSD
rc | MIT
rc | Apache-2.0
request | Apache-2.0
sails | MIT
sails-build-dictionary | MIT
sails-db-migrate | MIT
sails-disk | MIT
sails-postgresql | MIT
select2 | UNKNOWN
string | MIT
underscore | MIT
uswds | SEE LICENSE in LICENSE.md
validator | MIT
watchify | MIT
xmlhttprequest | MIT
casperjs | MIT
chai | MIT
chai-datetime | MIT
istanbul | BSD-3-Clause
jshint | (MIT AND JSON)
mocha | MIT
mocha-casperjs | MIT
replay | MIT
sails-memory | MIT
sinon | BSD-3-Clause
superagent | MIT
supertest | MIT
