# SLA (Service Level Agreement) — Mandatory Clauses Under Indian Law

## Clause: Defined Service Scope and Deliverables
Act: Indian Contract Act 1872, Section 29 (certainty of contract); IT Act 2000
Contract type: sla
Requirement: An SLA must precisely define the services to be provided. Vague scope creates disputes about what the service provider is obligated to deliver. The scope should include: what services, what system/application, what geography, what user population, and what exclusions.
Standard counter-clause: "The Service Provider shall deliver the following services: [detailed list of services]. The scope is limited to the systems/applications identified in Schedule A. The following are expressly excluded from the scope: third-party systems not under the Service Provider's control, outages caused by the Client's infrastructure, and [other specific exclusions]."

## Clause: Uptime and Availability SLA
Act: Indian Contract Act 1872; IT Act 2000; relevant TRAI regulations for telecom SLAs
Contract type: sla
Requirement: The uptime commitment must be expressed as a percentage measured over a defined period, with an explicit definition of "downtime" and what constitutes "scheduled maintenance" (which is typically excluded from uptime calculation). 99.9% uptime = 8.7 hours/year downtime.
Standard counter-clause: "The Service Provider shall maintain system availability of not less than 99.5% per calendar month, calculated as: (Total Hours in Month - Unplanned Downtime Hours) / Total Hours in Month × 100. Scheduled maintenance windows (maximum 4 hours per month, between 11 PM and 5 AM IST) shall not be counted as downtime."

## Clause: Response Time and Resolution Time for Incidents
Act: Indian Contract Act 1872; specific SLA measurement standards
Contract type: sla
Requirement: Incident response and resolution time commitments must be defined by severity level with clear definitions of each severity level. Without severity classification, every incident is treated as the same priority, making the SLA meaningless in practice.
Standard counter-clause: "Incident response and resolution times shall be as follows: Priority 1 (Critical - complete service outage): Response within 30 minutes, Resolution within 4 hours. Priority 2 (High - major feature unavailable): Response within 2 hours, Resolution within 8 hours. Priority 3 (Medium): Response within 4 hours, Resolution within 2 business days. Priority 4 (Low): Response within 1 business day, Resolution within 5 business days."

## Clause: Service Credits for SLA Breaches
Act: Indian Contract Act 1872, Section 74; liquidated damages jurisprudence
Contract type: sla
Requirement: Service credits are the financial remedy for SLA breaches. Credits should be reasonable pre-estimates of loss (not penal) and tied to the degree of breach. Indian courts have reduced disproportionate liquidated damages; credits must be calibrated to be defensible.
Standard counter-clause: "Service credits shall be issued for SLA breaches as follows: Availability below 99.5%: credit of [1/720] of monthly fee per hour of excess downtime. Resolution time exceeded for Priority 1 by >4 hours: credit of 5% of monthly fee per incident. Monthly credits shall not exceed 30% of the monthly fee. Service credits are the Client's sole financial remedy for SLA failures."

## Clause: Service Credit Application and Redemption Process
Act: Indian Contract Act 1872; set-off and appropriation principles
Contract type: sla
Requirement: The mechanism for claiming, validating, and applying service credits must be specified. Credits should typically be applied as a deduction from the next invoice. A process for the client to claim credits (by specified deadline) should be defined.
Standard counter-clause: "Service credits must be claimed by the Client within 30 days of the relevant SLA breach. The Service Provider shall validate the claim within 10 business days using performance monitoring data. Approved credits shall be applied as a deduction from the next monthly invoice. Credits have no cash value and do not carry forward beyond the next invoice cycle."

## Clause: Planned Maintenance Notification
Act: Indian Contract Act 1872; best practices for IT service management
Contract type: sla
Requirement: Advance notice of planned maintenance windows is essential for business continuity. The notice period, maintenance window timing, and maximum frequency of planned maintenance must be specified to avoid surprise outages.
Standard counter-clause: "The Service Provider shall give the Client a minimum of 48 hours advance written notice (via email and service portal) for all planned maintenance activities. Emergency maintenance that cannot wait 48 hours may be performed with 4 hours notice. Planned maintenance shall be scheduled only during agreed maintenance windows (specified in Schedule B) and shall not exceed 8 hours per month in aggregate."

## Clause: Data Backup and Recovery Point Objective (RPO)
Act: IT Act 2000, Section 43A; IT (Reasonable Security Practices) Rules 2011; RBI guidelines for banking SLAs
Contract type: sla
Requirement: For any SLA involving data storage or processing, the Recovery Point Objective (maximum data loss in case of failure) and Recovery Time Objective (time to restore service) must be explicitly stated and tested. For regulated industries, specific RPO/RTO requirements apply.
Standard counter-clause: "The Service Provider shall maintain the following disaster recovery objectives: Recovery Point Objective (RPO): not more than 4 hours of data loss. Recovery Time Objective (RTO): service restoration within 8 hours of declaration of disaster. The Service Provider shall conduct at least one full disaster recovery drill per year and provide the Client with the drill report within 30 days."

## Clause: Security Standards and Compliance
Act: IT Act 2000, Section 43A; IT (Reasonable Security Practices) Rules 2011; ISO 27001 standards; RBI/SEBI guidelines for financial services
Contract type: sla
Requirement: The SLA must specify the security standards the service provider must maintain. For financial and healthcare services, specific regulatory frameworks apply. Minimum requirements include: encryption, access controls, audit logging, penetration testing, and VAPT.
Standard counter-clause: "The Service Provider shall maintain information security controls compliant with ISO 27001 or equivalent, including: AES-256 encryption for data at rest, TLS 1.2+ for data in transit, role-based access control, comprehensive audit logging retained for 12 months, annual penetration testing by an independent party (with results shared with the Client), and vulnerability assessment every six months."

## Clause: Incident Reporting and Escalation Matrix
Act: IT Act 2000; SEBI/RBI cyber security frameworks; Companies Act 2013
Contract type: sla
Requirement: For any significant service disruption, the client needs to know who to contact and when to escalate. An escalation matrix with named contacts (not just roles), contact numbers, and escalation timelines is essential.
Standard counter-clause: "The Service Provider shall maintain an escalation matrix with named contacts at three levels: Level 1 (Support Lead), Level 2 (Service Manager), Level 3 (CTO/VP Operations). Contact details shall be updated within 3 business days of any personnel change. Escalation from Level 1 to Level 2 shall occur automatically if a Priority 1 incident is not resolved within 2 hours."

## Clause: Service Capacity and Performance Benchmarks
Act: Indian Contract Act 1872; IT Act 2000
Contract type: sla
Requirement: Beyond availability, an SLA should specify performance benchmarks: transaction response times, throughput, concurrent user capacity. Without these, a service can be technically "available" but so slow it is unusable, which constitutes a de facto breach.
Standard counter-clause: "In addition to availability, the Service Provider shall maintain the following performance benchmarks: (a) web page load time: not exceeding 3 seconds for 95th percentile of transactions during business hours; (b) transaction throughput: not less than [X] transactions per second during peak load; (c) concurrent user capacity: not less than [Y] simultaneous active users without performance degradation."

## Clause: Change Management Process
Act: Indian Contract Act 1872; ITIL best practices
Contract type: sla
Requirement: Any change to the service (new software releases, infrastructure changes, configuration changes) must go through a defined change management process to prevent unplanned outages. The SLA should specify review and approval requirements for changes.
Standard counter-clause: "All changes to the production environment shall follow the Service Provider's documented Change Management Process, which shall include: (a) change request submitted 5 business days in advance (emergency changes: 24 hours); (b) impact assessment and rollback plan documented; (c) Client approval required for changes affecting user-facing functionality; (d) post-change monitoring for 24 hours."

## Clause: Reporting Requirements
Act: Indian Contract Act 1872; corporate governance best practices; regulatory reporting requirements
Contract type: sla
Requirement: Regular SLA performance reports are essential for the client to track compliance and manage the vendor relationship. Reports should cover: uptime achieved, incidents by severity, credits issued, pending actions, and capacity trends.
Standard counter-clause: "The Service Provider shall deliver monthly SLA performance reports to the Client by the 5th of the following month, containing: (a) uptime percentage achieved vs. committed; (b) list of all incidents by severity, with resolution times and root cause for Priority 1 and 2 incidents; (c) service credits accrued; (d) capacity and performance trend data; (e) planned maintenance in the coming month."

## Clause: Vendor Personnel Qualifications and Continuity
Act: Contract Labour (Regulation and Abolition) Act 1970; IT sector HR practices
Contract type: sla
Requirement: For specialized IT services, the qualifications and certifications of key personnel are part of the service commitment. Replacing a certified expert with an unqualified person mid-contract constitutes a material degradation in service quality.
Standard counter-clause: "The Service Provider shall assign personnel with relevant qualifications to this engagement as specified in Schedule C. The Service Provider shall notify the Client of any change to key personnel at least 15 business days in advance. Replacement personnel shall have equivalent or superior qualifications. The Client may object to a proposed replacement with reasons within 10 business days."

## Clause: Audit Rights for SLA Compliance
Act: Indian Contract Act 1872; Companies Act 2013 (for statutory audits); RBI/SEBI guidelines
Contract type: sla
Requirement: The client must have the right to audit the service provider's actual compliance with SLA metrics. Self-reported compliance without audit rights is inadequate for significant service relationships, particularly in regulated industries.
Standard counter-clause: "The Client shall have the right to audit or commission an independent audit of the Service Provider's SLA compliance, security controls, and delivery quality, with 10 business days advance notice. The Service Provider shall provide all necessary documentation, system access, and cooperation. Annual audits are included in the contract price; additional audits may be required for cause at the Client's cost."

## Clause: Termination for Persistent SLA Failure
Act: Indian Contract Act 1872, Section 39 (anticipatory breach); Section 55 (breach of contract)
Contract type: sla
Requirement: If a service provider consistently fails to meet SLA commitments, the client should have the right to terminate without penalty (and recover a refund of pre-paid fees). What constitutes "persistent failure" must be defined objectively.
Standard counter-clause: "The Client may terminate this agreement without penalty if the Service Provider: (a) fails to meet the uptime SLA in three consecutive calendar months; (b) commits a Priority 1 incident that is not resolved within 24 hours; or (c) fails to issue agreed service credits in two consecutive months. Termination notice shall be 30 days, and upon termination, the Service Provider shall refund all pre-paid fees for the remaining unused term."
