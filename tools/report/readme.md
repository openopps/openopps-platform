# Progress Report

This script helps generate the monthly progress report for Midas. It takes pull request data from the GitHub API as JSON data, formats it, and passes it to a template file that generates the report in markdown.

Since the report audience is more general, it's usually necessary to add an introduction and to manually edit the generated markdown.

```sh
curl -o pulls.json "https://api.github.com/repos/18F/midas/pulls?state=closed&per_page=100"
# Edit report.js to set the date range
node report.js > generated.md
# Manually edit generated.md
```
