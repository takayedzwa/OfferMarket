You are a senior product architect, UX designer and full-stack engineer.

I already have a working application called Offermarket.

Offermarket is a reverse talent marketplace where skilled professionals create profiles and employers compete by making structured offers.

The first market is electricians in the Netherlands.

I now want to add a major new product area called:

**Offermarket Insights**

The objective is NOT to create a generic company blog.

The objective is to make Offermarket the trusted destination where skilled professionals can understand:

* What their skills are worth
* What employers are offering
* Where demand is highest
* Which skills are becoming more valuable
* Which employers are competitive
* What is changing in their industry
* What regulations or labor-market developments affect them

The Insights section must eventually become a proprietary labor-market intelligence product.

## Core principle

The platform should distinguish clearly between:

1. Offermarket proprietary marketplace data
2. Official government/public data
3. Third-party industry data
4. Editorial analysis

Never present third-party information as Offermarket's own data.

## Navigation

Add a primary navigation item:

Home
Offers
Discover
Insights
Profile

## Insights homepage

Design a modern dashboard containing:

### Personalized Market Overview

For a logged-in worker, use their:

* Profession
* Region
* Experience
* Skills
* Certifications

to display:

* Market demand
* Salary range
* Salary trend
* Most valuable skills
* Number of relevant employers
* Number of relevant offers
* Recent market changes

### Latest Insights

Cards for:

* Salary
* Demand
* Employers
* Trends
* Industry
* Career

## Content categories

Create:

1. Salary Intelligence
2. Demand Intelligence
3. Employer Intelligence
4. Industry News
5. Career Intelligence

## Article structure

Every Insight should support:

* Title
* Short summary
* Category
* Profession
* Region
* Publication date
* Data period
* Main content
* Charts
* Key statistics
* Sources
* Source type
* Methodology
* Last updated date

## Data transparency

For every data-driven Insight, display:

* Sample size
* Data period
* Geographic scope
* Profession
* Methodology
* Whether the data is Offermarket proprietary data or external data

Example:

"Based on 247 verified offers submitted on Offermarket between July 1 and August 31, 2026."

Do not generate statistics when insufficient data exists.

Create minimum sample-size rules for different types of statistics.

## Personalized worker intelligence

Create a "Your Market" component.

Example:

Electrician
Rotterdam
5 years experience

Demand:
Very High

Typical salary:
€4,400–€5,000

Relevant skills:
Industrial automation
EV charging
Maintenance

Market trend:
+4.2%

Create logic for generating this information from platform data.

## Employer view

Employers should see different Insights:

* Hiring difficulty
* Salary competitiveness
* Demand by region
* Candidate availability
* Competitor offer ranges
* Time-to-hire benchmarks
* Offer acceptance rates

Do not expose confidential individual employer information.

Only show aggregated data where sufficient sample size exists.

## Admin CMS

Create an internal Insights CMS.

Admins must be able to:

* Create
* Edit
* Preview
* Schedule
* Publish
* Unpublish
* Archive

Insights.

Fields:

Title
Slug
Category
Profession
Region
Summary
Content
Charts
Statistics
Sources
Methodology
Data period
Author
Status
Publish date
Last updated

## Source management

Create a source system.

Each source must contain:

* Source name
* URL
* Publisher
* Publication date
* Data date
* Source type
* Citation
* Notes

Support official sources such as:

CBS
UWV
RVO
Dutch government
European Commission
Eurostat

Do not scrape or republish copyrighted material.

Summarize and link to original sources.

## SEO

Each Insight should generate:

* SEO title
* Meta description
* Canonical URL
* Open Graph metadata
* Structured data where appropriate
* Sitemap inclusion

Create clean URLs such as:

/insights/electrician-salary-rotterdam

/insights/electrician-demand-netherlands

/insights/most-in-demand-electrical-skills

## Sharing

Every Insight should support sharing to:

LinkedIn
Facebook
WhatsApp

Generate a clean social preview image.

## Analytics

Track:

* Views
* Unique readers
* Search impressions
* Click-through to registration
* Worker registrations
* Employer registrations
* Shares
* Returning readers
* Most-read Insights

The key business metric is:

**Insight reader → platform registration → marketplace activity**

## Notifications

Allow users to follow:

* Profession
* Region
* Skills

Then notify them when relevant Insights are published.

Example:

"New Rotterdam electrician salary data is available."

## Design

The interface should feel like:

Financial Times + Bloomberg-style market intelligence + modern SaaS.

Do NOT make it look like a traditional job board.

Prioritize:

* Data
* Charts
* Numbers
* Transparency
* Credibility
* Readability

## Important constraints

Do not invent market data.

Do not display insufficiently supported salary estimates as facts.

Clearly distinguish estimates from verified marketplace data.

Do not expose individual worker or employer information.

Build the system so that it works with limited data initially and becomes more powerful as Offermarket grows.

## Deliverables

Provide:

1. UX architecture
2. Complete screen inventory
3. Component hierarchy
4. Database schema additions
5. API endpoints
6. Data models
7. Analytics events
8. Admin CMS architecture
9. Permission model
10. Data validation rules
11. SEO architecture
12. Personalization logic
13. Sample UI layouts
14. MVP implementation plan
15. Future architecture for a European labor-market intelligence platform

Do not redesign the existing Offermarket marketplace.

Treat Insights as a new integrated product module.
