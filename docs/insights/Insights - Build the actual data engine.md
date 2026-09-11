Extend the existing Offermarket application with a proprietary labor-market intelligence engine.

The goal is to turn marketplace activity into reliable aggregated market information.

Offermarket contains:

* Worker profiles
* Skills
* Experience
* Regions
* Salary expectations
* Employer profiles
* Employer requirements
* Structured offers
* Offer amounts
* Benefits
* Offer outcomes
* Interviews
* Hiring outcomes

Build an analytics and aggregation layer that converts this data into trustworthy market intelligence.

## Core outputs

Generate aggregated metrics for:

### Salary

* Median salary
* Average salary
* 25th percentile
* 75th percentile
* Salary by experience
* Salary by skill
* Salary by region
* Salary by profession

### Demand

* Number of employers seeking a skill
* Growth in demand
* Demand by region
* Demand by profession
* Skill growth rate

### Offer competitiveness

* Average employer offer
* Offer acceptance rate
* Offer rejection rate
* Time to acceptance
* Salary competitiveness
* Benefit competitiveness

### Worker market value

Create an explainable market-value indicator based on:

* Experience
* Skills
* Certifications
* Location
* Demand
* Comparable offers

Do not create a black-box score.

Explain why the score changes.

## Statistical safeguards

Never publish metrics below configurable minimum sample sizes.

For example:

* Salary statistics require at least N observations.
* Employer rankings require at least N offers.
* Acceptance rates require at least N completed offers.

Make these thresholds configurable by administrators.

Apply privacy-preserving aggregation.

Prevent users from reverse-engineering individual workers or employers.

## Time-series analysis

Support:

Daily
Weekly
Monthly
Quarterly
Year-over-year

Create trend calculations.

Examples:

Salary trend
Demand trend
Offer trend
Skill trend

## Geography

Support:

Country
Province
City
Region
Travel radius

Start with Netherlands.

Design architecture so Europe can be added later.

## Professions

Do not hard-code electricians.

Create a profession taxonomy.

Example:

Technical

* Electrician
* HVAC technician
* Industrial mechanic
* Welder
* Plumber

Healthcare

* Nurse
* Care worker

Transport

* Truck driver
* Bus driver

Engineering

* Electrical engineer
* Mechanical engineer

Allow administrators to add professions without changing application code.

## Skills taxonomy

Create normalized skills.

Example:

Electrician:

* Industrial electrical
* Residential electrical
* EV charging
* Solar
* PLC
* Automation
* Maintenance

Skills must be searchable and versioned.

## Data provenance

Every metric must retain:

* Source records
* Calculation method
* Data period
* Sample size
* Generation timestamp

An admin must be able to inspect how any published statistic was calculated.

## Insights generation

Build a service that identifies interesting changes automatically.

Examples:

"Electrician salary increased 5.2% in Rotterdam."

"Demand for EV charging skills increased 18%."

"Employers offering company cars have a higher offer acceptance rate."

Do not automatically publish these.

Generate them as **draft insights for admin review**.

## Dashboard

Create an admin Market Intelligence dashboard containing:

* Total active workers
* Active employers
* Offers
* Accepted offers
* Salary trends
* Demand trends
* Most valuable skills
* Fastest-growing skills
* Regional shortages

## Future European architecture

The system must eventually support:

Netherlands
Belgium
Germany
France
Denmark
Austria
Sweden
Norway
Finland
etc.

Do not build country-specific logic into the core data model.

Use:

country
currency
language
region
profession
skill
employment rules

as configurable dimensions.

## Critical principle

Offermarket must eventually become a trusted source of real labor-market intelligence.

Accuracy is more important than publishing frequency.

Never fabricate data.

Never hide sample sizes.

Never present estimates as observed facts.

Build the system so that trust is a core product feature.