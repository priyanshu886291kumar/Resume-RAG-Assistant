# Disaster Management RAG Evaluation Report

This report is generated automatically by `evaluate.py`.
It tests the hallucination guard and retrieval accuracy of the assistant.

--------------------------------------------------
Question 1
--------------------------------------------------

**Question:** When should the district control room be activated?

**Expected Topic:**
district_incident_response_protocol.md

**Generated Answer:**
> The district control room should be activated under the following conditions:
> 1. When any Orange alert is issued
> 2. When any Red alert is issued
> 3. When more than three blocks report disruption
> 
> 📌 Source: district_incident_response_protocol.md | Page 1 — IRP-1: Control Room Activation

**Retrieved Sources:**
- `district_incident_response_protocol.md` (Page 1 — IRP-1: Control Room Activation) — *Score: 0.481*
- `district_incident_response_protocol.md` (Page 1 — District Incident Response Protocol) — *Score: 1.092*
- `district_incident_response_protocol.md` (Page 1 — IRP-1: Control Room Activation) — *Score: 1.129*

--------------------------------------------------
Question 2
--------------------------------------------------

**Question:** What should be done before monsoon to reduce flood risk?

**Expected Topic:**
flood_sop.md

**Generated Answer:**
> To reduce flood risk before monsoon, the district should take the following steps:
> * Clean storm-water drains
> * Inspect culverts
> * Test dewatering pumps
> * Mark low-lying settlements
> * Update contact lists for ward officers
> 
> 📌 Source: flood_sop.md | Page 1 — FLOOD-2: Pre-Monsoon Preparedness

**Retrieved Sources:**
- `flood_sop.md` (Page 1 — FLOOD-2: Pre-Monsoon Preparedness) — *Score: 0.498*
- `flood_sop.md` (Page 1 — FLOOD-2: Pre-Monsoon Preparedness) — *Score: 0.861*
- `flood_sop.md` (Page 1 — FLOOD-5: Post-Event Assessment) — *Score: 0.931*

--------------------------------------------------
Question 3
--------------------------------------------------

**Question:** Who are the priority groups during a heatwave?

**Expected Topic:**
heatwave_action_plan.md

**Generated Answer:**
> The priority groups during a heatwave include:
> * Children
> * Elderly persons
> * Outdoor workers
> * Pregnant women
> * Persons with disabilities
> * People living in tin-roof homes
> * People without reliable cooling access
> 
> 📌 Source: heatwave_action_plan.md | Page 1 — HEAT-2: Vulnerable Groups 
> 📌 Source: heatwave_action_plan.md | Page 1 — Heatwave Action Plan

**Retrieved Sources:**
- `heatwave_action_plan.md` (Page 1 — HEAT-2: Vulnerable Groups) — *Score: 0.722*
- `heatwave_action_plan.md` (Page 1 — Heatwave Action Plan) — *Score: 0.840*
- `heatwave_action_plan.md` (Page 1 — HEAT-2: Vulnerable Groups) — *Score: 0.967*

--------------------------------------------------
Question 4
--------------------------------------------------

**Question:** What should a cyclone shelter contain?

**Expected Topic:**
cyclone_preparedness_sop.md

**Generated Answer:**
> A cyclone shelter should contain the following essential items:
> * Drinking water
> * Toilets
> * First-aid kits
> * Lighting
> * Phone-charging arrangements
> * Space for women, children, elderly people, and persons with disabilities
> 
> 📌 Source: cyclone_preparedness_sop.md | Page 1 — CYC-2: Shelter Readiness 
> 📌 Source: relief_shelter_management_guidelines.md | Page 1 — SHELTER-1: Minimum Services

**Retrieved Sources:**
- `relief_shelter_management_guidelines.md` (Page 1 — SHELTER-1: Minimum Services) — *Score: 0.862*
- `cyclone_preparedness_sop.md` (Page 1 — CYC-2: Shelter Readiness) — *Score: 0.898*
- `cyclone_preparedness_sop.md` (Page 1 — Cyclone Preparedness SOP) — *Score: 0.903*

--------------------------------------------------
Question 5
--------------------------------------------------

**Question:** What information should every public warning include?

**Expected Topic:**
risk_communication_checklist.md

**Generated Answer:**
> Every public warning should include the following information:
> * What is happening
> * Where
> * When
> * Who is affected
> * What action to take
> * Where to get help
> 
> Additionally, messages must mention:
> * Expected location
> * Timing
> * Safe routes
> * Shelter locations
> * Helpline numbers
> 
> 📌 Source: risk_communication_checklist.md | Page 1 — COMMS-1: Message Structure
> 📌 Source: flood_sop.md | Page 1 — FLOOD-4: Public Communication

**Retrieved Sources:**
- `risk_communication_checklist.md` (Page 1 — COMMS-1: Message Structure) — *Score: 0.512*
- `risk_communication_checklist.md` (Page 1 — Risk Communication Checklist) — *Score: 0.835*
- `flood_sop.md` (Page 1 — FLOOD-4: Public Communication) — *Score: 1.032*

--------------------------------------------------
Question 6
--------------------------------------------------

**Question:** When can a relief shelter be closed?

**Expected Topic:**
relief_shelter_management_guidelines.md

**Generated Answer:**
> A relief shelter can be closed after the following conditions are met:
> * Return routes are safe
> * Homes are assessed
> * Minimum services are restored
> 
> 📌 Source: relief_shelter_management_guidelines.md | Page 1 — SHELTER-5: Closure

**Retrieved Sources:**
- `relief_shelter_management_guidelines.md` (Page 1 — Relief Shelter Management Guidelines) — *Score: 0.492*
- `relief_shelter_management_guidelines.md` (Page 1 — SHELTER-5: Closure) — *Score: 0.630*
- `relief_shelter_management_guidelines.md` (Page 1 — SHELTER-5: Closure) — *Score: 0.896*

--------------------------------------------------
Question 7
--------------------------------------------------

**Question:** What is the exact compensation amount for damaged crops?

**Expected Topic:**


**Generated Answer:**
> Not found in the provided documents.

**Retrieved Sources:**
- No sources retrieved or hallucination guard triggered.

--------------------------------------------------
Question 8
--------------------------------------------------

**Question:** Which private telecom vendor should be used for emergency alerts?

**Expected Topic:**


**Generated Answer:**
> Not found in the provided documents.

**Retrieved Sources:**
- No sources retrieved or hallucination guard triggered.

--------------------------------------------------
Question 9
--------------------------------------------------

**Question:** What factors should be used for resource prioritization?

**Expected Topic:**
district_incident_response_protocol.md

**Generated Answer:**
> For resource prioritization, the following factors should be considered:
> * Severity
> * Vulnerable population
> * Time since last contact
> * Medical need
> * Accessibility
> * Availability of safe shelter
> 
> 📌 Source: district_incident_response_protocol.md | Page 1 — IRP-3: Resource Prioritization

**Retrieved Sources:**
- `district_incident_response_protocol.md` (Page 1 — IRP-3: Resource Prioritization) — *Score: 0.508*
- `district_incident_response_protocol.md` (Page 1 — IRP-3: Resource Prioritization) — *Score: 1.196*
- `heatwave_action_plan.md` (Page 1 — HEAT-2: Vulnerable Groups) — *Score: 1.230*

--------------------------------------------------
Question 10
--------------------------------------------------

**Question:** What actions are required during an Orange or Red heat alert?

**Expected Topic:**
heatwave_action_plan.md

**Generated Answer:**
> During an Orange or Red heat alert, the following actions are required:
>  
> For Orange alert: severe heat requiring reduced outdoor activity.
> For Red alert: extreme heat requiring active protection for vulnerable groups.
> 
> The specific immediate actions are outlined in HEAT-3, but the details of these actions are not provided in the retrieved context.
> 
> 📌 Source: heatwave_action_plan.md | Page 1 — HEAT-1: Heat Alert Meaning 
> 📌 Source: heatwave_action_plan.md | Page 1 — HEAT-3: Immediate Actions During Orange or Red Alert

**Retrieved Sources:**
- `heatwave_action_plan.md` (Page 1 — HEAT-3: Immediate Actions During Orange or Red Alert) — *Score: 0.290*
- `heatwave_action_plan.md` (Page 1 — HEAT-1: Heat Alert Meaning) — *Score: 0.717*
- `flood_sop.md` (Page 1 — FLOOD-1: Alert Levels) — *Score: 0.819*

--------------------------------------------------
Question 11
--------------------------------------------------

**Question:** What should fishermen do during a cyclone warning?

**Expected Topic:**
cyclone_preparedness_sop.md

**Generated Answer:**
> During a cyclone warning, fishing boats must not venture into the sea. 
> 
> Here are the key steps for fishermen:
> 1. Return to the harbour if they are already at sea.
> 2. Harbour officers will confirm the boat return status and communicate advisories in the local language.
> 
> 📌 Source: cyclone_preparedness_sop.md | Page 1 — CYC-3: Fisherfolk Advisory 
> 📌 Source: cyclone_preparedness_sop.md | Page 1 — Cyclone Preparedness SOP

**Retrieved Sources:**
- `cyclone_preparedness_sop.md` (Page 1 — CYC-3: Fisherfolk Advisory) — *Score: 0.500*
- `cyclone_preparedness_sop.md` (Page 1 — Cyclone Preparedness SOP) — *Score: 0.940*
- `risk_communication_checklist.md` (Page 1 — COMMS-1: Message Structure) — *Score: 1.122*

--------------------------------------------------
Question 12
--------------------------------------------------

**Question:** What is the mayor's personal phone number?

**Expected Topic:**


**Generated Answer:**
> Not found in the provided documents.

**Retrieved Sources:**
- No sources retrieved or hallucination guard triggered.

--------------------------------------------------
Question 13
--------------------------------------------------

**Question:** What records should shelter managers maintain?

**Expected Topic:**
relief_shelter_management_guidelines.md

**Generated Answer:**
> Shelter managers must maintain records of every household entering the shelter, including special needs such as:
> * Medicines
> * Disability support
> * Pregnancy
> * Unaccompanied children
> 
> 📌 Source: relief_shelter_management_guidelines.md | Page 1 — SHELTER-2: Registration

**Retrieved Sources:**
- `relief_shelter_management_guidelines.md` (Page 1 — SHELTER-2: Registration) — *Score: 0.759*
- `relief_shelter_management_guidelines.md` (Page 1 — Relief Shelter Management Guidelines) — *Score: 0.830*
- `relief_shelter_management_guidelines.md` (Page 1 — SHELTER-1: Minimum Services) — *Score: 0.905*

--------------------------------------------------
Question 14
--------------------------------------------------

**Question:** How should rumours be controlled?

**Expected Topic:**
risk_communication_checklist.md

**Generated Answer:**
> To control rumours, the control room should track them and issue corrections through trusted local channels.
> 
> 📌 Source: risk_communication_checklist.md | Page 1 — COMMS-4: Rumour Control 
> 📌 Source: risk_communication_checklist.md | Page 1 — Risk Communication Checklist

**Retrieved Sources:**
- `risk_communication_checklist.md` (Page 1 — COMMS-4: Rumour Control) — *Score: 0.723*
- `risk_communication_checklist.md` (Page 1 — COMMS-4: Rumour Control) — *Score: 0.884*
- `risk_communication_checklist.md` (Page 1 — Risk Communication Checklist) — *Score: 1.437*

--------------------------------------------------
Question 15
--------------------------------------------------

**Question:** What are the evacuation triggers for floods?

**Expected Topic:**
flood_sop.md

**Generated Answer:**
> Evacuation should be considered in the following situations:
> * When water enters homes
> * When the river gauge crosses the danger level
> * When two consecutive high-intensity rainfall alerts are received
> * When road access is likely to be cut off
> 
> 📌 Source: flood_sop.md | Page 1 — FLOOD-3: Evacuation Triggers

**Retrieved Sources:**
- `flood_sop.md` (Page 1 — FLOOD-3: Evacuation Triggers) — *Score: 0.302*
- `flood_sop.md` (Page 1 — FLOOD-3: Evacuation Triggers) — *Score: 0.689*
- `flood_sop.md` (Page 1 — FLOOD-1: Alert Levels) — *Score: 0.775*

--------------------------------------------------
Question 16
--------------------------------------------------

**Question:** Which satellite model is approved for landslide prediction?

**Expected Topic:**


**Generated Answer:**
> Not found in the provided documents.

**Retrieved Sources:**
- No sources retrieved or hallucination guard triggered.

--------------------------------------------------
Question 17
--------------------------------------------------

**Question:** What should be logged for major decisions?

**Expected Topic:**
district_incident_response_protocol.md

**Generated Answer:**
> For major decisions, the following information should be logged:
> * Timestamp
> * Decision owner
> * Reason
> * Affected location
> * Follow-up action
> 
> 📌 Source: district_incident_response_protocol.md | Page 1 — IRP-5: Decision Logs

**Retrieved Sources:**
- `district_incident_response_protocol.md` (Page 1 — IRP-5: Decision Logs) — *Score: 0.454*
- `district_incident_response_protocol.md` (Page 1 — IRP-5: Decision Logs) — *Score: 0.895*
- `risk_communication_checklist.md` (Page 1 — Risk Communication Checklist) — *Score: 1.224*

--------------------------------------------------
Question 18
--------------------------------------------------

**Question:** What low-cost measures reduce heat stress?

**Expected Topic:**
heatwave_action_plan.md

**Generated Answer:**
> Low-cost measures to reduce heat stress include:
> * Cool roof coating
> * Temporary shade
> * Tree canopy
> * Water stations
> * Ventilation improvements
> 
> These measures can help reduce local heat stress.
> 
> 📌 Source: heatwave_action_plan.md | Page 1 — HEAT-5: Cool Roof and Shade Measures

**Retrieved Sources:**
- `heatwave_action_plan.md` (Page 1 — HEAT-5: Cool Roof and Shade Measures) — *Score: 0.866*
- `heatwave_action_plan.md` (Page 1 — HEAT-4: Health System Preparedness) — *Score: 1.115*
- `heatwave_action_plan.md` (Page 1 — HEAT-5: Cool Roof and Shade Measures) — *Score: 1.175*

--------------------------------------------------
Question 19
--------------------------------------------------

**Question:** What is the flood return period of Nirmala river?

**Expected Topic:**


**Generated Answer:**
> Not found in the provided documents.

**Retrieved Sources:**
- No sources retrieved or hallucination guard triggered.

--------------------------------------------------
Question 20
--------------------------------------------------

**Question:** What should initial cyclone damage reports separate?

**Expected Topic:**
cyclone_preparedness_sop.md

**Generated Answer:**
> Initial cyclone damage reports should separate the following issues:
> * Life safety issues
> * Road blockage
> * Power failure
> * Building damage
> * Water contamination
> 
> 📌 Source: cyclone_preparedness_sop.md | Page 1 — CYC-5: Damage Reporting 
> 📌 Source: cyclone_preparedness_sop.md | Page 1 — Cyclone Preparedness SOP

**Retrieved Sources:**
- `cyclone_preparedness_sop.md` (Page 1 — CYC-5: Damage Reporting) — *Score: 0.669*
- `cyclone_preparedness_sop.md` (Page 1 — CYC-5: Damage Reporting) — *Score: 0.930*
- `cyclone_preparedness_sop.md` (Page 1 — Cyclone Preparedness SOP) — *Score: 0.934*

-----------------------------------
Evaluation Summary

Total Questions : 20
Correct Answers : 20
Fallback Answers : 5
Retrieval Failures : 0
Hallucinations : 0
Average Retrieved Chunks : 2.2
-----------------------------------