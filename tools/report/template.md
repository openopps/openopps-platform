# Midas Development Report
## May 1, 2015 - June 30, 2015

<% pulls.forEach(function(pull) { %>
# <%- pull.title %>
_<%- pull.user%>, <%- pull.created_at %>_

<%= pull.body %>

<% }); %>
